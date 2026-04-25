import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import api from "../../services/api";
import { motion } from "framer-motion";
import { FiLock, FiCheckCircle, FiArrowRight } from "react-icons/fi";

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const backPath = location.state?.from || "/login";
  const [email, setEmail] = useState("");
  const [otpValues, setOtpValues] = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  const validateField = (name, value, allData = {}) => {
    let err = null;
    switch (name) {
      case "newPassword":
        if (value) {
          if (value.length < 8) err = "Password must be at least 8 characters long";
          else if (!/[a-z]/.test(value)) err = "Password must contain at least one lowercase letter";
          else if (!/[A-Z]/.test(value)) err = "Password must contain at least one uppercase letter";
          else if (!/\d/.test(value)) err = "Password must contain at least one number";
          else if (!/[^A-Za-z0-9]/.test(value)) err = "Password must contain at least one special character";
        }
        break;
      case "confirmPassword":
        if (value && value !== allData.newPassword) err = "Passwords must match";
        break;
      default:
        break;
    }
    return err;
  };

  const handleNewPasswordChange = (e) => {
    const value = e.target.value;
    setNewPassword(value);
    setFieldErrors(prev => ({ ...prev, newPassword: validateField("newPassword", value, { newPassword: value, confirmPassword }) }));
  };

  const handleConfirmPasswordChange = (e) => {
    const value = e.target.value;
    setConfirmPassword(value);
    setFieldErrors(prev => ({ ...prev, confirmPassword: validateField("confirmPassword", value, { newPassword, confirmPassword: value }) }));
  };

  useEffect(() => {
    const emailParam = searchParams.get("email");
    if (emailParam) {
      setEmail(emailParam);
    } else {
      navigate("/forgot-password"); // if no email passed, send them back
    }
  }, [searchParams, navigate]);

  const validatePassword = (pwd) => {
    if (pwd.length < 8) return "Password must be at least 8 characters long";
    if (!/[a-z]/.test(pwd)) return "Password must contain at least one lowercase letter";
    if (!/[A-Z]/.test(pwd)) return "Password must contain at least one uppercase letter";
    if (!/\d/.test(pwd)) return "Password must contain at least one number";
    if (!/[^A-Za-z0-9]/.test(pwd)) return "Password must contain at least one special character";
    return null;
  };

  const handleOtpInput = (e, index) => {
    const value = e.target.value;
    if (!/^[0-9]*$/.test(value)) return;
    const newOtp = [...otpValues];
    newOtp[index] = value.substring(value.length - 1);
    setOtpValues(newOtp);
    if (value && index < 5) {
      document.getElementById(`reset-otp-${index + 1}`).focus();
    }
  };

  const handleOtpKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otpValues[index] && index > 0) {
      document.getElementById(`reset-otp-${index - 1}`).focus();
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError(null);

    const otp = otpValues.join("");
    if (otp.length < 6) return setError("Please enter the complete 6-digit OTP code.");

    const pwdError = validatePassword(newPassword);
    if (pwdError) return setError(pwdError);

    if (newPassword !== confirmPassword) return setError("Passwords do not match.");

    setIsLoading(true);

    try {
      await api.post("/users/reset-password", { email, otp, newPassword });
      navigate("/password-changed", { state: { from: backPath } });
    } catch (err) {
      if (err.response && err.response.data) {
        setError(err.response.data.message || "Failed to reset password.");
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
          <div className="mb-10">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-tight">Reset Password</h2>
            <p className="text-slate-500 font-medium mt-2">Enter the verification code sent to {email} and create your new password.</p>
          </div>

          {error && (
            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-sm font-bold text-center">
              {error}
            </motion.div>
          )}

          <form onSubmit={handleResetPassword} className="space-y-6">
            <div className="space-y-3">
              <label className="text-[13px] font-bold text-slate-700 ml-1">Verification Code (OTP)</label>
              <div className="flex justify-between gap-1">
                {otpValues.map((val, index) => (
                  <input
                    key={index}
                    id={`reset-otp-${index}`}
                    type="text"
                    maxLength="1"
                    value={val}
                    onChange={(e) => handleOtpInput(e, index)}
                    onKeyDown={(e) => handleOtpKeyDown(e, index)}
                    className="w-[15%] aspect-square max-h-16 text-2xl font-black text-center bg-slate-50 border border-slate-200 rounded-2xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 focus:bg-white outline-none transition-all placeholder:text-slate-300"
                    placeholder="-"
                  />
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[13px] font-bold text-slate-700 ml-1">New Password</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-emerald-500 transition-colors">
                  <FiLock className="w-5 h-5" />
                </div>
                <input type="password" value={newPassword} onChange={handleNewPasswordChange} required className={`w-full pl-12 pr-4 py-4 bg-slate-50 border ${fieldErrors.newPassword ? 'border-rose-300 ring-4 ring-rose-50' : 'border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/10'} rounded-2xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 transition-all font-medium`} placeholder="Enter new password" />
              </div>
              {fieldErrors.newPassword && <p className="text-[9px] text-rose-500 font-black uppercase ml-1 mt-1.5">{fieldErrors.newPassword}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-[13px] font-bold text-slate-700 ml-1">Confirm New Password</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-emerald-500 transition-colors">
                  <FiLock className="w-5 h-5" />
                </div>
                <input type="password" value={confirmPassword} onChange={handleConfirmPasswordChange} required className={`w-full pl-12 pr-4 py-4 bg-slate-50 border ${fieldErrors.confirmPassword ? 'border-rose-300 ring-4 ring-rose-50' : 'border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/10'} rounded-2xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 transition-all font-medium`} placeholder="Confirm your new password" />
              </div>
              {fieldErrors.confirmPassword && <p className="text-[9px] text-rose-500 font-black uppercase ml-1 mt-1.5">{fieldErrors.confirmPassword}</p>}
            </div>

            <button type="submit" disabled={isLoading || Object.values(fieldErrors).some(e => e !== null)} className="w-full py-4 bg-emerald-600 text-white font-bold rounded-2xl shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 group disabled:opacity-70 mt-6">
              {isLoading ? (
                <><span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /><span>Resetting...</span></>
              ) : (
                <><span>Reset Password</span><FiArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" /></>
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

export default ResetPasswordPage;
