import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import axios from 'axios';

// ─── Utils ───────────────────────────────────────────────────────────────────

function formatTime(sec) {
  if (sec == null || isNaN(sec)) return '00:00';
  const d  = new Date(sec * 1000);
  const hh = d.getUTCHours();
  const mm = d.getUTCMinutes().toString().padStart(2, '0');
  const ss = d.getUTCSeconds().toString().padStart(2, '0');
  return hh > 0 ? `${String(hh).padStart(2, '0')}:${mm}:${ss}` : `${mm}:${ss}`;
}

function hexToRgb(hex = '#000000') {
  const h = hex.replace('#', '');
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ].join(', ');
}

function getFileNameFromUrl(url) {
  if (!url) return 'Untitled Video';
  try {
    const decoded = decodeURIComponent(url);
    const parts   = decoded.split('/');
    const raw     = parts[parts.length - 1].split('?')[0] || 'Untitled Video';
    return raw.replace(/\.[^/.]+$/, '') || 'Untitled Video';
  } catch {
    return 'Untitled Video';
  }
}

const LANGUAGE_OPTIONS = [
  { code: 'en', label: 'English'    },
  { code: 'hi', label: 'Hindi'      },
  { code: 'es', label: 'Spanish'    },
  { code: 'fr', label: 'French'     },
  { code: 'de', label: 'German'     },
  { code: 'ar', label: 'Arabic'     },
  { code: 'pt', label: 'Portuguese' },
  { code: 'ja', label: 'Japanese'   },
  { code: 'ko', label: 'Korean'     },
  { code: 'zh', label: 'Chinese'    },
];

// ─── Toast ───────────────────────────────────────────────────────────────────

