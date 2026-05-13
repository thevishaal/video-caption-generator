import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../../Components/common/Sidebar';

const Editor = () => {
  return (
   
    <div className="flex h-screen overflow-hidden">
  
  {/* Sidebar */}
  <div className="w-[20%] bg-gray-100">
    <Sidebar />
  </div>

  {/* Main container */}
  <main className="w-full md:w-[80%] h-full overflow-y-auto">
    <Outlet />
  </main>

</div>
  );
};

export default Editor;