import React, { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { FiUser, FiMail, FiPhone, FiLock, FiArrowRight, FiArrowLeft } from "react-icons/fi";

const RegisterPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({
    firstName: location.state?.formData?.firstName || "",
    lastName: location.state?.formData?.lastName || "",
    email: location.state?.formData?.email || "",
    phone: location.state?.formData?.phone || "",
    password: location.state?.formData?.password || "",
    confirmPassword: location.state?.formData?.confirmPassword || "",
  });

  const [errors, setErrors] = useState({});

  const validateField = (name, value, allData) => {
    let error = null;
    const nameRegex = /^[A-Za-z]+$/; 

    switch (name) {
      case "firstName":
        if (!value.trim()) error = "First name is required";
        else if (!nameRegex.test(value.trim())) error = "Letters only";
        else if (`${value.trim()} ${allData.lastName.trim()}`.length > 20) error = "Max 20 chars";
        break;
      case "lastName":
        if (!value.trim()) error = "Last name is required";
        else if (!nameRegex.test(value.trim())) error = "Letters only";
        else if (`${allData.firstName.trim()} ${value.trim()}`.length > 20) error = "Max 20 chars";
        break;
      case "email":
        if (!value.trim()) error = "Email is required";
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) error = "Invalid email";
        break;
      case "phone":
        if (!value.trim()) error = "Phone required";
        else if (!/^(0[0-9]{9}|(77|76|74|78|75|71|70|72)[0-9]{7})$/.test(value.replace(/[\s-]/g, ''))) error = "Invalid phone";
        break;
      case "password":
        if (!value) error = "Password required";
        else if (value.length < 8) error = "Min 8 chars";
        else if (!/[a-z]/.test(value)) error = "Needs lowercase";
        else if (!/[A-Z]/.test(value)) error = "Needs uppercase";
        else if (!/\d/.test(value)) error = "Needs number";
        else if (!/[^A-Za-z0-9]/.test(value)) error = "Needs symbol";
        break;
      case "confirmPassword":
        if (!value) error = "Confirm password";
        else if (value !== allData.password) error = "No match";
        break;
      default:
        break;
    }
    return error;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const updatedData = { ...formData, [name]: value };
    setFormData(updatedData);

    const fieldError = validateField(name, value, updatedData);
    setErrors((prevErrors) => ({ ...prevErrors, [name]: fieldError }));
  };

  const handleNext = (e) => {
    e.preventDefault();
    let formIsValid = true;
    const newErrors = {};
    Object.keys(formData).forEach((key) => {
      const err = validateField(key, formData[key], formData);
      if (err) {
        newErrors[key] = err;
        formIsValid = false;
      }
    });

    if (!formIsValid) {
      setErrors(newErrors);
      return;
    }
    navigate("/summary", { state: { formData } });
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: { opacity: 1, x: 0 }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-[-5%] right-[-5%] w-96 h-96 bg-emerald-100/50 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-emerald-100/30 rounded-full blur-3xl animate-pulse delay-700" />

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-6xl w-full bg-white rounded-[2.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.06)] border border-slate-100 overflow-hidden flex flex-col md:flex-row z-10"
      >
        {/* Left Side (Visuals) */}
        <div className="hidden md:flex md:w-5/12 bg-slate-50 items-center justify-center p-12 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 to-transparent opacity-60" />
          <div className="relative z-10 flex flex-col items-center">
            <motion.div
              animate={{ y: [0, -10, 0], rotate: [0, 1, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              className="drop-shadow-[0_25px_45px_rgba(16,185,129,0.18)]"
            >
              <img src="/assets/auth_register_hero.png" alt="Join Network" className="w-full h-auto max-w-[280px]" />
            </motion.div>
            <div className="mt-12 text-center space-y-3 px-4">
              <h3 className="text-xl font-black text-slate-800 tracking-tight leading-tight">Join the Energy Revolution</h3>
              <p className="text-sm text-slate-500 font-medium leading-relaxed">
                Connect your household and start optimizing your energy consumption with smart AI insights.
              </p>
            </div>
          </div>
        </div>

        {/* Right Side (Form) */}
        <div className="w-full md:w-7/12 p-8 lg:p-14">
          {/* Progress Indicator */}
          <div className="flex gap-2 mb-10">
            <div className="h-1.5 flex-1 bg-emerald-600 rounded-full" />
            <div className="h-1.5 flex-1 bg-slate-100 rounded-full" />
            <div className="h-1.5 flex-1 bg-slate-100 rounded-full" />
          </div>

          <div className="mb-10 text-center md:text-left">
            <div className="flex items-center gap-3 mb-6 transition-all">
              <img src="/logo.png" alt="EnergyMate Logo" className="w-10 h-10 rounded-xl shadow-[0_4px_16px_rgba(16,185,129,0.2)]" />
              <h1 className="text-xl font-black text-slate-900 tracking-tighter">
                ENERGYMATE
              </h1>
            </div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-tight">Create Your Account</h2>
            <p className="text-slate-500 font-medium mt-2">Start your journey towards a smarter, greener home.</p>
          </div>

          <form onSubmit={handleNext} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <motion.div variants={itemVariants} className="space-y-2">
                <label className="text-[13px] font-bold text-slate-700 ml-1">First Name</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-emerald-500 transition-colors">
                    <FiUser className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    className={`w-full pl-12 pr-4 py-3.5 bg-slate-50 border ${errors.firstName ? 'border-red-300 ring-2 ring-red-50' : 'border-slate-200'} rounded-2xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-medium`}
                    placeholder="John"
                  />
                </div>
                {errors.firstName && <p className="text-[11px] text-red-500 font-bold ml-1">{errors.firstName}</p>}
              </motion.div>

              <motion.div variants={itemVariants} className="space-y-2">
                <label className="text-[13px] font-bold text-slate-700 ml-1">Last Name</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-emerald-500 transition-colors">
                    <FiUser className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    className={`w-full pl-12 pr-4 py-3.5 bg-slate-50 border ${errors.lastName ? 'border-red-300 ring-2 ring-red-50' : 'border-slate-200'} rounded-2xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-medium`}
                    placeholder="Doe"
                  />
                </div>
                {errors.lastName && <p className="text-[11px] text-red-500 font-bold ml-1">{errors.lastName}</p>}
              </motion.div>
            </div>

            <motion.div variants={itemVariants} className="space-y-2">
              <label className="text-[13px] font-bold text-slate-700 ml-1">Email Address</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-emerald-500 transition-colors">
                  <FiMail className="w-5 h-5" />
                </div>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full pl-12 pr-4 py-3.5 bg-slate-50 border ${errors.email ? 'border-red-300 ring-2 ring-red-50' : 'border-slate-200'} rounded-2xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-medium`}
                  placeholder="john@example.com"
                />
              </div>
              {errors.email && <p className="text-[11px] text-red-500 font-bold ml-1">{errors.email}</p>}
            </motion.div>

            <motion.div variants={itemVariants} className="space-y-2">
              <label className="text-[13px] font-bold text-slate-700 ml-1">Phone Number</label>
              <div className="flex gap-2">
                <div className="flex-shrink-0 w-16 bg-slate-100 border border-slate-200 rounded-2xl flex items-center justify-center font-bold text-slate-700 text-sm">
                  +94
                </div>
                <div className="flex-1 relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-emerald-500 transition-colors">
                    <FiPhone className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className={`w-full pl-12 pr-4 py-3.5 bg-slate-50 border ${errors.phone ? 'border-red-300 ring-2 ring-red-50' : 'border-slate-200'} rounded-2xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-medium`}
                    placeholder="771234567"
                  />
                </div>
              </div>
              {errors.phone && <p className="text-[11px] text-red-500 font-bold ml-1">{errors.phone}</p>}
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <motion.div variants={itemVariants} className="space-y-2">
                <label className="text-[13px] font-bold text-slate-700 ml-1">Password</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-emerald-500 transition-colors">
                    <FiLock className="w-5 h-5" />
                  </div>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className={`w-full pl-12 pr-4 py-3.5 bg-slate-50 border ${errors.password ? 'border-red-300 ring-2 ring-red-50' : 'border-slate-200'} rounded-2xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-medium`}
                    placeholder="••••••••"
                  />
                </div>
                {errors.password && <p className="text-[11px] text-red-500 font-bold ml-1">{errors.password}</p>}
              </motion.div>

              <motion.div variants={itemVariants} className="space-y-2">
                <label className="text-[13px] font-bold text-slate-700 ml-1">Confirm</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-emerald-500 transition-colors">
                    <FiLock className="w-5 h-5" />
                  </div>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className={`w-full pl-12 pr-4 py-3.5 bg-slate-50 border ${errors.confirmPassword ? 'border-red-300 ring-2 ring-red-50' : 'border-slate-200'} rounded-2xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-medium`}
                    placeholder="••••••••"
                  />
                </div>
                {errors.confirmPassword && <p className="text-[11px] text-red-500 font-bold ml-1">{errors.confirmPassword}</p>}
              </motion.div>
            </div>

            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 pt-6">
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="flex-1 py-4 px-6 bg-white border border-slate-200 text-slate-700 font-bold rounded-2xl hover:bg-slate-50 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group"
              >
                <FiArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                <span>Back to Login</span>
              </button>
              <button
                type="submit"
                disabled={Object.values(errors).some(e => e !== null)}
                className="flex-[1.5] py-4 px-6 bg-emerald-600 text-white font-bold rounded-2xl shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>Continue to Summary</span>
                <FiArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </motion.div>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default RegisterPage;