import React, { useEffect, useState , useRef} from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { showToast } from "../../utils/toastUtils";

const VerifyEmail = () => {

  const { token } = useParams();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("Verifying...");
  const [loading, setLoading] = useState(false);

  const hasRun = useRef(false);

useEffect(() => {
  if (!token || hasRun.current) return;

  hasRun.current = true;
  verifyEmail();
}, [token]);

  const verifyEmail = async () => {
    setLoading(true);

    try {
      const res = await axios.get(
        `http://127.0.0.1:8000/api/auth/verify-email/${token}/`
      );

      const msg = res.data.message || "Verified successfully";

      setMessage(msg);
      showToast.success(msg);   

      setTimeout(() => {
        navigate("/login");
      }, 2000);

    } catch (err) {
      const msg =
        err.response?.data?.message || "Verification failed";

      setMessage(msg);
      showToast.error(msg);     
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      showToast.warning("Enter email first"); 
      return;
    }

    try {
      const res = await axios.post(
        "http://127.0.0.1:8000/api/auth/resend-verification-email/",
        { email }
      );

      showToast.success(res.data.message || "Email resent successfully 📩");

    } catch (err) {
      showToast.error(err.response?.data?.message || "Error sending email");
    }
  };

  return (
    <div className="bg-[#f4faf9] font-sans min-h-screen flex flex-col items-center justify-center p-6">



      <main className="w-full max-w-lg bg-white rounded-[40px] shadow-[0_20px_50px_rgba(0,0,0,0.05)] p-10 md:p-16 text-center relative overflow-hidden">

        {/* Animated Email Icon Section */}
        <div className="relative flex justify-center mb-10">
          <div className="absolute inset-0 bg-teal-50 rounded-full scale-150 opacity-50"></div>
          <div className="absolute inset-0 bg-teal-100/50 rounded-full scale-110"></div>

          <div className="relative w-24 h-24 bg-[#e6f4f1] rounded-full flex items-center justify-center border-8 border-white shadow-sm">
            <svg
              className="w-10 h-10 text-[#0d9488]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
        </div>

        {/* Text Content */}
        <h2 className="text-4xl font-black text-slate-900 mb-6 tracking-tight">
          Check your inbox
        </h2>

        <p className="text-green-600 font-semibold mb-4">
          {loading ? "Verifying..." : message}
        </p>

        <p className="text-slate-500 text-lg leading-relaxed mb-12">
          We've sent a magic link to your email address. Please click the link to verify your account and start building.
        </p>

        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full mb-4 px-4 py-3 border rounded-xl"
        />

        <div className="space-y-4">

          <button className="w-full py-5 bg-[#0d9488] hover:bg-[#0f766e] text-white font-bold text-lg rounded-3xl shadow-lg shadow-teal-500/20 transition-all flex items-center justify-center gap-2">
            Open Email App
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </button>

          <button
            onClick={handleResend}
            className="w-full py-5 bg-slate-100 hover:bg-slate-200 text-teal-700 font-bold text-lg rounded-3xl transition-all flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Resend Email
          </button>

        </div>

        <div className="mt-16 pt-8 border-t border-slate-50">
          <p className="text-slate-400 text-sm font-medium">
            Can't find the email? Check spam or{" "}
            <span className="text-teal-600 font-bold cursor-pointer hover:underline">
              contact support.
            </span>
          </p>
        </div>

      </main>

      <button className="mt-8 flex items-center gap-2 text-slate-500 font-bold hover:text-slate-800 transition-colors">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back to Login
      </button>

    </div>
  );
};

export default VerifyEmail;