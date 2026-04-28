import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from '../Components/common/Header';

const Layout = () => {
  return (
    // 1. Replaced <> with a div that fills the whole screen vertically
    <div className="flex flex-col min-h-screen bg-[#FAFCFF] overflow-hidden">
      
      
      <Header />

      {/* 3. 'flex-1' automatically calculates the remaining height! No 90% needed. */}
      <main className="flex-1 w-full relative z-0 overflow-y-auto">
        <Outlet />
      </main>
      
    </div> // 4. Properly closed the tag!
  );
};

export default Layout;