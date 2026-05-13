import React from 'react'

const HowWorksSection = () => {
  return (
    <div>
        <section className="px-6 py-12 md:py-20 lg:px-12 max-w-9xl mx-auto bg-[#eff4ff]" id="how-it-works">
        <div className="mb-10 md:mb-12 text-center md:text-left">
          <h2 className="text-3xl md:text-4xl font-extrabold text-[#111827] mb-4">How it Works</h2>
          <p className="text-slate-500 max-w-2xl mx-auto md:mx-0 text-sm md:text-base">
            From raw footage to published content in three simple movements. <br className="hidden md:block"/>
            No professional training required.
          </p>
        </div>

        {/* Responsive Grid:
            Mobile: 1 column
            Tablet: 2 columns (last item centered or wrapping)
            Desktop: 3 columns
        */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          
          {/* Card 1 */}
          <div className="bg-white rounded-xl p-6 md:p-8 shadow-sm border border-slate-100 relative overflow-hidden group hover:shadow-xl hover:-translate-y-2 transition-all duration-300 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <span className="absolute top-4 right-4 text-5xl md:text-6xl font-bold text-slate-50 transition-transform duration-500 group-hover:scale-110 group-hover:-translate-y-2 group-hover:text-[#c5cee1]">01</span>
            <div className="w-12 h-12 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-500 mb-6 border border-indigo-100 transition-colors duration-300 group-hover:bg-indigo-500 group-hover:text-white text-xl">
              <i className="fa-solid fa-cloud-arrow-up"></i>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3 relative z-10 transition-colors group-hover:text-indigo-600">Upload Video</h3>
            <p className="text-slate-500 text-sm leading-relaxed relative z-10">
              Drag and drop your MP4, MOV, or AVI files into our Drop Chamber. High-speed ingestion for any resolution.
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-white rounded-xl p-6 md:p-8 shadow-sm border border-slate-100 relative overflow-hidden group hover:shadow-xl hover:-translate-y-2 transition-all duration-300 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <span className="absolute top-4 right-4 text-5xl md:text-6xl font-bold text-slate-50 transition-transform duration-500 group-hover:scale-110 group-hover:-translate-y-2 group-hover:text-[#c5cee1]">02</span>
            <div className="w-12 h-12 rounded-lg bg-teal-50 flex items-center justify-center text-teal-500 mb-6 border border-teal-100 transition-colors duration-300 group-hover:bg-teal-500 group-hover:text-white text-xl">
              <i className="fa-solid fa-file-waveform"></i>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3 relative z-10 transition-colors group-hover:text-teal-600">AI Transcribe</h3>
            <p className="text-slate-500 text-sm leading-relaxed relative z-10">
              Our neural engine analyzes your audio and generates perfectly timed captions in over 60 languages instantly.
            </p>
          </div>

          {/* Card 3 (Centers on tablet if grid-cols-2) */}
          <div className="md:col-span-2 lg:col-span-1 bg-white rounded-xl p-6 md:p-8 shadow-sm border border-slate-100 relative overflow-hidden group hover:shadow-xl hover:-translate-y-2 transition-all duration-300 animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <span className="absolute top-4 right-4 text-5xl md:text-6xl font-bold text-slate-50 transition-transform duration-500 group-hover:scale-110 group-hover:-translate-y-2 group-hover:text-[#c5cee1]">03</span>
            <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center text-blue-500 mb-6 border border-blue-100 transition-colors duration-300 group-hover:bg-blue-500 group-hover:text-white text-xl">
              <i className="fa-solid fa-download"></i>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3 relative z-10 transition-colors group-hover:text-blue-600">Export & Go</h3>
            <p className="text-slate-500 text-sm leading-relaxed relative z-10 lg:max-w-none md:max-w-md">
              Download as SRT, VTT, or burn them directly into your video with customizable editorial styles.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}

export default HowWorksSection