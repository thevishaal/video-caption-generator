import React from 'react'
import CATSection from './CATSection'
import HeroSection from './HeroSection'
import HowWorksSection from './HowWorksSection'
import BuiltForPrecisionSection from './BuiltForPrecisionSection'


const Landing = () => {
  return (
    <div className="bg-[#F8FAFC] font-sans overflow-hidden pb-10 lg:pb-20">
        <HeroSection />
        <HowWorksSection />
        <BuiltForPrecisionSection />
        <CATSection />
    </div>
  )
}

export default Landing