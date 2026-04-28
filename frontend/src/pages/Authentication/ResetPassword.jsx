import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();

  // Logic State
  const [formData, setFormData] = useState({
    new_password: "",
    confirm_password: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  // UI State for Password Visibility
  const [showPwd, setShowPwd] = useState({
    new: false,
    confirm: false,
  });

  const toggleShow = (field) => {
    setShowPwd((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.new_password !== formData.confirm_password) {
      return toast.error("Passwords do not match!");
    }

    setIsLoading(true);

    try {
      const res = await fetch(
        `http://127.0.0.1:8000/api/auth/reset-password/${token}/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            new_password: formData.new_password,
            confirm_password: formData.confirm_password,
          }),
        }
      );

      const data = await res.json();

      if (res.ok || data.success) {
        toast.success(data.message || "Password reset successfully! 🔐");
        setTimeout(() => navigate("/login"), 2000);
      } else {
        toast.error(data.message || "Reset failed. The token might be expired.");
      }
    } catch (err) {
      toast.error("Server error. Please try again later.");
    } finally {
      setIsLoading(false);
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
    <div className="bg-[var(--color-bg-app)] font-sans text-slate-800 min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <ToastContainer position="top-center" autoClose={2000} theme="light" />
      
      {/* Subtle Background Glow */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-teal-300/20 rounded-full mix-blend-multiply filter blur-[100px] pointer-events-none"></div>

      {/* Main Card */}
      <main className="w-full max-w-md bg-white rounded-[2.5rem] shadow-premium p-8 md:p-12 relative z-10 animate-fade-in-up border border-slate-50">
        
        {/* Header Content */}
        <div className="mb-8 text-center">
          <div className="w-16 h-16 mx-auto bg-[var(--color-bg-active)] text-[var(--color-brand-primary)] rounded-2xl flex items-center justify-center mb-6 shadow-inner">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">
            Secure Your Account
          </h2>
          <p className="text-[var(--color-brand-text)] text-sm font-medium">
            Enter a strong password below to regain access to your workspace.
          </p>
        </div>

        {/* Form Section */}
        <form className="space-y-5" onSubmit={handleSubmit}>
          
          {/* New Password */}
          <div className="space-y-1.5 relative">
            <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400 ml-1">New Password</label>
            <div className="relative">
              <input
                type={showPwd.new ? "text" : "password"}
                name="new_password"
                placeholder="••••••••"
                value={formData.new_password}
                onChange={handleChange}
                required
                className="w-full pl-5 pr-12 py-3.5 rounded-2xl bg-[var(--color-bg-panel)] border border-slate-100 focus:bg-white focus:border-[var(--color-brand-primary)] focus:ring-4 focus:ring-[var(--color-brand-ring)]/10 outline-none transition-all font-medium text-slate-700"
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

          {/* Confirm Password */}
          <div className="space-y-1.5 relative">
            <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400 ml-1">Confirm Password</label>
            <div className="relative">
              <input
                type={showPwd.confirm ? "text" : "password"}
                name="confirm_password"
                placeholder="••••••••"
                value={formData.confirm_password}
                onChange={handleChange}
                required
                className="w-full pl-5 pr-12 py-3.5 rounded-2xl bg-[var(--color-bg-panel)] border border-slate-100 focus:bg-white focus:border-[var(--color-brand-primary)] focus:ring-4 focus:ring-[var(--color-brand-ring)]/10 outline-none transition-all font-medium text-slate-700"
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

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-[var(--color-brand-button)] hover:bg-[var(--color-brand-button-hover)] text-white font-bold rounded-2xl shadow-premium hover:shadow-premium-hover transition-all transform hover:-translate-y-0.5 active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  Update Password
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Footer Support Text */}
        <div className="mt-8 pt-8 border-t border-slate-100 text-center">
          <p className="text-slate-400 text-sm font-medium">
            Remembered your password?{" "}
            <span 
              onClick={() => navigate("/login")}
              className="text-[var(--color-brand-primary)] font-bold cursor-pointer hover:underline"
            >
              Back to log in.
            </span>
          </p>
        </div>
      </main>
    </div>
  );
};

export default ResetPassword;