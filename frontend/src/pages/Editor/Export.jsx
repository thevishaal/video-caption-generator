import React, { useState, useEffect } from 'react';

// --- MOCK API SERVICE ---
const fetchExportData = async () => {
  // Simulating a 1-second network request to your backend
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        video: {
          name: 'Summer_Vlog_Final_02.mp4',
          thumbnailUrl: 'https://images.unsplash.com/photo-1516541196182-6bdb0516ed27?q=80&w=800&auto=format&fit=crop', // Example Thumbnail
          duration: '04:32',
          fps: '24fps'
        },
        resolutions: [
          { id: '720p', label: '720p', subLabel: 'HD Ready', sizeMultiplier: 0.6 },
          { id: '1080p', label: '1080p', subLabel: 'FULL HD', recommended: true, sizeMultiplier: 1.0 },
          { id: '4K', label: '4K', subLabel: 'Ultra HD', sizeMultiplier: 2.8 },
        ],
        formats: [
          { id: 'MP4', label: 'MP4', subLabel: 'H.264 HIGH', baseSizeMB: 842.4 },
          { id: 'MOV', label: 'MOV', subLabel: 'PRORES 422', baseSizeMB: 1450.2 },
        ],
        captionModes: [
          { id: 'Burned-in', label: 'Burned-in', description: 'Permanent on video', icon: 'fa-closed-captioning' },
          { id: 'Separate .SRT', label: 'Separate .SRT', description: 'Sidecar file for web', icon: 'fa-file-lines' },
        ],
        details: {
          codec: 'H.264 (AVC)',
          colorSpace: 'Rec. 709',
          projectLink: 'https://athenura.app/v/smr-vlg-02'
        }
      });
    }, 1000);
  });
};

