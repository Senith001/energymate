import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../../services/api";
import { motion, AnimatePresence } from "framer-motion";
import { FiCheck, FiArrowLeft, FiArrowRight, FiStar, FiAlertCircle, FiX } from "react-icons/fi";

const SummaryPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const formData = location.state?.formData || null;

  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [globalError, setGlobalError] = useState(null);
  const [errorModal, setErrorModal] = useState({ show: false, message: "" });

  const handleRegister = async () => {
    if (!termsAccepted) return;
    setIsLoading(true);
    setGlobalError(null);

    try {
      const fullName = `${formData.firstName.trim()} ${formData.lastName.trim()}`;
      await api.post("/users/register", {
        name: fullName,
        email: formData.email,
        password: formData.password,
        phone: formData.phone 
      });
      navigate("/verify-otp", { state: { email: formData.email } });
    } catch (err) {
      const serverMessage = err.response?.data?.message || "";
      if (serverMessage.toLowerCase().includes("already registered") || serverMessage.toLowerCase().includes("exists")) {
        setErrorModal({ show: true, message: serverMessage });
      } else {
        setGlobalError(serverMessage || "Cannot connect to the server. Please try again later.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // If the user refreshed the page or came here directly, warn them safely.
  if (!formData) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-2xl font-bold text-slate-800 mb-4">No Registration Data Found</h2>
        <p className="text-slate-500 mb-6">Please start the registration process from the beginning.</p>
        <button 
          onClick={() => navigate("/register")}
          className="py-3 px-6 bg-emerald-600 text-white font-bold rounded-xl"
        >
          Go to Registration
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 relative overflow-hidden">
      <div className="max-w-6xl w-full bg-white rounded-[2.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.06)] border border-slate-100 overflow-hidden flex flex-col md:flex-row z-10">
        
        {/* Left Side */}
        <div className="hidden md:flex md:w-5/12 bg-slate-50 items-center justify-center p-12 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-100/40 to-transparent opacity-60" />
          <div className="relative z-10 flex flex-col items-center">
            <img src="/assets/auth_register_hero.png" alt="Check Information" className="w-full h-auto max-w-[280px] drop-shadow-xl" />
            <div className="mt-12 text-center space-y-3 px-4">
              <h3 className="text-xl font-black text-slate-800">Review Your Profile</h3>
              <p className="text-sm text-slate-500 font-medium leading-relaxed">
                Check if your provided details are correct before initializing your dashboard.
              </p>
            </div>
          </div>
        </div>

        {/* Right Side */}
        <div className="w-full md:w-7/12 p-8 lg:p-14">
          
          {/* Progress Indicator */}
          <div className="flex gap-2 mb-10">
            <div className="h-1.5 flex-1 bg-emerald-600 rounded-full" />
            <div className="h-1.5 flex-1 bg-emerald-600 rounded-full" />
            <div className="h-1.5 flex-1 bg-slate-100 rounded-full" />
          </div>

          <div className="mb-10 text-center md:text-left">
            <div className="flex items-center gap-3 mb-6 transition-all">
              <img src="/logo.png" alt="EnergyMate Logo" className="w-10 h-10 rounded-xl shadow-lg" />
              <h1 className="text-xl font-black text-slate-900 tracking-tighter">ENERGYMATE</h1>
            </div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Final Summary</h2>
            <p className="text-slate-500 font-medium mt-2">Almost there! Review your information below.</p>
          </div>

          {globalError && (
            <div className="mb-8 p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-sm font-bold text-center">
              {globalError}
            </div>
          )}

          {/* Member Card */}
          <div className="bg-emerald-50/50 border border-emerald-100 rounded-[2rem] p-6 mb-10 flex items-center gap-5">
            <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-emerald-600 shadow-sm border border-emerald-100">
               <FiStar className="w-7 h-7 fill-emerald-600" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-widest">Account Type</p>
              <h4 className="text-lg font-black text-slate-900">Standard Member</h4>
            </div>
          </div>

          {/* Data Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-10">
            <div className="space-y-1">
              <p className="text-[13px] font-bold text-slate-400 uppercase tracking-wider">Full Name</p>
              <p className="text-base font-black text-slate-800">{formData.firstName} {formData.lastName}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[13px] font-bold text-slate-400 uppercase tracking-wider">Mobile Number</p>
              <p className="text-base font-black text-slate-800">+94 {formData.phone}</p>
            </div>
            <div className="space-y-1 sm:col-span-2 border-t border-slate-50 pt-4">
              <p className="text-[13px] font-bold text-slate-400 uppercase tracking-wider">Email Address</p>
              <p className="text-base font-black text-slate-800">{formData.email}</p>
            </div>
          </div>

          {/* Terms */}
          <div className="flex items-center gap-3 mb-10">
            <label className="relative flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="peer sr-only"
              />
              <div className="w-6 h-6 bg-slate-100 border-2 border-slate-200 rounded-lg peer-checked:bg-emerald-600 peer-checked:border-emerald-600 transition-all flex items-center justify-center">
                <FiCheck className="text-white w-4 h-4 opacity-0 peer-checked:opacity-100" />
              </div>
            </label>
            <p className="text-sm font-medium text-slate-500">
              I agree to the <span className="text-emerald-600 font-bold hover:underline cursor-pointer">Terms & Conditions</span>
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
               onClick={() => navigate("/register", { state: { formData } })}
               disabled={isLoading}
               className="flex-1 py-4 px-6 bg-white border border-slate-200 text-slate-700 font-bold rounded-2xl hover:bg-slate-50 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group"
            >
              <FiArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              <span>Edit Details</span>
            </button>
            <button
              onClick={handleRegister}
              disabled={!termsAccepted || isLoading}
              className="flex-[1.5] py-4 px-6 bg-emerald-600 text-white font-bold rounded-2xl shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                  <span>Processing...</span>
              ) : (
                <span>Initialize Account</span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Error Modal */}
      {errorModal.show && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-white rounded-[2rem] p-8 shadow-2xl flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center text-red-500 mb-6">
                <FiAlertCircle className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-2">Registration Issue</h3>
            <p className="text-slate-500 font-medium mb-8 leading-relaxed">{errorModal.message}</p>
            <button
              onClick={() => setErrorModal({ show: false, message: "" })}
              className="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-colors"
            >
              Close Window
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SummaryPage;