import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Helper to format time as MM:SS
const formatTime = (seconds) => {
  if (isNaN(seconds)) return "00:00";
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

// Mock translations for the preview
const mockTranslations = {
  'English (Source)': "The golden hour in the Swiss Alps is simply breathtaking.",
  'French (Generated)': "L'heure dorée dans les Alpes suisses est tout simplement à couper le souffle.",
  'German (Pending)': "[ Translation Pending... ]"
};

const Preview = () => {
  const navigate = useNavigate();
  
  // --- VIDEO REFS & STATE ---
  const videoContainerRef = useRef(null);
  const videoRef = useRef(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [ratio, setRatio] = useState("16/9"); // Dynamic Aspect Ratio

  // --- STYLING & LANGUAGE STATE ---
  // Simulating the styles passed down from Captions.jsx
  const [styles, setStyles] = useState({
    typography: "Inter",
    isBold: false,
    isItalic: false,
    isCaps: false,
    textColor: "#FFFFFF",
    bgColor: "#1A1D2D", // Navy background
    bgOpacity: 90,
    fontSize: 50 // Slider percentage
  });

  const [activeLanguage, setActiveLanguage] = useState('English (Source)');

  const colors = [
    { id: 'white', hex: '#FFFFFF', border: 'border-slate-200' },
    { id: 'navy', hex: '#1A1D2D', border: 'border-transparent' },
    { id: 'yellow', hex: '#FACC15', border: 'border-transparent' },
    { id: 'pure-white', hex: '#F8FAFC', border: 'border-slate-200' },
  ];

  const languages = [
    { id: 'English (Source)', type: 'source', status: 'active', icon: 'fa-globe' },
    { id: 'French (Generated)', type: 'generated', status: 'preview', icon: 'fa-language' },
    { id: 'German (Pending)', type: 'pending', status: 'pending', icon: 'fa-hourglass-half' },
  ];

  // --- VIDEO HANDLERS ---
  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  // CRITICAL: Calculates the intrinsic aspect ratio of the video
  const handleLoadedMetadata = (e) => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
    const video = e.target;
    const r = video.videoWidth / video.videoHeight;
    // Set ratio dynamically based on video source (portrait vs landscape)
    setRatio(r); 
  };

  const handleScrub = (e) => {
    if (videoRef.current) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percentage = Math.max(0, Math.min(1, x / rect.width));
      const newTime = percentage * duration;
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      // Request fullscreen on the WRAPPER to keep custom controls visible
      if (videoContainerRef.current.requestFullscreen) {
        videoContainerRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  // Listen for fullscreen changes to update UI icon
  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="w-full min-h-screen bg-[#F8FAFC] p-4 md:p-8 lg:p-12 font-sans overflow-x-hidden flex flex-col">
      
      {/* --- HEADER SECTION --- */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 animate-fade-in">
        <div className="mb-6 md:mb-0">
          <span className="text-[#128189] text-[10px] md:text-xs font-bold tracking-widest uppercase mb-1 block">
            STAGE: PREVIEW
          </span>
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-[#111827] tracking-tight">
            Travel_Vlog_Draft_v2.mp4
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button 
            className="px-5 py-2.5 rounded-full bg-[#E2E8F0] hover:bg-slate-300 text-[#0C4E5E] font-semibold text-sm transition-all duration-300"
          >
            Save Draft
          </button>
          <button 
            onClick={() => navigate('/editor/upload/captions/translate/preview/export')}
            className="px-5 py-2.5 rounded-full bg-[#128189] hover:bg-[#0E666D] text-white font-semibold text-sm transition-all duration-300 shadow-md hover:shadow-lg"
          >
            Proceed to Export
          </button>
        </div>
      </div>

      {/* --- MAIN CONTENT GRID --- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* =========================================
            LEFT COLUMN: VIDEO PREVIEW 
            ========================================= */}
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col items-center animate-slide-up" style={{ animationDelay: '0.1s' }}>
          
          {/* Video Container with Dynamic Aspect Ratio */}
          <div 
            ref={videoContainerRef}
            className="relative w-full max-w-4xl bg-[#D4CFC7] rounded-2xl md:rounded-3xl overflow-hidden shadow-lg group flex items-center justify-center"
            style={{ aspectRatio: ratio, maxHeight: '75vh' }}
          >
            
            <video 
              ref={videoRef}
              // Using a portrait video URL to demonstrate the dynamic aspect ratio
              src="/video.mp4" 
              className="w-full h-full object-contain cursor-pointer"
              onClick={togglePlay}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onEnded={() => setIsPlaying(false)}
              playsInline
            />

            {/* Subtitle Burn-in Overlay based on styling passed from Captions.jsx */}
            <div className="absolute bottom-24 left-1/2 -translate-x-1/2 w-[90%] md:w-3/4 flex justify-center pointer-events-none">
              <div 
                className="px-4 py-3 md:px-6 md:py-4 rounded-xl text-center shadow-lg transition-all duration-300 backdrop-blur-sm"
                style={{
                  backgroundColor: `rgba(${parseInt(styles.bgColor.slice(1, 3), 16)}, ${parseInt(styles.bgColor.slice(3, 5), 16)}, ${parseInt(styles.bgColor.slice(5, 7), 16)}, ${styles.bgOpacity / 100})`,
                }}
              >
                <p 
                  className="leading-snug drop-shadow-sm transition-all duration-200 break-words"
                  style={{ 
                    color: styles.textColor,
                    fontFamily: styles.typography,
                    fontWeight: styles.isBold ? "700" : "500",
                    fontStyle: styles.isItalic ? "italic" : "normal",
                    textTransform: styles.isCaps ? "uppercase" : "none",
                    // Dynamic responsive font sizing based on the slider (0-100)
                    fontSize: `clamp(12px, ${1 + (styles.fontSize / 50)}vw, 32px)` 
                  }}
                >
                  {mockTranslations[activeLanguage]}
                </p>
              </div>
            </div>

            {/* Custom Video Player Controls Overlay */}
            <div className="absolute bottom-4 left-4 right-4 bg-[#EAE6DF]/95 backdrop-blur-md rounded-2xl p-3 md:p-4 flex items-center justify-between gap-3 md:gap-4 shadow-lg border border-white/20 transition-opacity duration-300 opacity-100 xl:opacity-0 xl:group-hover:opacity-100">
              
              <button onClick={togglePlay} className="text-[#128189] hover:text-[#0C4E5E] transition-colors w-8 flex justify-center" aria-label={isPlaying ? "Pause" : "Play"}>
                <i className={`fa-solid ${isPlaying ? 'fa-pause' : 'fa-play'} text-lg`}></i>
              </button>

              <div className="flex-1 h-1.5 md:h-2 bg-[#CFCBBE] rounded-full relative cursor-pointer group/bar overflow-hidden" onClick={handleScrub}>
                <div className="absolute top-0 bottom-0 left-0 bg-[#128189] rounded-full transition-all duration-75 ease-linear" style={{ width: `${progressPercentage}%` }}></div>
                <div className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white rounded-full shadow border border-[#128189] scale-0 group-hover/bar:scale-100 transition-transform pointer-events-none" style={{ left: `calc(${progressPercentage}% - 6px)` }}></div>
              </div>

              <div className="flex items-center gap-4">
                <span className="text-[#5A5753] text-[10px] md:text-xs font-mono font-medium whitespace-nowrap">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
                <div className="flex items-center gap-3 text-[#5A5753]">
                  <button onClick={toggleMute} className="hover:text-[#128189] transition-colors w-5">
                    <i className={`fa-solid ${isMuted ? 'fa-volume-xmark' : 'fa-volume-high'} text-sm`}></i>
                  </button>
                  <button className="hover:text-[#128189] transition-colors hidden sm:block w-5">
                    <i className="fa-regular fa-eye text-sm"></i>
                  </button>
                  <button onClick={toggleFullscreen} className="hover:text-[#128189] transition-colors w-5">
                    <i className={`fa-solid ${isFullscreen ? 'fa-compress' : 'fa-expand'} text-sm`}></i>
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* =========================================
            RIGHT COLUMN: SIDEBAR SETTINGS
            ========================================= */}
        <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-6 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          
          {/* --- 1. Subtitle Style Box --- */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
            <h2 className="text-sm font-bold text-[#111827] mb-4">Subtitle Style</h2>
            
            {/* Style Preview Block */}
            <div 
              className="w-full h-32 rounded-2xl flex items-center justify-center mb-5 relative overflow-hidden transition-colors duration-300"
              style={{ backgroundColor: styles.bgColor === '#FFFFFF' ? '#F4F6F8' : styles.bgColor }}
            >
               <div className="bg-[#128189]/20 border border-[#128189]/30 px-4 py-2 rounded-lg backdrop-blur-sm">
                  <span className="text-sm font-medium" style={{ color: styles.textColor }}>Preview Style</span>
               </div>
            </div>

            {/* Color Swatches */}
            <div className="flex items-center gap-3 mb-6">
              {colors.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setStyles({...styles, textColor: c.hex})}
                  className={`w-10 h-10 rounded-xl transition-all duration-200 border-2 ${
                    styles.textColor === c.hex ? 'border-[#128189] scale-110 shadow-md' : c.border
                  }`}
                  style={{ backgroundColor: c.hex }}
                  aria-label={`Select color ${c.id}`}
                ></button>
              ))}
            </div>

            {/* Font Size Slider */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Font Size
                </label>
                <span className="text-[10px] font-bold text-[#128189] bg-[#E1F2F3] px-2 py-0.5 rounded">
                  {styles.fontSize}%
                </span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={styles.fontSize}
                onChange={(e) => setStyles({...styles, fontSize: e.target.value})}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#128189]"
              />
            </div>
          </div>

          {/* --- 2. Language Selection Box --- */}
          <div className="bg-transparent flex flex-col">
            <h2 className="text-sm font-bold text-[#111827] mb-4 pl-1">Language Selection</h2>
            
            <div className="flex flex-col gap-3">
              {languages.map((lang) => (
                <div 
                  key={lang.id}
                  onClick={() => setActiveLanguage(lang.id)}
                  className={`flex items-center justify-between p-4 rounded-2xl cursor-pointer transition-all duration-200 border ${
                    activeLanguage === lang.id 
                      ? 'bg-white shadow-sm border-white border-l-4 border-l-[#128189]' 
                      : 'bg-white border-slate-100 hover:border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <i className={`fa-solid ${lang.icon} ${activeLanguage === lang.id ? 'text-[#128189]' : 'text-slate-400'}`}></i>
                    <span className={`font-semibold text-sm ${activeLanguage === lang.id ? 'text-[#111827]' : 'text-slate-600'}`}>
                      {lang.id}
                    </span>
                  </div>
                  
                  {/* Right side status indicators */}
                  {lang.status === 'active' && <i className="fa-solid fa-circle-check text-[#128189]"></i>}
                  {lang.status === 'preview' && (
                    <span className="text-[9px] font-bold bg-[#E2E8F0] text-slate-500 px-2 py-1 rounded uppercase tracking-wider">
                      Preview
                    </span>
                  )}
                  {lang.status === 'pending' && <i className="fa-solid fa-hourglass-half text-slate-400 text-sm"></i>}
                </div>
              ))}
              
              {/* Add New Language Button */}
              <button className="mt-1 w-full py-4 border border-dashed border-slate-300 rounded-2xl text-slate-500 font-medium hover:border-[#128189] hover:text-[#128189] hover:bg-white transition-all text-sm flex items-center justify-center gap-2">
                <i className="fa-solid fa-plus"></i> Add New Language
              </button>
            </div>
          </div>

          {/* --- 3. AI Insight Box --- */}
          <div className="bg-[#E1F2F3] border border-[#BCE4E5] rounded-3xl p-6 shadow-sm flex flex-col gap-2 mt-2">
             <div className="flex items-center gap-2 mb-1">
               <i className="fa-solid fa-wand-magic-sparkles text-[#128189]"></i>
               <h3 className="text-[#128189] font-bold text-xs tracking-wider uppercase">AI Insight</h3>
             </div>
             <p className="text-[#4E8182] text-xs font-medium leading-relaxed">
               Subtitles cover 98% of the audio. Average reading speed is optimal for mobile viewing.
             </p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Preview;