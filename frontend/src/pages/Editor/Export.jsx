import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';

// ─────────────────────────────────────────────────────────────────────────────
// API LAYER
// ─────────────────────────────────────────────────────────────────────────────

const API_BASE = 'http://127.0.0.1:8000/api'; // adjust to match your actual base path

function authHeaders() {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token') || '';
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { ...authHeaders(), ...(options.headers || {}) },
  });

  const text = await res.text();
  const json = JSON.parse(text);

  if (!res.ok || json.success === false) {
    throw new Error(json.message || `HTTP ${res.status}`);
  }

  return json.data;
}

const fetchVideoPreview = (videoId) => apiFetch(`/videos/${videoId}/preview/`);

const startVideoExport = (videoId, payload) =>
  apiFetch(`/videos/${videoId}/export/`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });

const fetchExportStatus = (videoId, exportId) =>
  apiFetch(`/videos/${videoId}/export/${exportId}/status/`);

const buildVideoDownloadUrl = (videoId) => `${API_BASE}/videos/${videoId}/download/`;

const buildSrtDownloadUrl = (videoId, language = 'en', translated = false) =>
  `${API_BASE}/captions/videos/${videoId}/download-srt?language=${language}&translated=${translated}`;

// ─────────────────────────────────────────────────────────────────────────────
// STATIC CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const RESOLUTIONS = [
  { id: '854x480',   label: '480p',  subLabel: 'SD' },
  { id: '1280x720',  label: '720p',  subLabel: 'HD Ready' },
  { id: '1920x1080', label: '1080p', subLabel: 'Full HD' },
  { id: '3840x2160', label: '4K',    subLabel: 'Ultra HD' },
];

const FORMATS = [
  { id: 'mp4', label: 'MP4', subLabel: 'H.264 HIGH' },
  { id: 'mov', label: 'MOV', subLabel: 'PRORES 422' },
];

const CAPTION_MODES = [
  { id: 'Burned-in',     label: 'Burned-in',     description: 'Permanent on video',   icon: 'fa-closed-captioning' },
  { id: 'Separate .SRT', label: 'Separate .SRT', description: 'Sidecar file for web', icon: 'fa-file-lines' },
];

// ─────────────────────────────────────────────────────────────────────────────
// UTILITIES
// ─────────────────────────────────────────────────────────────────────────────