const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    if (type === 'loading') return;
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose, type]);

  const colors = { success:'bg-emerald-500', error:'bg-red-500', loading:'bg-[#128189]', info:'bg-slate-600' };
  const icons  = { success:'fa-circle-check', error:'fa-circle-exclamation', loading:'fa-circle-notch fa-spin', info:'fa-circle-info' };

  return (
    <div
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-3 px-5 py-3 rounded-2xl text-white shadow-2xl text-sm font-semibold ${colors[type]}`}
      style={{ animation: 'toastUp .25s ease' }}
    >
      <i className={`fa-solid ${icons[type]}`} />
      <span>{message}</span>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const Preview = () => {
  const navigate    = useNavigate();
  const { videoId } = useParams();
  const location    = useLocation();

  // ── Router state from Translate.jsx ──
  const passedVideoUrl  = location.state?.videoUrl  || '';
  const passedCaptions  = location.state?.captions  || [];
  const passedStyles    = location.state?.styles    || {};

  // ✨ FIX: Array ke deep changes ko detect karne ke liye stringify
  const passedCaptionsString = JSON.stringify(passedCaptions);

  // Clean video name — strip extension, never show videoId
  const passedVideoName = location.state?.videoName
    ? location.state.videoName.replace(/\.[^/.]+$/, '')
    : getFileNameFromUrl(passedVideoUrl);

  // Merge styles with safe defaults
  const styles = {
    typography: 'Inter',
    isBold:     true,
    isItalic:   false,
    isCaps:     false,
    textColor:  '#FFFFFF',
    bgColor:    '#000000',
    bgOpacity:  40,
    position:   'bottom-center',
    fontSize:   16,
    ...passedStyles,
  };

  // ── State ──
  const [captions,           setCaptions]        = useState([]);
  const [activeCaptionId, setActiveCaptionId] = useState(null);
  const [isExporting,        setIsExporting]     = useState(false);
  const [exportProgress,     setExportProgress]  = useState(0);
  const [toast,              setToast]           = useState(null);
  const [videoRatio,         setVideoRatio]      = useState(null);

  // ✨ FIX: Agar return aate waqt pehle se activeLang state mein hai toh use karein, warna 'en'
  const [activeLang,         setActiveLang]      = useState(location.state?.activeLang || 'en');
  
  const [showAddLang,        setShowAddLang]     = useState(false);
  const [selectedNewLang, setSelectedNewLang] = useState('fr');
  const [addedLangs,         setAddedLangs]      = useState([]);

  const videoRef    = useRef(null);
  const timelineRef = useRef(null);
  const isDragging  = useRef(false);

  const [isPlaying,   setIsPlaying]   = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration,    setDuration]    = useState(0);

  const showToast = useCallback((msg, type) => setToast({ message: msg, type }), []);

  // ── Load captions ──
  useEffect(() => {
    if (!passedCaptions?.length) return;
    const normalized = passedCaptions
      .map((item) => ({
        id:              item.id,
        start_time:      Number(item.start_time),
        end_time:        Number(item.end_time),
        original_text:    item.original_text    || item.original_text || item.text || '',
        translated_text: item.translated_text?.trim() || item.translated_text || '',
        language:        item.language || '',
        time:            formatTime(Number(item.start_time)),
      }))
      .sort((a, b) => a.start_time - b.start_time);

    setCaptions(normalized);
    if (normalized.length) setActiveCaptionId(normalized[0].id);

    // Auto-detect ONLY languages that actually have translations
    const langMap = new Map();

    normalized.forEach((c) => {
      const hasTranslation = c.translated_text?.trim();

      if (!hasTranslation) return;        // ❌ skip empty translations
      if (c.language === 'en') return;    // ❌ skip English

      langMap.set(c.language, true);
    });

    const langs = Array.from(langMap.keys());
    const newAddedLangs = langs.map(code => ({
      code,
      label: LANGUAGE_OPTIONS.find(l => l.code === code)?.label || code,
      status: 'generated',
    }));

    setAddedLangs(newAddedLangs);

    // ✨ FIX: Jab Translate page se aao toh translated language automatically select ho jaye
    if (!location.state?.activeLang && newAddedLangs.length > 0) {
      setActiveLang(newAddedLangs[0].code);
    }

  // ✨ FIX: Dependency array mein passedCaptionsString aur location.state add kiya
  }, [passedCaptionsString, location.state?.activeLang]); // eslint-disable-line

  // ── Sync active caption ──
  useEffect(() => {
    const match = captions.find(c => currentTime >= c.start_time && currentTime <= c.end_time);
    if (match && match.id !== activeCaptionId) setActiveCaptionId(match.id);
  }, [currentTime, captions]); // eslint-disable-line

  // ── Video handlers ──
  const handleTimeUpdate = () => {
    if (videoRef.current && !isDragging.current) setCurrentTime(videoRef.current.currentTime);
  };
  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    setDuration(videoRef.current.duration);
    const { videoWidth, videoHeight } = videoRef.current;
    if (videoWidth && videoHeight) setVideoRatio(videoWidth >= videoHeight ? 'landscape' : 'portrait');
  };
  const togglePlay = () => {
    if (!videoRef.current) return;
    videoRef.current.paused ? videoRef.current.play() : videoRef.current.pause();
  };
  const seekTo = useCallback((time) => {
    const t = Math.max(0, Math.min(time, duration || 0));
    setCurrentTime(t);
    if (videoRef.current) videoRef.current.currentTime = t;
  }, [duration]);
  const seekVideo = (delta) => seekTo(currentTime + delta);

  // ── Timeline drag ──
  const timeFromX = useCallback((clientX) => {
    if (!timelineRef.current || !duration) return 0;
    const { left, width } = timelineRef.current.getBoundingClientRect();
    return Math.max(0, Math.min((clientX - left) / width, 1)) * duration;
  }, [duration]);

  const onTlMouseDown = (e) => { isDragging.current = true; seekTo(timeFromX(e.clientX)); };

  useEffect(() => {
    const onMove = (e) => { if (!isDragging.current) return; const t = timeFromX(e.clientX); setCurrentTime(t); if (videoRef.current) videoRef.current.currentTime = t; };
    const onUp   = ()  => { isDragging.current = false; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup',   onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, [timeFromX]);

  // ── Export (unchanged) ──

  const handleExport = () => {
    navigate(
      `/editor/upload/captions/translate/preview/export/${videoId}`,
      {
        state: {
          videoId,
          videoUrl: passedVideoUrl,
          captions,
          styles,
          activeLang,
          languageLabel: activeLangLabel,
          videoName: passedVideoName,
        },
      }
    );
  };

  // ── Add language ──
  const handleAddLanguage = () => {
    const lang = LANGUAGE_OPTIONS.find(l => l.code === selectedNewLang);
    if (!lang) return;
    if (addedLangs.find(l => l.code === selectedNewLang)) { setShowAddLang(false); return; }
    setAddedLangs(prev => [...prev, { code: selectedNewLang, label: lang.label, status: 'pending' }]);
    setShowAddLang(false);
  };

  // ── Derived ──
  const progressPct    = duration ? (currentTime / duration) * 100 : 0;
  const bgRgb          = hexToRgb(styles.bgColor);
  const isPortrait     = videoRatio === 'portrait';
  const stylePreviewBg = `rgba(${bgRgb}, ${styles.bgOpacity / 100})`;

  // STRICT language rule: 'en' → original_text only | other → translated_text only (no mixing)
  const activeSubtitle = (() => {
    const seg = captions.find(c => currentTime >= c.start_time && currentTime <= c.end_time);
    if (!seg) return null;
    if (activeLang === 'en') {
      return seg.original_text || seg.original_text || null;
    }

    return seg.translated_text?.trim()
      ? seg.translated_text
      : null;
  })();

  const positionClass = ({
    'top-left':      'justify-start items-start',
    'top-center':    'justify-start items-center',
    'top-right':     'justify-start items-end',
    'bottom-left':   'justify-end items-start',
    'bottom-center': 'justify-end items-center',
    'bottom-right':  'justify-end items-end',
  })[styles.position] || 'justify-end items-center';

  const videoContainerStyle = isPortrait
    ? { width: '100%', maxWidth: '340px', aspectRatio: '9/16' }
    : { width: '100%', aspectRatio: '16/9' };

  const activeLangLabel = LANGUAGE_OPTIONS.find(l => l.code === activeLang)?.label ?? activeLang;

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap');
        @keyframes toastUp { from{opacity:0;transform:translate(-50%,14px)} to{opacity:1;transform:translate(-50%,0)} }
        @keyframes fadeUp  { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeIn  { from{opacity:0} to{opacity:1} }
        .fade-up { animation: fadeUp .45s cubic-bezier(.22,.68,0,1.2) both; }
        .fade-in { animation: fadeIn .35s ease both; }
        .custom-scrollbar::-webkit-scrollbar       { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 99px; }
        .tl-bar { cursor: col-resize; user-select: none; touch-action: none; }
        input[type=range] { -webkit-appearance:none; appearance:none; height:3px; border-radius:99px; background:#e2e8f0; }
        input[type=range]::-webkit-slider-thumb { -webkit-appearance:none; width:13px; height:13px; border-radius:50%; background:#128189; cursor:pointer; box-shadow:0 1px 4px rgba(0,0,0,.2); }
        .top-nav { box-shadow: 0 1px 0 #e2e8f0, 0 2px 12px rgba(0,0,0,.04); }
      `}</style>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="w-full min-h-screen bg-[#F2F4F6] flex flex-col" style={{ fontFamily: "'DM Sans', sans-serif" }}>

        {/* ══════════════════════════════════════════════════════════════════
            STICKY TOP NAV BAR
        ══════════════════════════════════════════════════════════════════ */}
        <nav className="top-nav sticky w-full p-10 top-0 z-50 bg-white h-14 flex items-center justify-center mx-auto md:px-6 gap-2 shrink-0">

          {/* CENTER — Clean video name only, no ID */}
          <div className="flex w-full items-center justify-start">
           <div className="flex items-center gap-2 min-w-0 flex-1">
              <i className="fa-solid fa-clapperboard text-brand-primary text-xs shrink-0" />

              <h1
                className="text-sm font-bold text-slate-800 whitespace-normal break-words"
                title={passedVideoName}
              >
                {passedVideoName}
              </h1>
            </div>
             {videoRatio && (
              <span className="hidden md:flex items-center text-[9px] font-bold text-brand-primary border border-brand-primary px-1.5 py-0.5 rounded uppercase shrink-0">
                {isPortrait ? '9:16' : '16:9'}
              </span>
            )}
          </div>

          {/* RIGHT — Action buttons */}
          <div className="flex items-center gap-2 shrink-0" style={{ width: '220px', justifyContent: 'flex-end' }}>
            <button
              onClick={() => navigate(-1)}
              className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-500 text-xs font-bold transition-all active:scale-95"
            >
              Save Draft
            </button>

            <button
  onClick={handleExport}
  disabled={isExporting}
  className={`px-4 py-2 rounded-xl text-white text-xs font-bold transition-all active:scale-95 ${isExporting ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#128189] hover:bg-[#0d7677]'}`}
