import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useLocation } from "react-router-dom";

// ─────────────────────────────────────────────────────────────────────────────
// API LAYER  — all network calls live here, nothing else touches fetch()
// ─────────────────────────────────────────────────────────────────────────────

const API_BASE = 'http://127.0.0.1:8000/api';   // adjust to match your actual base path

function authHeaders() {
  const token =
    localStorage.getItem('token') ||
    sessionStorage.getItem('token') ||
    '';
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
  console.log(text);

  const json = JSON.parse(text);

  if (!res.ok || json.success === false) {
    throw new Error(json.message || `HTTP ${res.status}`);
  }

  return json.data;
}
// GET  /api/videos/:id/preview/
const fetchVideoPreview = (videoId) =>
  apiFetch(`/videos/${videoId}/preview/`);

// POST /api/videos/:id/export/  → returns ExportJob
const startVideoExport = (videoId, payload) =>
  apiFetch(`/videos/${videoId}/export/`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });

// GET  /api/videos/:videoId/export/:exportId/status/
const fetchExportStatus = (videoId, exportId) =>
  apiFetch(`/videos/${videoId}/export/${exportId}/status/`);

// GET  /api/videos/:id/download/  (streams the exported file)
const buildVideoDownloadUrl = (videoId) =>
  `${API_BASE}/videos/${videoId}/download/`;

// GET  /api/captions/videos/:videoId/download-srt?language=…
const buildSrtDownloadUrl = (videoId, language = 'en', translated = false) =>
  `${API_BASE}/captions/videos/${videoId}/download-srt?language=${language}&translated=${translated}`;

// ─────────────────────────────────────────────────────────────────────────────
// STATIC UI OPTIONS  — zero mock data here, only labels / IDs
// ─────────────────────────────────────────────────────────────────────────────

const RESOLUTIONS = [
  { id: '854x480',   label: '480p',  subLabel: 'SD'       },
  { id: '1280x720',  label: '720p',  subLabel: 'HD Ready' },
  { id: '1920x1080', label: '1080p', subLabel: 'Full HD'  },
  { id: '3840x2160', label: '4K',    subLabel: 'Ultra HD' },
];

const FORMATS = [
  { id: 'mp4', label: 'MP4', subLabel: 'H.264 HIGH' },
  { id: 'mov', label: 'MOV', subLabel: 'PRORES 422'  },
];

const CAPTION_MODES = [
  { id: 'Burned-in',     label: 'Burned-in',    description: 'Permanent on video',    icon: 'fa-closed-captioning' },
  { id: 'Separate .SRT', label: 'Separate .SRT', description: 'Sidecar file for web', icon: 'fa-file-lines'        },
];

// ── Rough client-side size estimate for UX only (not authoritative) ──────────
const SIZE_MULTIPLIERS = {
  '854x480':   0.35,
  '1280x720':  0.60,
  '1920x1080': 1.00,
  '3840x2160': 2.80,
};
const FORMAT_BASE_MB = { mp4: 842, mov: 1450 };

