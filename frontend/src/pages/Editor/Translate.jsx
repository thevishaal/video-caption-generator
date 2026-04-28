import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Initial Mock Data (Simulating what comes from your backend)
const initialCaptions = [
  {
    id: 1,
    time: '00:00:02:14',
    sourceText: "Welcome back to the studio. Today we're exploring the new Fluid Editor features that will change your workflow forever.",
    translatedText: "", // Will be filled by API
  },
  {
    id: 2,
    time: '00:00:05:02',
    sourceText: "Notice how the layering principle works seamlessly with our new tonal surfaces architecture.",
    translatedText: "",
  },
  {
    id: 3,
    time: '00:00:08:24',
    sourceText: "It's designed to be intuitive, yet powerful enough for the most demanding professional creators.",
    translatedText: "",
  },
  {
    id: 4,
    time: '00:00:12:10',
    sourceText: "Let's jump into the timeline and see how we can apply these concepts to our next big project.",
    translatedText: "",
  },
];

// Mock Spanish Translations for demonstration
const mockSpanishTranslations = {
  1: "Bienvenidos de nuevo al estudio. Hoy estamos explorando las nuevas características de Fluid Editor que cambiarán tu flujo de trabajo para siempre.",
  2: "Note cómo el principio de capas funciona a la perfección con nuestra nueva arquitectura de superficies tonales.",
  3: "Está diseñado para ser intuitivo, pero lo suficientemente potente para los creadores profesionales más exigentes.",
  4: "Saltemos a la línea de tiempo y veamos cómo podemos aplicar estos conceptos a nuestro próximo gran proyecto."
};

