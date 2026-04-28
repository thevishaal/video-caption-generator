import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Athenura from '../../assets/images/Athenura.png';

const Header = () => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const dropdownRef = useRef(null);
  const mobileMenuRef = useRef(null);
  
  const navigate = useNavigate();
  const location = useLocation();

  // Close dropdowns if clicked outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target)) {
        setIsMobileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");
    setIsProfileOpen(false);
    setIsMobileMenuOpen(false);
    navigate("/", { replace: true });
  };

  const handleMenuClick = (path) => {
    setIsProfileOpen(false);
    setIsMobileMenuOpen(false);
    navigate(path);
  };

  const navLinks = [
    { name: 'Home', path: '/dashboard' },
    { name: 'Editor', path: '/editor' },
    { name: 'Exports', path: '/exports' },
  ];

  return (
    <nav className="relative w-full h-[60px] bg-[#F8FAFC] flex items-center justify-between px-4 md:px-8 shadow-sm z-[999]">
      
      {/* Left: Logo */}
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

      {/* 💻 DESKTOP CENTER: Navigation Links */}
      <div className="hidden md:flex items-center gap-8 h-full">
        {navLinks.map((link) => {
          const isActive = location.pathname.startsWith(link.path);
          return (
            <button
              key={link.name}
              onClick={() => handleMenuClick(link.path)}
              className={`relative h-full flex items-center text-[15px] transition-colors duration-300 focus:outline-none ${
                isActive ? 'text-[#0B755F] font-semibold' : 'text-slate-500 hover:text-[#0B755F] font-medium'
              }`}
            >
              {link.name}
              <span className={`absolute bottom-0 left-0 w-full h-[3px] bg-[#0B755F] transform origin-left transition-transform duration-300 ease-out rounded-t-md ${
                isActive ? 'scale-x-100' : 'scale-x-0'
              }`}></span>
            </button>
          );
        })}
      </div>

      {/* 💻 DESKTOP RIGHT: Profile Avatar */}
      <div className="hidden md:flex items-center gap-5">
        <div className="relative ml-1" ref={dropdownRef}>
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="w-10 h-10 rounded-full overflow-hidden border-2 border-transparent hover:border-[#12B79A] transition-all focus:outline-none focus:ring-2 focus:ring-[#12B79A] focus:ring-offset-2 focus:ring-offset-[#F8FAFC] shadow-sm"
          >
            <img 
              src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix&backgroundColor=1f2937&hairColor=2c1b18" 
              alt="User Avatar" 
              className="w-full h-full object-cover bg-gray-800"
            />
          </button>

          {/* Desktop Dropdown */}
          <div className={`absolute right-0 mt-3 w-56 bg-white rounded-xl shadow-2xl py-1.5 border border-slate-200 z-[999] transition-all duration-200 origin-top-right ${
            isProfileOpen ? 'scale-100 opacity-100 visible' : 'scale-95 opacity-0 invisible'
          }`}>
            <button onClick={() => handleMenuClick('/change-password')} className="w-full text-left px-5 py-2.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-[#0B755F] transition-colors flex items-center gap-3 font-medium">
              <i className="fa-solid fa-key w-4 text-center"></i> Change Password
            </button>
            <button onClick={() => handleMenuClick('/profile')} className="w-full text-left px-5 py-2.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-[#0B755F] transition-colors flex items-center gap-3 font-medium">
              <i className="fa-solid fa-user w-4 text-center"></i> My Profile
            </button>
            <div className="border-t border-slate-100 my-1"></div>
            <button onClick={handleLogout} className="w-full text-left px-5 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-3 font-medium">
              <i className="fa-solid fa-arrow-right-from-bracket w-4 text-center"></i> Log out
            </button>
          </div>
        </div>
      </div>

      {/* 📱 MOBILE RIGHT: Hamburger Menu Button */}
      <div className="md:hidden flex items-center">
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="text-slate-600 hover:text-[#0B755F] focus:outline-none p-2"
        >
          {isMobileMenuOpen ? (
             <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
          ) : (
             <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
          )}
        </button>
      </div>

      {/* 📱 MOBILE DROPDOWN MENU */}
      {/* FIXED: Guaranteed solid background using standard Tailwind. 
        Removed animate-in plugin dependencies. 
        Forced high z-index and explicit bg-white.
      */}
      <div 
        ref={mobileMenuRef}
        className={`absolute top-[100%] left-0 w-full bg-white shadow-2xl border-b border-slate-200 md:hidden flex flex-col z-[999] transition-all duration-300 origin-top ${
          isMobileMenuOpen ? 'scale-y-100 opacity-100 visible' : 'scale-y-95 opacity-0 invisible h-0 overflow-hidden'
        }`}
      >
        <div className="flex flex-col py-2 px-4 gap-1">
          <p className="text-[11px] font-bold text-slate-400 tracking-wider uppercase mb-2 mt-2">Navigation</p>
          {navLinks.map((link) => {
            const isActive = location.pathname.startsWith(link.path);
            return (
              <button
                key={link.name}
                onClick={() => handleMenuClick(link.path)}
                className={`text-left px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                  isActive 
                    ? 'bg-[#E5F4F1] text-[#0B755F]' 
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                {link.name}
              </button>
            );
          })}
        </div>

        <div className="border-t border-slate-100 my-1"></div>

        <div className="flex flex-col py-2 px-4 gap-1 mb-2">
          <p className="text-[11px] font-bold text-slate-400 tracking-wider uppercase mb-2 mt-2">Account</p>
          <button 
            onClick={() => handleMenuClick('/change-password')}
            className="text-left px-4 py-3 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-all flex items-center gap-3"
          >
            <i className="fa-solid fa-key w-4 text-center"></i> Change Password
          </button>
          <button 
            onClick={() => handleMenuClick('/profile')}
            className="text-left px-4 py-3 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-all flex items-center gap-3"
          >
            <i className="fa-solid fa-user w-4 text-center"></i> My Profile
          </button>
          <button 
            onClick={handleLogout}
            className="text-left px-4 py-3 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-all flex items-center gap-3"
          >
            <i className="fa-solid fa-arrow-right-from-bracket w-4 text-center"></i> Log out
          </button>
        </div>
      </div>

    </nav>
  );
};

export default Header;