function formatFileSize(bytes) {
  if (bytes == null || isNaN(Number(bytes))) return '—';
  const b = Number(bytes);
  if (b === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(b) / Math.log(k));
  
  return parseFloat((b / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function formatDuration(secs) {
  if (secs == null || isNaN(Number(secs))) return '--:--';
  const totalSeconds = Number(secs);
  const m = Math.floor(totalSeconds / 60);
  const s = Math.floor(totalSeconds % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

/**
 * Dynamically calculates estimated export size based on original video metadata
 * applying realistic non-linear scaling for resolution changes and codec formats.
 */
function calculateEstimatedExportSize(originalBytes, origW, origH, targetResString, targetFormat, isSrt, originalCodec) {
  if (isSrt) return '~12 KB';
  if (!originalBytes || isNaN(Number(originalBytes))) return '—';

  const baseBytes = Number(originalBytes);

  // Parse target resolution
  const [targetW, targetH] = targetResString.split('x').map(Number);
  const targetPixels = targetW * targetH;

  // Parse original resolution (fallback to standard 1080p if missing from metadata)
  const originalW = Number(origW) || 1920;
  const originalH = Number(origH) || 1080;
  const originalPixels = originalW * originalH;

  // Realistic compression scaling: File sizes don't scale 1:1 with pixels.
  // Using an exponent (0.75) mimics standard H.264/HEVC bitrate efficiency curves.
  const resolutionMultiplier = Math.pow(targetPixels / originalPixels, 0.75);

  // Format multiplier: MOV typically uses less efficient or heavier Prores codecs.
  const formatMultiplier = targetFormat === 'mov' ? 1.6 : 1.0;

  // Real compression overhead: if settings match the original video exactly,
  // we add a tiny 2% overhead for subtitle burning. Otherwise, we add a 15% quality margin.
  const codecMatch = originalCodec ? originalCodec.toLowerCase().includes('264') || originalCodec.toLowerCase().includes('h264') : true;
  const qualityOverhead = (targetResString === `${originalW}x${originalH}` && targetFormat === 'mp4' && codecMatch) ? 1.02 : 1.15;

  const estimatedBytes = baseBytes * resolutionMultiplier * formatMultiplier * qualityOverhead;

  return formatFileSize(estimatedBytes);
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

const LANGUAGES_MAP = {
  en: 'English',
  es: 'Spanish (Español)',
  fr: 'French (Français)',
  de: 'German (Deutsch)',
  it: 'Italian (Italiano)',
  pt: 'Portuguese (Português)',
  hi: 'Hindi (हिन्दी)',
  zh: 'Chinese (中文)',
  ja: 'Japanese (日本語)',
  ko: 'Korean (한국어)',
};

const getFriendlyLanguage = (code) => {
  if (!code) return '—';
  const c = code.toLowerCase();
  return LANGUAGES_MAP[c] || code.toUpperCase();
};

const copyToClipboard = async (text) => {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      // Fallback to execCommand if clipboard write fails
    }
  }

  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.top = '0';
    textArea.style.left = '0';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch (err) {
    return false;
  }
};

const Export = () => {
  const { videoId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [selectedLanguage, setSelectedLanguage] = useState(location.state?.activeLang || 'en');
  const useTranslated = selectedLanguage !== 'en';

  // ── State: Video Metadata
  const [videoData, setVideoData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  // ── State: User Selections
  const [selectedRes, setSelectedRes] = useState('1920x1080');
  const [selectedFormat, setSelectedFormat] = useState('mp4');
  const [selectedCaptionMode, setSelectedCaptionMode] = useState('Burned-in');

  // ── State: Export Job
  const [exportPhase, setExportPhase] = useState('idle'); // 'idle' | 'submitting' | 'rendering' | 'complete' | 'failed'
  const [progress, setProgress] = useState(0);
  const [estimatedTime, setEstimatedTime] = useState('--:--');
  const [exportJobId, setExportJobId] = useState(null);
  const [completedJobData, setCompletedJobData] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [copied, setCopied] = useState(false);

  const pollTimerRef = useRef(null);
  const progressTimerRef = useRef(null);

  const isSrt = selectedCaptionMode === 'Separate .SRT';

  // ── 1. Progress Animations & Polling
  const startProgressAnimation = useCallback(() => {
    progressTimerRef.current = setInterval(() => {
      setProgress((p) => (p < 88 ? p + Math.random() * 2.5 : p));
      const secs = Math.floor(Math.random() * 40 + 5);
      const m = Math.floor(secs / 60);
      const s = secs % 60;
      setEstimatedTime(`0${m}:${s.toString().padStart(2, '0')}`);
    }, 800);
  }, []);

  const startPolling = useCallback((jobId) => {
    pollTimerRef.current = setInterval(async () => {
      try {
        const job = await fetchExportStatus(videoId, jobId);
        if (job.status === 'completed') {
          clearInterval(pollTimerRef.current);
          clearInterval(progressTimerRef.current);
          setCompletedJobData(job);
          setProgress(100);
          setEstimatedTime('Ready');
          setExportPhase('complete');
        } else if (job.status === 'failed') {
          clearInterval(pollTimerRef.current);
          clearInterval(progressTimerRef.current);
          setErrorMessage(job.error_message || 'Export failed on the server.');
          setExportPhase('failed');
        }
      } catch {
        // Transient network hiccup — keep polling
      }
    }, 2000);
  }, [videoId]);

  // ── State for SRT actual size
  const [srtFileSize, setSrtFileSize] = useState(null);

  // ── 2. Option-Specific Export Matching
  const checkMatchingExport = useCallback(async (res, fmt, capMode, lang) => {
    try {
      const mode = capMode === 'Separate .SRT' ? 'srt' : 'burned';
      const format = capMode === 'Separate .SRT' ? 'srt' : fmt;
      
      const latestJob = await apiFetch(
        `/videos/${videoId}/export/?resolution=${res}&export_format=${format}&caption_mode=${mode}&language=${lang}`
      );
      
      if (latestJob && latestJob.id) {
        setExportJobId(latestJob.id);
        setCompletedJobData(latestJob);

        if (latestJob.status === 'processing' || latestJob.status === 'pending') {
          setExportPhase('rendering');
          setProgress(30);
          startProgressAnimation();
          startPolling(latestJob.id);
        } else if (latestJob.status === 'completed') {
          setExportPhase('complete');
          setProgress(100);
          setEstimatedTime('Ready');
        } else if (latestJob.status === 'failed') {
          setExportPhase('failed');
          setErrorMessage(latestJob.error_message || 'Export failed.');
        }
      } else {
        // No matching job — reset to idle
        setExportPhase('idle');
        setProgress(0);
        setEstimatedTime('--:--');
        setExportJobId(null);
        setCompletedJobData(null);
        setErrorMessage('');
        clearInterval(pollTimerRef.current);
        clearInterval(progressTimerRef.current);
      }
    } catch (err) {
      // Ignore transient fetch errors
    }
  }, [videoId, startPolling, startProgressAnimation]);

  // ── 3. Initialization & Cleanup
  useEffect(() => {
    if (!videoId) {
      setLoadError('No videoId provided.');
      setIsLoading(false);
      return;
    }
    
    // Load video data and run first option match
    fetchVideoPreview(videoId)
      .then((videoData) => {
        setVideoData(videoData);
        setIsLoading(false);
        // Initial check for selections
        checkMatchingExport(selectedRes, selectedFormat, selectedCaptionMode, selectedLanguage);
      })
      .catch((err) => {
        setLoadError(err.message);
        setIsLoading(false);
      });
  }, [videoId]); // Only run on mount!

  // Check matching exports whenever selections change (unless wait-submitting/rendering)
  useEffect(() => {
    if (exportPhase !== 'rendering' && exportPhase !== 'submitting') {
      checkMatchingExport(selectedRes, selectedFormat, selectedCaptionMode, selectedLanguage);
    }
  }, [selectedRes, selectedFormat, selectedCaptionMode, selectedLanguage, checkMatchingExport, exportPhase]);

  // Fetch actual SRT file size dynamically
  useEffect(() => {
    if (isSrt) {
      apiFetch(`/captions/videos/${videoId}/srt-size?language=${selectedLanguage}`)
        .then((data) => {
          if (data && data.size != null) {
            setSrtFileSize(data.size);
          }
        })
        .catch(() => {
          setSrtFileSize(null);
        });
    }
  }, [videoId, selectedLanguage, isSrt]);

  useEffect(() => {
    return () => {
      clearInterval(pollTimerRef.current);
      clearInterval(progressTimerRef.current);
    };
  }, []);

  // ── 3. Actions
  const handleExport = async () => {
    if (isSrt) {
      handleDownload();
      return;
    }
    setExportPhase('submitting');
    setProgress(0);
    setEstimatedTime('--:--');
    setErrorMessage('');

    try {
      const job = await startVideoExport(videoId, {
        export_format: isSrt ? 'srt' : selectedFormat,
        resolution: selectedRes,
        language: selectedLanguage,
        caption_mode: 'burned',
        use_translated: useTranslated,
      });

      setExportJobId(job.id);
      setExportPhase('rendering');
      setProgress(5);
      startProgressAnimation();
      startPolling(job.id);
    } catch (err) {
      setErrorMessage(err.message);
      setExportPhase('failed');
    }
  };

  const handleDownload = async () => {
    const url = isSrt
      ? buildSrtDownloadUrl(videoId, selectedLanguage, useTranslated)
      : buildVideoDownloadUrl(videoId);

    const token = localStorage.getItem('token') || sessionStorage.getItem('token') || '';

    try {
      const res = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      
      if (!res.ok) throw new Error(`Download failed: HTTP ${res.status}`);
      
      const blob = await res.blob();
      const name = isSrt
        ? `captions_${videoId}_${selectedLanguage}.srt`
        : `${videoData?.title || videoId}_${selectedRes}_${selectedLanguage}.${selectedFormat}`;

      const href = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = href;
      a.download = name;
      a.click();
      window.URL.revokeObjectURL(href);
    } catch (err) {
      setErrorMessage(err.message);
    }
  };

  const handleReset = () => {
    clearInterval(pollTimerRef.current);
    clearInterval(progressTimerRef.current);
    setExportPhase('idle');
    setProgress(0);
    setEstimatedTime('--:--');
    setExportJobId(null);
    setCompletedJobData(null);
    setErrorMessage('');
  };

  const handleCopyLink = async () => {
    const url = `${window.location.origin}/videos/${videoId}`;
    const success = await copyToClipboard(url);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // ── 4. Derived UI State
  const {
    title,
    original_filename,
    duration_seconds,
    fps,
    codec,
    thumbnail_url,
    file_size,
    width,
    height
  } = videoData || {};

  const displayName = title || original_filename || 'Untitled Video';
  const displayDuration = formatDuration(duration_seconds);
  const displayFps = fps ? `${Math.round(fps)}fps` : '—';
  const displayCodec = codec || '—';
  const selectedResLabel = RESOLUTIONS.find((r) => r.id === selectedRes)?.label ?? selectedRes;

  const displaySize = isSrt
    ? (srtFileSize != null ? formatFileSize(srtFileSize) : '~12 KB')
    : (exportPhase === 'complete' && completedJobData?.output_file_size
        ? formatFileSize(completedJobData.output_file_size)
        : calculateEstimatedExportSize(
            file_size,
            width,
            height,
            selectedRes,
            selectedFormat,
            isSrt,
            codec
          ));

  // Derived Export Target parameters
  const targetFormatLabel = isSrt ? 'SRT Subtitles' : (selectedFormat === 'mov' ? 'MOV Video' : 'MP4 Video');
  const targetResolutionLabel = isSrt ? '—' : `${selectedResLabel} (${selectedRes})`;
  const targetCodecLabel = isSrt ? 'SubRip Text' : (selectedFormat === 'mov' ? 'ProRes 422' : 'H.264 (AVC)');
  const displayLanguage = getFriendlyLanguage(selectedLanguage);

  // ── 5. Render Loading & Errors
  if (isLoading) {
    return (
      <div className="w-full min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center">
        <i className="fa-solid fa-circle-notch fa-spin text-4xl text-[#128189] mb-4" />
        <h2 className="text-[#111827] font-bold text-lg animate-pulse">Loading Export Settings…</h2>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="w-full min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center gap-3">
        <i className="fa-solid fa-triangle-exclamation text-4xl text-red-500" />
        <p className="text-[#111827] font-semibold text-base">{loadError}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-2 px-5 py-2 bg-[#0C4E5E] text-white rounded-xl text-sm font-bold hover:bg-[#093c48] transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  // ── 6. Main Render
  return (
    <div className="w-full min-h-screen bg-[#F8FAFC] p-4 md:p-8 lg:p-12 font-sans overflow-x-hidden flex flex-col">
      {/* ── HEADER ── */}
      <div className="mb-8 md:mb-10 animate-fade-in">
        <h1 className="text-2xl md:text-3xl font-bold text-[#111827] mb-2 tracking-tight">
          Finalizing Your Export
        </h1>
        <p className="text-[#64748B] text-sm md:text-base font-medium max-w-2xl">
          Review your project details and select your preferred delivery settings.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 items-start">
        {/* ════════════════════════════════════════════════════════════════
            LEFT COLUMN — settings  (2 / 3 width)
            ════════════════════════════════════════════════════════════════ */}
        <div className="lg:col-span-2 flex flex-col gap-6 md:gap-8 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          
          {/* ── VIDEO RESOLUTION ── */}
          <div className="bg-white rounded-2xl md:rounded-3xl p-5 md:p-8 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <h2 className="text-base md:text-lg font-bold text-[#111827] uppercase tracking-wide">
                Video Resolution
              </h2>
              <span className="bg-[#E2E8F0] text-slate-500 text-[9px] md:text-[10px] font-bold px-2 md:px-3 py-1 md:py-1.5 rounded-md tracking-wider">
                Recommended: 1080p
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
              {RESOLUTIONS.map((res) => (
                <button
                  key={res.id}
                  onClick={() => setSelectedRes(res.id)}
                  className={`p-4 md:p-6 rounded-xl md:rounded-2xl border-2 transition-all duration-300 text-center flex flex-col items-center justify-center gap-1 md:gap-2 group ${
                    selectedRes === res.id
                      ? 'bg-[#F0F9FA] border-[#8CCACB] shadow-md scale-[1.02]'
                      : 'bg-white border-slate-100 hover:border-slate-200'
                  }`}
                >
                  <div className="font-bold text-2xl md:text-4xl text-[#111827] tracking-tight relative">
                    {res.label}
                    {selectedRes === res.id && (
                      <i className="fa-solid fa-circle-check absolute -top-1 md:-top-2 -right-3 md:-right-4 text-[#128189] text-base md:text-xl animate-fade-in" />
                    )}
                  </div>
                  <div className="font-semibold text-[10px] md:text-xs text-[#4E8182] uppercase tracking-wider">
                    {res.subLabel}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* ── FORMAT + CAPTION MODE ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-start">
            
            {/* Format */}
            <div className="bg-white rounded-2xl md:rounded-3xl p-5 md:p-8 shadow-sm border border-slate-100">
              <h2 className="text-base md:text-lg font-bold text-[#111827] mb-4 md:mb-6 uppercase tracking-wide">
                Format
              </h2>
              <div className="grid grid-cols-2 gap-3 md:gap-4">
                {FORMATS.map((fmt) => (
                  <button
                    key={fmt.id}
                    onClick={() => setSelectedFormat(fmt.id)}
                    disabled={isSrt}
                    className={`p-4 md:p-6 rounded-xl border-2 transition-all duration-300 flex flex-col items-center sm:items-start justify-center gap-1 group ${
                      selectedFormat === fmt.id
                        ? 'bg-[#F0F9FA] border-[#8CCACB] shadow-sm scale-[1.02]'
                        : 'bg-white border-slate-100 hover:border-slate-200'
                    } ${isSrt ? 'opacity-40 cursor-not-allowed' : ''}`}
                  >
                    <div className="font-bold text-lg md:text-xl text-[#111827] tracking-tight">
                      {fmt.label}
                    </div>
                    <div className="font-semibold text-[9px] md:text-[10px] text-[#4E8182] uppercase tracking-wider text-center sm:text-left">
                      {fmt.subLabel}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Caption Mode */}
            <div className="bg-white rounded-2xl md:rounded-3xl p-5 md:p-8 shadow-sm border border-slate-100">
              <h2 className="text-base md:text-lg font-bold text-[#111827] mb-4 md:mb-6 uppercase tracking-wide">
                Caption Mode
              </h2>
              <div className="flex flex-col gap-3 md:gap-4">
                {CAPTION_MODES.map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => setSelectedCaptionMode(mode.id)}
                    className={`p-4 md:p-5 rounded-xl border-2 transition-all duration-300 flex items-center justify-between gap-3 ${
                      selectedCaptionMode === mode.id
                        ? 'bg-[#F0F9FA] border-[#8CCACB]'
                        : 'bg-white border-slate-100 hover:border-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <i
                        className={`fa-solid ${mode.icon} ${
                          selectedCaptionMode === mode.id ? 'text-[#128189]' : 'text-slate-400'
                        } text-xl md:text-2xl transition-colors`}
                      />
                      <div className="flex flex-col items-start text-left">
                        <span className="font-bold text-xs md:text-sm text-[#111827]">
                          {mode.label}
                        </span>
                        <span className="text-[#64748B] text-[10px] md:text-[11px] font-medium">
                          {mode.description}
                        </span>
                      </div>
                    </div>
                    <i
                      className={`fa-solid ${
                        selectedCaptionMode === mode.id
                          ? 'fa-circle-dot text-[#128189]'
                          : 'fa-circle text-slate-200'
                      } text-xl transition-colors`}
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ── ACTION / PROGRESS CARD ── */}
          <div className="w-full bg-white rounded-2xl md:rounded-3xl p-5 md:p-8 shadow-md border border-slate-200 relative overflow-hidden">
            
            {/* Progress Header */}
            {exportPhase !== 'idle' && (
              <div className="flex items-start justify-between mb-3 animate-fade-in">
                <div>
                  <h2 className="text-sm md:text-base font-bold text-[#111827]">
                    Rendering Progress
                  </h2>
                  <span className="text-slate-500 font-semibold text-[9px] md:text-[10px] tracking-wider uppercase">
                    {exportPhase === 'complete' && 'Export Complete'}
                    {exportPhase === 'failed'   && 'Export Failed'}
                    {(exportPhase === 'submitting' || exportPhase === 'rendering') && `Time remaining: ${estimatedTime}`}
                  </span>
                </div>
                <span className="text-3xl md:text-4xl font-extrabold text-[#128189] tracking-tighter">
                  {Math.round(progress)}%
                </span>
              </div>
            )}

            {/* Progress Bar */}
            {exportPhase !== 'idle' && (
              <div className="w-full h-2 md:h-2.5 bg-slate-100 rounded-full mb-6 relative overflow-hidden">
                <div
                  className={`absolute top-0 bottom-0 left-0 rounded-full transition-all duration-500 ease-out ${
                    exportPhase === 'failed' ? 'bg-red-500' : 'bg-[#128189]'
                  }`}
                  style={{ width: `${progress}%` }}
                >
                  {(exportPhase === 'submitting' || exportPhase === 'rendering') && (
                    <div className="absolute inset-0 bg-white/20 w-full h-full animate-[pulse_1.5s_ease-in-out_infinite]" />
                  )}
                </div>
              </div>
            )}

            {/* Error message */}
            {exportPhase === 'failed' && errorMessage && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs md:text-sm font-medium">
                ⚠ {errorMessage}
              </div>
            )}

            {/* CTA Buttons */}
            {exportPhase === 'idle' && (
              <button
                onClick={handleExport}
                className="w-full text-white font-bold py-3.5 md:py-4 rounded-xl md:rounded-2xl transition-all duration-300 shadow-md flex items-center justify-center gap-2 md:gap-2.5 text-sm md:text-base bg-[#0C4E5E] hover:bg-[#093c48]"
              >
                {isSrt ? (
                  <>
                    <i className="fa-solid fa-download" />
                    {`Download SRT · ${displayLanguage} (${displaySize})`}
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-play" />
                    {'Start Video Export'}
                  </>
                )}
              </button>
            )}

            {(exportPhase === 'submitting' || exportPhase === 'rendering') && (
              <button
                disabled
                className="w-full text-white font-bold py-3.5 md:py-4 rounded-xl md:rounded-2xl bg-[#128189]/80 flex items-center justify-center gap-2 md:gap-2.5 text-sm md:text-base cursor-not-allowed opacity-90"
              >
                <i className="fa-solid fa-circle-notch fa-spin" />
                Generating…
              </button>
            )}

            {exportPhase === 'complete' && (
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleDownload}
                  className="flex-1 text-white font-bold py-3.5 md:py-4 rounded-xl md:rounded-2xl transition-all duration-300 shadow-md flex items-center justify-center gap-2 md:gap-2.5 text-sm md:text-base bg-[#10B981] hover:bg-[#059669]"
                >
                  <i className="fa-solid fa-download" />
                  {isSrt ? `Download SRT · ${displayLanguage} (${displaySize})` : `Download ${selectedFormat.toUpperCase()} · ${selectedResLabel} (${displaySize})`}
                </button>
                <button
                  onClick={handleReset}
                  className="sm:w-40 font-bold py-3.5 md:py-4 rounded-xl md:rounded-2xl border-2 border-slate-200 text-slate-600 hover:border-slate-300 transition-all duration-300 text-sm md:text-base"
                >
                  Export Again
                </button>
              </div>
            )}

            {exportPhase === 'failed' && (
              <button
                onClick={handleReset}
                className="w-full text-white font-bold py-3.5 md:py-4 rounded-xl md:rounded-2xl transition-all duration-300 shadow-md flex items-center justify-center gap-2 md:gap-2.5 text-sm md:text-base bg-[#0C4E5E] hover:bg-[#093c48]"
              >
                <i className="fa-solid fa-rotate-right" />
                Try Again
              </button>
            )}
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════════
            RIGHT COLUMN — preview + details  (1 / 3 width)
            ════════════════════════════════════════════════════════════════ */}
        <div className="lg:col-span-1 flex flex-col gap-6 md:gap-8 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          
          {/* ── VIDEO THUMBNAIL PREVIEW ── */}
          <div 
            onClick={() => navigate(-1)}
            className="bg-white rounded-2xl md:rounded-3xl overflow-hidden shadow-sm border border-slate-100 relative group cursor-pointer"
          >
            <div className="relative aspect-[16/9] bg-slate-800 flex items-center justify-center overflow-hidden">
              {thumbnail_url ? (
                <img
                  src={thumbnail_url}
                  alt={displayName}
                  className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-700"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-700 to-slate-900">
                  <i className="fa-solid fa-film text-slate-500 text-4xl" />
                </div>
              )}

              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col items-start justify-end p-4 md:p-5">
                <div className="text-white text-[10px] md:text-xs font-bold mb-1.5 flex items-center gap-1.5 uppercase tracking-wider">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                  </span>
                  Master Preview
                </div>
                <h3 className="text-white font-bold text-sm md:text-base leading-snug mb-1 truncate w-full">
                  {displayName}
                </h3>
                <div className="text-slate-300 text-[10px] md:text-[11px] font-medium tracking-wide">
                  {selectedResLabel} · {displayFps} · {displayDuration}
                </div>
              </div>
            </div>
          </div>

          {/* ── EXPORT DETAILS ── */}
          <div className="bg-white rounded-2xl md:rounded-3xl p-5 md:p-8 shadow-sm border border-slate-100">
            <h2 className="text-base md:text-lg font-bold text-[#111827] mb-4 md:mb-6 uppercase tracking-wide">
              Export Details
            </h2>

            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500 font-semibold text-[10px] md:text-xs tracking-wider uppercase">
                  {exportPhase === 'complete' ? 'Actual Size' : 'Estimated Size'}
                </span>
                <span className="text-[#111827] font-bold text-xs md:text-sm">
                  {displaySize}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500 font-semibold text-[10px] md:text-xs tracking-wider uppercase">
                  Target Format
                </span>
                <span className="text-[#111827] font-bold text-xs md:text-sm">
                  {targetFormatLabel}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500 font-semibold text-[10px] md:text-xs tracking-wider uppercase">
                  Resolution
                </span>
                <span className="text-[#111827] font-bold text-xs md:text-sm">
                  {targetResolutionLabel}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500 font-semibold text-[10px] md:text-xs tracking-wider uppercase">
                  Target Codec
                </span>
                <span className="text-[#111827] font-bold text-xs md:text-sm">
                  {targetCodecLabel}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500 font-semibold text-[10px] md:text-xs tracking-wider uppercase">
                  Caption Language
                </span>
                <span className="text-[#111827] font-bold text-xs md:text-sm">
                  {displayLanguage}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500 font-semibold text-[10px] md:text-xs tracking-wider uppercase">
                  Duration
                </span>
                <span className="text-[#111827] font-bold text-xs md:text-sm">
                  {displayDuration}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500 font-semibold text-[10px] md:text-xs tracking-wider uppercase">
                  Frame Rate
                </span>
                <span className="text-[#111827] font-bold text-xs md:text-sm">
                  {displayFps}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 pt-2">
                <span className="text-slate-500 font-semibold text-[10px] md:text-xs tracking-wider uppercase">
                  Project Link
                </span>
                <button
                  onClick={handleCopyLink}
                  className={`${
                    copied ? 'text-green-600 font-extrabold scale-[1.03]' : 'text-[#128189] hover:text-[#0E666D]'
                  } font-bold text-xs md:text-sm flex items-center gap-1.5 transition-all duration-300`}
                >
                  {copied ? (
                    <>
                      Copied! <i className="fa-solid fa-circle-check animate-fade-in text-green-600" />
                    </>
                  ) : (
                    <>
                      Copy URL <i className="fa-solid fa-copy" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* ── TURBO MODE BADGE ── */}
          <div className="bg-[#F6EBE5] rounded-2xl md:rounded-3xl p-4 md:p-6 border border-[#ECCACA] flex items-center gap-3 md:gap-4 shadow-sm">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-[#B16938]/10 flex items-center justify-center flex-shrink-0">
              <i className="fa-solid fa-bolt text-[#B16938] text-lg md:text-xl" />
            </div>
            <p className="text-[#845330] font-medium text-[11px] md:text-xs leading-relaxed">
              <span className="font-bold text-[#B16938]">Turbo Mode:</span> Using GPU acceleration for 3.5× faster rendering.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Export;