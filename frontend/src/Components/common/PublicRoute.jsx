import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import LoginNav from './LoginNav'; // Make sure LoginNav is in the same folder!

const PublicRoute = () => {
  const isAuthenticated = !!localStorage.getItem('token');

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <>
      <LoginNav />
      <div className="pt-20"> 
        <Outlet />
      </div>
    </>
  );
};

export default PublicRoute;