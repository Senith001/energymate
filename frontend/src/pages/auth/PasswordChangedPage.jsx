import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { FiCheckCircle, FiArrowRight } from "react-icons/fi";

const PasswordChangedPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const backPath = location.state?.from || "/login";

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-emerald-100/50 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-emerald-100/30 rounded-full blur-3xl animate-pulse delay-1000" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}
        className="max-w-md w-full bg-white rounded-[2.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.06)] border border-slate-100 p-10 lg:p-14 text-center z-10 relative overflow-hidden"
      >
        <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
          <FiCheckCircle className="w-12 h-12" />
        </div>
        
        <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-tight mb-4">Password Changed!</h2>
        <p className="text-slate-500 font-medium mb-10 leading-relaxed">
          Your password has been successfully reset. You can now use your new password to log in to your account.
        </p>

        <button onClick={() => navigate(backPath)} className="w-full py-4 bg-emerald-600 text-white font-bold rounded-2xl shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 group">
          <span>Back to Login</span>
          <FiArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </button>
      </motion.div>
    </div>
  );
};

export default PasswordChangedPage;
