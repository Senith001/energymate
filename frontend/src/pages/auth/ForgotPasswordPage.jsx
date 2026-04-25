import React, { useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import api from "../../services/api";
import { motion } from "framer-motion";
import { FiMail, FiArrowRight, FiArrowLeft } from "react-icons/fi";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const backPath = location.state?.from || "/login";

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!email) return setError("Please enter your email");
    setError(null);
    setIsLoading(true);

    try {
      await api.post("/users/forgot-password", { email });
      navigate(`/reset-password?email=${encodeURIComponent(email)}`, { state: { from: backPath } });
    } catch (err) {
      if (err.response && err.response.data) {
        setError(err.response.data.message || "Failed to send reset code.");
      } else {
        setError("Cannot connect to the server. Please try again later.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-emerald-100/50 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-emerald-100/30 rounded-full blur-3xl animate-pulse delay-1000" />

      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: "easeOut" }}
        className="max-w-5xl w-full bg-white rounded-[2.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.06)] border border-slate-100 overflow-hidden flex flex-col md:flex-row z-10"
      >
        <div className="w-full md:w-1/2 p-10 lg:p-16 flex flex-col justify-center">
          <Link to={backPath} className="self-start mb-8 text-slate-400 hover:text-emerald-600 transition-colors flex items-center gap-2 font-bold text-sm">
            <FiArrowLeft /> Back to Login
          </Link>
          <div className="mb-10">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-tight">Forgot Password</h2>
            <p className="text-slate-500 font-medium mt-2">Enter your email address to receive a secure password reset code.</p>
          </div>

          {error && (
            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-sm font-bold text-center">
              {error}
            </motion.div>
          )}

          <form onSubmit={handleForgotPassword} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[13px] font-bold text-slate-700 ml-1">Email Address</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-emerald-500 transition-colors">
                  <FiMail className="w-5 h-5" />
                </div>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-medium" placeholder="name@example.com" />
              </div>
            </div>

            <button type="submit" disabled={isLoading} className="w-full py-4 bg-emerald-600 text-white font-bold rounded-2xl shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 group disabled:opacity-70 mt-6">
              {isLoading ? (
                <><span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /><span>Sending...</span></>
              ) : (
                <><span>Send Verify Code</span><FiArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" /></>
              )}
            </button>
          </form>
        </div>
        <div className="hidden md:flex w-1/2 bg-slate-50 items-center justify-center p-12 relative">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 to-transparent opacity-50" />
          <motion.div animate={{ y: [0, -15, 0] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }} className="relative z-10 w-full max-w-sm drop-shadow-[0_20px_40px_rgba(16,185,129,0.15)]">
            <img src="/assets/auth_login_hero.png" alt="Smart Energy Living" className="w-full h-auto object-contain" />
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default ForgotPasswordPage;
