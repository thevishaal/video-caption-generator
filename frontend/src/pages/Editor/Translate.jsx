import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import axios from 'axios';
import { showToast as showToastGlobal } from "../../utils/toastUtils";



// ─── Utils ─────────────────────────────────────────────────────────────────────
function formatTime(sec) {
  if (sec == null || isNaN(sec)) return '00:00';
  const d = new Date(sec * 1000);
  const hh = d.getUTCHours();
  const mm = d.getUTCMinutes().toString().padStart(2, '0');
  const ss = d.getUTCSeconds().toString().padStart(2, '0');
  return hh > 0 ? `${String(hh).padStart(2, '0')}:${mm}:${ss}` : `${mm}:${ss}`;
}

function hexToRgb(hex = '#000000') {
  if (!hex) return '0, 0, 0';
  if (hex.startsWith('rgba') || hex.startsWith('rgb')) {
    try {
      const match = hex.match(/\d+,\s*\d+,\s*\d+/);
      if (match) return match[0];
    } catch {
      return '0, 0, 0';
    }
  }
  const h = hex.replace('#', '');
  if (h.length === 3) {
    const r = parseInt(h[0] + h[0], 16);
    const g = parseInt(h[1] + h[1], 16);
    const b = parseInt(h[2] + h[2], 16);
    if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
      return `${r}, ${g}, ${b}`;
    }
  }
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  if (isNaN(r) || isNaN(g) || isNaN(b)) {
    return '0, 0, 0';
  }
  return `${r}, ${g}, ${b}`;
}

// ─── Language options (codes match backend LANGUAGE_NAMES keys) ────────────────
const languageOptions = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'Hindi' },
  { code: 'es', label: 'Spanish' },
  { code: 'fr', label: 'French' },
  { code: 'de', label: 'German' },
  { code: 'ar', label: 'Arabic' },
  { code: 'pt', label: 'Portuguese' },
  { code: 'ja', label: 'Japanese' },
  { code: 'ko', label: 'Korean' },
  { code: 'zh', label: 'Chinese' },
];

// Returns human-readable label for a language code
const getLanguageLabel = (code) => {
  const found = languageOptions.find((lang) => lang.code === code);
  return found ? found.label : code;
};

