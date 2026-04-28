import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';

const Sidebar = () => {
  const location = useLocation();

  const navItems = [
    { id: 'upload', label: 'UPLOAD', path: '/editor/upload', icon: 'fa-solid fa-cloud-arrow-up' },
    { id: 'captions', label: 'CAPTIONS', path: '/editor/upload/captions', icon: 'fa-solid fa-closed-captioning' },
    { id: 'translate', label: 'TRANSLATE', path: '/editor/upload/captions/translate', icon: 'fa-solid fa-language' },
    { id: 'preview', label: 'PREVIEW', path: '/editor/upload/captions/translate/preview', icon: 'fa-regular fa-eye' },
    { id: 'export', label: 'EXPORT', path: '/editor/upload/captions/translate/preview/export', icon: 'fa-solid fa-arrow-up-from-bracket' },
  ];

  return (
    <aside className="w-full h-full bg-[#F8FAFC] border-r border-slate-200 flex flex-col py-6 lg:py-8 px-2 lg:px-4 font-sans transition-all duration-300 z-50">
      
      {/* --- HEADER SECTION --- */}
      <div className="mb-8 flex flex-col items-center lg:items-start lg:px-4">
        {/* Mobile/Tablet: Show a small brand icon instead of text */}
        <div className="w-10 h-10 rounded-xl bg-[#128189] text-white flex items-center justify-center lg:hidden shadow-md">
          <i className="fa-solid fa-layer-group text-lg"></i>
        </div>
        
        {/* Desktop: Show full text labels */}
        <div className="hidden lg:block">
          <h2 className="text-[13px] font-bold text-[#128189] tracking-widest uppercase mb-1">
            Workflow
          </h2>
          <p className="text-xs text-slate-400 font-medium">
            Current Progress
          </p>
        </div>
      </div>

      {/* --- NAVIGATION LINKS --- */}
      <nav className="flex flex-col gap-3 items-center lg:items-stretch">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          
          return (
            <NavLink
              key={item.id}
              to={item.path}
              title={item.label} // Shows tooltip on hover for icon-only mode
              className={`flex items-center justify-center lg:justify-start lg:gap-3 p-3 lg:px-4 lg:py-3 rounded-xl transition-all duration-200 font-bold text-[13px] tracking-wide ${
                isActive 
                  ? 'bg-[#D6EBEF] text-[#128189] shadow-sm scale-105 lg:scale-100' // Active state
                  : 'text-slate-400 hover:bg-slate-100 hover:text-slate-800' // Inactive state
              }`}
            >
              {/* Icon Container (Fixed width to keep text aligned on desktop) */}
              <div className="w-6 h-6 flex items-center justify-center text-xl lg:text-lg">
                <i className={item.icon}></i>
              </div>
              
              {/* Text Label (Hidden on Mobile/Tablet, visible on lg screens) */}
              <span className="hidden lg:block">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
      
    </aside>
  );
};

export default Sidebar;