const Export = () => {
  // --- DATA STATE ---
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // --- SELECTION STATE ---
  const [selectedRes, setSelectedRes] = useState('1080p');
  const [selectedFormat, setSelectedFormat] = useState('MP4');
  const [selectedCaptionMode, setSelectedCaptionMode] = useState('Burned-in');

  // --- PROGRESS STATE ---
  const [exportStatus, setExportStatus] = useState('idle'); // 'idle', 'rendering', 'complete'
  const [progress, setProgress] = useState(0);
  const [estimatedTime, setEstimatedTime] = useState('--:--');

  // 1. Fetch Initial Data
  useEffect(() => {
    fetchExportData().then((fetchedData) => {
      setData(fetchedData);
      setIsLoading(false);
    });
  }, []);

  // 2. Dynamic Size Calculation
  const calculateEstimatedSize = () => {
    if (!data) return '0 MB';
    const format = data.formats.find(f => f.id === selectedFormat);
    const resolution = data.resolutions.find(r => r.id === selectedRes);
    
    // If downloading just SRT, the size is tiny (mocked to KB)
    if (selectedCaptionMode === 'Separate .SRT') {
      return '12.4 KB';
    }
    
    const size = (format.baseSizeMB * resolution.sizeMultiplier).toFixed(1);
    return `${size} MB`;
  };

  // 3. Handle Export / Download Process
  const handleExport = () => {
    setExportStatus('rendering');
    setProgress(0);
    
    // Total simulated rendering time: ~10 seconds (faster if just SRT)
    const totalSeconds = selectedCaptionMode === 'Separate .SRT' ? 2 : 10; 
    let currentSecond = 0;

    const timer = setInterval(() => {
      currentSecond += 0.5; // Update every 500ms
      const currentProgress = Math.min(100, Math.floor((currentSecond / totalSeconds) * 100));
      
      setProgress(currentProgress);

      const secondsRemaining = Math.max(0, totalSeconds - currentSecond);
      const m = Math.floor(secondsRemaining / 60);
      const s = Math.floor(secondsRemaining % 60);
      setEstimatedTime(`0${m}:${s.toString().padStart(2, '0')}`);

      if (currentProgress >= 100) {
        clearInterval(timer);
        setExportStatus('complete');
        setEstimatedTime('Ready');
        
        // Trigger simulated file download
        setTimeout(() => triggerNativeDownload(), 500);
      }
    }, 500);
  };

  // 4. SMART DOWNLOAD LOGIC (Generates SRT or MP4 based on selection)
  const triggerNativeDownload = () => {
    let content, filename, mimeType;

    const baseName = data.video.name.replace('.mp4', '');

    if (selectedCaptionMode === 'Separate .SRT') {
      // Mock SRT File Structure
      content = `1\n00:00:02,000 --> 00:00:05,000\nIn this lesson, we will explore the boundaries of modern design.\n\n2\n00:00:05,500 --> 00:00:08,000\nFluidity is key to achieving a truly professional interface.\n\n3\n00:00:08,500 --> 00:00:12,000\nLet's look at how we can manipulate space and light.\n`;
      filename = `${baseName}_captions.srt`;
      mimeType = 'text/plain'; // Browsers download SRTs via text/plain blobs
    } else {
      // Mock Video File Structure
      content = `MOCK VIDEO DATA (Burned-in Captions)\nName: ${data.video.name}\nResolution: ${selectedRes}\nFormat: ${selectedFormat}`;
      filename = `${baseName}_${selectedRes}.${selectedFormat.toLowerCase()}`;
      mimeType = 'video/mp4'; 
    }

    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  if (isLoading || !data) {
    return (
      <div className="w-full min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center">
        <i className="fa-solid fa-circle-notch fa-spin text-4xl text-[#128189] mb-4"></i>
        <h2 className="text-brand-navy font-bold text-lg animate-pulse">Loading Export Settings...</h2>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-[#F8FAFC] p-4 md:p-8 lg:p-12 font-sans overflow-x-hidden flex flex-col">
      
      {/* --- HEADER SECTION --- */}
      <div className="mb-8 md:mb-10 animate-fade-in">
        <h1 className="text-2xl md:text-3xl font-bold text-[#111827] mb-2 tracking-tight">
          Finalizing Your Export
        </h1>
        <p className="text-[#64748B] text-sm md:text-base font-medium max-w-2xl">
          Review your project details and select your preferred delivery settings.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 items-start">
        
        {/* =========================================
            LEFT COLUMN: SETTINGS (Takes up 2/3 width)
            ========================================= */}
        <div className="lg:col-span-2 flex flex-col gap-6 md:gap-8 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          
          {/* Video Resolution */}
          <div className="bg-white rounded-2xl md:rounded-3xl p-5 md:p-8 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <h2 className="text-base md:text-lg font-bold text-[#111827] uppercase tracking-wide">Video Resolution</h2>
              <span className="bg-[#E2E8F0] text-slate-500 text-[9px] md:text-[10px] font-bold px-2 md:px-3 py-1 md:py-1.5 rounded-md tracking-wider">
                Recommended: 1080p
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
              {data.resolutions.map((res) => (
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
                       <i className="fa-solid fa-circle-check absolute -top-1 md:-top-2 -right-3 md:-right-4 text-[#128189] text-base md:text-xl animate-fade-in"></i>
                    )}
                  </div>
                  <div className="font-semibold text-[10px] md:text-xs text-[#4E8182] uppercase tracking-wider">{res.subLabel}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Format & Caption Mode Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-start">
             
             {/* Format Selection */}
             <div className="bg-white rounded-2xl md:rounded-3xl p-5 md:p-8 shadow-sm border border-slate-100">
                <h2 className="text-base md:text-lg font-bold text-[#111827] mb-4 md:mb-6 uppercase tracking-wide">Format</h2>
                <div className="grid grid-cols-2 gap-3 md:gap-4">
                   {data.formats.map((fmt) => (
                      <button
                         key={fmt.id}
                         onClick={() => setSelectedFormat(fmt.id)}
                         className={`p-4 md:p-6 rounded-xl border-2 transition-all duration-300 flex flex-col items-center sm:items-start justify-center gap-1 group ${
                            selectedFormat === fmt.id
                               ? 'bg-[#F0F9FA] border-[#8CCACB] shadow-sm scale-[1.02]'
                               : 'bg-white border-slate-100 hover:border-slate-200'
                         }`}
                      >
                         <div className="font-bold text-lg md:text-xl text-[#111827] tracking-tight">{fmt.label}</div>
                         <div className="font-semibold text-[9px] md:text-[10px] text-[#4E8182] uppercase tracking-wider text-center sm:text-left">{fmt.subLabel}</div>
                      </button>
                   ))}
                </div>
             </div>

             {/* Caption Mode Selection */}
             <div className="bg-white rounded-2xl md:rounded-3xl p-5 md:p-8 shadow-sm border border-slate-100">
                <h2 className="text-base md:text-lg font-bold text-[#111827] mb-4 md:mb-6 uppercase tracking-wide">Caption Mode</h2>
                <div className="flex flex-col gap-3 md:gap-4">
                   {data.captionModes.map((mode) => (
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
                            <i className={`fa-solid ${mode.icon} ${selectedCaptionMode === mode.id ? 'text-[#128189]' : 'text-slate-400'} text-xl md:text-2xl transition-colors`}></i>
                            <div className="flex flex-col items-start text-left">
                               <span className="font-bold text-xs md:text-sm text-[#111827]">{mode.label}</span>
                               <span className="text-[#64748B] text-[10px] md:text-[11px] font-medium">{mode.description}</span>
                            </div>
                         </div>
                         <i className={`fa-solid ${selectedCaptionMode === mode.id ? 'fa-circle-dot text-[#128189]' : 'fa-circle text-slate-200'} text-xl transition-colors`}></i>
                      </button>
                   ))}
                </div>
             </div>
          </div>
              <div className="w-full bg-white rounded-2xl md:rounded-3xl p-5 md:p-8 shadow-md border border-slate-200 relative overflow-hidden">
             
             {/* Progress Info Header */}
             {exportStatus !== 'idle' && (
               <div className="flex items-start justify-between mb-3 animate-fade-in">
                  <div>
                     <h2 className="text-sm md:text-base font-bold text-[#111827]">Rendering Progress</h2>
                     <span className="text-slate-500 font-semibold text-[9px] md:text-[10px] tracking-wider uppercase">
                       {exportStatus === 'complete' ? 'Export Complete' : `Time remaining: ${estimatedTime}`}
                     </span>
                  </div>
                  <span className="text-3xl md:text-4xl font-extrabold text-[#128189] tracking-tighter">
                    {progress}%
                  </span>
               </div>
             )}

             {/* Progress Bar Fill */}
             {exportStatus !== 'idle' && (
               <div className="w-full h-2 md:h-2.5 bg-slate-100 rounded-full mb-6 relative overflow-hidden">
                  <div 
                    className="absolute top-0 bottom-0 left-0 bg-[#128189] rounded-full transition-all duration-300 ease-out" 
                    style={{ width: `${progress}%` }}
                  >
                    {/* Shimmer effect when active */}
                    {exportStatus === 'rendering' && (
                      <div className="absolute inset-0 bg-white/20 w-full h-full animate-[pulse_1.5s_ease-in-out_infinite]"></div>
                    )}
                  </div>
               </div>
             )}

             {/* Dynamic Action Button */}
             <button
               onClick={handleExport}
               disabled={exportStatus === 'rendering'}
               className={`w-full text-white font-bold py-3.5 md:py-4 rounded-xl md:rounded-2xl transition-all duration-300 shadow-md flex items-center justify-center gap-2 md:gap-2.5 text-sm md:text-base disabled:opacity-90 disabled:cursor-not-allowed ${
                 exportStatus === 'rendering' ? 'bg-[#128189]/80' : 
                 exportStatus === 'complete' ? 'bg-[#10B981] hover:bg-[#059669]' : 
                 'bg-[#0C4E5E] hover:bg-[#093c48]'
               }`}
             >
                {exportStatus === 'idle' && (
                  <><i className="fa-solid fa-play"></i> {selectedCaptionMode === 'Separate .SRT' ? 'Download .SRT File' : 'Start Video Export'}</>
                )}
                {exportStatus === 'rendering' && (
                  <><i className="fa-solid fa-circle-notch fa-spin"></i> Generating...</>
                )}
                {exportStatus === 'complete' && (
                  <><i className="fa-solid fa-download"></i> Download Again</>
                )}
             </button>
          </div>
        </div>

        {/* =========================================
            RIGHT COLUMN: PREVIEW & EXPORT DETAILS
            ========================================= */}
        <div className="lg:col-span-1 flex flex-col gap-6 md:gap-8 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          
          {/* Dynamic Video Preview */}
          <div className="bg-white rounded-2xl md:rounded-3xl overflow-hidden shadow-sm border border-slate-100 relative group">
             <div className="relative aspect-[16/9] bg-slate-800 flex items-center justify-center overflow-hidden">
                <img 
                  src={data.video.thumbnailUrl} 
                  alt="Thumbnail" 
                  className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-700" 
                />
                
                {/* Gradient Overlay & Text */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col items-start justify-end p-4 md:p-5">
                   <div className="text-white text-[10px] md:text-xs font-bold mb-1.5 flex items-center gap-1.5 uppercase tracking-wider">
                     <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                     </span> 
                     MASTER PREVIEW
                   </div>
                   <h3 className="text-white font-bold text-sm md:text-base leading-snug mb-1 truncate w-full">
                     {data.video.name}
                   </h3>
                   <div className="text-slate-300 text-[10px] md:text-[11px] font-medium tracking-wide">
                     {selectedRes} • {data.video.fps} • {data.video.duration}
                   </div>
                </div>
             </div>
          </div>

          {/* Dynamic Export Details */}
          <div className="bg-white rounded-2xl md:rounded-3xl p-5 md:p-8 shadow-sm border border-slate-100">
             <h2 className="text-base md:text-lg font-bold text-[#111827] mb-4 md:mb-6 uppercase tracking-wide">Export Details</h2>
             <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500 font-semibold text-[10px] md:text-xs tracking-wider uppercase">Estimated Size</span>
                  <span className="text-[#111827] font-bold text-xs md:text-sm">{calculateEstimatedSize()}</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500 font-semibold text-[10px] md:text-xs tracking-wider uppercase">Codec</span>
                  <span className="text-[#111827] font-bold text-xs md:text-sm">{data.details.codec}</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500 font-semibold text-[10px] md:text-xs tracking-wider uppercase">Color Space</span>
                  <span className="text-[#111827] font-bold text-xs md:text-sm">{data.details.colorSpace}</span>
                </div>
                <div className="flex items-center justify-between py-1 pt-2">
                  <span className="text-slate-500 font-semibold text-[10px] md:text-xs tracking-wider uppercase">Project Link</span>
                  <button 
                    onClick={() => navigator.clipboard.writeText(data.details.projectLink)}
                    className="text-[#128189] font-bold text-xs md:text-sm flex items-center gap-1.5 hover:text-[#0E666D] transition-colors"
                  >
                     Copy URL <i className="fa-solid fa-copy"></i>
                  </button>
                </div>
             </div>
          </div>

          {/* Turbo Mode Card */}
          <div className="bg-[#F6EBE5] rounded-2xl md:rounded-3xl p-4 md:p-6 border border-[#ECCACA] flex items-center gap-3 md:gap-4 shadow-sm">
             <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-[#B16938]/10 flex items-center justify-center flex-shrink-0">
               <i className="fa-solid fa-bolt text-[#B16938] text-lg md:text-xl"></i>
             </div>
             <p className="text-[#845330] font-medium text-[11px] md:text-xs leading-relaxed">
               <span className="font-bold text-[#B16938]">Turbo Mode:</span> Using GPU acceleration for 3.5x faster rendering.
             </p>
          </div>

          {/* Action / Rendering Progress Block */}
         
          
        </div>
      </div>
    </div>
  );
};

export default Export;