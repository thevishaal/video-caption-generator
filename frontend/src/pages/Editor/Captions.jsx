import React, { useState, useRef, useEffect } from "react";


const FONTS = [
  "Inter",
  "Roboto",
  "Pirata One",
  "Playfair Display",
  "Montserrat",
  "Open Sans",
  "Courier New",
];

// Helper: Format seconds to "MM:SS" or "HH:MM:SS"
const formatTime = (seconds) => {
  
  if (isNaN(seconds)) return "00:00:00";
  const date = new Date(seconds * 1000);
  const hh = date.getUTCHours();
  const mm = date.getUTCMinutes().toString().padStart(2, "0");
  const ss = date.getUTCSeconds().toString().padStart(2, "0");
  if (hh > 0) {
    return `${hh.toString().padStart(2, "0")}:${mm}:${ss}`;
  }
  return `00:${mm}:${ss}`;
};

const Captions = () => {
  // --- STATE: API DATA & SEGMENTS ---
  const [segments, setSegments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // --- STATE: VIDEO CONTROLS ---
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [activeSegmentId, setActiveSegmentId] = useState(null);

  // --- STATE: STYLE SETTINGS ---
  const [styles, setStyles] = useState({
    typography: "Inter",
    isBold: true,
    isItalic: false,
    isCaps: false,
    textColor: "#FFFFFF",
    bgColor: "#000000",
    bgOpacity: 40,
    position: "bottom-center", 
  });

  const [isFontMenuOpen, setIsFontMenuOpen] = useState(false);
  const fontDropdownRef = useRef(null);

  // --- 1. MOCK API FETCH ---
  useEffect(() => {
    const fetchCaptionsFromAPI = async () => {
      setIsLoading(true);
      setTimeout(() => {
        const backendData = [
          { id: 1, startSeconds: 2, endSeconds: 5, text: "In this lesson, we will explore the boundaries of modern design." },
          { id: 2, startSeconds: 5.5, endSeconds: 8, text: "Fluidity is key to achieving a truly professional interface." },
          { id: 3, startSeconds: 8.5, endSeconds: 12, text: "Let's look at how we can manipulate space and light." },
        ];
        setSegments(backendData);
        setIsLoading(false);
      }, 800);
    };
    fetchCaptionsFromAPI();
  }, []);

  // --- 2. CLICK OUTSIDE TO CLOSE DROPDOWN ---
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (fontDropdownRef.current && !fontDropdownRef.current.contains(event.target)) {
        setIsFontMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- 3. SYNC VIDEO TIME WITH CAPTIONS ---
  useEffect(() => {
    const active = segments.find(
      (seg) => currentTime >= seg.startSeconds && currentTime <= seg.endSeconds
    );
    setActiveSegmentId(active ? active.id : null);
  }, [currentTime, segments]);

  // --- VIDEO HANDLERS ---
  const handleTimeUpdate = () => {
    if (videoRef.current) setCurrentTime(videoRef.current.currentTime);
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) setDuration(videoRef.current.duration);
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
      } else {
        videoRef.current.pause();
      }
    }
  };

  const seekVideo = (seconds) => {
    if (videoRef.current) {
      videoRef.current.currentTime += seconds;
    }
  };

  const handleTimelineClick = (e) => {
    const bounds = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - bounds.left;
    const percentage = x / bounds.width;
    const newTime = percentage * duration;
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  // --- CAPTION HANDLERS ---
  const updateSegmentText = (id, newText) => {
    setSegments(segments.map((seg) => (seg.id === id ? { ...seg, text: newText } : seg)));
  };

  const toggleStyle = (key) => setStyles({ ...styles, [key]: !styles[key] });

  const activeSegment = segments.find((s) => s.id === activeSegmentId);

  // Map position state to Tailwind flex classes
  const getPositionClasses = () => {
    const posMap = {
      "top-left": "justify-start items-start text-left",

      "top-center": "justify-start items-center text-center",

      "top-right": "justify-start items-end text-right",

      "bottom-left": "justify-end items-start text-left",

      "bottom-center": "justify-end items-center text-center",

      "bottom-right": "justify-end items-end text-right",
    };
    return posMap[styles.position] || posMap["bottom-center"];
  };

  return (
    /* RESPONSIVE CONTAINER WRAPPER
      Mobile: grid 1 col
      Tablet: grid 2 cols
      Desktop (xl): Flexbox row (3 cols)
    */
    <div className="grid grid-cols-1 md:grid-cols-2 xl:flex min-h-screen xl:h-screen bg-[#F4F6F8] font-sans overflow-y-auto xl:overflow-hidden w-full">
      
      {/* ==========================================
          CENTER PANEL: VIDEO PLAYER (Moves to top on Mobile/Tablet)
          ========================================== */}
      <main className="md:col-span-2 xl:flex-1 order-1 xl:order-2 flex flex-col items-center justify-center p-4 md:p-8 bg-white relative z-0 xl:overflow-y-auto xl:overflow-x-hidden min-w-0 border-b xl:border-b-0 border-slate-200">
        
        {/* Video Screen Container */}
        <div className="flex-1 w-full flex flex-col items-center justify-center min-h-[30vh] md:min-h-[400px]">
          <div className="relative inline-block w-full max-w-3xl max-h-[40vh] md:max-h-[50vh] xl:max-h-[65vh] bg-black rounded-2xl md:rounded-3xl shadow-lg border border-slate-100 overflow-hidden group">
            
            <video
              ref={videoRef}
              src="/video.mp4"
              className="block w-full h-auto max-h-[40vh] md:max-h-[50vh] xl:max-h-[65vh] object-contain cursor-pointer mx-auto"
              onClick={togglePlay}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
            />
            
            {/* Dynamic Caption Positioning Wrapper */}
            <div className={`absolute inset-0 p-3 md:p-6 flex flex-col ${getPositionClasses()}   pointer-events-none`}>
              {activeSegment && (
                <div
                  className="rounded-lg md:rounded-xl px-3 py-2 md:px-4 md:py-3 shadow-lg transition-all duration-300 w-[90%] md:w-[80%]  pointer-events-auto flex items-center justify-center"
                  style={{
                    backgroundColor: `rgba(${parseInt(styles.bgColor.slice(1, 3), 16)}, ${parseInt(styles.bgColor.slice(3, 5), 16)}, ${parseInt(styles.bgColor.slice(5, 7), 16)}, ${styles.bgOpacity / 100})`,
                  }}
                >
                 <p
                  className="leading-tight break-words text-center w-full"
                  style={{
                    color: styles.textColor,
                    fontFamily: styles.typography,
                    fontWeight: styles.isBold ? "700" : "400",
                    fontStyle: styles.isItalic ? "italic" : "normal",
                    textTransform: styles.isCaps ? "uppercase" : "none",
                    fontSize: "clamp(8px, 1vw, 16px)",
                  }}
                 >
                  {activeSegment.text}
                 </p>
                </div>
              )}
            </div>

            {/* Floating Player Controls */}
            {/* Visible always on mobile, hover-only on desktop */}
          </div>
        </div>
            <div className="md:bottom-6  bg-white/95 backdrop-blur-md px-4 md:px-6 py-2 md:py-3 rounded-full shadow-xl flex items-center gap-4 md:gap-6 z-20 border border-slate-100/50 opacity-100 transition-opacity duration-300">
              <button onClick={() => seekVideo(-5)} className="text-slate-600 hover:text-[#128189] hover:-translate-x-1 transition-all">
                <i className="fa-solid fa-backward-step text-sm md:text-base"></i>
              </button>
              <button
                onClick={togglePlay}
                className="w-10 h-10 md:w-12 md:h-12 bg-[#0C4E5E] text-white rounded-full flex items-center justify-center hover:scale-105 hover:shadow-lg transition-all shadow-md"
              >
                <i className={`fa-solid ${isPlaying ? "fa-pause" : "fa-play"} text-sm md:text-lg ${!isPlaying && "ml-1"}`}></i>
              </button>
              <button onClick={() => seekVideo(5)} className="text-slate-600 hover:text-[#128189] hover:translate-x-1 transition-all">
                <i className="fa-solid fa-forward-step text-sm md:text-base"></i>
              </button>
            </div>

        {/* Real Functional Timeline Area */}
        <div className="w-full max-w-3xl mt-6 md:mt-8 bg-[#F8FAFC] rounded-xl md:rounded-2xl p-3 md:p-4 border border-slate-100 shadow-sm flex-shrink-0">
          <div className="flex justify-between items-center mb-3 md:mb-4 px-1 md:px-2">
            <div className="font-mono text-xs md:text-sm">
              <span className="font-bold text-[#128189]">{formatTime(currentTime)}</span>
              <span className="text-slate-400 ml-1 md:ml-2">/ {formatTime(duration)}</span>
            </div>
          </div>

          <div 
            className="h-12 md:h-16 bg-white rounded-lg relative flex items-center px-1 md:px-2 border border-slate-200 shadow-inner cursor-pointer"
            onClick={handleTimelineClick}
          >
            <div 
              className="absolute top-0 bottom-0 left-0 bg-[#E1F2F3] rounded-l-lg transition-all ease-linear"
              style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
            ></div>
            
            <div 
              className="absolute top-0 bottom-0 w-[2px] bg-[#0C4E5E] z-10 flex flex-col items-center transition-all ease-linear pointer-events-none"
              style={{ left: `${(currentTime / (duration || 1)) * 100}%` }}
            >
              <div className="w-2 h-2 md:w-3 md:h-3 bg-[#0C4E5E] rounded-full -mt-1 shadow-sm"></div>
            </div>

            <div className="flex items-center w-full h-full opacity-80 gap-[1px] md:gap-[2px] z-0 pointer-events-none">
              {Array.from({ length: window.innerWidth < 768 ? 30 : 60 }).map((_, i) => {
                const isActiveZone = (i / (window.innerWidth < 768 ? 30 : 60)) * duration <= currentTime;
                return (
                  <div
                    key={i}
                    className={`flex-1 rounded-full ${isActiveZone ? "bg-[#128189]" : "bg-slate-200"}`}
                    style={{ height: `${Math.max(20, Math.random() * 80)}%` }}
                  ></div>
                )
              })}
            </div>
          </div>
        </div>
      </main>

      {/* ==========================================
          LEFT PANEL: CAPTION EDITOR (Moves below video on Mobile/Tablet)
          ========================================== */}
      <aside className="md:col-span-1 xl:w-80 order-2 xl:order-1 bg-[#F4F6F8] border-b md:border-b-0 md:border-r border-slate-200 flex flex-col h-[50vh] md:h-[50vh] xl:h-full z-10 flex-shrink-0">
        <div className="px-4 py-4 md:px-6 md:py-6 flex items-center justify-between border-b border-slate-200/50 bg-white/50 backdrop-blur-sm sticky top-0 z-20">
          <h2 className="text-xs md:text-sm font-bold tracking-widest text-slate-900 uppercase">
            Segments
          </h2>
          <button className="text-[#128189] hover:scale-110 transition-transform">
            <i className="fa-solid fa-circle-plus text-base md:text-lg"></i>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 md:p-4 space-y-3 md:space-y-4 custom-scrollbar">
          {isLoading ? (
            <div className="flex justify-center py-10">
              <i className="fa-solid fa-circle-notch fa-spin text-xl md:text-2xl text-[#128189]"></i>
            </div>
          ) : (
            <>
              {segments.map((segment) => {
                const isActive = segment.id === activeSegmentId;
                return (
                  <div
                    key={segment.id}
                    onClick={() => seekVideo(segment.startSeconds - currentTime)}
                    className={`p-3 md:p-4 rounded-xl cursor-pointer transition-all duration-300 group ${
                      isActive
                        ? "bg-white shadow-md border-l-4 border-[#128189] transform scale-[1.02]"
                        : "bg-transparent hover:bg-slate-200/50 border-l-4 border-transparent"
                    }`}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className={`text-[10px] md:text-xs font-mono font-bold tracking-wider ${isActive ? "text-[#128189]" : "text-slate-500"}`}>
                        {formatTime(segment.startSeconds)} - {formatTime(segment.endSeconds)}
                      </span>
                    </div>
                    <textarea
                      value={segment.text}
                      onChange={(e) => updateSegmentText(segment.id, e.target.value)}
                      className={`w-full text-xs md:text-sm leading-relaxed bg-transparent resize-none focus:outline-none focus:ring-0 overflow-hidden ${
                        isActive ? "text-slate-900 font-medium" : "text-slate-600"
                      }`}
                      rows={3}
                      placeholder="Type caption here..."
                    />
                  </div>
                );
              })}
              <button className="w-full py-3 md:py-4 border-2 border-dashed border-slate-300 rounded-xl text-slate-400 font-medium hover:border-[#128189] hover:text-[#128189] transition-colors flex items-center justify-center gap-2 bg-white/50 text-sm">
                <i className="fa-solid fa-plus"></i> Add Caption
              </button>
            </>
          )}
        </div>
      </aside>

      {/* ==========================================
          RIGHT PANEL: STYLE SETTINGS (Moves to bottom on Mobile/Tablet)
          ========================================== */}
      <aside className="md:col-span-1 xl:w-80 order-3 xl:order-3 bg-[#F4F6F8] flex flex-col h-[60vh] md:h-[50vh] xl:h-full z-10 flex-shrink-0">
        <div className="px-4 py-4 md:px-6 md:py-6 border-b border-slate-200/50 bg-white/50 backdrop-blur-sm sticky top-0 z-20">
          <h2 className="text-xs md:text-sm font-bold tracking-widest text-slate-900 uppercase">
            Style Settings
          </h2>
        </div>
        
        <div className="p-4 md:p-6 overflow-y-auto overflow-x-hidden custom-scrollbar flex-1">
          <div className="mb-6 md:mb-8 relative" ref={fontDropdownRef}>
            <h3 className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 md:mb-3">
              Typography
            </h3>

            <div
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 md:px-4 md:py-3 mb-3 md:mb-4 flex justify-between items-center cursor-pointer shadow-sm hover:border-slate-300 transition-colors"
              onClick={() => setIsFontMenuOpen(!isFontMenuOpen)}
            >
              <span className="text-xs md:text-sm font-bold text-slate-800" style={{ fontFamily: styles.typography }}>
                {styles.typography}
              </span>
              <i className={`fa-solid fa-chevron-down text-[10px] md:text-xs text-slate-400 transition-transform duration-300 ${isFontMenuOpen ? "rotate-180" : ""}`}></i>
            </div>

            {isFontMenuOpen && (
              <div className="absolute top-[60px] md:top-[70px] left-0 w-full bg-white border border-slate-200 rounded-lg shadow-xl z-50 py-2 max-h-40 md:max-h-48 overflow-y-auto">
                {FONTS.map((font) => (
                  <div
                    key={font}
                    className={`px-3 py-2 cursor-pointer hover:bg-slate-50 text-xs md:text-sm ${styles.typography === font ? "text-[#128189] font-bold bg-[#F0F9FA]" : "text-slate-700"}`}
                    style={{ fontFamily: font }}
                    onClick={() => {
                      setStyles({ ...styles, typography: font });
                      setIsFontMenuOpen(false);
                    }}
                  >
                    {font}
                  </div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => toggleStyle("isBold")}
                className={`py-1.5 md:py-2 rounded-lg text-xs md:text-sm font-bold transition-all ${styles.isBold ? "bg-[#0C4E5E] text-white shadow-md" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"}`}
              >
                Bold
              </button>
              <button
                onClick={() => toggleStyle("isItalic")}
                className={`py-1.5 md:py-2 rounded-lg text-xs md:text-sm font-bold italic transition-all ${styles.isItalic ? "bg-[#0C4E5E] text-white shadow-md" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"}`}
              >
                Italic
              </button>
              <button
                onClick={() => toggleStyle("isCaps")}
                className={`py-1.5 md:py-2 rounded-lg text-xs md:text-sm font-bold uppercase transition-all ${styles.isCaps ? "bg-[#0C4E5E] text-white shadow-md" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"}`}
              >
                Caps
              </button>
            </div>
          </div>

          <div className="mb-6 md:mb-8">
            <h3 className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 md:mb-3">
              Appearance
            </h3>

            <div className="grid grid-cols-2 gap-3 md:gap-4 mb-4 md:mb-6">
              <label className="cursor-pointer group relative">
                <span className="text-[10px] md:text-xs text-slate-500 mb-1 block group-hover:text-slate-700 transition-colors">Text Color</span>
                <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                  <input type="color" value={styles.textColor} onChange={(e) => setStyles({ ...styles, textColor: e.target.value })} className="absolute opacity-0 w-full h-full cursor-pointer z-10 top-0 left-0" />
                  <div className="w-4 h-4 md:w-5 md:h-5 rounded-md border border-slate-200" style={{ backgroundColor: styles.textColor }}></div>
                  <span className="text-[10px] md:text-xs font-mono text-slate-700 truncate">{styles.textColor.toUpperCase()}</span>
                </div>
              </label>

              <label className="cursor-pointer group relative">
                <span className="text-[10px] md:text-xs text-slate-500 mb-1 block group-hover:text-slate-700 transition-colors">Background</span>
                <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                  <input type="color" value={styles.bgColor} onChange={(e) => setStyles({ ...styles, bgColor: e.target.value })} className="absolute opacity-0 w-full h-full cursor-pointer z-10 top-0 left-0" />
                  <div className="w-4 h-4 md:w-5 md:h-5 rounded-md border border-slate-200" style={{ backgroundColor: styles.bgColor }}></div>
                  <span className="text-[10px] md:text-xs font-mono text-slate-700 truncate">{styles.bgColor.toUpperCase()}</span>
                </div>
              </label>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-[10px] md:text-xs text-slate-500">Background Opacity</label>
                <span className="text-[10px] md:text-xs font-bold text-[#128189] bg-[#E1F2F3] px-2 py-0.5 rounded">{styles.bgOpacity}%</span>
              </div>
              <input type="range" min="0" max="100" value={styles.bgOpacity} onChange={(e) => setStyles({ ...styles, bgOpacity: e.target.value })} className="w-full h-1.5 md:h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#128189]" />
            </div>
          </div>

          <div>
            <h3 className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 md:mb-3">
              Position
            </h3>
            <div className="grid grid-cols-3 gap-1 md:gap-2 bg-white p-3 md:p-4 rounded-xl border border-slate-200 shadow-sm">
              {[
                { id: "top-left", icon: "fa-align-left" },
                { id: "top-center", icon: "fa-align-center" },
                { id: "top-right", icon: "fa-align-right" },
                { id: "bottom-left", icon: "fa-align-left" },
                { id: "bottom-center", icon: "fa-align-center" },
                { id: "bottom-right", icon: "fa-align-right" },
              ].map((pos) => (
                <button
                  key={pos.id}
                  onClick={() => setStyles({ ...styles, position: pos.id })}
                  className={`h-10 md:h-12 rounded-lg flex items-center justify-center transition-all ${
                    styles.position === pos.id
                      ? "bg-[#E1F2F3] border-2 border-[#128189] text-[#128189] shadow-inner transform scale-95"
                      : "bg-slate-50 border border-slate-100 text-slate-400 hover:border-slate-300 hover:text-slate-700 hover:bg-slate-100"
                  }`}
                  title={`Align ${pos.id.replace("-", " ")}`}
                >
                  <i className={`fa-solid ${pos.icon} text-xs md:text-sm`}></i>
                </button>
              ))}
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
};

export default Captions;