// ─── Translate ─────────────────────────────────────────────────────────────────
const Translate = () => {
  const navigate = useNavigate();
  const { videoId } = useParams();
  const location = useLocation();

  const passedStyles = location.state?.styles || {};
  const passedVideoUrl = location.state?.videoUrl || '';
  const passedCaptions = location.state?.captions || null;

  // State-backed videoUrl and styles to survive refreshes
  const [videoUrl, setVideoUrl] = useState(passedVideoUrl);
  const [styles, setStyles] = useState({
    typography: 'Montserrat',
    isBold: true,
    isItalic: false,
    isCaps: false,
    textColor: '#FFFFFF',
    bgColor: '#000000',
    bgOpacity: 40,
    position: 'bottom-center',
    fontSize: 32,
    ...passedStyles,
  });

  // ── State ──────────────────────────────────────────────────────────────────
  const [captions, setCaptions] = useState([]);
  const [activeCaptionId, setActiveCaptionId] = useState(null);
  const [activeTone, setActiveTone] = useState('Professional');
  const [sourceLang, setSourceLang] = useState('en');
  const [targetLang, setTargetLang] = useState('es');  // language code, not display name
  const [isLoadingCaptions, setIsLoadingCaptions] = useState(true);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const loadingToastId = useRef(null);
  const finalizeTimeout = useRef(null);

  // Video
  const videoRef = useRef(null);
  const timelineRef = useRef(null);
  const isDragging = useRef(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const showToast = useCallback((message, type) => {
    showToastGlobal.dismiss(loadingToastId.current);
    if (type === 'loading') {
      loadingToastId.current = showToastGlobal.loading(message);
    } else if (type === 'success') {
      showToastGlobal.success(message);
    } else if (type === 'error') {
      showToastGlobal.error(message);
    } else {
      showToastGlobal.info(message);
    }
  }, []);

  // ── Load captions ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!videoId) return;

    // Normalize any caption shape → consistent { original_text, translated_text, ... }
    const normalize = (item) => ({
      id: item.id,
      start_time: Number(item.start_time),
      end_time: Number(item.end_time),
      original_text: item.original_text || item.text || '',
      translated_text: item.translated_text || '',
      language: item.language || '',
      time: formatTime(Number(item.start_time)),
    });

    const load = async () => {
      setIsLoadingCaptions(true);
      const token = localStorage.getItem('token');
      try {
        // 1. Fetch video preview details (refresh resilience)
        const videoRes = await axios.get(
          `http://127.0.0.1:8000/api/videos/${videoId}/preview/`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const videoData = videoRes.data?.data || videoRes.data || {};
        if (videoData.preview_url) {
          setVideoUrl(videoData.preview_url);
        }

        // 2. Fetch list of all captions
        const res = await axios.get(
          `http://127.0.0.1:8000/api/captions/?video_id=${videoId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const raw = res.data?.data || res.data || [];

        // 3. Process separate language rows cleanly
        const sourceLanguageCode = videoData.language || 'en';
        const sourceCaps = raw.filter(c => c.language === sourceLanguageCode || c.language === 'en');
        const translatedCaps = raw.filter(c => c.language !== sourceLanguageCode && c.language !== 'en');

        // Restore custom styling values from first caption record if available
        if (raw.length > 0) {
          const first = raw[0];
          setStyles({
            typography: first.font_family || "Montserrat",
            fontSize: first.font_size || 32,
            textColor: first.font_color || "#FFFFFF",
            bgColor: first.background_color || "#000000",
            bgOpacity: first.bg_opacity ?? 40,
            isBold: first.bold || false,
            isItalic: first.italic || false,
            isCaps: first.is_caps || false,
            position: first.position || "bottom-center",
          });
        }

        const mapped = sourceCaps.map(item => {
          // Find translated match with similar timestamp
          const transMatch = translatedCaps.find(tc =>
            Math.abs(tc.start_time - item.start_time) < 0.05 && tc.language === targetLang
          );
          return {
            id: item.id,
            start_time: Number(item.start_time),
            end_time: Number(item.end_time),
            original_text: item.original_text || item.text || '',
            translated_text: transMatch ? transMatch.translated_text : '',
            language: transMatch ? transMatch.language : item.language,
            time: formatTime(Number(item.start_time)),
          };
        }).sort((a, b) => a.start_time - b.start_time);

        setCaptions(mapped);
        if (mapped.length) setActiveCaptionId(mapped[0].id);
      } catch (err) {
        console.error('Failed to load captions:', err.response?.data || err);
        showToast('Failed to load captions.', 'error');
      } finally {
        setIsLoadingCaptions(false);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId, targetLang]);


  useEffect(() => {
    return () => {
      if (finalizeTimeout.current) clearTimeout(finalizeTimeout.current);
      if (loadingToastId.current) showToastGlobal.dismiss(loadingToastId.current);
    };
  }, []);

  // ── Active caption: video time → cards ──────────────────────────────────────
  useEffect(() => {
    const match = captions.find(
      (c) => currentTime >= c.start_time && currentTime <= c.end_time
    );
    if (match && match.id !== activeCaptionId) {
      setActiveCaptionId(match.id);
      document.getElementById(`cap-${match.id}`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTime, captions]);

  // ── Video handlers ───────────────────────────────────────────────────────────
  const handleTimeUpdate = () => { if (videoRef.current && !isDragging.current) setCurrentTime(videoRef.current.currentTime); };
  const handleLoadedMetadata = () => { if (videoRef.current) setDuration(videoRef.current.duration); };
  const togglePlay = () => { if (!videoRef.current) return; videoRef.current.paused ? videoRef.current.play() : videoRef.current.pause(); };

  const seekTo = useCallback((time) => {
    const t = Math.max(0, Math.min(time, duration || 0));
    setCurrentTime(t);
    if (videoRef.current) videoRef.current.currentTime = t;
  }, [duration]);

  // ── Caption card click ───────────────────────────────────────────────────────
  const handleCaptionClick = useCallback((cap) => {
    setActiveCaptionId(cap.id);
    seekTo(cap.start_time);
    videoRef.current?.play();
  }, [seekTo]);

  // ── Draggable timeline ───────────────────────────────────────────────────────
  const timeFromClientX = useCallback((clientX) => {
    if (!timelineRef.current || !duration) return 0;
    const { left, width } = timelineRef.current.getBoundingClientRect();
    return Math.max(0, Math.min((clientX - left) / width, 1)) * duration;
  }, [duration]);

  const onTimelineMouseDown = (e) => {
    isDragging.current = true;
    seekTo(timeFromClientX(e.clientX));
  };

  useEffect(() => {
    const onMove = (e) => {
      if (!isDragging.current) return;
      const t = timeFromClientX(e.clientX);
      setCurrentTime(t);
      if (videoRef.current) videoRef.current.currentTime = t;
    };
    const onUp = () => { isDragging.current = false; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, [timeFromClientX]);

  // ── Translate API ────────────────────────────────────────────────────────────
  const handleTranslate = async () => {
    if (!videoId || isTranslating) return;
    setIsTranslating(true);
    showToast('Translating captions...', 'loading');
    const token = localStorage.getItem('token');
    try {
      const res = await axios.post(
        'http://127.0.0.1:8000/api/captions/translate',
        { video_id: videoId, target_language: targetLang, tone: activeTone },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const translated = res.data?.data || res.data || [];

      setCaptions((prev) =>
        prev.map((cap) => {
          const match = Array.isArray(translated)
            ? translated.find((t) => Math.abs(t.start_time - cap.start_time) < 0.01)
            : null;
          return match ? {
            ...cap,
            translated_text: match.translated_text || cap.translated_text,
            language: targetLang
          } : cap;
        })
      );
      showToast('Translation complete!', 'success');
    } catch (err) {
      console.error('Translation failed:', err.response?.data || err);
      showToast('Translation failed. Please try again.', 'error');
    } finally {
      setIsTranslating(false);
    }
  };

  // ── Finalize / Discard ───────────────────────────────────────────────────────
  const handleFinalize = () => {
    setIsFinalizing(true);
    showToast('Preparing preview...', 'loading');
    setTimeout(() => {
      showToastGlobal.dismiss(loadingToastId.current);
      navigate(`/editor/upload/captions/translate/preview/${videoId}`, {
        state: {
          videoUrl: passedVideoUrl,
          styles,
          captions,
          activeLang: targetLang // ✨ CRITICAL FIX: Navigate karte waqt select ki hui language bhejein
        },
      });
    }, 700);
  };

  const handleDiscard = () => {
    showToastGlobal.dismiss(loadingToastId.current);
    navigate(`/editor/upload/captions/${videoId}`, {
      state: { videoUrl: passedVideoUrl }
    });
  };

  // ── Derived ──────────────────────────────────────────────────────────────────
  const activeCaption = captions.find((c) => c.id === activeCaptionId);
  const translatedCount = captions.filter((c) => c.translated_text).length;
  const progressPct = duration ? (currentTime / duration) * 100 : 0;

  // Only show TRANSLATED text on video overlay
  const activeSubtitle = (() => {
    const seg = captions.find(
      (c) => currentTime >= c.start_time && currentTime <= c.end_time
    );
    return seg?.translated_text || null;
  })();

  const positionClass = ({
    'top-left': 'justify-start items-start',
    'top-center': 'justify-start items-center',
    'top-right': 'justify-start items-end',
    'bottom-left': 'justify-end   items-start',
    'bottom-center': 'justify-end   items-center',
    'bottom-right': 'justify-end   items-end',
  })[styles.position] || 'justify-end items-center';

  const bgRgb = hexToRgb(styles.bgColor);

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @keyframes toastSlideUp {
          from { opacity: 0; transform: translate(-50%, 16px); }
          to   { opacity: 1; transform: translate(-50%, 0);    }
        }
        @keyframes fadeIn  { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in  { animation: fadeIn  .4s ease both; }
        .animate-slide-up { animation: slideUp .45s ease both; }
        .custom-scrollbar::-webkit-scrollbar       { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 99px; }
        .tl-bar { cursor: col-resize; user-select: none; touch-action: none; }
      `}</style>



      <div className="w-full min-h-screen bg-[#F8FAFC] p-6 md:p-10 lg:p-12 font-sans overflow-x-hidden flex flex-col">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 animate-fade-in">
          <div className="mb-6 md:mb-0">
            <h1 className="text-3xl font-bold text-brand-navy mb-2 tracking-tight">Translate Content</h1>
            <p className="text-brand-text text-sm md:text-base font-medium">
              Expand your reach with AI-powered multi-language translation.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleDiscard}
              className="px-5 py-2.5 rounded-full bg-[#E2E8F0] hover:bg-slate-300 text-brand-button font-semibold text-sm transition-all duration-300 disabled:opacity-50"
            >
              Discard Changes
            </button>
            <button
              onClick={handleFinalize}
              type="button"
              disabled={isFinalizing || isTranslating}
              className="px-5 py-2.5 rounded-full bg-brand-button hover:bg-brand-button-hover text-white font-semibold text-sm transition-all duration-300 shadow-sm disabled:opacity-50 flex items-center gap-2"
            >
              {isFinalizing
                ? <><i className="fa-solid fa-circle-notch fa-spin" /> Preparing preview...</>
                : 'Finalize Translation'}
            </button>
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">

          {/* LEFT — Caption list */}
          <div className="xl:col-span-7 flex flex-col bg-slate-50/50 rounded-3xl animate-slide-up border border-slate-100" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center justify-between bg-white rounded-t-3xl p-6 border-b border-slate-100">
              <h3 className="text-brand-navy font-bold text-sm">Source: English</h3>
              <div className="flex items-center gap-2">
                {translatedCount > 0 && (
                  <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-3 py-1 rounded-md tracking-widest uppercase">
                    {translatedCount}/{captions.length} TRANSLATED
                  </span>
                )}
                <span className="bg-[#BCE4E5] text-[#0C4E5E] text-[10px] font-bold px-3 py-1 rounded-md tracking-widest uppercase">
                  {captions.length} CAPTIONS
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-4 p-6 bg-[#F4F6F8] rounded-b-3xl h-[600px] overflow-y-auto custom-scrollbar">
              {isLoadingCaptions ? (
                <div className="flex flex-col items-center justify-center h-full gap-4">
                  <i className="fa-solid fa-circle-notch fa-spin text-3xl text-[#128189]" />
                  <p className="text-slate-500 text-sm font-medium">Loading captions…</p>
                </div>
              ) : captions.length === 0 ? (
                <div className="flex items-center justify-center h-full text-slate-400 text-sm italic">
                  No captions found for this video.
                </div>
              ) : captions.map((caption) => {
                const isActive = caption.id === activeCaptionId;
                return (
                  <div
                    id={`cap-${caption.id}`}
                    key={caption.id}
                    onClick={() => handleCaptionClick(caption)}
                    className={`relative flex items-center gap-4 bg-white rounded-xl px-6 py-4 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer border min-w-max ${isActive ? 'border-slate-300 scale-[1.01]' : 'border-transparent hover:border-slate-200'
                      }`}
                  >
                    {/* Active Indicator Bar */}
                    {isActive && (
                      <div className="absolute left-0 top-3 bottom-3 w-1 bg-brand-button rounded-r-md" />
                    )}

                    {/* 1. Time Section */}
                    <div className={`text-[10px] font-mono font-bold tracking-wider shrink-0 ${isActive ? 'text-brand-primary' : 'text-slate-400'}`}>
                      {caption.time}
                    </div>

                    {/* 2. Text Content (Stacked Vertically, but Single Row width) */}
                    <div className="flex flex-col justify-center min-w-0 flex-1">
                      <p className="text-brand-primary font-semibold text-[13px] whitespace-nowrap overflow-hidden text-ellipsis">
                        {caption.original_text}
                      </p>

                      {caption.translated_text && (
                        <p className="text-[13px] text-[#4E8182] font-medium italic whitespace-nowrap overflow-hidden text-ellipsis border-t border-slate-100 mt-1 pt-1">
                          {caption.translated_text}
                        </p>
                      )}

                    </div>

                    {/* 3. Status Section (Live & Tick) */}
                    <div className="flex items-center gap-3 shrink-0 ml-auto">

                      {isActive && (
                        <span className="text-[9px] font-bold bg-[#E1F2F3] text-[#128189] px-2 py-1 rounded-full tracking-tighter animate-pulse whitespace-nowrap">
                          ● LIVE
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* RIGHT — Settings + Preview */}
          <div className="xl:col-span-5 flex flex-col gap-6 animate-slide-up" style={{ animationDelay: '0.2s' }}>

            {/* Settings */}
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100">
              <div className="flex items-center gap-3 mb-6">
                <i className="fa-solid fa-gear text-brand-primary text-xl" />
                <h2 className="text-lg font-bold text-brand-navy">Translation Settings</h2>
              </div>

              {/* SOURCE LANGUAGE */}
              <div className="mb-5">
                <label className="block text-[10px] font-bold text-slate-400 tracking-wider uppercase mb-2">SOURCE LANGUAGE</label>
                <div className="relative">
                  <select
                    value={sourceLang}
                    onChange={(e) => setSourceLang(e.target.value)}
                    className="w-full appearance-none bg-[#F4F6F8] border-none text-brand-navy font-semibold text-sm rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-brand-primary cursor-pointer"
                  >
                    {languageOptions.map((lang) => (
                      <option key={lang.code} value={lang.code}>
                        {lang.label}
                      </option>
                    ))}
                  </select>
                  <i className="fa-solid fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none" />
                </div>
              </div>

              {/* TARGET LANGUAGE */}
              <div className="mb-6">
                <label className="block text-[10px] font-bold text-slate-400 tracking-wider uppercase mb-2">TARGET LANGUAGE</label>
                <div className="relative">
                  <select
                    value={targetLang}
                    onChange={(e) => setTargetLang(e.target.value)}
                    className="w-full appearance-none bg-[#F4F6F8] border-none text-brand-navy font-semibold text-sm rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-brand-primary cursor-pointer"
                  >
                    {languageOptions.map((lang) => (
                      <option key={lang.code} value={lang.code}>
                        {lang.label}
                      </option>
                    ))}
                  </select>
                  <i className="fa-solid fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none" />
                </div>
              </div>

              <div className="mb-8">
                <label className="block text-[10px] font-bold text-slate-400 tracking-wider uppercase mb-2">VOICE TONE</label>
                <div className="flex gap-2">
                  {['Professional', 'Casual', 'Creative'].map((tone) => (
                    <button key={tone} onClick={() => setActiveTone(tone)}
                      className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all duration-300 ${activeTone === tone ? 'bg-brand-button text-white shadow-md' : 'bg-[#F4F6F8] text-brand-navy hover:bg-slate-200'
                        }`}>
                      {tone}
                    </button>
                  ))}
                </div>
              </div>

              <button onClick={handleTranslate} disabled={isTranslating || isLoadingCaptions}
                className="w-full bg-brand-primary hover:bg-[#138A8B] text-white font-bold py-3.5 rounded-xl transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed">
                {isTranslating
                  ? <><i className="fa-solid fa-circle-notch fa-spin" /> Translating...</>
                  : <><i className="fa-solid fa-wand-magic-sparkles" /> Generate Translation</>}
              </button>
            </div>

            {/* Video preview card */}
            <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100 flex flex-col">

              {/* Video */}
              <div className="relative bg-black w-full h-full" style={{ aspectRatio: '16/9' }}>
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

                    {!isPlaying && (
                      <button onClick={togglePlay}
                        className="absolute inset-0 flex items-center justify-center bg-black/25 hover:bg-black/30 transition-all">
                        <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg">
                          <i className="fa-solid fa-play ml-1 text-white text-xl" />
                        </div>
                      </button>
                    )}

                    {/* TRANSLATED subtitle overlay ONLY */}
                    <div className={`absolute inset-0 p-4 flex flex-col pointer-events-none ${positionClass}`}>
                      <div
                        className="rounded-xl px-4 py-2.5 max-w-[90%] flex items-center justify-center"
                        style={{
                          backgroundColor: activeSubtitle
                            ? `rgba(${bgRgb}, ${styles.bgOpacity / 100})`
                            : 'rgba(0,0,0,0.55)',
                        }}
                      >
                        <p
                          className="text-center leading-snug break-words w-full"
                          style={{
                            color: activeSubtitle ? styles.textColor : 'rgba(255,255,255,0.55)',
                            fontFamily: styles.typography,
                            fontWeight: styles.isBold ? '700' : '400',
                            fontStyle: styles.isItalic ? 'italic' : 'normal',
                            textTransform: styles.isCaps ? 'uppercase' : 'none',
                            fontSize: Math.min(styles.fontSize, 15),
                          }}
                        >
                          {activeSubtitle || '[ Translation Pending ]'}
                        </p>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full flex items-end justify-center p-4 bg-gradient-to-br from-slate-500 to-slate-700">
                    <div className="bg-[#2D333A]/90 backdrop-blur-md px-6 py-3.5 rounded-xl w-11/12 text-center shadow-lg mb-3">
                      <p className="text-white font-semibold text-sm tracking-wide line-clamp-2">
                        {activeCaption?.translated_text || '[ Translation Pending ]'}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Translation text preview */}
              <div className="px-6 pb-6 pt-2">
                <div className="flex items-center gap-2 mb-4">
                  <i className="fa-solid fa-language text-brand-primary text-sm" />
                  {/* Uses getLanguageLabel(code) instead of targetLang.split(' ')[0] */}
                  <h3 className="font-bold text-brand-navy text-sm">{getLanguageLabel(targetLang)} Preview</h3>
                </div>

                <div className="bg-[#F0F9FA] rounded-2xl p-5 relative min-h-[80px] flex items-center">
                  <div className="absolute left-0 top-4 bottom-4 w-1 bg-[#8CCACB] rounded-r-full" />
                  {isTranslating ? (
                    <div className="w-full flex justify-center text-brand-primary opacity-50">
                      <i className="fa-solid fa-ellipsis fa-fade text-2xl" />
                    </div>
                  ) : (
                    <p className="text-[#4E8182] font-medium text-sm leading-relaxed pl-2">
                      {activeCaption?.translated_text
                        ? `"${activeCaption.translated_text}"`
                        : <span className="italic opacity-60">Click "Generate Translation" to preview text here.</span>}
                    </p>
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
};

export default Translate;