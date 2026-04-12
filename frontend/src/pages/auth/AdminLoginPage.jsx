import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";
import { motion } from "framer-motion";
import { FiShield, FiMail, FiLock, FiArrowRight } from "react-icons/fi";

const AdminLoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await api.post("/users/login", { email, password });
      const { user, token } = response.data;

      if (user.role !== "admin" && user.role !== "superadmin") {
        setError("Access Denied: Administrative privileges required.");
        setIsLoading(false);
        return; 
      }

      login(user, token);
      navigate("/admin/dashboard");
    } catch (err) {
      if (err.response && err.response.data) {
        setError(err.response.data.message || "Invalid administrative credentials");
      } else {
        setError("Network failure: Could not reach secure portal.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6 relative overflow-hidden font-inter">
      {/* Background patterns */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:40px_40px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-5xl w-full bg-white rounded-[2.5rem] shadow-[0_30px_80px_rgba(0,0,0,0.12)] border border-slate-200 overflow-hidden flex flex-col md:flex-row z-10"
      >
        {/* Left Side: Secure Form */}
        <div className="w-full md:w-1/2 p-10 lg:p-16 flex flex-col justify-center border-r border-slate-50">
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-8">
              <img src="/logo.png" alt="EnergyMate" className="w-10 h-10 rounded-xl" />
              <div className="px-3 py-1 bg-emerald-50 border border-emerald-100 rounded-full flex items-center gap-2">
                 <FiShield className="text-emerald-600 w-3 h-3" />
                 <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">SECURE PORTAL</span>
              </div>
            </div>
            
            <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-tight">Admin Terminal</h1>
            <p className="text-slate-500 font-medium mt-2">Authorized EnergyMate personnel only.</p>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="mb-8 p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-sm font-bold text-center"
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[13px] font-bold text-slate-700 ml-1 uppercase tracking-wider">Admin Identitity</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-emerald-600 transition-colors">
                  <FiMail className="w-5 h-5" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-medium"
                  placeholder="admin@energymate.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[13px] font-bold text-slate-700 ml-1 uppercase tracking-wider">Password</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-emerald-600 transition-colors">
                  <FiLock className="w-5 h-5" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-medium"
                  placeholder="••••••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-5 bg-slate-900 text-white font-black rounded-2xl shadow-xl hover:bg-black hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 flex items-center justify-center gap-3 group disabled:opacity-50 mt-6"
            >
              {isLoading ? (
                <>
                  <span className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Authenticating Authority...</span>
                </>
              ) : (
                <>
                  <span>Initialize Secure Session</span>
                  <FiArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <p className="mt-12 text-center text-slate-400 text-xs font-medium">
             &copy; {new Date().getFullYear()} EnergyMate Admin Operations Center.
          </p>
        </div>

        {/* Right Side: Admin Visual */}
        <div className="hidden md:flex w-1/2 bg-slate-50 items-center justify-center p-12 relative overflow-hidden">
           <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-100/30 rounded-full blur-[100px]" />
           <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-50/20 rounded-full blur-[100px]" />
           
           <motion.div 
            animate={{ 
              y: [0, -12, 0],
              filter: ["drop-shadow(0 15px 30px rgba(16,185,129,0.1))", "drop-shadow(0 25px 45px rgba(16,185,129,0.25))", "drop-shadow(0 15px 30px rgba(16,185,129,0.1))"]
            }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
            className="relative z-10 w-full max-w-sm"
          >
            <img 
              src="/assets/auth_admin_hero.png" 
              alt="Secure Data Vault" 
              className="w-full h-auto object-contain"
            />
          </motion.div>

          <div className="absolute bottom-10 left-10 right-10 p-6 bg-white/40 backdrop-blur-sm border border-white/50 rounded-3xl">
             <div className="flex gap-1.5 mb-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse delay-75" />
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse delay-150" />
             </div>
             <p className="text-[11px] font-bold text-slate-600 uppercase tracking-widest leading-relaxed">
                System Health: Optimal <br />
                Security Layer: Active (AES-256)
             </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminLoginPage;