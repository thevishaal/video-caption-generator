import React,{ useEffect } from "react";
import { useLocation } from "react-router-dom";
import CATSection from './CATSection'
import HeroSection from './HeroSection'
import HowWorksSection from './HowWorksSection'
import BuiltForPrecisionSection from './BuiltForPrecisionSection'


const Landing = () => {

    const location = useLocation();

  useEffect(() => {
    if (location.hash) {
      const el = document.querySelector(location.hash);
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, [location]);
  return (
    <div className="bg-[#F8FAFC] font-sans overflow-hidden pb-10 lg:pb-20">
        <HeroSection />
        <div id="how-it-works">
        <HowWorksSection />
        </div>
        <div id="features">
        <BuiltForPrecisionSection />
        </div>
        <CATSection />
    </div>
  )
}

export default Landing