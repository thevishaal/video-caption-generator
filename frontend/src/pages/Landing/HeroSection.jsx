import React from 'react'
import { useNavigate } from 'react-router-dom'

const HeroSection = () => {
  const navigate = useNavigate()

  return (
    <div>
        <section className="px-6 py-10 md:py-16 lg:py-24 lg:px-12 max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-10 lg:gap-16">
        
        {/* Left Column: Text & CTA */}
        <div className="flex-1 space-y-6 lg:space-y-8 z-10 animate-slide-in-left text-center lg:text-left mt-8 lg:mt-0">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-[#111827] leading-[1.1] tracking-tight">
            Automate your <br className="hidden md:block" />
            <span className="text-[#088e9d] relative inline-block">
              subtitles
              <span className="absolute bottom-0 left-0 w-full h-2 md:h-3 bg-[#088e9d]/20 -z-10 -rotate-2"></span>
            </span> in <br className="hidden lg:block"/>
            seconds.
          </h1>
          
          <p className="text-slate-600 text-base md:text-xl max-w-lg mx-auto lg:mx-0 leading-relaxed">
            The Kinetic Editor uses advanced AI to generate precise,
            professional-grade captions. Stop manual transcribing and start
            focusing on your creative vision.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
            <button onClick={() => navigate('/login')} className="w-full sm:w-auto bg-[#0F4C5C] hover:bg-[#0A3642] text-white px-8 py-3.5 rounded-md font-semibold flex items-center justify-center gap-3 transition-all duration-300 hover:-translate-y-1 shadow-lg hover:shadow-[#0F4C5C]/40 group">
              Get Started 
              <i className="fa-solid fa-arrow-right transition-transform group-hover:translate-x-1"></i>
            </button>
            <button className="w-full sm:w-auto bg-blue-100/80 hover:bg-blue-200 text-blue-900 px-8 py-3.5 rounded-md font-semibold transition-all duration-300 hover:-translate-y-1 flex items-center justify-center gap-2">
              <i className="fa-regular fa-circle-play"></i> Watch Demo
            </button>
          </div>

          {/* Social Proof */}
          <div className="flex items-center justify-center lg:justify-start gap-4 pt-6 animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <div className="flex -space-x-3">
              <img src="https://i.pravatar.cc/100?img=1" alt="User 1" className="w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-white shadow-sm" />
              <img src="https://i.pravatar.cc/100?img=2" alt="User 2" className="w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-white shadow-sm" />
              <img src="https://i.pravatar.cc/100?img=3" alt="User 3" className="w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-white shadow-sm" />
            </div>
            <span className="text-xs md:text-sm font-medium text-slate-500">
              Trusted by 2,000+ content creators
            </span>
          </div>
        </div>

        {/* Right Column: Video/App Mockup */}
        <div className="flex-1 relative w-full max-w-2xl mx-auto animate-slide-up mt-10 lg:mt-0" style={{ animationDelay: '0.2s' }}>
          
          {/* Floating Accuracy Badge */}
          <div className="absolute -top-4 -right-2 md:-top-6 md:-right-6 lg:-right-8 bg-white shadow-xl rounded-xl p-3 md:p-4 flex items-center gap-2 md:gap-3 z-20 animate-bounce" style={{ animationDuration: '3s' }}>
            <div className="bg-orange-100 p-1.5 md:p-2 rounded-lg text-orange-500 flex items-center justify-center">
              <i className="fa-solid fa-crosshairs text-sm md:text-base"></i>
            </div>
            <div>
              <div className="text-[8px] md:text-[10px] text-slate-400 font-bold tracking-wider uppercase">Accuracy</div>
              <div className="text-blue-900 font-black text-lg md:text-xl leading-none">99.8%</div>
            </div>
          </div>

          {/* Main Mockup Container */}
          <div className="bg-white rounded-2xl shadow-2xl p-2 md:p-4 border border-slate-100 transition-transform duration-500 hover:-translate-y-2 hover:shadow-3xl">
            {/* Browser Header */}
            <div className="flex items-center gap-1.5 md:gap-2 mb-3 md:mb-4 px-2">
              <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-slate-200"></div>
              <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-slate-200"></div>
              <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-slate-200"></div>
            </div>

            {/* Video Player Area */}
            <div className="bg-[#83979D] rounded-lg aspect-[16/10] relative overflow-hidden group cursor-pointer">
              
              {/* Play Button */}
              <div className="absolute inset-0 flex items-center justify-center bg-black/10 transition-colors duration-300 group-hover:bg-black/30">
                <div className="w-12 h-12 md:w-16 md:h-16 bg-white/30 backdrop-blur-md rounded-lg flex items-center justify-center transition-transform duration-300 group-hover:scale-110 text-white text-xl md:text-2xl shadow-lg">
                  <i className="fa-solid fa-play ml-1"></i>
                </div>
              </div>

              {/* Subtitle Box */}
              <div className="absolute bottom-8 md:bottom-10 left-1/2 -translate-x-1/2 w-[90%] md:w-[85%] bg-[#0F4C5C]/95 backdrop-blur-sm text-white px-4 md:px-6 py-2 md:py-3 rounded-md text-xs md:text-sm lg:text-base text-center font-medium shadow-lg transition-transform duration-300 group-hover:-translate-y-2">
                [AI-Generated] Automating subtitles has never been this kinetic.
              </div>

              {/* Timeline */}
              <div className="absolute bottom-2 md:bottom-4 left-0 w-full px-4 md:px-6 flex items-center gap-2 md:gap-3">
                <span className="text-white/90 text-[10px] md:text-xs font-mono">0:12</span>
                <div className="flex-1 h-1 md:h-1.5 bg-white/30 rounded-full overflow-hidden relative">
                   <div className="absolute top-0 left-0 h-full w-[40%] bg-teal-400 rounded-full relative transition-all duration-1000">
                     <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-2 h-2 md:w-3 md:h-3 bg-white rounded-full shadow"></div>
                   </div>
                </div>
                <span className="text-white/90 text-[10px] md:text-xs font-mono">1:45</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default HeroSection