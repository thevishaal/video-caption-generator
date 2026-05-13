import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import UserProfile from "./UserProfile"; 

const MyProfile = () => {
  const navigate = useNavigate();
  
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state for editable fields
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
  });

  useEffect(() => {
    const fetchUserData = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        toast.warn("Please login to access your profile.");
        navigate("/login", { replace: true });
        return;
      }

      try {
        const response = await axios.get("http://127.0.0.1:8000/api/auth/me/", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.data.success) {
          const rawData = response.data.data;
          
          const formattedUser = {
            ...rawData,
            fullName: rawData.full_name || 
                      (rawData.first_name 
                        ? `${rawData.first_name} ${rawData.last_name || ""}`.trim() 
                        : "User")
          };

          setUser(formattedUser);
          localStorage.setItem("user", JSON.stringify(formattedUser));

          // Initialize form data with fetched user details
          setFormData({
            first_name: rawData.first_name || "",
            last_name: rawData.last_name || "",
          });
        }

      } catch (error) {
        console.error("Profile Fetch Error:", error.response || error);
        if (error.response?.status === 401 || error.response?.status === 403) {
          toast.error("Session expired. Please login again.");
          localStorage.removeItem("token");
          localStorage.removeItem("refresh_token");
          localStorage.removeItem("user");
          navigate("/login", { replace: true });
        } else {
          const savedUser = localStorage.getItem("user");
          if (savedUser) {
            const parsedUser = JSON.parse(savedUser);
            setUser(parsedUser);
            setFormData({
              first_name: parsedUser.first_name || "",
              last_name: parsedUser.last_name || "",
            });
          } else {
            toast.error("Unable to load profile.");
          }
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    const token = localStorage.getItem("token");

    try {
      // NOTE: Update this endpoint to match your backend route for updating user data
      const response = await axios.put(
        "http://127.0.0.1:8000/api/auth/profile/update/", 
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      toast.success("Profile updated successfully! ✨");
      
      // Update local user state with new names
      const updatedUser = { 
        ...user, 
        first_name: formData.first_name, 
        last_name: formData.last_name,
        fullName: `${formData.first_name} ${formData.last_name}`.trim()
      };
      
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));

    } catch (error) {
      const errorMsg = error.response?.data?.message || "Failed to update profile";
      toast.error(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div>
          <p className="text-teal-600 font-bold animate-pulse text-sm tracking-widest uppercase">Syncing Workspace...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[var(--color-bg-app)] text-[var(--color-brand-navy)] font-sans relative overflow-hidden">
      <ToastContainer position="top-center" autoClose={2000} theme="light" />
      
     

      {/* Subtle Background Glow */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-teal-200/20 rounded-full mix-blend-multiply filter blur-[120px] pointer-events-none -translate-y-1/2 translate-x-1/3"></div>

      <main className="max-w-5xl mx-auto p-6 md:p-12 relative z-10 animate-fade-in-up">
        
        <button 
          onClick={() => navigate("/dashboard")}
          className="text-slate-400 hover:text-[var(--color-brand-primary)] text-sm font-semibold flex items-center gap-2 mb-8 transition-colors group w-fit"
        >
          <svg className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Dashboard
        </button>

        <div className="mb-10 text-center md:text-left">
          <h1 className="text-4xl font-black tracking-tight mb-2 text-slate-900">My Profile</h1>
          <p className="text-[var(--color-brand-text)]">Manage your personal information and security settings.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          
          {/* Avatar Card */}
          <div className="md:col-span-4">
            <div className="bg-white rounded-[2rem] border border-slate-100 p-8 flex flex-col items-center shadow-premium relative overflow-hidden">
              {/* Decorative top header in card */}
              <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-br from-[var(--color-bg-light)] to-white"></div>
              
              <div className="relative group mb-4 mt-8 z-10">
                <div className="w-28 h-28 rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center text-4xl font-bold text-white shadow-xl shadow-teal-500/20 group-hover:scale-105 transition-transform uppercase border-4 border-white">
                  {user?.first_name?.[0] || user?.email?.[0] || "U"}
                </div>
                <div className="absolute bottom-2 right-2 w-6 h-6 bg-[var(--color-brand-success)] border-4 border-white rounded-full" title="Online"></div>
              </div>
              
              <h3 className="text-xl font-bold truncate w-full text-center text-slate-800 z-10">
                {user?.fullName || "User Name"}
              </h3>
              <p className="text-teal-600 font-bold text-[10px] mt-2 px-3 py-1 bg-teal-50 rounded-full uppercase tracking-widest z-10">
                Workspace Member
              </p>
            </div>
          </div>

          {/* Details Form Card */}
          <div className="md:col-span-8">
            <div className="bg-white rounded-[2rem] border border-slate-100 p-8 md:p-10 shadow-premium">
              <h4 className="text-lg font-bold mb-8 flex items-center gap-3 text-slate-800">
                <span className="w-2.5 h-2.5 bg-[var(--color-brand-primary)] rounded-full shadow-[0_0_8px_var(--color-brand-ring)]"></span>
                Personal Information
              </h4>

              <form onSubmit={handleUpdateProfile} className="space-y-6">
                
                {/* Editable Name Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400 block ml-1">First Name</label>
                    <input
                      type="text"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleInputChange}
                      className="w-full px-5 py-3.5 rounded-2xl bg-[var(--color-bg-panel)] border border-slate-100 focus:bg-white focus:border-[var(--color-brand-primary)] focus:ring-4 focus:ring-[var(--color-brand-ring)]/10 outline-none transition-all text-slate-700 font-medium"
                      placeholder="Enter your first name"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400 block ml-1">Last Name</label>
                    <input
                      type="text"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleInputChange}
                      className="w-full px-5 py-3.5 rounded-2xl bg-[var(--color-bg-panel)] border border-slate-100 focus:bg-white focus:border-[var(--color-brand-primary)] focus:ring-4 focus:ring-[var(--color-brand-ring)]/10 outline-none transition-all text-slate-700 font-medium"
                      placeholder="Enter your last name"
                    />
                  </div>
                </div>

                {/* Disabled Email Field */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400 block ml-1 flex justify-between items-center">
                    Email Address
                    <span className="text-[9px] bg-slate-100 text-slate-400 px-2 py-0.5 rounded uppercase">Non-editable</span>
                  </label>
                  <input
                    type="email"
                    disabled
                    value={user?.email || "No Email Found"}
                    className="w-full px-5 py-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-slate-400 cursor-not-allowed font-medium select-none"
                  />
                  <p className="text-xs text-slate-400 ml-1 mt-1">To change your email, please contact workspace administration.</p>
                </div>

                {/* Action Buttons */}
                <div className="pt-8 mt-8 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
                  <button 
                    type="button"
                    onClick={() => navigate("/change-password")}
                    className="w-full sm:w-auto px-6 py-3.5 text-sm font-bold text-slate-500 hover:text-slate-800 bg-white border border-slate-200 hover:bg-slate-50 rounded-2xl transition-colors flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Change Password
                  </button>

                  <button 
                    type="submit"
                    disabled={saving}
                    className="w-full sm:w-auto px-8 py-3.5 bg-[var(--color-brand-button)] hover:bg-[var(--color-brand-button-hover)] text-white rounded-2xl text-sm font-bold shadow-premium hover:shadow-premium-hover transition-all active:scale-[0.98] flex items-center justify-center gap-2 min-w-[160px]"
                  >
                    {saving ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      "Save Changes"
                    )}
                  </button>
                </div>

              </form>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
};

export default MyProfile;