>
  Export Video
</button>
          </div>
        </nav>

        {/* ══════════════════════════════════════════════════════════════════
            BODY  — Left Sidebar | Center Video | Right (reserved)
        ══════════════════════════════════════════════════════════════════ */}
        <div className="flex flex-1 overflow-hidden" style={{ height: 'calc(100vh - 56px)' }}>

          {/* ════════════════════
              CENTER — Video (dominant)
          ════════════════════ */}
          <main className="flex-1 overflow-y-auto overflow-x-hidden bg-[#F2F4F6] flex flex-col items-center justify-start p-6 md:p-10">

            <div
              className="relative bg-black rounded-2xl overflow-hidden shadow-2xl border border-slate-900/10 mx-auto fade-up w-full"
              style={videoContainerStyle}
            >
              {passedVideoUrl ? (
                <>
                  <video
                    ref={videoRef}
                    src={passedVideoUrl}
                    className="w-full h-full object-contain"
                    onClick={togglePlay}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    onTimeUpdate={handleTimeUpdate}
                    onLoadedMetadata={handleLoadedMetadata}
                  />

                  {/* Big play overlay */}
                  {!isPlaying && (
                    <button onClick={togglePlay} className="absolute inset-0 flex items-center justify-center bg-black/25 group transition-all">
                      <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                        <i className="fa-solid fa-play ml-1 text-white text-2xl" />
                      </div>
                    </button>
                  )}

                  {/* Caption overlay — strict language rule applied here */}
                  <div className={`absolute inset-0 px-6 py-5 flex flex-col pointer-events-none ${positionClass}`}>
                    {activeSubtitle && (
                      <div className="rounded-xl px-5 py-3 max-w-[90%] shadow-lg" style={{ backgroundColor: stylePreviewBg }}>
                        <p
                          className="text-center leading-snug break-words w-full"
                          style={{
                            color:         styles.textColor,
                            fontFamily:    styles.typography,
                            fontWeight:    styles.isBold   ? '700'       : '400',
                            fontStyle:     styles.isItalic ? 'italic'    : 'normal',
                            textTransform: styles.isCaps   ? 'uppercase' : 'none',
                            fontSize:      `clamp(12px, ${styles.fontSize / 16}vw + 5px, ${styles.fontSize}px)`,
                          }}
                        >
                          {activeSubtitle}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Controls bar */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/85 to-transparent px-4 pt-8 pb-3">
                    {/* Scrubber */}
                    <div
                      ref={timelineRef}
                      className="tl-bar relative w-full h-1 bg-white/25 rounded-full cursor-pointer group mb-3"
                      onMouseDown={onTlMouseDown}
                    >
                      <div className="absolute inset-y-0 left-0 bg-[#128189] rounded-full pointer-events-none" style={{ width: `${progressPct}%` }} />
                      <div className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white rounded-full shadow pointer-events-none scale-0 group-hover:scale-100 transition-transform" style={{ left: `calc(${progressPct}% - 7px)` }} />
                    </div>

                    <div className="flex items-center gap-3">
                      <button onClick={togglePlay} className="text-white hover:text-[#6ECECE] transition-colors">
                        <i className={`fa-solid ${isPlaying ? 'fa-pause' : 'fa-play'} text-base`} />
                      </button>
                      <span className="font-mono text-[11px] text-white/70 flex-1">
                        {formatTime(currentTime)} / {formatTime(duration)}
                      </span>
                      <button onClick={() => seekVideo(-5)} className="text-white/60 hover:text-white transition-colors">
                        <i className="fa-solid fa-backward-step text-sm" />
                      </button>
                      <button onClick={() => seekVideo(5)} className="text-white/60 hover:text-white transition-colors">
                        <i className="fa-solid fa-forward-step text-sm" />
                      </button>
                      <button className="text-white/60 hover:text-white transition-colors">
                        <i className="fa-solid fa-volume-high text-sm" />
                      </button>
                      <button className="text-white/60 hover:text-white transition-colors">
                        <i className="fa-solid fa-expand text-sm" />
                      </button>
                      {/* Active language badge */}
                      <span className="text-[9px] font-bold text-white/80 border border-white/20 px-2 py-0.5 rounded-full uppercase tracking-wide">
                        {activeLangLabel}
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-white/30 bg-slate-800">
                  <i className="fa-solid fa-video-slash text-4xl" />
                  <span className="text-sm">No video source</span>
                </div>
              )}
            </div>

            {/* Info strip */}
            {captions.length > 0 && (
              <div className="mt-4 flex items-center gap-3 text-xs text-slate-400 font-medium fade-up flex-wrap justify-center">
                <span><span className="font-bold text-slate-600">{captions.length}</span> segments</span>
                <span className="text-slate-300">·</span>
                <span><span className="font-bold text-slate-600">{captions.filter(c => c.translated_text).length}</span> translated</span>
                <span className="text-slate-300">·</span>
                <span>{isPortrait ? '9:16 Portrait' : '16:9 Landscape'}</span>
                <span className="text-slate-300">·</span>
                <span>Viewing: <span className="font-bold text-[#128189]">{activeLangLabel}</span></span>
              </div>
            )}
          </main>

          {/* ════════════════════
              RIGHT — Sidebar
          ════════════════════ */}
           <aside className="w-72 shrink-0 bg-white border-r border-slate-200 overflow-y-auto custom-scrollbar py-5 px-4 flex flex-col gap-5 fade-in">

            {/* ─── Subtitle Style ─── */}
            <section>
              <p className="text-[10px] font-bold tracking-[.12em] text-slate-500 uppercase mb-3">Subtitle Style</p>

              {/* Style preview swatch */}
              <div
                className="w-full h-24 rounded-xl flex items-center justify-center mb-3 border border-slate-100"
                style={{ backgroundColor: '#0D1117' }}
              >
                <div className="rounded-lg px-4 py-2" style={{ backgroundColor: stylePreviewBg }}>
                  <p style={{
                    color:         styles.textColor,
                    fontFamily:    styles.typography,
                    fontWeight:    styles.isBold   ? '700'       : '400',
                    fontStyle:     styles.isItalic ? 'italic'    : 'normal',
                    textTransform: styles.isCaps   ? 'uppercase' : 'none',
                    fontSize:      Math.min(styles.fontSize, 13),
                  }}>
                    Preview Style
                  </p>
                </div>
              </div>

              {/* Color dots */}
              <div className="flex gap-2 mb-3">
                <div className="w-9 h-9 rounded-lg border-2 border-[#128189] shadow-sm" style={{ backgroundColor: styles.textColor }} title="Text color" />
                <div className="w-9 h-9 rounded-lg border border-slate-200 shadow-sm" style={{ backgroundColor: styles.bgColor }} title="Background color" />
              </div>

              {/* Read-only style sliders */}
              <div className="bg-slate-50 rounded-xl px-3 py-3 border border-slate-100 mb-2 flex flex-col gap-2.5">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <p className="text-[9px] font-bold tracking-widest text-slate-400 uppercase">Background Opacity</p>
                    <span className="text-[9px] font-bold text-[#128189] bg-[#E1F2F3] px-1.5 py-0.5 rounded">{styles.bgOpacity}%</span>
                  </div>
                  <input type="range" min={0} max={100} value={styles.bgOpacity} readOnly onChange={() => {}} className="w-full accent-[#128189]" />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <p className="text-[9px] font-bold tracking-widest text-slate-400 uppercase">Font Size</p>
                    <span className="text-[9px] font-bold text-[#128189] bg-[#E1F2F3] px-1.5 py-0.5 rounded">{styles.fontSize}px</span>
                  </div>
                  <input type="range" min={10} max={36} value={styles.fontSize} readOnly onChange={() => {}} className="w-full accent-[#128189]" />
                </div>
              </div>

              {/* Style badges */}
              <div className="flex flex-wrap gap-1.5">
                <span className="text-[9px] font-bold bg-slate-100 text-slate-500 px-2.5 py-1 rounded-lg uppercase tracking-wide">{styles.typography}</span>
                {styles.isBold   && <span className="text-[9px] font-black bg-[#E1F2F3] text-[#128189] px-2.5 py-1 rounded-lg uppercase">Bold</span>}
                {styles.isItalic && <span className="text-[9px] italic bg-[#E1F2F3] text-[#128189] px-2.5 py-1 rounded-lg">Italic</span>}
                {styles.isCaps   && <span className="text-[9px] font-bold bg-[#E1F2F3] text-[#128189] px-2.5 py-1 rounded-lg uppercase">Caps</span>}
                <span className="text-[9px] font-semibold bg-slate-100 text-slate-500 px-2.5 py-1 rounded-lg capitalize">{styles.position.replace('-', ' ')}</span>
              </div>

              <button
                onClick={() => navigate(`/editor/upload/captions/${videoId}`, { state: { videoUrl: passedVideoUrl } })}
                className="mt-3 w-full py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-500 hover:border-[#128189] hover:text-[#128189] transition-colors flex items-center justify-center gap-1.5"
              >
                <i className="fa-solid fa-pen text-[10px]" /> Edit Style
              </button>
            </section>

            <div className="h-px bg-slate-100" />

        {/* ─── Language Selection ─── */}
<section>
  <p className="text-[10px] font-bold tracking-[.12em] text-slate-500 uppercase mb-3">
    Languages
  </p>

  <div className="flex flex-col gap-1.5">
    
    {/* English (source) */}
    <button
      onClick={() => setActiveLang('en')}
      className={`flex items-center gap-3 px-3.5 py-3 rounded-xl border transition-all text-left ${
        activeLang === 'en'
          ? 'bg-white border-[#128189] shadow-sm'
          : 'bg-slate-50 border-transparent hover:border-slate-200'
      }`}
    >
      <i className="fa-solid fa-globe text-sm text-slate-400" />
      <span className="text-sm font-semibold text-slate-700 flex-1">
        English <span className="text-[10px] text-slate-400">(Source)</span>
      </span>

      {activeLang === 'en' && (
        <i className="fa-solid fa-circle-check text-[#128189] text-sm" />
      )}
    </button>

    {/* Only languages that exist in captions */}
    {addedLangs
      .filter(lang => lang.status === 'generated')
      .map(lang => (
        <button
          key={lang.code}
          onClick={() => setActiveLang(lang.code)}
          className={`flex items-center gap-3 px-3.5 py-3 rounded-xl border transition-all text-left ${
            activeLang === lang.code
              ? 'bg-white border-[#128189] shadow-sm'
              : 'bg-slate-50 border-transparent hover:border-slate-200'
          }`}
        >
          <i className="fa-solid fa-language text-sm text-slate-400" />

          <span className="text-sm font-semibold text-slate-700 flex-1">
            {lang.label}
          </span>

          {activeLang === lang.code && (
            <i className="fa-solid fa-circle-check text-[#128189] text-sm" />
          )}
        </button>
      ))}

    {/* Empty state */}
    {addedLangs.filter(l => l.status === 'generated').length === 0 && (
      <div className="text-xs text-slate-400 px-2 py-2">
        No translated captions available
      </div>
    )}
  </div>
</section>

            <div className="h-px bg-slate-100" />

            {/* ─── AI Insight ─── */}
            <section>
              <div className="bg-[#EAF5F5] rounded-2xl p-4 border border-[#c5eaed]">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-lg bg-[#128189]/20 flex items-center justify-center">
                    <i className="fa-solid fa-wand-magic-sparkles text-[#128189] text-[10px]" />
                  </div>
                  <span className="text-[10px] font-bold text-[#0C4E5E] tracking-[.12em] uppercase">AI Insight</span>
                </div>
                <p className="text-xs text-[#1a6a72] leading-relaxed">
                  Subtitles cover <span className="font-bold">98%</span> of the audio. Average reading speed is optimal for mobile viewing.
                </p>
              </div>
            </section>

            {/* ─── Export progress ─── */}
            {isExporting && (
              <section className="fade-in">
                <div className="bg-[#0C4E5E] rounded-2xl p-4 text-white">
                  <p className="text-xs font-bold mb-2 flex items-center gap-2">
                    <i className="fa-solid fa-circle-notch fa-spin" /> Exporting…
                  </p>
                  <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
                    <div className="h-full bg-white rounded-full transition-all duration-500" style={{ width: `${exportProgress}%` }} />
                  </div>
                  <p className="text-right text-[10px] text-white/60 mt-1 font-mono">{Math.round(exportProgress)}%</p>
                </div>
              </section>
            )}
          </aside>

        </div>
        
      </div>
    </>
  );
};

export default Preview;