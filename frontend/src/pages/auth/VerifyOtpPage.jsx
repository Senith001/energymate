import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import api from "../../services/api";
import { motion } from "framer-motion";
import { FiMail, FiArrowLeft, FiRefreshCw, FiCheckCircle, FiClock } from "react-icons/fi";

const VerifyOtpPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const userEmail = location.state?.email || "your registered email"; 

  const [otpValues, setOtpValues] = useState(["", "", "", "", "", ""]);
  const [timeLeft, setTimeLeft] = useState(60);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [resendMessage, setResendMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!location.state?.email) {
      navigate("/register");
    }
  }, [location.state, navigate]);

  useEffect(() => {
    if (timeLeft > 0) {
      const timerId = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timerId);
    }
  }, [timeLeft]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleOtpInput = (e, index) => {
    const val = e.target.value;
    if (/[^0-9]/.test(val)) return; 

    const newOtp = [...otpValues];
    newOtp[index] = val;
    setOtpValues(newOtp);
    setError(null);
    setResendMessage("");

    if (val && index < 5) {
      document.getElementById(`otp-${index + 1}`).focus();
    }
  };

  const handleOtpKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otpValues[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`).focus();
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    const otpString = otpValues.join("");
    if (otpString.length !== 6) {
      setError("Please enter the complete 6-digit code.");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      await api.post("/users/verify-otp", { email: userEmail, otp: otpString });
      setSuccess(true);
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setError(err.response?.data?.message || "Invalid or expired OTP.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (timeLeft > 0) return; 
    setOtpValues(["", "", "", "", "", ""]);
    setError(null);
    setIsLoading(true);
    try {
      await api.post("/users/resend-otp", { email: userEmail });
      setTimeLeft(60); 
      setResendMessage("Verification code resent to your inbox!");
      setTimeout(() => setResendMessage(""), 5000);
    } catch (err) {
      setError("Failed to resend OTP.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-[-5%] left-[-5%] w-96 h-96 bg-emerald-100/50 rounded-full blur-3xl" />
      <div className="absolute bottom-[-5%] right-[-10%] w-96 h-96 bg-emerald-100/30 rounded-full blur-3xl" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-6xl w-full bg-white rounded-[2.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.06)] border border-slate-100 overflow-hidden flex flex-col md:flex-row z-10"
      >
        {/* Left Side: Visual */}
        <div className="hidden md:flex md:w-5/12 bg-slate-50 items-center justify-center p-12 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-100/40 to-transparent opacity-60" />
          <div className="relative z-10 flex flex-col items-center">
            <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}>
              <img src="/assets/auth_register_hero.png" alt="Verify OTP" className="w-full h-auto max-w-[280px]" />
            </motion.div>
            <div className="mt-12 text-center space-y-3 px-4">
              <h3 className="text-xl font-black text-slate-800 tracking-tight leading-tight">Verification Required</h3>
              <p className="text-sm text-slate-500 font-medium leading-relaxed">
                Check your inbox! We've sent a 6-digit security code to your email address for account authentication.
              </p>
            </div>
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="w-full md:w-7/12 p-8 lg:p-14 flex flex-col items-center">
          {/* Progress Indicator */}
          <div className="flex gap-2 mb-14 w-full">
            <div className="h-1.5 flex-1 bg-emerald-600 rounded-full" />
            <div className="h-1.5 flex-1 bg-emerald-600 rounded-full" />
            <div className="h-1.5 flex-1 bg-emerald-600 rounded-full" />
          </div>

          <div className="flex items-center gap-3 mb-10 transition-all">
            <img src="/logo.png" alt="EnergyMate Logo" className="w-10 h-10 rounded-xl shadow-[0_4px_16px_rgba(16,185,129,0.2)]" />
            <h1 className="text-xl font-black text-slate-900 tracking-tighter">
              ENERGYMATE
            </h1>
          </div>

          <div className="text-center mb-10">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-tight">Verify Your Email</h2>
            <p className="text-slate-500 font-medium mt-3">
              Enter the verification code sent to <br />
              <span className="text-slate-900 font-black">{userEmail}</span>
            </p>
          </div>

          {error && (
            <div className="w-full mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-sm font-bold text-center">
              {error}
            </div>
          )}

          {resendMessage && (
            <div className="w-full mb-6 p-4 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-2xl text-[13px] font-bold text-center animate-bounce">
              {resendMessage}
            </div>
          )}

          {success ? (
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-full py-10 bg-emerald-50 border border-emerald-100 rounded-3xl flex flex-col items-center gap-4"
            >
               <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-md">
                  <FiCheckCircle className="w-8 h-8 text-emerald-600" />
               </div>
               <p className="text-emerald-700 font-black text-lg">Verification Successful!</p>
               <p className="text-emerald-600/70 text-sm font-medium">Redirecting you to login...</p>
            </motion.div>
          ) : (
            <form onSubmit={handleVerify} className="w-full max-w-sm space-y-10">
              <div className="flex items-center justify-center gap-4 mb-2">
                <FiClock className={`w-4 h-4 ${timeLeft <= 20 ? 'text-red-500 animate-pulse' : 'text-slate-400'}`} />
                <span className={`text-sm font-black tracking-widest ${timeLeft <= 20 ? 'text-red-500' : 'text-slate-700'}`}>
                  {formatTime(timeLeft)}
                </span>
              </div>

              <div className="flex justify-between gap-2.5">
                {otpValues.map((val, index) => (
                  <input
                    key={index}
                    id={`otp-${index}`}
                    type="text"
                    maxLength="1"
                    value={val}
                    onChange={(e) => handleOtpInput(e, index)}
                    onKeyDown={(e) => handleOtpKeyDown(e, index)}
                    className="w-11 sm:w-14 h-14 sm:h-16 text-2xl font-black text-center bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-emerald-600 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all text-slate-900"
                    autoFocus={index === 0}
                  />
                ))}
              </div>

              <button
                type="submit"
                disabled={isLoading || otpValues.join("").length !== 6}
                className="w-full py-4 bg-emerald-600 text-white font-bold rounded-2xl shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <span>Verify Account</span>
                )}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={timeLeft > 0 || isLoading}
                  className="inline-flex items-center gap-2 text-sm font-black text-slate-400 hover:text-emerald-600 disabled:opacity-50 disabled:hover:text-slate-400 transition-colors"
                >
                  <FiRefreshCw className={isLoading ? "animate-spin" : ""} />
                  Resend Verification Code
                </button>
              </div>
            </form>
          )}

          <div className="mt-12 w-full pt-8 border-t border-slate-50 flex flex-col items-center">
             <Link to="/login" className="flex items-center gap-2 text-slate-500 font-bold hover:text-slate-800 transition-colors text-sm">
                <FiArrowLeft className="w-4 h-4" />
                Return to Login
             </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default VerifyOtpPage;