function estimateSize(formatId, resolutionId, isSrt) {
  if (isSrt) return '~12 KB';
  const base = FORMAT_BASE_MB[formatId] ?? 842;
  const mult = SIZE_MULTIPLIERS[resolutionId] ?? 1.0;
  const mb   = base * mult;
  return mb >= 1024
    ? `${(mb / 1024).toFixed(1)} GB`
    : `${Math.round(mb)} MB`;
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Props
 *   videoId   {string}  UUID of the video to export  (required)
 *   language  {string}  caption language code         (default "en")
 */
const Export = () => {
  const { videoId } = useParams();

  const location = useLocation();  // import bhi add karo
  const [selectedLanguage, setSelectedLanguage] = useState(
    location.state?.activeLang || 'en'
  );
  const useTranslated = selectedLanguage !== 'en';

  // ── Video data from backend ──────────────────────────────────────────────
  const [videoData,  setVideoData]  = useState(null);
  const [isLoading,  setIsLoading]  = useState(true);
  const [loadError,  setLoadError]  = useState(null);

  // ── User selections ──────────────────────────────────────────────────────
  const [selectedRes,         setSelectedRes]         = useState('1920x1080');
  const [selectedFormat,      setSelectedFormat]      = useState('mp4');
  const [selectedCaptionMode, setSelectedCaptionMode] = useState('Burned-in');

  // ── Export-job state ─────────────────────────────────────────────────────
  // phase: 'idle' | 'submitting' | 'rendering' | 'complete' | 'failed'
  const [exportPhase,   setExportPhase]   = useState('idle');
  const [progress,      setProgress]      = useState(0);
  const [estimatedTime, setEstimatedTime] = useState('--:--');
  const [exportJobId,   setExportJobId]   = useState(null);
  const [errorMessage,  setErrorMessage]  = useState('');

  const pollTimerRef     = useRef(null);
  const progressTimerRef = useRef(null);

  const isSrt = selectedCaptionMode === 'Separate .SRT';

  // ── 1. Fetch video preview on mount ─────────────────────────────────────
  useEffect(() => {
    if (!videoId) {
      setLoadError('No videoId provided.');
      setIsLoading(false);
      return;
    }
    fetchVideoPreview(videoId)
      .then((data) => { setVideoData(data); setIsLoading(false); })
      .catch((err)  => { setLoadError(err.message); setIsLoading(false); });
  }, [videoId]);



  const LANGUAGES = [
  { id: 'en', label: 'English' },
  { id: 'hi', label: 'Hindi' },
  { id: 'es', label: 'Spanish' },
  { id: 'fr', label: 'French' },
  { id: 'de', label: 'German' },
  { id: 'ar', label: 'Arabic' },
  { id: 'pt', label: 'Portuguese' },
  { id: 'ja', label: 'Japanese' },
  { id: 'ko', label: 'Korean' },
  { id: 'zh', label: 'Chinese' },
];

  // ── 2. Cleanup timers on unmount ─────────────────────────────────────────
  useEffect(() => () => {
    clearInterval(pollTimerRef.current);
    clearInterval(progressTimerRef.current);
  }, []);

  // ── 3. Smooth fake-progress while polling ─────────────────────────────────
  const startProgressAnimation = () => {
    progressTimerRef.current = setInterval(() => {
      setProgress((p) => (p < 88 ? p + Math.random() * 2.5 : p));
      const secs = Math.floor(Math.random() * 40 + 5);
      const m = Math.floor(secs / 60);
      const s = secs % 60;
      setEstimatedTime(`0${m}:${s.toString().padStart(2, '0')}`);
    }, 800);
  };

  // ── 4. Poll export-job status ─────────────────────────────────────────────
  const startPolling = useCallback((jobId) => {
    pollTimerRef.current = setInterval(async () => {
      try {
        const job = await fetchExportStatus(videoId, jobId);
        if (job.status === 'completed') {
          clearInterval(pollTimerRef.current);
          clearInterval(progressTimerRef.current);
          setProgress(100);
          setEstimatedTime('Ready');
          setExportPhase('complete');
        } else if (job.status === 'failed') {
          clearInterval(pollTimerRef.current);
          clearInterval(progressTimerRef.current);
          setErrorMessage(job.error_message || 'Export failed on the server.');
          setExportPhase('failed');
        }
        // status === 'processing' → keep polling
      } catch {
        // transient network hiccup — keep polling
      }
    }, 2000);
  }, [videoId]);

  // ── 5. Kick off export ────────────────────────────────────────────────────
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
        resolution:    selectedRes,
        language:     selectedLanguage, 
        caption_mode: "burned",
        use_translated:  useTranslated, 
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

  // ── 6. Download the exported file ─────────────────────────────────────────
  const handleDownload = async () => {
    const url = isSrt
      ? buildSrtDownloadUrl(videoId, selectedLanguage, useTranslated)
      : buildVideoDownloadUrl(videoId);
    
    

      
    const token =
      localStorage.getItem('token') ||
      sessionStorage.getItem('token') ||
      '';

    try {
      const res  = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error(`Download failed: HTTP ${res.status}`);
      const blob = await res.blob();
      const name = isSrt
        ? `captions_${videoId}_${selectedLanguage}.srt`
        : `${videoData?.title || videoId}_${selectedRes}_${selectedLanguage}.${selectedFormat}`;

      const href = window.URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = href; a.download = name; a.click();
      window.URL.revokeObjectURL(href);
    } catch (err) {
      setErrorMessage(err.message);
    }
  };

  // ── 7. Reset ──────────────────────────────────────────────────────────────
  const handleReset = () => {
    clearInterval(pollTimerRef.current);
    clearInterval(progressTimerRef.current);
    setExportPhase('idle');
    setProgress(0);
    setEstimatedTime('--:--');
    setExportJobId(null);
    setErrorMessage('');
  };

  // ─────────────────────────────────────────────────────────────────────────
  // DERIVED DISPLAY VALUES  — sourced entirely from real videoData
  // ─────────────────────────────────────────────────────────────────────────

  const formatDuration = (secs) => {
    if (!secs) return '--:--';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const displayName     = videoData?.title
    || videoData?.original_file?.split('/').pop()
    || '—';
  const displayDuration = formatDuration(videoData?.duration);
  const displayFps      = videoData?.fps    ? `${Math.round(videoData.fps)}fps` : '—';
  const displayCodec    = videoData?.codec  || '—';
  const thumbnailUrl    = videoData?.thumbnail_url || null;
  const estimatedSize   = estimateSize(selectedFormat, selectedRes, isSrt);
  const selectedResLabel = RESOLUTIONS.find((r) => r.id === selectedRes)?.label ?? selectedRes;

  // ─────────────────────────────────────────────────────────────────────────
  // LOADING / ERROR SCREENS
  // ─────────────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="w-full min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center">
        <i className="fa-solid fa-circle-notch fa-spin text-4xl text-[#128189] mb-4" />
        <h2 className="text-[#111827] font-bold text-lg animate-pulse">
          Loading Export Settings…
        </h2>
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

  // ─────────────────────────────────────────────────────────────────────────
  // MAIN RENDER  (structure + class names preserved from original Export.jsx)
  // ─────────────────────────────────────────────────────────────────────────

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
        <div
          className="lg:col-span-2 flex flex-col gap-6 md:gap-8 animate-slide-up"
          style={{ animationDelay: '0.1s' }}
        >

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

          {/* ── FORMAT + CAPTION MODE (side by side) ── */}
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

            {/* Progress header — hidden when idle */}
            {exportPhase !== 'idle' && (
              <div className="flex items-start justify-between mb-3 animate-fade-in">
                <div>
                  <h2 className="text-sm md:text-base font-bold text-[#111827]">
                    Rendering Progress
                  </h2>
                  <span className="text-slate-500 font-semibold text-[9px] md:text-[10px] tracking-wider uppercase">
                    {exportPhase === 'complete' && 'Export Complete'}
                    {exportPhase === 'failed'   && 'Export Failed'}
                    {(exportPhase === 'submitting' || exportPhase === 'rendering') &&
                      `Time remaining: ${estimatedTime}`}
                  </span>
                </div>
                <span className="text-3xl md:text-4xl font-extrabold text-[#128189] tracking-tighter">
                  {Math.round(progress)}%
                </span>
              </div>
            )}

            {/* Progress bar — hidden when idle */}
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

            {/* ── CTA Buttons — driven by exportPhase ── */}

            {/* IDLE */}
            {exportPhase === 'idle' && (
              <button
                onClick={handleExport}
                className="w-full text-white font-bold py-3.5 md:py-4 rounded-xl md:rounded-2xl transition-all duration-300 shadow-md flex items-center justify-center gap-2 md:gap-2.5 text-sm md:text-base bg-[#0C4E5E] hover:bg-[#093c48]"
              >
                <i className="fa-solid fa-play" />
                {isSrt ? 'Download .SRT File' : 'Start Video Export'}
              </button>
            )}

            {/* SUBMITTING / RENDERING */}
            {(exportPhase === 'submitting' || exportPhase === 'rendering') && (
              <button
                disabled
                className="w-full text-white font-bold py-3.5 md:py-4 rounded-xl md:rounded-2xl bg-[#128189]/80 flex items-center justify-center gap-2 md:gap-2.5 text-sm md:text-base cursor-not-allowed opacity-90"
              >
                <i className="fa-solid fa-circle-notch fa-spin" />
                Generating…
              </button>
            )}

            {/* COMPLETE */}
            {exportPhase === 'complete' && (
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleDownload}
                  className="flex-1 text-white font-bold py-3.5 md:py-4 rounded-xl md:rounded-2xl transition-all duration-300 shadow-md flex items-center justify-center gap-2 md:gap-2.5 text-sm md:text-base bg-[#10B981] hover:bg-[#059669]"
                >
                  <i className="fa-solid fa-download" />
                  {isSrt
                    ? 'Download .SRT File'
                    : `Download ${selectedFormat.toUpperCase()} · ${selectedResLabel}`}
                </button>
                <button
                  onClick={handleReset}
                  className="sm:w-40 font-bold py-3.5 md:py-4 rounded-xl md:rounded-2xl border-2 border-slate-200 text-slate-600 hover:border-slate-300 transition-all duration-300 text-sm md:text-base"
                >
                  Export Again
                </button>
              </div>
            )}

            {/* FAILED */}
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
        <div
          className="lg:col-span-1 flex flex-col gap-6 md:gap-8 animate-slide-up"
          style={{ animationDelay: '0.2s' }}
        >

          {/* ── VIDEO THUMBNAIL PREVIEW ── */}
          <div className="bg-white rounded-2xl md:rounded-3xl overflow-hidden shadow-sm border border-slate-100 relative group">
            <div className="relative aspect-[16/9] bg-slate-800 flex items-center justify-center overflow-hidden">

              {/* Real thumbnail from backend — fallback to placeholder */}
              {thumbnailUrl ? (
                <img
                  src={thumbnailUrl}
                  alt={displayName}
                  className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-700"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-700 to-slate-900">
                  <i className="fa-solid fa-film text-slate-500 text-4xl" />
                </div>
              )}

              {/* Overlay with live badge + video info from backend */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col items-start justify-end p-4 md:p-5">
                <div className="text-white text-[10px] md:text-xs font-bold mb-1.5 flex items-center gap-1.5 uppercase tracking-wider">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                  </span>
                  Master Preview
                </div>
                {/* Video file name — from backend */}
                <h3 className="text-white font-bold text-sm md:text-base leading-snug mb-1 truncate w-full">
                  {displayName}
                </h3>
                {/* Resolution + fps + duration — from backend + selection */}
                <div className="text-slate-300 text-[10px] md:text-[11px] font-medium tracking-wide">
                  {selectedResLabel} · {displayFps} · {displayDuration}
                </div>
              </div>
            </div>
          </div>

          {/* ── EXPORT DETAILS — all values from real videoData ── */}
          <div className="bg-white rounded-2xl md:rounded-3xl p-5 md:p-8 shadow-sm border border-slate-100">
            <h2 className="text-base md:text-lg font-bold text-[#111827] mb-4 md:mb-6 uppercase tracking-wide">
              Export Details
            </h2>

            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500 font-semibold text-[10px] md:text-xs tracking-wider uppercase">
                  Estimated Size
                </span>
                {/* Client-side estimate based on selection */}
                <span className="text-[#111827] font-bold text-xs md:text-sm">
                  {estimatedSize}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500 font-semibold text-[10px] md:text-xs tracking-wider uppercase">
                  Codec
                </span>
                {/* Real codec from backend */}
                <span className="text-[#111827] font-bold text-xs md:text-sm">
                  {displayCodec}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500 font-semibold text-[10px] md:text-xs tracking-wider uppercase">
                  Duration
                </span>
                {/* Real duration from backend */}
                <span className="text-[#111827] font-bold text-xs md:text-sm">
                  {displayDuration}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500 font-semibold text-[10px] md:text-xs tracking-wider uppercase">
                  Frame Rate
                </span>
                {/* Real fps from backend */}
                <span className="text-[#111827] font-bold text-xs md:text-sm">
                  {displayFps}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 pt-2">
                <span className="text-slate-500 font-semibold text-[10px] md:text-xs tracking-wider uppercase">
                  Project Link
                </span>
                {/* Copies shareable URL to clipboard */}
                <button
                  onClick={() =>
                    navigator.clipboard.writeText(
                      `${window.location.origin}/videos/${videoId}`
                    )
                  }
                  className="text-[#128189] font-bold text-xs md:text-sm flex items-center gap-1.5 hover:text-[#0E666D] transition-colors"
                >
                  Copy URL <i className="fa-solid fa-copy" />
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
              <span className="font-bold text-[#B16938]">Turbo Mode:</span>{' '}
              Using GPU acceleration for 3.5× faster rendering.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Export;