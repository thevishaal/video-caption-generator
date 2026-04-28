import React from 'react'

const CATSection = () => {
  return (
    <div>
        <section className="px-6 py-10 md:py-16 lg:px-12 max-w-7xl mx-auto">
        <div className="bg-gradient-to-r from-[#00c3d0] to-[#0099a3] rounded-3xl p-8 md:p-16 lg:p-20 text-center flex flex-col items-center justify-center text-white shadow-2xl relative overflow-hidden group">
          
          {/* Decorative background elements */}
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-0">
             <div className="absolute top-10 left-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
             <div className="absolute bottom-10 right-10 w-40 h-40 bg-teal-900/30 rounded-full blur-3xl"></div>
          </div>

          <div className="relative z-10 animate-slide-up">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold mb-4 md:mb-6 tracking-tight">
              Ready to animate your workflow?
            </h2>
            <p className="text-white/90 mb-8 md:mb-10 max-w-xl mx-auto text-sm md:text-lg leading-relaxed">
              Join thousands of creators using The Kinetic Editor to scale their video production today.
            </p>
            <button className="bg-white text-[#00c3d0] cursor-pointer font-bold px-8 py-4 rounded-lg shadow-xl hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 flex items-center justify-center gap-3 mx-auto">
              Get Started For Free
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}

export default CATSection