const Translate = () => {
  const navigate = useNavigate();
  
  // --- STATE MANAGEMENT ---
  const [captions, setCaptions] = useState(initialCaptions);
  const [activeCaptionId, setActiveCaptionId] = useState(1);
  const [activeTone, setActiveTone] = useState('Professional');
  const [sourceLang, setSourceLang] = useState('English (United States)');
  const [targetLang, setTargetLang] = useState('Spanish (Latin America)');
  const [isTranslating, setIsTranslating] = useState(false);

  // --- HANDLERS ---
  const handleTranslate = () => {
    setIsTranslating(true);
    
    // Simulate an API Call to your backend
    setTimeout(() => {
      const translatedCaptions = captions.map(cap => ({
        ...cap,
        // In a real app, this would be the response from your backend API
        translatedText: mockSpanishTranslations[cap.id]
      }));
      
      setCaptions(translatedCaptions);
      setIsTranslating(false);
    }, 1500); // 1.5 second simulated delay
  };

  // Get the currently selected caption to show in the preview
  const activeCaption = captions.find(c => c.id === activeCaptionId);

  return (
    <div className="w-full min-h-screen bg-[#F8FAFC] p-6 md:p-10 lg:p-12 font-sans overflow-x-hidden flex flex-col">
      
      {/* --- HEADER SECTION --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 animate-fade-in">
        <div className="mb-6 md:mb-0">
          <h1 className="text-3xl font-bold text-brand-navy mb-2 tracking-tight">
            Translate Content
          </h1>
          <p className="text-brand-text text-sm md:text-base font-medium">
            Expand your reach with AI-powered multi-language translation.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate(-1)}
            className="px-5 py-2.5 rounded-full bg-[#E2E8F0] hover:bg-slate-300 text-brand-button font-semibold text-sm transition-all duration-300"
          >
            Discard Changes
          </button>
          <button 
            className="px-5 py-2.5 rounded-full bg-brand-button hover:bg-brand-button-hover text-white font-semibold text-sm transition-all duration-300 shadow-sm disabled:opacity-50"
            disabled={isTranslating}
          >
            Finalize Translation
          </button>
        </div>
      </div>

      {/* --- MAIN CONTENT GRID --- */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: SOURCE CONTENT */}
        <div className="xl:col-span-7 flex flex-col bg-slate-50/50 rounded-3xl animate-slide-up border border-slate-100" style={{ animationDelay: '0.1s' }}>
          
          <div className="flex items-center justify-between bg-white rounded-t-3xl p-6 border-b border-slate-100">
            <h3 className="text-brand-navy font-bold text-sm">Source: English</h3>
            <span className="bg-[#BCE4E5] text-[#0C4E5E] text-[10px] font-bold px-3 py-1 rounded-md tracking-widest uppercase">
              {captions.length} CAPTIONS
            </span>
          </div>

          <div className="flex flex-col gap-4 p-6 bg-[#F4F6F8] rounded-b-3xl h-[600px] overflow-y-auto custom-scrollbar">
            {captions.map((caption) => {
              const isActive = caption.id === activeCaptionId;
              
              return (
                <div 
                  key={caption.id}
                  onClick={() => setActiveCaptionId(caption.id)}
                  className={`relative bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300 group cursor-pointer overflow-hidden border ${
                    isActive ? 'border-slate-300 scale-[1.01]' : 'border-transparent hover:border-slate-200'
                  }`}
                >
                  {/* Active Left Border Highlight */}
                  {isActive && (
                    <div className="absolute left-0 top-6 bottom-6 w-1.5 bg-brand-button rounded-r-md"></div>
                  )}

                  <div className="flex items-start justify-between mb-3">
                    <span className={`text-[10px] font-mono font-semibold tracking-wider ${isActive ? 'text-brand-primary' : 'text-slate-400'}`}>
                      {caption.time}
                    </span>
                    <button className="text-slate-400 hover:text-brand-teal transition-colors">
                      <i className="fa-solid fa-ellipsis-vertical text-sm"></i>
                    </button>
                  </div>
                  
                  <p className="text-brand-navy font-medium leading-relaxed text-[15px]">
                    {caption.sourceText}
                  </p>
                  
                  {/* Show a subtle checkmark if this specific caption has been translated */}
                  {caption.translatedText && (
                    <div className="mt-3 text-[11px] font-bold text-brand-success flex items-center gap-1.5">
                      <i className="fa-solid fa-check-double"></i> Translated
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* RIGHT COLUMN: SETTINGS & PREVIEW */}
        <div className="xl:col-span-5 flex flex-col gap-6 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          
          {/* --- Settings Card --- */}
          <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100">
            <div className="flex items-center gap-3 mb-6">
              <i className="fa-solid fa-gear text-brand-primary text-xl"></i>
              <h2 className="text-lg font-bold text-brand-navy">Translation Settings</h2>
            </div>

            <div className="mb-5">
              <label className="block text-[10px] font-bold text-slate-400 tracking-wider uppercase mb-2">
                SOURCE LANGUAGE
              </label>
              <div className="relative">
                <select 
                  value={sourceLang}
                  onChange={(e) => setSourceLang(e.target.value)}
                  className="w-full appearance-none bg-[#F4F6F8] border-none text-brand-navy font-semibold text-sm rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-brand-primary cursor-pointer"
                >
                  <option>English (United States)</option>
                  <option>English (UK)</option>
                </select>
                <i className="fa-solid fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none"></i>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-[10px] font-bold text-slate-400 tracking-wider uppercase mb-2">
                TARGET LANGUAGE
              </label>
              <div className="relative">
                <select 
                  value={targetLang}
                  onChange={(e) => setTargetLang(e.target.value)}
                  className="w-full appearance-none bg-[#F4F6F8] border-none text-brand-navy font-semibold text-sm rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-brand-primary cursor-pointer"
                >
                  <option>Spanish (Latin America)</option>
                  <option>French (France)</option>
                  <option>German</option>
                  <option>Japanese</option>
                </select>
                <i className="fa-solid fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none"></i>
              </div>
            </div>

            <div className="mb-8">
              <label className="block text-[10px] font-bold text-slate-400 tracking-wider uppercase mb-2">
                VOICE TONE
              </label>
              <div className="flex gap-2">
                {['Professional', 'Casual', 'Creative'].map((tone) => (
                  <button
                    key={tone}
                    onClick={() => setActiveTone(tone)}
                    className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all duration-300 ${
                      activeTone === tone 
                        ? 'bg-brand-button text-white shadow-md' 
                        : 'bg-[#F4F6F8] text-brand-navy hover:bg-slate-200'
                    }`}
                  >
                    {tone}
                  </button>
                ))}
              </div>
            </div>

            <button 
              onClick={handleTranslate}
              disabled={isTranslating}
              className="w-full bg-brand-primary hover:bg-[#138A8B] text-white font-bold py-3.5 rounded-xl transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isTranslating ? (
                <><i className="fa-solid fa-circle-notch fa-spin"></i> Translating...</>
              ) : (
                <><i className="fa-solid fa-wand-magic-sparkles"></i> Generate Translation</>
              )}
            </button>
          </div>

          {/* --- Dynamic Preview Card --- */}
          <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100 flex flex-col">
            
            {/* Top Mock Video Area */}
            <div className="relative h-44 bg-gradient-to-br from-slate-500 to-slate-700 w-full flex items-end justify-center p-4">
               {/* Translucent Subtitle Overlay */}
               <div className="bg-[#2D333A]/90 backdrop-blur-md px-6 py-3.5 rounded-xl w-11/12 text-center shadow-lg mb-2">
                  <p className="text-white font-semibold text-sm md:text-base tracking-wide line-clamp-2">
                    {/* Show a snippet of the translation on the video, or placeholder */}
                    {activeCaption?.translatedText 
                      ? activeCaption.translatedText.substring(0, 45) + "..." 
                      : "[ Translation Pending ]"}
                  </p>
               </div>
            </div>

            {/* Bottom Translation Text Area */}
            <div className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <i className="fa-solid fa-language text-brand-primary text-sm"></i>
                <h3 className="font-bold text-brand-navy text-sm">
                  {targetLang.split(' ')[0]} Preview
                </h3>
              </div>
              
              <div className="bg-[#F0F9FA] rounded-2xl p-5 relative min-h-[100px] flex items-center">
                <div className="absolute left-0 top-4 bottom-4 w-1 bg-[#8CCACB] rounded-r-full"></div>
                
                {isTranslating ? (
                  <div className="w-full flex justify-center text-brand-primary opacity-50">
                     <i className="fa-solid fa-ellipsis fa-fade text-2xl"></i>
                  </div>
                ) : (
                  <p className="text-[#4E8182] font-medium text-sm leading-relaxed pl-2">
                    {activeCaption?.translatedText 
                      ? `"${activeCaption.translatedText}"` 
                      : <span className="italic opacity-60">Click "Generate Translation" to preview text here.</span>}
                  </p>
                )}
              </div>
            </div>

          </div>

        </div>
      </div>
      
    </div>
  );
};

export default Translate;