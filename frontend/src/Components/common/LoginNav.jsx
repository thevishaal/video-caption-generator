import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Athenura from '../../assets/images/Athenura.png';

const LoginNav = () => {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Landing page navigation links (example)
  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Features', path: '/#features' },
    { name: 'How it Works', path: '/#how-it-works' },
    
  ];

  return (
    <>
      <nav className="fixed top-0 left-0 w-full z-50 bg-white/80 backdrop-blur-lg border-b border-slate-200/60 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 md:px-12 flex items-center justify-between h-20">
          
          {/* Left: Brand / Logo */}
          <div 
            className="flex items-center gap-3 cursor-pointer group w-40 h-auto z-100" 
            onClick={() => navigate('/')}
          >
            {/* Custom Premium Logo */}
           <img 
          src={Athenura} 
          alt="Athenura." 
          className="w-auto h-auto" 
        />
          </div>

          {/* Center: Marketing Links (Hidden on Mobile) */}
          <div className="hidden md:flex items-center gap-10">
            {navLinks.map((link) => (
             <a
              key={link.name}
              onClick={(e) => {
                e.preventDefault();
                navigate(link.path);
              }}
              className="text-[15px] font-semibold text-slate-500 hover:text-[#0F172A] transition-colors duration-200 cursor-pointer"
            >
              {link.name}
            </a>
            ))}
          </div>

          {/* Right: Actions (Log In & Get Started) */}
          <div className="hidden md:flex items-center gap-5">
           
            
            {/* Primary Call to Action */}
            <button onClick={() => navigate('/login')} className="w-full sm:w-auto bg-[#0F4C5C] hover:bg-[#0A3642] text-white px-5 py-2 rounded-md font-semibold flex items-center justify-center gap-3 transition-all duration-300">
            
              Get Started
              <i className="fa-solid fa-arrow-right transition-transform group-hover:translate-x-1"></i>
            </button>
          </div>

          {/* Mobile Menu Toggle */}
          <div className="md:hidden flex items-center">
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-slate-600 hover:text-[#0F172A] focus:outline-none"
            >
              {isMobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8h16M4 16h16"/></svg>
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-white pt-20 px-6 md:hidden animate-in slide-in-from-top duration-300">
          <div className="flex flex-col gap-6 mt-8">
            {navLinks.map((link) => (
             <a
                key={link.name}
                onClick={(e) => {
                  e.preventDefault();
                  navigate(link.path);
                }}
                className="text-[15px] font-semibold text-slate-500 hover:text-[#0F172A] transition-colors duration-200 cursor-pointer"
              >
                {link.name}
              </a>
            ))}
            
            <div className="flex flex-col gap-4 mt-8">
              
              <button 
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  navigate('/login');
                }}
                className="w-full py-4 text-lg font-bold text-white bg-[#0F172A] rounded-xl shadow-lg"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default LoginNav;