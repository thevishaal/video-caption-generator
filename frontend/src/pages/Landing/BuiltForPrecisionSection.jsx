import React from 'react'

const BuiltForPrecisionSection = () => {
  return (
    <div>
        <section className="px-6 py-12 md:py-20 lg:px-12 max-w-7xl mx-auto" id="features">
        <div className="text-center mb-10 md:mb-12">
          <h2 className="text-3xl md:text-4xl font-extrabold text-[#111827]">Built for Precision</h2>
        </div>

        {/* Responsive Bento Grid:
            Mobile: 1 column
            Tablet: 2 columns (custom spanning)
            Desktop: 4 columns (custom spanning)
        */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 auto-rows-min gap-4 lg:gap-6">
          
          {/* Box 1: AI Pulse (Wide on tablet/desktop) */}
          <div className="md:col-span-2 lg:col-span-2 bg-[#00c8b3] rounded-2xl p-6 md:p-8 relative overflow-hidden flex flex-col justify-end text-white min-h-[200px] md:min-h-[250px] shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group cursor-pointer animate-slide-up">
            <div className="absolute top-6 right-6 text-6xl md:text-8xl text-white/20 transition-transform duration-500 group-hover:scale-125 group-hover:rotate-12 group-hover:text-white/30">
              <i className="fa-solid fa-bolt"></i>
            </div>
            <h3 className="text-xl md:text-2xl font-bold mb-2 relative z-10">AI-Powered Pulse</h3>
            <p className="text-white/90 text-sm max-w-sm relative z-10">
              Industry-leading speech recognition that understands nuance, accents, and technical terminology.
            </p>
          </div>

          {/* Box 2: Accuracy (Square) */}
          <div className="md:col-span-1 lg:col-span-1 bg-white rounded-2xl p-6 md:p-8 flex flex-col items-center justify-center text-center min-h-[200px] md:min-h-[250px] shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group cursor-pointer animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <div className="w-14 h-14 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 mb-4 shadow-sm text-2xl transition-transform duration-500 group-hover:scale-110 group-hover:rotate-12">
              <i className="fa-solid fa-crosshairs"></i>
            </div>
            <h3 className="text-lg md:text-xl font-bold text-slate-900 mb-1">99.9% Accuracy</h3>
            <p className="text-slate-500 text-sm">Error-free captions, every time.</p>
          </div>

          {/* Box 3: Universal Export (Tall on desktop, normal on mobile, tall on tablet) */}
          <div className="md:col-span-1 md:row-span-2 lg:col-span-1 lg:row-span-2 bg-[#DCE7F7] rounded-2xl p-6 md:p-8 flex flex-col min-h-[300px] md:min-h-[520px] shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group cursor-pointer animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <h3 className="text-lg md:text-xl font-bold text-slate-900 mb-6">Universal Export</h3>
            <ul className="space-y-4 mb-8">
              <li className="flex items-center gap-3 p-2 rounded-lg transition-colors hover:bg-white/50">
                <span className="bg-white text-[10px] md:text-xs font-bold px-2 py-1 rounded shadow-sm text-slate-700">SRT</span>
                <span className="text-sm font-medium text-slate-700">Subtitle SubRip</span>
              </li>
              <li className="flex items-center gap-3 p-2 rounded-lg transition-colors hover:bg-white/50">
                <span className="bg-white text-[10px] md:text-xs font-bold px-2 py-1 rounded shadow-sm text-slate-700">VTT</span>
                <span className="text-sm font-medium text-slate-700">Web Video Text</span>
              </li>
              <li className="flex items-center gap-3 p-2 rounded-lg transition-colors hover:bg-white/50">
                <span className="bg-white text-[10px] md:text-xs font-bold px-2 py-1 rounded shadow-sm text-slate-700">TXT</span>
                <span className="text-sm font-medium text-slate-700">Plain Transcript</span>
              </li>
            </ul>
            {/* Gradient decoration box at the bottom */}
            <div className="mt-auto w-full h-32 md:h-40 rounded-xl bg-gradient-to-tr from-[#0F4C5C] to-[#0bc2c4] shadow-inner transition-transform duration-500 group-hover:scale-105 flex items-center justify-center overflow-hidden">
               <i className="fa-solid fa-file-export text-4xl text-white/20 group-hover:text-white/40 transition-colors"></i>
            </div>
          </div>

          {/* Box 4: Team Workspaces (Square) */}
          <div className="md:col-span-1 lg:col-span-1 bg-white rounded-2xl p-6 md:p-8 flex flex-col justify-end min-h-[200px] md:min-h-[250px] shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group cursor-pointer animate-slide-up" style={{ animationDelay: '0.3s' }}>
             <div className="absolute top-6 left-6 text-indigo-500 bg-indigo-50 w-12 h-12 flex items-center justify-center rounded-lg transition-transform duration-500 group-hover:scale-110">
               <i className="fa-solid fa-users text-xl"></i>
             </div>
             <div className="relative z-10 mt-16">
               <h3 className="text-lg md:text-xl font-bold text-slate-900 mb-2">Team Workspaces</h3>
               <p className="text-slate-500 text-sm">Collaborate in real-time with your editing team.</p>
             </div>
             {/* Decorative background shape */}
             <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-indigo-50 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          </div>

          {/* Box 5: Editorial Presets (Wide on tablet/desktop) */}
          <div className="md:col-span-2 lg:col-span-2 bg-[#203047] rounded-2xl p-6 md:p-8 flex flex-col sm:flex-row justify-between sm:items-end gap-6 min-h-[200px] md:min-h-[250px] shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group cursor-pointer animate-slide-up" style={{ animationDelay: '0.4s' }}>
            <div className="text-white max-w-sm">
              <div className="mb-4 text-teal-400 text-2xl transition-transform duration-500 group-hover:-translate-y-1">
                <i className="fa-solid fa-wand-magic-sparkles"></i>
              </div>
              <h3 className="text-xl md:text-2xl font-bold mb-2">Editorial Style Presets</h3>
              <p className="text-slate-300 text-sm">
                Apply cinematic typography styles used by professional studios with a single click.
              </p>
            </div>
            <div className="flex gap-2 pb-2">
            {/* Colored circle accents - simulating theme choices */}
              <div className="w-8 h-8 rounded-lg bg-indigo-600 border-2 border-white/20 shadow-lg transition-transform duration-300 hover:scale-125 cursor-pointer"></div>
              <div className="w-8 h-8 rounded-lg bg-orange-600 border-2 border-white/20 shadow-lg transition-transform duration-300 hover:scale-125 cursor-pointer"></div>
              <div className="w-8 h-8 rounded-lg bg-teal-500 border-2 border-white/20 shadow-lg transition-transform duration-300 hover:scale-125 cursor-pointer"></div>
            </div>
          </div>

        </div>
      </section>
    </div>
  )
}

export default BuiltForPrecisionSection