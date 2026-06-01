import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { showToast } from "../../utils/toastUtils";

const ChangePassword = () => {
  const navigate = useNavigate();
  
  // Logic State
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    current_password: "",
    new_password: "",
    confirmPassword: "",
  });

  // UI State for Password Visibility
  const [showPwd, setShowPwd] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const toggleShow = (field) => {
    setShowPwd((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.new_password !== formData.confirmPassword) {
      return showToast.error("New passwords do not match!");
    }

    setLoading(true);
    const token = localStorage.getItem("token");

    try {
      const response = await axios.post(
        "http://127.0.0.1:8000/api/auth/change-password/",
        {
          current_password: formData.current_password,
          new_password: formData.new_password,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 200 || response.data.success) {
        showToast.success("Password updated successfully! 🚀");
        
        setTimeout(() => {
          navigate("/dashboard");
        }, 2000);
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || "Error updating password";
      showToast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Reusable SVG Icons
  const EyeIcon = () => (
    <svg className="w-5 h-5 text-slate-400 hover:text-[var(--color-brand-primary)] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );

  const EyeOffIcon = () => (
    <svg className="w-5 h-5 text-slate-400 hover:text-[var(--color-brand-primary)] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  );

  return (
    <div className="bg-[var(--color-bg-app)] font-sans text-[var(--color-brand-navy)] min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      

      {/* Decorative Background Blur */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-teal-300/20 rounded-full mix-blend-multiply filter blur-[100px] pointer-events-none"></div>

      <main className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 bg-white rounded-[2.5rem] overflow-hidden shadow-premium animate-fade-in-up relative z-10">
        
        {/* LEFT SIDE - FORM */}
        <section className="lg:col-span-7 flex flex-col justify-center p-8 md:p-16 bg-white relative border-r border-slate-50">
          <div className="max-w-md w-full mx-auto animate-slide-in-left">
            
            <button 
              onClick={() => navigate("/dashboard")}
              className="text-slate-400 hover:text-[var(--color-brand-primary)] text-sm font-semibold flex items-center gap-2 mb-8 transition-colors group w-fit"
            >
              <svg className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Dashboard
            </button>

            <header className="mb-10">
              <h2 className="text-3xl font-black mb-2 tracking-tight">Change Password</h2>
              <p className="text-[var(--color-brand-text)] text-sm font-medium">
                Ensure your account is using a strong, secure password.
              </p>
            </header>

            <form onSubmit={handleSubmit} className="space-y-5">
              
              {/* Current Password */}
              <div className="space-y-1.5 relative">
                <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400 ml-1">Current Password</label>
                <div className="relative">
                  <input
                    type={showPwd.current ? "text" : "password"}
                    required
                    className="w-full pl-5 pr-12 py-3.5 rounded-2xl bg-[var(--color-bg-panel)] border border-slate-100 focus:bg-white focus:border-[var(--color-brand-primary)] focus:ring-4 focus:ring-[var(--color-brand-ring)]/10 outline-none transition-all font-medium text-slate-700"
                    placeholder="••••••••"
                    value={formData.current_password}
                    onChange={(e) => setFormData({...formData, current_password: e.target.value})}
                  />
                  <button
                    type="button"
                    onClick={() => toggleShow('current')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-1 focus:outline-none"
                  >
                    {showPwd.current ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div className="space-y-1.5 relative">
                <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400 ml-1">New Password</label>
                <div className="relative">
                  <input
                    type={showPwd.new ? "text" : "password"}
                    required
                    className="w-full pl-5 pr-12 py-3.5 rounded-2xl bg-[var(--color-bg-panel)] border border-slate-100 focus:bg-white focus:border-[var(--color-brand-primary)] focus:ring-4 focus:ring-[var(--color-brand-ring)]/10 outline-none transition-all font-medium text-slate-700"
                    placeholder="••••••••"
                    value={formData.new_password}
                    onChange={(e) => setFormData({...formData, new_password: e.target.value})}
                  />
                  <button
                    type="button"
                    onClick={() => toggleShow('new')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-1 focus:outline-none"
                  >
                    {showPwd.new ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
              </div>

              {/* Confirm New Password */}
              <div className="space-y-1.5 relative">
                <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400 ml-1">Confirm New Password</label>
                <div className="relative">
                  <input
                    type={showPwd.confirm ? "text" : "password"}
                    required
                    className="w-full pl-5 pr-12 py-3.5 rounded-2xl bg-[var(--color-bg-panel)] border border-slate-100 focus:bg-white focus:border-[var(--color-brand-primary)] focus:ring-4 focus:ring-[var(--color-brand-ring)]/10 outline-none transition-all font-medium text-slate-700"
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                  />
                  <button
                    type="button"
                    onClick={() => toggleShow('confirm')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-1 focus:outline-none"
                  >
                    {showPwd.confirm ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-4 py-4 bg-[var(--color-brand-button)] hover:bg-[var(--color-brand-button-hover)] text-white font-bold rounded-2xl shadow-premium hover:shadow-premium-hover transition-all transform hover:-translate-y-0.5 active:scale-[0.98] flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  "Update Password"
                )}
              </button>
            </form>
          </div>
        </section>

        {/* RIGHT SIDE - VISUALS */}
        <section className="lg:col-span-5 hidden lg:flex flex-col justify-center items-center relative p-12 bg-gradient-to-br from-[var(--color-bg-light)] to-white overflow-hidden">
          <div className="z-10 w-full max-w-sm animate-slide-in-right">
            
            {/* Security Visual Card */}
            <div className="bg-white/80 backdrop-blur-xl p-8 rounded-[2rem] shadow-xl border border-white text-center transform hover:-translate-y-2 transition-transform duration-500">
              <div className="w-16 h-16 mx-auto bg-[var(--color-bg-active)] text-[var(--color-brand-primary)] rounded-2xl flex items-center justify-center mb-6 shadow-inner">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Enterprise Security</h3>
              <p className="text-slate-500 text-sm mb-6 leading-relaxed">
                Your architectural workspace is protected with military-grade encryption. Update your credentials regularly to maintain access safety.
              </p>
              
              {/* Animated progress lines mimicking encryption */}
              <div className="space-y-2">
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-[var(--color-brand-ring)] to-cyan-400 w-full animate-pulse"></div>
                </div>
                <div className="h-1.5 w-3/4 mx-auto bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-[var(--color-brand-ring)] to-cyan-400 w-full animate-pulse" style={{animationDelay: '150ms'}}></div>
                </div>
              </div>
            </div>

          </div>

          {/* Abstract Background Element */}
          <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-[var(--color-bg-icon)] rounded-full blur-[80px] opacity-60"></div>
        </section>
      </main>
    </div>
  );
};

export default ChangePassword;