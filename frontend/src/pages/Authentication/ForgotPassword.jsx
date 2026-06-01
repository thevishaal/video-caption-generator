import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { showToast } from "../../utils/toastUtils";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return showToast.error("Please enter your email address");

    setIsLoading(true);

    try {
      const res = await fetch("http://127.0.0.1:8000/api/auth/forgot-password/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok && data.success !== false) {
        showToast.success(data.message || "Reset link sent to your email");

        setTimeout(() => {
          navigate("/send-verification-email");
        }, 2000);
      } else {
        showToast.error(
          data.message ||
          data.errors?.email?.[0] ||
          "Something went wrong"
        );
      }
    } catch (error) {
      console.error("Error:", error);
      showToast.error("Server not reachable. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-[var(--color-bg-app)] font-sans text-[var(--color-brand-navy)] min-h-screen flex items-center justify-center p-4 relative overflow-hidden">


      {/* Decorative Background Blur */}
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-teal-300/20 rounded-full mix-blend-multiply filter blur-[100px] pointer-events-none"></div>

      <main className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 bg-white rounded-[2.5rem] overflow-hidden shadow-premium animate-fade-in-up relative z-10 border border-slate-50">

        {/* LEFT SIDE - FORM */}
        <section className="lg:col-span-6 flex flex-col justify-center p-8 md:p-16 bg-white relative border-r border-slate-50">
          <div className="max-w-md w-full mx-auto animate-slide-in-left">

            {/* Back Button */}
            <button
              onClick={() => navigate("/login")}
              className="text-slate-400 hover:text-[var(--color-brand-primary)] text-sm font-semibold flex items-center gap-2 mb-10 transition-colors group w-fit"
            >
              <svg className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Login
            </button>

            {/* Header */}
            <header className="mb-8">
              <div className="w-14 h-14 bg-[var(--color-bg-active)] rounded-2xl flex items-center justify-center mb-6 border border-[var(--color-bg-light)]">
                <svg className="w-7 h-7 text-[var(--color-brand-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              </div>
              <h2 className="text-3xl font-black mb-2 tracking-tight">Forgot Password?</h2>
              <p className="text-[var(--color-brand-text)] text-sm font-medium">
                No worries, we'll send you secure reset instructions to get you back into your workspace.
              </p>
            </header>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400 ml-1">Email Address</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-4 flex items-center text-slate-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </span>
                  <input
                    type="email"
                    name="email"
                    required
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-5 py-3.5 rounded-2xl bg-[var(--color-bg-panel)] border border-slate-100 focus:bg-white focus:border-[var(--color-brand-primary)] focus:ring-4 focus:ring-[var(--color-brand-ring)]/10 outline-none transition-all font-medium text-slate-700 placeholder:font-normal"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 bg-[var(--color-brand-button)] hover:bg-[var(--color-brand-button-hover)] text-white font-bold rounded-2xl shadow-premium hover:shadow-premium-hover transition-all transform hover:-translate-y-0.5 active:scale-[0.98] flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    Send Reset Link
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </>
                )}
              </button>
            </form>

            {/* Need Help Footer */}
            <div className="mt-12 pt-8 border-t border-slate-100 text-center">
              <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mb-3">Need Help?</p>
              <p className="text-slate-400 text-xs leading-relaxed font-medium">
                If you don't receive an email within 5 minutes, check your spam folder or <span className="text-[var(--color-brand-primary)] font-bold cursor-pointer hover:underline">contact support</span>.
              </p>
            </div>

          </div>
        </section>

        {/* RIGHT SIDE - VISUALS */}
        <section className="lg:col-span-6 hidden lg:flex flex-col justify-center items-center relative p-12 bg-gradient-to-br from-[var(--color-bg-light)] to-white overflow-hidden">
          <div className="z-10 w-full max-w-sm animate-slide-in-right">

            <h2 className="text-4xl font-black leading-tight mb-8 text-slate-900 tracking-tighter text-center">
              Regain access to your <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-cyan-500">
                Content.
              </span>
            </h2>

            {/* Abstract Recovery Visual Card */}
            <div className="bg-white/90 backdrop-blur-xl p-6 rounded-[2rem] shadow-xl border border-white transform hover:-translate-y-2 transition-transform duration-500">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-full bg-teal-50 flex items-center justify-center text-teal-600 border border-teal-100 animate-bounce-slight">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Secure Link Dispatch</h3>
                  <p className="text-xs text-slate-400">Verifying account credentials</p>
                </div>
              </div>

              {/* Animated sequence lines mimicking email sending */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-teal-400"></div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-[var(--color-brand-ring)] to-cyan-400 w-[100%]"></div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-slate-200 animate-pulse"></div>
                  <div className="h-2 w-3/4 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-[var(--color-brand-ring)] to-cyan-400 w-full animate-shimmer"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Social Proof */}
            <div className="mt-12 flex items-center justify-center gap-4 opacity-80">
              <div className="flex -space-x-3">
                <div className="w-8 h-8 rounded-full border-2 border-white bg-teal-100 flex items-center justify-center text-[10px] font-bold text-teal-700">A</div>
                <div className="w-8 h-8 rounded-full border-2 border-white bg-blue-100 flex items-center justify-center text-[10px] font-bold text-blue-700">M</div>
                <div className="w-8 h-8 rounded-full border-2 border-white bg-emerald-100 flex items-center justify-center text-[10px] font-bold text-emerald-700">J</div>
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Trusted by Creators
              </p>
            </div>

          </div>

          {/* Abstract Background Elements */}
          <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-[var(--color-bg-icon)] rounded-full blur-[80px] opacity-60 pointer-events-none"></div>
        </section>
      </main>
    </div>
  );
};

export default ForgotPassword;