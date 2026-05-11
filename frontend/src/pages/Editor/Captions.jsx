import React, { useState, useRef, useEffect, useCallback } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";

const FONTS = [
  "Inter",
  "Roboto",
  "Pirata One",
  "Playfair Display",
  "Montserrat",
  "Open Sans",
  "Courier New",
];

const TIMELINE_ZOOM = 100; // px per second

const formatTime = (seconds) => {
  if (isNaN(seconds) || seconds == null) return "00:00:00";
  const date = new Date(seconds * 1000);
  const hh = date.getUTCHours();
  const mm = date.getUTCMinutes().toString().padStart(2, "0");
  const ss = date.getUTCSeconds().toString().padStart(2, "0");
  if (hh > 0) return `${hh.toString().padStart(2, "0")}:${mm}:${ss}`;
  return `00:${mm}:${ss}`;
};

const parseTimeInput = (str) => {
  const parts = str.split(":").map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return parseFloat(str) || 0;
};

// ─── Toast ────────────────────────────────────────────────────────────────────
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);

  const bg =
    type === "success"
      ? "bg-emerald-500"
      : type === "error"
      ? "bg-red-500"
      : "bg-[#128189]";

  return (
    <div
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[999] flex items-center gap-3 px-5 py-3 rounded-2xl text-white shadow-2xl text-sm font-semibold transition-all ${bg}`}
      style={{ animation: "slideUp .25s ease" }}
    >
      {type === "success" && <i className="fa-solid fa-circle-check" />}
      {type === "error" && <i className="fa-solid fa-circle-exclamation" />}
      {type === "loading" && <i className="fa-solid fa-circle-notch fa-spin" />}
      <span>{message}</span>
    </div>
  );
};

// ─── Captions Component ───────────────────────────────────────────────────────
const Captions = () => {
  const { videoId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const videoUrl = location.state?.videoUrl || "";

  // ── State ──
  const [segments, setSegments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState("Loading...");

  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [activeSegmentId, setActiveSegmentId] = useState(null);

  // Video dimensions for correct aspect ratio
  const [videoDimensions, setVideoDimensions] = useState({ width: 16, height: 9 });
  const isPortrait = videoDimensions.height > videoDimensions.width;

  const [styles, setStyles] = useState({
    typography: "Inter",
    isBold: true,
    isItalic: false,
    isCaps: false,
    textColor: "#FFFFFF",
    bgColor: "#000000",
    bgOpacity: 40,
    position: "bottom-center",
    fontSize: 16,
  });

  const [isFontMenuOpen, setIsFontMenuOpen] = useState(false);
  const fontDropdownRef = useRef(null);

  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState(null);

  // Refs
  const timelineRef = useRef(null);
  const isDraggingPlayhead = useRef(false);
  const draggingSegRef = useRef(null);
  const activeSegmentRef = useRef(null); // for auto-scroll
  const segmentRefs = useRef({});

  // ── Caption Generation ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!videoId) return;
    const generateCaptions = async () => {
      setIsLoading(true);
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };
      try {
        setLoadingMessage("Extracting audio...");
        const response = await axios.post(
          "http://127.0.0.1:8000/api/captions/generate/",
          { video_id: videoId, language: "en" },
          { headers }
        );
        setLoadingMessage("Generating AI captions...");
        const captions = response.data?.data || [];
        const mappedSegments = captions
          .map((item) => ({
            id: item.id,
            start_time: item.start_time,
            end_time: item.end_time,
            text: item.original_text || item.translated_text || "",
          }))
          .sort((a, b) => a.start_time - b.start_time);
        setSegments(mappedSegments);
        setLoadingMessage("Captions ready");
        setIsLoading(false);
      } catch (error) {
        console.error("Caption generation failed:", error);
        setLoadingMessage("Failed to generate captions");
        setIsLoading(false);
      }
    };
    generateCaptions();
  }, [videoId]);

  // ── Click outside font menu ─────────────────────────────────────────────────
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (fontDropdownRef.current && !fontDropdownRef.current.contains(e.target))
        setIsFontMenuOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ── Active segment sync ─────────────────────────────────────────────────────
  useEffect(() => {
    const active = segments.find(
      (seg) => currentTime >= seg.start_time && currentTime <= seg.end_time
    );
    const newActiveId = active ? active.id : null;
    setActiveSegmentId(newActiveId);

    // Auto-scroll active segment into view in the left panel
    if (newActiveId && segmentRefs.current[newActiveId]) {
      segmentRefs.current[newActiveId].scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [currentTime, segments]);

  // ── Video handlers ──────────────────────────────────────────────────────────
  const handleTimeUpdate = () => {
    if (videoRef.current) setCurrentTime(videoRef.current.currentTime);
  };

  const handleLoadedMetadata = (e) => {
    const video = e.target;
    if (video) {
      setDuration(video.duration);
      setVideoDimensions({ width: video.videoWidth, height: video.videoHeight });
    }
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) videoRef.current.play();
    else videoRef.current.pause();
  };

  const seekVideo = (seconds) => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(
        0,
        Math.min(videoRef.current.currentTime + seconds, duration)
      );
    }
  };

  // ── Caption click: jump + play + highlight + sync ───────────────────────────
  const handleCaptionClick = useCallback((segment) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = segment.start_time;
    videoRef.current.play();
    setCurrentTime(segment.start_time);
    setActiveSegmentId(segment.id);
  }, []);

  // ── Timeline interactions ───────────────────────────────────────────────────
  const getTimeFromTimelineX = useCallback(
    (clientX) => {
      if (!timelineRef.current) return 0;
      const bounds = timelineRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(clientX - bounds.left, bounds.width));
      const scrollLeft = timelineRef.current.scrollLeft;
      const totalPx = x + scrollLeft;
      return Math.max(0, Math.min(totalPx / TIMELINE_ZOOM, duration));
    },
    [duration]
  );

  const handleTimelineMouseDown = (e) => {
    if (e.target.closest(".seg-block")) return;
    isDraggingPlayhead.current = true;
    const t = getTimeFromTimelineX(e.clientX);
    if (videoRef.current) videoRef.current.currentTime = t;
    setCurrentTime(t);
  };

  useEffect(() => {
    const onMove = (e) => {
      if (!isDraggingPlayhead.current) return;
      const t = getTimeFromTimelineX(e.clientX);
      if (videoRef.current) videoRef.current.currentTime = t;
      setCurrentTime(t);
    };
    const onUp = () => { isDraggingPlayhead.current = false; };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [getTimeFromTimelineX]);

  // ── Segment drag (timeline blocks) ─────────────────────────────────────────
  const handleSegmentMouseDown = (e, seg) => {
    e.stopPropagation();
    draggingSegRef.current = {
      id: seg.id,
      startX: e.clientX,
      origStart: seg.start_time,
      origEnd: seg.end_time,
    };
  };

  useEffect(() => {
    const onMove = (e) => {
      if (!draggingSegRef.current) return;
      const { id, startX, origStart, origEnd } = draggingSegRef.current;
      const dx = e.clientX - startX;
      const dt = dx / TIMELINE_ZOOM;
      const dur = origEnd - origStart;
      const newStart = Math.max(0, origStart + dt);
      const newEnd = newStart + dur;
      setSegments((prev) =>
        prev.map((s) =>
          s.id === id ? { ...s, start_time: newStart, end_time: newEnd } : s
        )
      );
    };
    const onUp = () => { draggingSegRef.current = null; };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);

  // ── Inline segment editing ──────────────────────────────────────────────────
  const updateSegmentText = (id, newText) => {
    setSegments((prev) =>
      prev.map((s) => (s.id === id ? { ...s, text: newText } : s))
    );
  };

  const updateSegmentTime = (id, field, value) => {
    const parsed = parseTimeInput(value);
    if (isNaN(parsed)) return;
    setSegments((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: parsed } : s))
    );
    // Sync video if editing the active segment's start
    if (field === "start_time" && id === activeSegmentId && videoRef.current) {
      videoRef.current.currentTime = parsed;
      setCurrentTime(parsed);
    }
  };

  const toggleStyle = (key) => setStyles((prev) => ({ ...prev, [key]: !prev[key] }));

  const activeSegment = segments.find((s) => s.id === activeSegmentId);

   // ── Subtitle overlay position ───────────────────────────────────────────────
  const getPositionStyle = () => {
    // Cleaned up map: pure absolute positioning for the container, and text alignment for the text.
    const map = {
      "top-left":     { top: "12px", left: "12px", textAlign: "left" },
      "top-center":   { top: "12px", left: "8%", textAlign: "center" },
      "top-right":    { top: "12px", right: "12px", textAlign: "right" },
      "bottom-left":  { bottom: "16px", left: "12px", textAlign: "left" },
      "bottom-center":{ bottom: "16px", left: "8%", textAlign: "center" },
      "bottom-right": { bottom: "16px", right: "12px", textAlign: "right" },
    };
    return map[styles.position] || map["bottom-center"];
  };

  const posStyle = getPositionStyle();
  // Separate the container positioning from the text alignment
  const { textAlign, ...containerStyle } = posStyle;

  // ── Apply Changes ─────────────────────────────────────────────────────────
  const handleApplyChanges = async () => {
    setIsSaving(true);
    setToast({ message: "Saving captions...", type: "loading" });
    const token = localStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}` };

    try {
      await Promise.all(
        segments.map((seg) =>
          axios.put(
            `http://127.0.0.1:8000/api/captions/${seg.id}/`,
            {
              start_time: seg.start_time,
              end_time: seg.end_time,
              original_text: seg.text,
            },
            { headers }
          )
        )
      );

      setToast({ message: "Saving styles...", type: "loading" });
      await axios.put(
        "http://127.0.0.1:8000/api/captions/style",
        {
          video_id: videoId,
          font_family: styles.typography,
          font_size: styles.fontSize,
          font_color: styles.textColor,
          background_color: styles.bgColor,
          bold: styles.isBold,
          italic: styles.isItalic,
          alignment: styles.position.includes("center")
            ? "center"
            : styles.position.includes("right")
            ? "right"
            : "left",
          position: styles.position,
        },
        { headers }
      );

      setToast({ message: "Changes applied successfully!", type: "success" });

      setTimeout(() => {
        navigate(`/editor/upload/captions/translate/${videoId}`, {
          state: { videoUrl, segments, styles },
        });
      }, 1200);
    } catch (err) {
      console.error("Apply changes failed:", err);
      setToast({ message: "Failed to save changes. Please try again.", type: "error" });
      setIsSaving(false);
    }
  };

  // ── Waveform bars (stable) ──────────────────────────────────────────────────
  const waveformBars = useRef(
    Array.from({ length: 60 }, () => Math.max(20, Math.floor(Math.random() * 80)))
  );

  // ── Compute video container max dimensions ──────────────────────────────────
  // For portrait video: cap height so it doesn't dominate. For landscape: full width.
  const aspectRatioValue = videoDimensions.width / videoDimensions.height;

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translate(-50%, 20px); }
          to   { opacity: 1; transform: translate(-50%, 0); }
        }
        @keyframes subtitleFadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 99px; }
        .seg-block { cursor: grab; user-select: none; }
        .seg-block:active { cursor: grabbing; }
        .time-input {
          background: transparent;
          border: none;
          outline: none;
          font-family: monospace;
          font-size: 10px;
          width: 64px;
          color: #64748b;
        }
        .time-input:focus {
          background: #f1f5f9;
          border-radius: 4px;
          color: #0C4E5E;
          padding: 1px 3px;
        }
        .subtitle-animate {
          animation: subtitleFadeIn 0.2s ease forwards;
        }
        .segment-card {
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .segment-card.active {
          background: white;
          box-shadow: 0 2px 12px rgba(18, 129, 137, 0.15);
          border-left: 3px solid #128189;
        }
        .segment-card:not(.active):hover {
          background: rgba(241, 245, 249, 0.8);
        }
      `}</style>

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}

      {/* ── Root layout: 3 cols on xl, stacked on mobile ── */}
      <div className="flex flex-col xl:flex-row min-h-screen xl:h-screen bg-[#F4F6F8] font-sans overflow-y-auto xl:overflow-hidden w-full">

        {/* ══════════════════════════════════════════════════════════════
            LEFT PANEL — Segment List (compact)
        ══════════════════════════════════════════════════════════════ */}
        <aside className="xl:w-72 order-2 xl:order-1 bg-[#F4F6F8] border-b xl:border-b-0 xl:border-r border-slate-200 flex flex-col xl:h-full z-10 flex-shrink-0"
          style={{ minHeight: 0 }}
        >
          {/* Header */}
          <div className="px-4 py-3 flex items-center justify-between border-b border-slate-200/50 bg-white/60 backdrop-blur-sm sticky top-0 z-20">
            <h2 className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">
              Captions · {segments.length}
            </h2>
            <button className="text-[#128189] hover:scale-110 transition-transform">
              <i className="fa-solid fa-circle-plus text-base" />
            </button>
          </div>

          {/* Segment list */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar" style={{ maxHeight: "calc(100vh - 130px)" }}>
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <i className="fa-solid fa-circle-notch fa-spin text-2xl text-[#128189] mb-3" />
                <p className="text-xs text-slate-500 max-w-[180px] leading-relaxed">{loadingMessage}</p>
              </div>
            ) : segments.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-sm">
                No captions found.
              </div>
            ) : (
              <>
                {segments.map((segment) => {
                  const isActive = segment.id === activeSegmentId;
                  return (
                    <div
                      key={segment.id}
                      ref={(el) => { segmentRefs.current[segment.id] = el; }}
                      className={`segment-card rounded-lg cursor-pointer px-3 py-2.5 border-l-[3px] ${
                        isActive
                          ? "active border-[#128189]"
                          : "border-transparent"
                      }`}
                      onClick={() => handleCaptionClick(segment)}
                    >
                      {/* Timestamps + index badge */}
                      <div className="flex justify-between items-center mb-1.5">
                        <div className="flex items-center gap-0.5">
                          <input
                            className="time-input"
                            defaultValue={formatTime(segment.start_time)}
                            onBlur={(e) => updateSegmentTime(segment.id, "start_time", e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                          />
                          <span className="text-slate-300 text-[10px]">›</span>
                          <input
                            className="time-input"
                            defaultValue={formatTime(segment.end_time)}
                            onBlur={(e) => updateSegmentTime(segment.id, "end_time", e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                        <span className={`text-[8px] font-bold tracking-wider px-1.5 py-0.5 rounded-full ${
                          isActive ? "bg-[#E1F2F3] text-[#128189]" : "bg-slate-100 text-slate-400"
                        }`}>
                          {isActive ? "●" : `${segments.indexOf(segment) + 1}`}
                        </span>
                      </div>

                      {/* Text */}
                      <textarea
                        value={segment.text}
                        onChange={(e) => updateSegmentText(segment.id, e.target.value)}
                        className={`w-full text-xs leading-snug bg-transparent resize-none focus:outline-none focus:ring-0 overflow-hidden ${
                          isActive ? "text-slate-900 font-medium" : "text-slate-500"
                        }`}
                        rows={2}
                        placeholder="Caption text..."
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  );
                })}

                <button className="w-full py-3 border-2 border-dashed border-slate-200 rounded-lg text-slate-400 text-xs font-medium hover:border-[#128189] hover:text-[#128189] transition-colors flex items-center justify-center gap-1.5 bg-white/30 mt-1">
                  <i className="fa-solid fa-plus text-[10px]" /> Add Segment
                </button>
              </>
            )}
          </div>

          {/* Apply Changes */}
          <div className="p-3 border-t border-slate-200/60 bg-white/60 backdrop-blur-sm flex-shrink-0">
            <button
              onClick={handleApplyChanges}
              disabled={isSaving || isLoading}
              className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-bold text-xs tracking-wide transition-all shadow-sm ${
                isSaving || isLoading
                  ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-[#0C4E5E] to-[#128189] text-white hover:shadow-md hover:scale-[1.02] active:scale-[0.98]"
              }`}
            >
              {isSaving ? (
                <><i className="fa-solid fa-circle-notch fa-spin" /> Saving...</>
              ) : (
                <><i className="fa-solid fa-floppy-disk" /> Apply Changes</>
              )}
            </button>
          </div>
        </aside>

        {/* ══════════════════════════════════════════════════════════════
            CENTER PANEL — Video Player (primary focus)
        ══════════════════════════════════════════════════════════════ */}
        <main className="xl:flex-1 order-1 xl:order-2 flex flex-col items-center justify-center p-4 bg-white relative z-0 xl:overflow-y-auto min-w-0">

          {/* ── Video wrapper: aspect-ratio aware, no stretching ── */}
          <div
            className="relative w-full flex items-center justify-center"
            style={{
              // For portrait: limit width so it doesn't blow up. For landscape: full width.
              maxWidth: isPortrait
                ? `min(100%, calc((100vh - 280px) * ${aspectRatioValue}))`
                : "100%",
            }}
          >
            {/* Video container: correct aspect ratio */}
            <div
              className="relative w-full bg-black rounded-2xl shadow-xl border border-slate-100 overflow-hidden"
              style={{ aspectRatio: `${videoDimensions.width} / ${videoDimensions.height}` }}
            >
              {!videoUrl && (
                <div className="absolute inset-0 flex items-center justify-center text-white/40 z-10 pointer-events-none">
                  <div className="text-center">
                    <i className="fa-solid fa-film text-3xl mb-2 opacity-40" />
                    <p className="text-sm">No video source</p>
                  </div>
                </div>
              )}

              <video
                ref={videoRef}
                src={videoUrl}
                className="absolute inset-0 w-full h-full object-contain cursor-pointer"
                onClick={togglePlay}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
              />

              {/* Subtitle overlay — positioned absolutely inside the video box */}
      {activeSegment && (
        <div
          key={activeSegment.id}
          className="subtitle-animate absolute pointer-events-none"
          style={{
            ...containerStyle, // Only applies top, bottom, left, right, and transform
            maxWidth: "85%",
            width: "max-content", // Ensures the box only wraps the text, rather than stretching
          }}
        >
          <div
            className="rounded-lg px-3 py-1.5 shadow-lg"
            style={{
              backgroundColor: `rgba(${parseInt(styles.bgColor.slice(1, 3), 16)}, ${parseInt(styles.bgColor.slice(3, 5), 16)}, ${parseInt(styles.bgColor.slice(5, 7), 16)}, ${styles.bgOpacity / 100})`,
            }}
          >
            <p
              className="leading-snug break-words"
              style={{
                color: styles.textColor,
                fontFamily: styles.typography,
                fontWeight: styles.isBold ? "700" : "400",
                fontStyle: styles.isItalic ? "italic" : "normal",
                textTransform: styles.isCaps ? "uppercase" : "none",
                fontSize: `clamp(10px, ${styles.fontSize / 16}vw + 6px, ${styles.fontSize}px)`,
                textAlign: textAlign, // Text alignment handled here cleanly
              }}
            >
              {activeSegment.text}
            </p>
          </div>
        </div>
      )}


              {/* Play/pause overlay icon (brief flash) */}
            </div>
          </div>

          {/* Playback controls */}
          <div className="mt-4 bg-white/95 backdrop-blur-md px-5 py-2 rounded-full shadow-lg flex items-center gap-5 z-20 border border-slate-100/80 flex-shrink-0">
            <button
              onClick={() => seekVideo(-5)}
              className="text-slate-500 hover:text-[#128189] transition-colors text-sm"
              title="Back 5s"
            >
              <i className="fa-solid fa-backward-step" />
            </button>
            <button
              onClick={() => seekVideo(-1)}
              className="text-slate-400 hover:text-[#128189] transition-colors text-xs"
              title="Back 1s"
            >
              <i className="fa-solid fa-rotate-left text-xs" />
            </button>
            <button
              onClick={togglePlay}
              className="w-10 h-10 bg-[#0C4E5E] text-white rounded-full flex items-center justify-center hover:scale-105 hover:shadow-md transition-all shadow"
            >
              <i className={`fa-solid ${isPlaying ? "fa-pause" : "fa-play"} text-sm ${!isPlaying && "ml-0.5"}`} />
            </button>
            <button
              onClick={() => seekVideo(1)}
              className="text-slate-400 hover:text-[#128189] transition-colors"
              title="Forward 1s"
            >
              <i className="fa-solid fa-rotate-right text-xs" />
            </button>
            <button
              onClick={() => seekVideo(5)}
              className="text-slate-500 hover:text-[#128189] transition-colors text-sm"
              title="Forward 5s"
            >
              <i className="fa-solid fa-forward-step" />
            </button>
          </div>

          {/* ── Timeline ── */}
          <div className="w-full mt-4 bg-[#F8FAFC] rounded-xl border border-slate-100 shadow-sm flex-shrink-0 overflow-hidden">
            {/* Time display */}
            <div className="flex justify-between items-center px-4 pt-2.5 pb-1.5">
              <div className="font-mono text-xs">
                <span className="font-bold text-[#128189]">{formatTime(currentTime)}</span>
                <span className="text-slate-300 ml-1.5">/ {formatTime(duration)}</span>
              </div>
              <span className="text-[9px] text-slate-400 font-medium">{segments.length} segments</span>
            </div>

            {/* Waveform scrubber */}
            <div
              className="relative h-10 bg-white border-y border-slate-100 cursor-pointer overflow-hidden"
              onClick={(e) => {
                const bounds = e.currentTarget.getBoundingClientRect();
                const pct = (e.clientX - bounds.left) / bounds.width;
                const t = Math.max(0, Math.min(pct * duration, duration));
                if (videoRef.current) videoRef.current.currentTime = t;
                setCurrentTime(t);
              }}
            >
              {/* Progress fill */}
              <div
                className="absolute inset-y-0 left-0 bg-[#E1F2F3] pointer-events-none transition-none"
                style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
              />
              {/* Waveform */}
              <div className="absolute inset-0 flex items-center gap-[1px] px-1 pointer-events-none opacity-60">
                {waveformBars.current.map((h, i) => {
                  const isActive = (i / 60) * duration <= currentTime;
                  return (
                    <div
                      key={i}
                      className={`flex-1 rounded-full ${isActive ? "bg-[#128189]" : "bg-slate-200"}`}
                      style={{ height: `${h}%` }}
                    />
                  );
                })}
              </div>
              {/* Playhead */}
              <div
                className="absolute top-0 bottom-0 w-[2px] bg-[#0C4E5E] z-10 pointer-events-none"
                style={{ left: `${(currentTime / (duration || 1)) * 100}%` }}
              >
                <div className="w-3 h-3 bg-[#0C4E5E] rounded-full -ml-[5px] -mt-0.5 shadow" />
              </div>
            </div>

            {/* Caption lane */}
            <div
              ref={timelineRef}
              className="relative overflow-x-auto custom-scrollbar"
              style={{ height: 40 }}
              onMouseDown={handleTimelineMouseDown}
            >
              <div
                className="relative h-full"
                style={{ width: Math.max(600, duration * TIMELINE_ZOOM) }}
              >
                {/* Tick marks */}
                {duration > 0 &&
                  Array.from({ length: Math.ceil(duration) + 1 }).map((_, i) => (
                    <div
                      key={i}
                      className="absolute top-0 bottom-0 border-l border-slate-100 pointer-events-none"
                      style={{ left: i * TIMELINE_ZOOM }}
                    >
                      {i % 5 === 0 && (
                        <span className="absolute bottom-1 left-1 text-[8px] text-slate-300 font-mono select-none">
                          {formatTime(i).slice(3)}
                        </span>
                      )}
                    </div>
                  ))}

                {/* Segment blocks */}
                {segments.map((seg) => {
                  const isActive = seg.id === activeSegmentId;
                  const left = seg.start_time * TIMELINE_ZOOM;
                  const width = Math.max(8, (seg.end_time - seg.start_time) * TIMELINE_ZOOM);
                  return (
                    <div
                      key={seg.id}
                      className={`seg-block absolute top-2 bottom-2 rounded flex items-center px-1.5 text-[9px] font-semibold truncate border transition-all ${
                        isActive
                          ? "bg-[#128189] text-white border-[#0C4E5E] shadow"
                          : "bg-[#E1F2F3] text-[#0C4E5E] border-[#b2dde1] hover:bg-[#c5eaed]"
                      }`}
                      style={{ left, width }}
                      onMouseDown={(e) => handleSegmentMouseDown(e, seg)}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCaptionClick(seg);
                      }}
                    >
                      {seg.text.slice(0, 25)}
                    </div>
                  );
                })}

                {/* Playhead on lane */}
                {duration > 0 && (
                  <div
                    className="absolute top-0 bottom-0 w-[2px] bg-[#0C4E5E] z-20 pointer-events-none"
                    style={{ left: currentTime * TIMELINE_ZOOM }}
                  >
                    <div className="w-2 h-2 bg-[#0C4E5E] rounded-full -ml-[3px] shadow" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>

        {/* ══════════════════════════════════════════════════════════════
            RIGHT PANEL — Style Settings (unchanged logic)
        ══════════════════════════════════════════════════════════════ */}
        <aside className="xl:w-72 order-3 xl:order-3 bg-[#F4F6F8] flex flex-col xl:h-full z-10 flex-shrink-0 border-t xl:border-t-0 xl:border-l border-slate-200">
          <div className="px-4 py-3 border-b border-slate-200/50 bg-white/60 backdrop-blur-sm sticky top-0 z-20">
            <h2 className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">
              Style Settings
            </h2>
          </div>

          <div className="p-4 overflow-y-auto custom-scrollbar flex-1 space-y-6">

            {/* Typography */}
            <div className="relative" ref={fontDropdownRef}>
              <h3 className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">Typography</h3>

              <div
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 mb-2.5 flex justify-between items-center cursor-pointer shadow-sm hover:border-slate-300 transition-colors"
                onClick={() => setIsFontMenuOpen(!isFontMenuOpen)}
              >
                <span className="text-xs font-bold text-slate-800" style={{ fontFamily: styles.typography }}>
                  {styles.typography}
                </span>
                <i className={`fa-solid fa-chevron-down text-[9px] text-slate-400 transition-transform duration-200 ${isFontMenuOpen ? "rotate-180" : ""}`} />
              </div>

              {isFontMenuOpen && (
                <div className="absolute top-[68px] left-0 w-full bg-white border border-slate-200 rounded-lg shadow-xl z-50 py-1 max-h-40 overflow-y-auto custom-scrollbar">
                  {FONTS.map((font) => (
                    <div
                      key={font}
                      className={`px-3 py-2 cursor-pointer hover:bg-slate-50 text-xs ${
                        styles.typography === font ? "text-[#128189] font-bold bg-[#F0F9FA]" : "text-slate-700"
                      }`}
                      style={{ fontFamily: font }}
                      onClick={() => { setStyles((p) => ({ ...p, typography: font })); setIsFontMenuOpen(false); }}
                    >
                      {font}
                    </div>
                  ))}
                </div>
              )}

              {/* Font size */}
              <div className="mb-3">
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-[9px] text-slate-400">Font Size</label>
                  <span className="text-[9px] font-bold text-[#128189] bg-[#E1F2F3] px-2 py-0.5 rounded">{styles.fontSize}px</span>
                </div>
                <input
                  type="range" min="10" max="36" value={styles.fontSize}
                  onChange={(e) => setStyles((p) => ({ ...p, fontSize: Number(e.target.value) }))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#128189]"
                />
              </div>

              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { key: "isBold", label: "Bold", cls: "font-bold" },
                  { key: "isItalic", label: "Italic", cls: "italic" },
                  { key: "isCaps", label: "Caps", cls: "uppercase" },
                ].map(({ key, label, cls }) => (
                  <button
                    key={key}
                    onClick={() => toggleStyle(key)}
                    className={`py-1.5 rounded-lg text-xs font-bold transition-all ${cls} ${
                      styles[key]
                        ? "bg-[#0C4E5E] text-white shadow"
                        : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Appearance */}
            <div>
              <h3 className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">Appearance</h3>
              <div className="grid grid-cols-2 gap-3 mb-3">
                {[
                  { label: "Text Color", key: "textColor" },
                  { label: "Background", key: "bgColor" },
                ].map(({ label, key }) => (
                  <label key={key} className="cursor-pointer relative">
                    <span className="text-[9px] text-slate-400 mb-1 block">{label}</span>
                    <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                      <input
                        type="color"
                        value={styles[key]}
                        onChange={(e) => setStyles((p) => ({ ...p, [key]: e.target.value }))}
                        className="absolute opacity-0 w-full h-full cursor-pointer z-10 top-0 left-0"
                      />
                      <div className="w-4 h-4 rounded border border-slate-200 flex-shrink-0" style={{ backgroundColor: styles[key] }} />
                      <span className="text-[9px] font-mono text-slate-600 truncate">{styles[key].toUpperCase()}</span>
                    </div>
                  </label>
                ))}
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-[9px] text-slate-400">Opacity</label>
                  <span className="text-[9px] font-bold text-[#128189] bg-[#E1F2F3] px-2 py-0.5 rounded">{styles.bgOpacity}%</span>
                </div>
                <input
                  type="range" min="0" max="100" value={styles.bgOpacity}
                  onChange={(e) => setStyles((p) => ({ ...p, bgOpacity: Number(e.target.value) }))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#128189]"
                />
              </div>
            </div>

            {/* Position */}
            <div>
              <h3 className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">Position</h3>
              <div className="grid grid-cols-3 gap-1.5 bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm">
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
                    onClick={() => setStyles((p) => ({ ...p, position: pos.id }))}
                    className={`h-9 rounded-lg flex items-center justify-center transition-all ${
                      styles.position === pos.id
                        ? "bg-[#E1F2F3] border-2 border-[#128189] text-[#128189] scale-95"
                        : "bg-slate-50 border border-slate-100 text-slate-400 hover:border-slate-300"
                    }`}
                    title={`Align ${pos.id.replace("-", " ")}`}
                  >
                    <i className={`fa-solid ${pos.icon} text-[10px]`} />
                  </button>
                ))}
              </div>
            </div>

            {/* Live preview */}
            <div>
              <h3 className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">Preview</h3>
              <div className="bg-slate-900 rounded-xl p-4 flex items-end justify-center min-h-[64px]">
                <div
                  className="rounded-lg px-3 py-1.5 max-w-full text-center"
                  style={{
                    backgroundColor: `rgba(${parseInt(styles.bgColor.slice(1,3),16)},${parseInt(styles.bgColor.slice(3,5),16)},${parseInt(styles.bgColor.slice(5,7),16)},${styles.bgOpacity/100})`,
                  }}
                >
                  <p
                    style={{
                      color: styles.textColor,
                      fontFamily: styles.typography,
                      fontWeight: styles.isBold ? "700" : "400",
                      fontStyle: styles.isItalic ? "italic" : "normal",
                      textTransform: styles.isCaps ? "uppercase" : "none",
                      fontSize: Math.min(styles.fontSize, 16),
                    }}
                  >
                    {activeSegment?.text || "Sample caption text"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
};

export default Captions;