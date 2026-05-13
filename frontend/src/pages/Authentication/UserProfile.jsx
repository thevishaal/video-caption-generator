import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';

const UserProfile = ({ user }) => {
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false); // New: Logout loading state
    const dropdownRef = useRef(null);
    const navigate = useNavigate();

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsProfileOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // --- LOGOUT LOGIC (Optimized) ---
    const handleLogout = async (e) => {
        if (e) e.preventDefault();
        
        // Agar pehle se logout ho raha hai toh dubara click block karein
        if (isLoggingOut) return;

        setIsLoggingOut(true);
        const refreshToken = localStorage.getItem("refresh_token");
        const accessToken = localStorage.getItem("token");

        try {
            // 1. Backend call (Optional but good practice)
            if (refreshToken && accessToken) {
                await axios.post(
                    "http://127.0.0.1:8000/api/auth/logout/",
                    { refresh: refreshToken }, // Backend key "refresh" ho sakti hai, check karein
                    {
                        headers: { Authorization: `Bearer ${accessToken}` },
                    }
                );
            }
            toast.success("Logged out successfully");
        } catch (error) {
            console.error("Logout failed on server:", error.response?.data || error.message);
            // Server fail ho tab bhi local clean-up zaroori hai
        } finally {
            // 2. Clear All Storage
            localStorage.removeItem("token");
            localStorage.removeItem("refresh_token");
            localStorage.removeItem("user");
            
            setIsProfileOpen(false);
            setIsLoggingOut(false);
            
            // 3. Final Redirect
            navigate("/login", { replace: true });
        }
    };

    return (
        <nav className="w-full flex items-center justify-between py-4 px-6 bg-[#0A0F16] border-b border-white/5 relative z-50">
            <div className="flex items-center">
                <button 
                    onClick={() => navigate("/dashboard")} 
                    className="text-white font-bold text-xl tracking-tight hover:text-cyan-400 transition-colors"
                >
                    ATHENURA
                </button>
            </div>

            <div className="relative" ref={dropdownRef}>
                <button
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex items-center gap-3 p-1 rounded-full hover:bg-white/5 transition-all duration-200 focus:outline-none"
                >
                    <div className="hidden md:flex flex-col text-right">
                        <span className="text-sm font-semibold text-white leading-none">
                            {user?.fullName || "Loading..."}
                        </span>
                        <span className="text-[10px] text-gray-500 mt-1 uppercase tracking-wider">
                            {user?.email || "Account Settings"}
                        </span>
                    </div>

                    <div className="relative">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold uppercase shadow-lg group-hover:border-cyan-400 transition-all">
                            {user?.first_name?.[0] || user?.fullName?.[0] || "U"}
                        </div>
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-[#0A0F16] rounded-full shadow-sm"></span>
                    </div>
                </button>

                {isProfileOpen && (
                    <div className="absolute right-0 mt-3 w-60 rounded-2xl bg-[#131A26] border border-white/10 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-2 space-y-1">
                            {/* MY PROFILE */}
                            <button
                                onClick={() => { navigate("/me"); setIsProfileOpen(false); }}
                                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:bg-cyan-500/10 hover:text-cyan-400 rounded-xl transition-all"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                My Profile
                            </button>

                            {/* CHANGE PASSWORD */}
                            <button
                                onClick={() => { navigate("/change-password"); setIsProfileOpen(false); }}
                                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:bg-cyan-500/10 hover:text-cyan-400 rounded-xl transition-all"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m-3 4h.01M19 12a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                Change Password
                            </button>

                            <div className="h-px bg-white/5 mx-2 my-1"></div>

                            {/* LOGOUT */}
                            <button
                                onClick={handleLogout}
                                disabled={isLoggingOut}
                                className={`w-full flex items-center gap-3 px-4 py-3 text-sm rounded-xl transition-all ${
                                    isLoggingOut 
                                    ? "bg-red-500/10 text-red-400 cursor-not-allowed" 
                                    : "text-red-400 hover:bg-red-500/10"
                                }`}
                            >
                                {isLoggingOut ? (
                                    <div className="w-4 h-4 border-2 border-red-400 border-t-transparent animate-spin rounded-full"></div>
                                ) : (
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                    </svg>
                                )}
                                {isLoggingOut ? "Logging out..." : "Logout"}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </nav>
    );
};

export default UserProfile;