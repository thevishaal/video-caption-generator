import React, { useState } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from "react-router-dom";
import LoginNav from "../../Components/common/LoginNav";

const LoginPage = () => {
  const navigate = useNavigate();
  
  // State for logic
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  const [isLoading, setIsLoading] = useState(false);

  // State for UI
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { email, password } = formData;

    if (!email || !password) {
      toast.error("All fields are required");
      return;
    }

    setIsLoading(true);

    try {
      const response = await axios.post("http://127.0.0.1:8000/api/auth/login/",
        { email, password }
      );

      const data = response.data;

      if (response.status === 200) {
        toast.success(data.message || "Login successful");

        const userObj = data.data.user;
        const formattedUser = {
          ...userObj,
          fullName: userObj.full_name || `${userObj.first_name} ${userObj.last_name}`.trim()
        };

        localStorage.setItem("user", JSON.stringify(formattedUser));
        
        const accessToken = data.data?.access_token || data.data?.access || data.access || data.token;

        if (!accessToken) {
          toast.error("Token not received from backend");
          setIsLoading(false);
          return;
        }

        localStorage.setItem("token", accessToken);
        setFormData({ email: "", password: "" });

        setTimeout(() => {
          navigate("/dashboard");
        }, 1000);

      } else {
        toast.error(data.message || "Login failed");
        setIsLoading(false);
      }

    } catch (error) {
      if (error.response && error.response.data) {
        const serverErrors = error.response.data.errors;
        const errorMsg = serverErrors?.non_field_errors?.[0] || "Invalid email or password";
        toast.error(errorMsg);
      } else {
        toast.error("Server error");
      }
      setIsLoading(false);
    }
  };

  // SVGs for the Password Eye Toggle
  const EyeIcon = () => (
    <svg className="w-5 h-5 text-slate-400 hover:text-teal-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );

  const EyeOffIcon = () => (
    <svg className="w-5 h-5 text-slate-400 hover:text-teal-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  );

  return (
    <div className="bg-[#FAFCFF] font-sans text-slate-800 min-h-[90vh] flex flex-col relative overflow-hidden">
      
      
     
      <ToastContainer position="top-center" autoClose={2000} theme="light" />

      
        <main className="w-full max-w-9xl grid grid-cols-1 lg:grid-cols-12 min-h-[630px] bg-white  animate-in fade-in zoom-in-95 duration-700">

          {/* LEFT SIDE - FORM */}
          <section className="lg:col-span-5 flex justify-center items-center bg-white border-r border-slate-100 relative z-20">
            <div className="p-8 md:p-12 w-full max-w-md">
              
              {/* Header */}
              <div className="mb-10 animate-in slide-in-from-bottom-4 fade-in duration-500 delay-100">
               
                <h2 className="text-3xl md:text-4xl font-black mb-2 tracking-tight text-slate-900">Welcome Back</h2>
                <p className="text-slate-500 text-sm font-medium">
                  Precision editing and architecture at your fingertips.
                </p>
              </div>

              {/* Form */}
              <form className="space-y-5" onSubmit={handleSubmit}>
                
                {/* Email Field */}
                <div className="animate-in slide-in-from-bottom-4 fade-in duration-500 delay-200">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400 block mb-1.5 ml-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    placeholder="name@company.com"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-5 py-3.5 rounded-2xl bg-[#F8FAFC] border border-slate-200 focus:bg-white focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 outline-none transition-all text-slate-700 font-medium placeholder:font-normal"
                  />
                </div>

                {/* Password Field with Eye Toggle */}
                <div className="animate-in slide-in-from-bottom-4 fade-in duration-500 delay-300">
                  <div className="flex justify-between items-center mb-1.5 px-1">
                    <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                      Password
                    </label>
                    <span
                      onClick={() => navigate("/forgot-password")}
                      className="text-xs text-teal-600 font-bold cursor-pointer hover:text-teal-700 transition-colors">
                      Forgot?
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      placeholder="Enter your password"
                      value={formData.password}
                      onChange={handleChange}
                      className="w-full pl-5 pr-12 py-3.5 rounded-2xl bg-[#F8FAFC] border border-slate-200 focus:bg-white focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 outline-none transition-all text-slate-700 font-medium placeholder:font-normal"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-1 focus:outline-none"
                    >
                      {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="pt-2 animate-in slide-in-from-bottom-4 fade-in duration-500 delay-400">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-4 bg-[#0F172A] hover:bg-[#1E293B] text-white font-bold rounded-2xl shadow-[0_4px_14px_0_rgba(15,23,42,0.2)] hover:shadow-[0_6px_20px_rgba(15,23,42,0.23)] transition-all transform hover:-translate-y-0.5 active:scale-95 flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <>Sign In to Workspace <span className="text-lg leading-none">&rarr;</span></>
                    )}
                  </button>
                </div>

             

              </form>

              <p className="text-center text-sm mt-8 text-slate-500 animate-in fade-in duration-700 delay-700">
                Don't have an account?
                <span onClick={() => navigate("/register")} className="text-[#0F172A] font-bold ml-1.5 cursor-pointer hover:underline">
                  Create account
                </span>
              </p>
            </div>
          </section>

          {/* RIGHT SIDE - VISUALS */}
          <section className="lg:col-span-7 hidden lg:flex flex-col justify-center items-center relative p-16 bg-gradient-to-br from-[#f0fdfa] to-[#e0f2fe] overflow-hidden">
            
            {/* Soft glowing orb in background */}
            <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-teal-300/20 rounded-full mix-blend-multiply filter blur-[100px]"></div>

            <div className="z-10 w-full max-w-2xl animate-in slide-in-from-right-8 fade-in duration-1000 ease-out">
              <h2 className="text-5xl lg:text-6xl font-black leading-[1.1] mb-6 text-slate-900 tracking-tighter">
                Automate your <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-cyan-500">
                  architecture
                </span>{" "}
                in seconds.
              </h2>

              {/* Visual Container */}
              <div className="relative mt-12">
                <div className="flex gap-6 items-start">
                  
                  {/* Main Video/Image Mockup */}
                  <div className="bg-white/80 backdrop-blur p-3 rounded-[2rem] shadow-2xl flex-1 border border-white transform hover:-translate-y-2 transition-transform duration-500">
                    <div className="aspect-video rounded-[1.5rem] overflow-hidden bg-slate-900 relative">
                      <img
                        src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop"
                        alt="Workspace"
                        className="w-full h-full object-cover opacity-70 hover:opacity-100 transition-opacity duration-700"
                      />
                      <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-slate-900/90 to-transparent text-white">
                        <div className="h-1 w-2/3 bg-teal-400 rounded-full mb-3 shadow-[0_0_10px_rgba(45,212,191,0.5)]"></div>
                        <p className="italic text-sm text-slate-200">"Architecture is not just about buildings, it's about life."</p>
                      </div>
                    </div>
                  </div>

                  {/* Floating Stats Cards */}
                  <div className="space-y-4 w-52 pt-8">
                    {/* Accuracy Card */}
                    <div className="bg-white/90 backdrop-blur-md p-5 rounded-[1.5rem] shadow-xl border border-white/50 transform hover:-translate-y-1 transition-transform duration-300 hover:shadow-2xl">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="bg-teal-100 text-teal-600 rounded-full p-1 w-5 h-5 flex items-center justify-center text-[10px]">✓</span>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">AI Accuracy</p>
                      </div>
                      <h3 className="text-3xl font-black text-slate-800">99.8%</h3>
                      <div className="h-1.5 w-full bg-slate-100 rounded-full mt-3 overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-teal-400 to-cyan-400 w-[99%]"></div>
                      </div>
                    </div>

                    {/* Languages Card */}
                    <div className="bg-white/90 backdrop-blur-md p-5 rounded-[1.5rem] shadow-xl border border-white/50 transform translate-x-4 hover:translate-x-2 transition-transform duration-300">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Formats</p>
                      <div className="flex flex-wrap gap-2">
                        {['DWG', 'PDF', 'RVT', 'OBJ'].map(l => (
                          <span key={l} className="bg-slate-50 px-2.5 py-1 rounded-lg text-[10px] font-bold text-slate-600 border border-slate-200">{l}</span>
                        ))}
                        <span className="text-[10px] font-bold text-teal-600 py-1">+ Auto-sync</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* PROJECT TIMELINE (Audio Waves - Animated) */}
                <div className="absolute -bottom-8 left-10 right-20 bg-white/80 backdrop-blur-xl p-5 rounded-[1.5rem] border border-white shadow-2xl transform hover:-translate-y-1 transition-transform duration-500">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-teal-400 animate-pulse"></div>
                      Live Processing
                    </span>
                    <span className="text-slate-300">•••</span>
                  </div>
                  <div className="flex items-end justify-between gap-1.5 h-12">
                    {[40, 70, 40, 80, 50, 90, 60, 80, 40, 60, 90, 50, 70, 40, 80].map((h, i) => (
                      <div
                        key={i}
                        style={{ height: `${h}%` }}
                        className={`w-full rounded-t-sm transition-all duration-500 hover:h-full ${
                          i % 4 === 0 ? 'bg-teal-500' : 'bg-teal-200'
                        }`}
                      ></div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          </section>
        </main>
      </div>
    
  );
};

export default LoginPage;