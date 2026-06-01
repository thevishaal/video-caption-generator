import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { showToast } from "../../utils/toastUtils";

const SendEmail = () => {
  const navigate = useNavigate();
  const [isResending, setIsResending] = useState(false);

  // Mock function for resending email (You will need to connect this to your backend)
  const handleResendEmail = async () => {
    setIsResending(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      showToast.success("Verification email resent successfully! 📧");
    } catch (error) {
      showToast.error("Failed to resend email. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="bg-[#f7f9fb] font-sans text-slate-800 min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">


      {/* Visual Polish: Floating Background Elements */}
      <div className="fixed top-1/4 -left-20 w-64 h-64 bg-teal-200/20 rounded-full mix-blend-multiply blur-[100px] pointer-events-none -z-10 animate-[pulse_6s_ease-in-out_infinite]"></div>
      <div className="fixed bottom-1/4 -right-20 w-96 h-96 bg-cyan-200/20 rounded-full mix-blend-multiply blur-[120px] pointer-events-none -z-10 animate-[pulse_8s_ease-in-out_infinite_reverse]"></div>

      {/* Top Brand Identity */}
      <header className="absolute top-0 w-full px-6 py-8 flex justify-center animate-in fade-in slide-in-from-top-4 duration-700">
        <div 
          onClick={() => navigate('/')}
          className="flex items-center gap-3 cursor-pointer group transition-transform duration-300 active:scale-95"
        >
          <div className="w-10 h-10 bg-[#0F172A] rounded-xl flex items-center justify-center shadow-lg transform group-hover:-translate-y-0.5 transition-transform">
            <div className="w-4 h-4 bg-white rounded-sm transform rotate-45 border-2 border-[#0F172A]"></div>
          </div>
          <span className="font-black text-2xl tracking-tight text-slate-900">
            SubArchitect AI
          </span>
        </div>
      </header>

      {/* Main Content Canvas */}
      <main className="w-full max-w-md animate-in fade-in zoom-in-95 duration-700 delay-100">
        
        {/* Verification Card */}
        <div className="bg-white rounded-[2rem] p-10 md:p-12 shadow-[0_20px_60px_-15px_rgba(13,148,136,0.1)] border border-slate-100 flex flex-col items-center text-center relative overflow-hidden group">
          
          {/* Subtle Decorative Element */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-teal-50 rounded-full blur-3xl group-hover:bg-teal-100/50 transition-colors duration-700 pointer-events-none"></div>

          {/* Illustration / Icon Section */}
          <div className="mb-10 relative">
            <div className="w-24 h-24 bg-teal-50 rounded-full flex items-center justify-center text-teal-600 relative z-10 shadow-inner">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            {/* Animated Pulse Effect Simulation */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-teal-50/50 rounded-full scale-110 animate-ping" style={{ animationDuration: '3s' }}></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-teal-50/30 rounded-full scale-125"></div>
          </div>

          {/* Content Hierarchy */}
          <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-4">
            Check your inbox
          </h1>
          <p className="text-slate-500 font-medium leading-relaxed mb-10 max-w-[280px] mx-auto">
            We've sent a magic link to your email address. Please click the link to verify your account and start building.
          </p>

          {/* Actions */}
          <div className="w-full space-y-4">
            <a 
              href="https://mail.google.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-full py-4 px-6 bg-teal-600 hover:bg-teal-700 text-white rounded-[1.25rem] font-bold flex items-center justify-center gap-2 transition-all duration-300 shadow-[0_4px_14px_0_rgba(13,148,136,0.39)] hover:shadow-[0_6px_20px_rgba(13,148,136,0.23)] transform hover:-translate-y-0.5 active:scale-95"
            >
              <span>Open Email App</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
            
            <button 
              onClick={handleResendEmail}
              disabled={isResending}
              className="w-full py-4 px-6 rounded-[1.25rem] text-slate-600 font-bold bg-[#F8FAFC] border border-slate-200 transition-all duration-300 hover:bg-slate-100 hover:text-slate-900 active:scale-95 flex items-center justify-center gap-2"
            >
              {isResending ? (
                <div className="w-5 h-5 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin"></div>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>Resend Email</span>
                </>
              )}
            </button>
          </div>

          {/* Help Section */}
          <div className="mt-10 pt-8 border-t border-slate-100 w-full">
            <p className="text-[13px] font-medium text-slate-500 leading-relaxed">
              Can't find the email? Check your spam folder or{' '}
              <a href="#" className="text-teal-600 font-bold hover:underline">
                contact support
              </a>.
            </p>
          </div>
        </div>

        {/* Footer Meta (Back to Login) */}
        <div className="mt-8 text-center animate-in fade-in duration-700 delay-300">
          <Link 
            to="/login"
            className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors duration-200"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Login
          </Link>
        </div>
      </main>
    </div>
  );
};

export default SendEmail;