import React, { useState } from "react";
import axios from "axios";
import { showToast, formatServerError } from "../../utils/toastUtils";
import { useNavigate } from "react-router-dom";
import LoginNav from "../../Components/common/LoginNav";

const Register = () => {
  const navigate = useNavigate();

  // State for form logic
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  
  // State for UI enhancements
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { first_name, last_name, email, password, confirmPassword } = formData;

    if (password !== confirmPassword) {
      showToast.error("Passwords do not match");
      return;
    }

    setIsLoading(true);

    try {
      const response = await axios.post(
        "http://127.0.0.1:8000/api/auth/register/",
        { first_name, last_name, email, password }
      );

      if (response.status === 201) {
        showToast.success("Account created successfully! 🎉");
        setTimeout(() => {
          navigate("/send-verification-email");
        }, 2000);
      }
    } catch (error) {
      console.error(error);
      if (error.response && error.response.data) {
        const serverErrors = error.response.data.errors;
        if (serverErrors) {
          const polishedError = formatServerError(serverErrors);
          showToast.error(polishedError);
        } else {
          showToast.error(error.response.data.message || "Registration failed");
        }
      } else {
        showToast.error("Error connecting to server");
      }
    } finally {
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
    <div className="bg-[#FAFCFF] font-sans text-slate-800 min-h-screen flex flex-col relative overflow-hidden">
      
     
      
      


      
        <main className="w-full max-w-9xl grid grid-cols-1 lg:grid-cols-12 min-h-[630px] overflow-hidden animate-in fade-in zoom-in-95 duration-700">
          
          {/* LEFT SIDE - BRANDING & VISUALS (Hidden on mobile) */}
          <section className="hidden lg:flex lg:col-span-5 bg-gradient-to-br from-[#f0fdfa] to-[#e0f2fe] p-8 flex-col justify-between relative overflow-hidden">
            
           

            {/* Main Hero Text */}
            <div className="z-10 max-w-md mt-12 animate-in slide-in-from-left-4 fade-in duration-500 delay-200">
              <h2 className="text-4xl lg:text-5xl font-black text-slate-900 leading-[1.1] mb-6 tracking-tighter">
                Join creators using AI to scale content.
              </h2>
              <p className="text-teal-700 text-lg leading-relaxed font-medium">
                Automate your architectural workflow with surgical precision and cinematic style.
              </p>
            </div>

            {/* FLOATING IMAGES SECTION */}
            <div className="relative h-72 mt-12 z-10 animate-in slide-in-from-bottom-8 fade-in duration-700 delay-300">
              {/* Card 1: Captions Preview (Back) */}
              <div className="absolute left-0 bottom-12 w-64 p-6 bg-white/90 backdrop-blur-md border border-white/50 rounded-[2rem] shadow-xl rotate-[-6deg] hover:rotate-0 hover:-translate-y-2 transition-all duration-500">
                <div className="flex items-center gap-3 mb-4">
                   <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center text-white text-xs">🎬</div>
                   <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Auto Captions</span>
                </div>
                <div className="space-y-2 mb-4">
                   <div className="h-2 w-full bg-slate-100 rounded-full"></div>
                   <div className="h-2 w-2/3 bg-slate-100 rounded-full"></div>
                </div>
                <div className="bg-teal-100 text-teal-700 py-2 px-4 rounded-lg w-fit text-[9px] font-black uppercase tracking-tighter">Storytelling Mode</div>
              </div>

              {/* Card 2: Main Render (Front) */}
              <div className="absolute left-16 bottom-0 w-72 bg-white p-3 rounded-[2rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.15)] rotate-[4deg] hover:rotate-0 hover:-translate-y-2 transition-all duration-500 border border-slate-50">
                <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-900">
                  <img 
                    src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80" 
                    alt="V2.4 Render" 
                    className="w-full h-full object-cover opacity-80 hover:opacity-100 transition-opacity duration-500"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <h3 className="text-white font-black text-2xl tracking-tighter drop-shadow-lg uppercase text-center">Impactful AI</h3>
                  </div>
                </div>
                <div className="flex justify-between items-center mt-3 px-2">
                   <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse"></div>
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-200"></div>
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-200"></div>
                   </div>
                   <span className="text-[9px] font-bold text-slate-400 tracking-widest uppercase">V2.4 Render</span>
                </div>
              </div>
            </div>

            {/* Trusted by Section */}
            <div className="z-10 flex mt-8 items-center gap-4 bg-white/60 backdrop-blur-md w-fit p-3 px-5 rounded-full border border-white shadow-lg animate-in fade-in duration-700 delay-500">
               <div className="flex -space-x-3">
                 <div className="w-8 h-8 rounded-full border-2 border-white overflow-hidden"><img src="https://i.pravatar.cc/100?u=1" alt="user" /></div>
                 <div className="w-8 h-8 rounded-full border-2 border-white overflow-hidden"><img src="https://i.pravatar.cc/100?u=2" alt="user" /></div>
                 <div className="w-8 h-8 rounded-full border-2 border-white overflow-hidden"><img src="https://i.pravatar.cc/100?u=3" alt="user" /></div>
               </div>
               <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Trusted by 2k+ Editors</p>
            </div>
          </section>

          {/* RIGHT SIDE - REGISTRATION FORM */}
          <section className="col-span-1 lg:col-span-7 flex flex-col justify-center items-center p-4 md:p-12 lg:p-16 relative z-20">
            <div className="w-full max-w-lg">
              
              <div className="mb-10 animate-in slide-in-from-bottom-4 fade-in duration-500 delay-100">
                <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-3 tracking-tight">Create an account</h2>
                <p className="text-slate-500 font-medium">Precision tools for modern architects and storytellers.</p>
              </div>

              <form className="space-y-5" onSubmit={handleSubmit}>
                
                {/* Name Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-in slide-in-from-bottom-4 fade-in duration-500 delay-200">
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400 block mb-1.5 ml-1">First Name</label>
                    <input 
                      required
                      type="text"
                      name="first_name"
                      placeholder="Jane"
                      value={formData.first_name}
                      onChange={handleChange}
                      className="w-full px-5 py-3.5 rounded-2xl bg-[#F8FAFC] border border-slate-200 focus:bg-white focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 outline-none transition-all text-slate-700 font-medium placeholder:font-normal" 
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400 block mb-1.5 ml-1">Last Name</label>
                    <input 
                      required
                      type="text"
                      name="last_name"
                      placeholder="Doe"
                      value={formData.last_name}
                      onChange={handleChange}
                      className="w-full px-5 py-3.5 rounded-2xl bg-[#F8FAFC] border border-slate-200 focus:bg-white focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 outline-none transition-all text-slate-700 font-medium placeholder:font-normal" 
                    />
                  </div>
                </div>

                {/* Email Field */}
                <div className="animate-in slide-in-from-bottom-4 fade-in duration-500 delay-300">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400 block mb-1.5 ml-1">Email Address</label>
                  <input 
                    required
                    type="email"
                    name="email"
                    placeholder="name@company.com"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-5 py-3.5 rounded-2xl bg-[#F8FAFC] border border-slate-200 focus:bg-white focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 outline-none transition-all text-slate-700 font-medium placeholder:font-normal" 
                  />
                </div>

                {/* Password Fields Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-in slide-in-from-bottom-4 fade-in duration-500 delay-400">
                  
                  {/* Create Password */}
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400 block mb-1.5 ml-1">Create Password</label>
                    <div className="relative">
                      <input 
                        required
                        type={showPassword ? "text" : "password"}
                        name="password"
                        placeholder="Min. 8 characters"
                        value={formData.password}
                        onChange={handleChange}
                        className="w-full pl-5 pr-11 py-3.5 rounded-2xl bg-[#F8FAFC] border border-slate-200 focus:bg-white focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 outline-none transition-all text-slate-700 font-medium placeholder:font-normal" 
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 focus:outline-none"
                      >
                        {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400 block mb-1.5 ml-1">Confirm Password</label>
                    <div className="relative">
                      <input 
                        required
                        type={showConfirmPassword ? "text" : "password"}
                        name="confirmPassword"
                        placeholder="Repeat password"
                        value={formData.confirmPassword}
                        onChange={handleChange} 
                        className="w-full pl-5 pr-11 py-3.5 rounded-2xl bg-[#F8FAFC] border border-slate-200 focus:bg-white focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 outline-none transition-all text-slate-700 font-medium placeholder:font-normal" 
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 focus:outline-none"
                      >
                        {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="pt-4 animate-in slide-in-from-bottom-4 fade-in duration-500 delay-500">
                  <button 
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-4 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-2xl shadow-[0_4px_14px_0_rgba(13,148,136,0.39)] hover:shadow-[0_6px_20px_rgba(13,148,136,0.23)] transition-all transform hover:-translate-y-0.5 active:scale-95 flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <>Get Started <span className="text-lg leading-none">&rarr;</span></>
                    )}
                  </button>
                </div>

               
              </form>

              <p className="text-center text-sm text-slate-500 font-medium mt-8 animate-in fade-in duration-700 delay-[700ms]">
                Already have an account? 
                <span 
                  onClick={() => navigate("/login")}
                  className="text-[#0F172A] font-bold ml-1.5 cursor-pointer hover:underline"
                >
                  Sign In
                </span>
              </p>

            </div>
          </section>
        </main>
      </div>
  
  );
};

export default Register;