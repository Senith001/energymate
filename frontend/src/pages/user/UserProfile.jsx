import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";
import Navbar from "../../components/Navbar";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FiUser, FiMail, FiPhone, FiMapPin, FiCamera, 
  FiTrash2, FiShield, FiCheckCircle, FiX, FiCheck, FiArrowRight, FiArrowLeft
} from "react-icons/fi";

const UserProfile = () => {
  const { user: authUser, login, logout } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: "", text: "" });

  const [formData, setFormData] = useState({
    name: "", email: "", phone: "", address: "", city: "",
  });
  const [errors, setErrors] = useState({});
  const [userId, setUserId] = useState("");
  const [createdAt, setCreatedAt] = useState("");
  const [avatar, setAvatar] = useState(null);
  
  const [passwordData, setPasswordData] = useState({
    oldPassword: "", newPassword: "", confirmPassword: "",
  });

  const [showSurveyModal, setShowSurveyModal] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  
  const [deleteReason, setDeleteReason] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  
  const [otpValues, setOtpValues] = useState(["", "", "", "", "", ""]);
  const [timeLeft, setTimeLeft] = useState(0); 
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get("/users/me");
        const userData = res.data.user;
        setFormData({
          name: userData.name || "", email: userData.email || "", phone: userData.phone || "",
          address: userData.address || "", city: userData.city || "",
        });
        setUserId(userData.userId || userData.id || "N/A");
        setCreatedAt(userData.createdAt || "");
        if (userData.avatar && userData.avatar.url) setAvatar(userData.avatar.url);
        setLoading(false);
      } catch (err) {
        setMessage({ type: "error", text: "Failed to load profile." });
        setLoading(false);
      }
    };
    fetchProfile();
  }, [authUser]);

  useEffect(() => {
    if (showOtpModal && timeLeft > 0) {
      const timerId = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timerId);
    }
  }, [showOtpModal, timeLeft]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const validateField = (name, value, allData = {}) => {
    let error = null;
    const trimmedVal = typeof value === 'string' ? value.trim() : value;
    switch (name) {
      case "name":
        if (!trimmedVal) error = "Name is required";
        else if (trimmedVal.length > 30) error = "Name must not exceed 30 characters";
        else if (!/^[A-Za-z ]+$/.test(trimmedVal)) error = "Name cannot contain special characters/digits";
        break;
      case "phone":
        if (!trimmedVal) error = "Mobile number is required";
        else if (!/^(0[0-9]{9}|(77|76|74|78|75|71|70)[0-9]{7})$/.test(trimmedVal)) error = "Invalid mobile number";
        break;
      case "address":
        if (!trimmedVal) error = "Address is required";
        else if (trimmedVal.length > 100) error = "Address must not exceed 100 characters";
        else if (!/^[A-Za-z0-9/\-, ]+$/.test(trimmedVal)) error = "Address can only contain letters, numbers, '/', and '-'";
        break;
      case "city":
        if (!trimmedVal) error = "City is required";
        else if (trimmedVal.length > 50) error = "City must not exceed 50 characters";
        else if (!/^[A-Za-z ]+$/.test(trimmedVal)) error = "City can only contain English letters and spaces";
        break;
      case "oldPassword":
        if (!value && (allData.newPassword || allData.confirmPassword)) error = "Old password is required";
        break;
      case "newPassword":
        if (value) {
          if (value.length < 8) error = "Password must be at least 8 characters long";
          else if (!/[a-z]/.test(value)) error = "Password must contain at least one lowercase letter";
          else if (!/[A-Z]/.test(value)) error = "Password must contain at least one uppercase letter";
          else if (!/\d/.test(value)) error = "Password must contain at least one number";
          else if (!/[^A-Za-z0-9]/.test(value)) error = "Password must contain at least one special character";
        }
        break;
      case "confirmPassword":
        if (value && value !== allData.newPassword) error = "Passwords must match";
        break;
      default:
        break;
    }
    return error;
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    const updatedForm = { ...formData, [name]: value };
    setFormData(updatedForm);
    setErrors((prev) => ({ ...prev, [name]: validateField(name, value, updatedForm) }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    const updatedPwdData = { ...passwordData, [name]: value };
    setPasswordData(updatedPwdData);
    setErrors((prev) => ({ ...prev, [name]: validateField(name, value, updatedPwdData) }));
  };

  const handleSaveChanges = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const { email, ...updateData } = formData;
      const profileRes = await api.put("/users/me", updateData);
      login(profileRes.data.user, localStorage.getItem("token"));
      
      if (passwordData.oldPassword && passwordData.newPassword) {
        await api.put("/users/me/change-password", { 
          oldPassword: passwordData.oldPassword, 
          newPassword: passwordData.newPassword 
        });
        setPasswordData({ oldPassword: "", newPassword: "", confirmPassword: "" });
      }
      setMessage({ type: "success", text: "Profile updated successfully!" });
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.message || "Update failed." });
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const uploadData = new FormData();
    uploadData.append("avatar", file);
    try {
      const res = await api.put("/users/me/avatar", uploadData, { headers: { "Content-Type": "multipart/form-data" }});
      setAvatar(res.data.avatar.url);
      login({ ...authUser, avatar: res.data.avatar.url }, localStorage.getItem("token"));
      setShowAvatarModal(false);
    } catch (err) {
      setMessage({ type: "error", text: "Upload failed." });
    }
  };

  const handleDeleteAvatar = async () => {
    try {
      await api.delete("/users/me/avatar");
      setAvatar(null);
      login({ ...authUser, avatar: null }, localStorage.getItem("token"));
      setShowAvatarModal(false);
    } catch (err) {
      setMessage({ type: "error", text: "Failed to remove photo." });
    }
  };

  const handleRequestDeletion = async () => {
    if (!termsAccepted) return;
    setIsDeleting(true);
    try {
      await api.post("/users/me/delete-request");
      setShowSurveyModal(false);
      setShowOtpModal(true);
      setTimeLeft(600);
      setOtpValues(["", "", "", "", "", ""]);
    } catch (err) {
      alert("Failed to initiate deletion.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOtpInput = (e, index) => {
    const val = e.target.value;
    if (/[^0-9]/.test(val)) return; 
    const newOtp = [...otpValues];
    newOtp[index] = val;
    setOtpValues(newOtp);
    if (val && index < 5) document.getElementById(`otp-${index + 1}`).focus();
  };

  const handleConfirmDeletion = async () => {
    const otpString = otpValues.join("");
    if (otpString.length !== 6) return;
    setIsDeleting(true);
    try {
      await api.delete("/users/me/delete-confirm", { data: { otp: otpString } });
      logout();
      navigate("/login");
    } catch (err) {
      alert("Invalid OTP or deletion failed.");
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-emerald-600 font-black">
       <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} className="mb-4 text-4xl">🌱</motion.div>
       Syncing Profile...
    </div>
  );

  return (
    <div className="min-h-screen font-inter" style={{ background: "#f3f4f6" }}>
      <div style={{ padding: "30px", boxSizing: "border-box", overflowX: "auto", minHeight: "100vh" }}>
        <Navbar />
        
        <div className="max-w-5xl mx-auto pt-8 pb-12">
          <div className="mb-6">
            <Link to="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-emerald-600 font-black text-[13px] uppercase tracking-widest transition-colors">
              <FiArrowLeft className="w-4 h-4" /> Back to Dashboard
            </Link>
          </div>

          {/* HEADER CARD */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-[0_4px_30px_rgba(0,0,0,0.03)] border border-slate-100 mb-12 flex flex-col md:flex-row items-center justify-between gap-10"
        >
          <div className="flex flex-col md:flex-row items-center gap-10">
             <div className="relative group cursor-pointer" onClick={() => setShowAvatarModal(true)}>
                <div className="w-32 h-32 rounded-[2.5rem] bg-slate-100 border-4 border-white shadow-xl overflow-hidden">
                   {avatar ? (
                     <img src={avatar} alt="Profile" className="w-full h-full object-cover" />
                   ) : (
                     <div className="w-full h-full flex items-center justify-center text-slate-300">
                        <FiUser className="w-16 h-16" />
                     </div>
                   )}
                </div>
                <div className="absolute inset-0 bg-emerald-600/60 rounded-[2.5rem] opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center text-white scale-95 group-hover:scale-100">
                   <FiCamera className="w-8 h-8" />
                </div>
             </div>
             <div className="text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-4 mb-2">
                   <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">{formData.name}</h1>
                   <div className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100 flex items-center gap-1.5">
                      <FiCheckCircle /> Verified Member
                   </div>
                </div>
                <p className="text-slate-400 font-bold mb-4">Member ID: <span className="text-slate-900">{userId}</span></p>
                
             </div>
          </div>
          
          <div className="text-center md:text-right hidden lg:block">
             <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">Joined EnergyMate</p>
             <p className="text-lg font-black text-slate-900 italic">
                {createdAt ? new Date(createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : "Recently"}
             </p>
          </div>
        </motion.div>

        {/* FEEDBACK ALERT */}
        <AnimatePresence>
          {message.text && (
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className={`p-5 rounded-2xl border mb-10 flex items-center gap-4 ${message.type === "success" ? "bg-emerald-50 border-emerald-100 text-emerald-700" : "bg-rose-50 border-rose-100 text-rose-700"}`}
            >
               {message.type === "success" ? <FiCheckCircle className="w-6 h-6" /> : <FiX className="w-6 h-6" />}
               <span className="font-black text-sm">{message.text}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* CONTENT SECTIONS */}
        <div className="w-full">
          {/* Main Form */}
          <div className="w-full space-y-12">
            <form onSubmit={handleSaveChanges} className="space-y-12">
              <section className="space-y-8">
                <div className="flex items-center gap-3">
                   <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Personal Details</h2>
                   <div className="h-px flex-1 bg-slate-100" />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Name</label>
                    <div className="relative group">
                       <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors" />
                       <input name="name" value={formData.name} onChange={handleProfileChange} className={`w-full pl-12 pr-4 py-4 bg-white border ${errors.name ? 'border-rose-300 ring-4 ring-rose-50' : 'border-slate-200'} rounded-2xl focus:outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/10 font-bold text-slate-900 transition-all`} />
                    </div>
                    {errors.name && <p className="text-[10px] text-rose-500 font-black ml-1 uppercase">{errors.name}</p>}
                  </div>
                  
                  <div className="space-y-2 opacity-60">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Verified Email</label>
                    <div className="relative">
                       <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                       <input value={formData.email} disabled className="w-full pl-12 pr-4 py-4 bg-slate-100 border border-slate-200 rounded-2xl font-bold text-slate-900 cursor-not-allowed" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Contact Number</label>
                    <div className="relative group">
                       <FiPhone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors" />
                       <input name="phone" value={formData.phone} onChange={handleProfileChange} className={`w-full pl-12 pr-4 py-4 bg-white border ${errors.phone ? 'border-rose-300 ring-4 ring-rose-50' : 'border-slate-200'} rounded-2xl focus:outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/10 font-bold text-slate-900 transition-all`} />
                    </div>
                    {errors.phone && <p className="text-[10px] text-rose-500 font-black ml-1 uppercase">{errors.phone}</p>}
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">City</label>
                    <div className="relative group">
                       <FiMapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors" />
                       <input name="city" value={formData.city} onChange={handleProfileChange} className={`w-full pl-12 pr-4 py-4 bg-white border ${errors.city ? 'border-rose-300 ring-4 ring-rose-50' : 'border-slate-200'} rounded-2xl focus:outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/10 font-bold text-slate-900 transition-all`} />
                    </div>
                    {errors.city && <p className="text-[10px] text-rose-500 font-black ml-1 uppercase">{errors.city}</p>}
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Home Address</label>
                    <div className="relative group">
                       <FiMapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors" />
                       <input name="address" value={formData.address} onChange={handleProfileChange} className={`w-full pl-12 pr-4 py-4 bg-white border ${errors.address ? 'border-rose-300 ring-4 ring-rose-50' : 'border-slate-200'} rounded-2xl focus:outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/10 font-bold text-slate-900 transition-all`} />
                    </div>
                    {errors.address && <p className="text-[10px] text-rose-500 font-black ml-1 uppercase">{errors.address}</p>}
                  </div>
                </div>
              </section>

              <section className="space-y-8 bg-white border border-slate-200 rounded-[2.5rem] p-8 md:p-12 overflow-hidden relative shadow-sm">
                 <div className="flex items-center gap-3 relative z-10">
                    <h2 className="text-xl font-black uppercase tracking-tighter text-slate-900">Change Passkey</h2>
                    <div className="h-px flex-1 bg-slate-100" />
                 </div>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-3 gap-6 relative z-10">
                   {['oldPassword', 'newPassword', 'confirmPassword'].map((field, i) => (
                      <div key={i} className="space-y-1.5">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                            {field === 'oldPassword' ? 'Current Access' : field === 'newPassword' ? 'Next Key' : 'Verify Key'}
                         </label>
                         <input 
                          type="password" name={field} value={passwordData[field]} onChange={handlePasswordChange}
                          autoComplete="off"
                          className={`w-full px-5 py-4 bg-white border ${errors[field] ? 'border-rose-300 ring-4 ring-rose-50' : 'border-slate-200'} rounded-2xl focus:outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/10 transition-all font-bold text-slate-900 placeholder:text-slate-300`} 
                          placeholder="••••••••"
                        />
                        {errors[field] && <p className="text-[9px] text-rose-500 font-black uppercase ml-1">{errors[field]}</p>}
                      </div>
                   ))}
                 </div>
              </section>

              <div className="flex items-center justify-between gap-6 pt-10 border-t border-slate-200">
                 <button 
                  type="button" 
                  onClick={() => setShowSurveyModal(true)}
                  className="flex items-center gap-2.5 px-6 py-4 text-slate-400 hover:text-rose-600 font-black text-xs uppercase tracking-widest transition-all group"
                >
                   <FiTrash2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
                   Delete Account
                </button>
                <button 
                  type="submit" 
                  disabled={isSaving || Object.values(errors).some(e => e !== null)}
                  className="flex-1 max-w-xs py-5 bg-emerald-600 text-white font-black rounded-3xl shadow-xl shadow-emerald-200 hover:bg-emerald-700 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                >
                   {isSaving ? (
                     <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Applying Changes...</span>
                     </>
                   ) : (
                     <>
                        <span>Save Changes</span>
                     </>
                   )}
                </button>
              </div>
            </form>
          </div>


        </div>
      </div>

      {/* --- MODALS --- */}
      <AnimatePresence>
        {/* AVATAR MODAL */}
        {showAvatarModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAvatarModal(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="relative w-full max-w-sm bg-white rounded-[2.5rem] p-8 shadow-2xl flex flex-col items-center">
              <div className="w-32 h-32 rounded-[2.5rem] bg-slate-50 border-4 border-slate-100 overflow-hidden mb-8 shadow-lg">
                {avatar ? <img src={avatar} alt="Profile" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-300"><FiUser className="w-12 h-12" /></div>}
              </div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-2 italic">Profile Photo</h3>
              <p className="text-slate-400 font-bold text-sm mb-10 text-center uppercase tracking-widest">Update your visual ID</p>
              
              <div className="w-full space-y-3">
                <button onClick={() => fileInputRef.current.click()} className="w-full py-4 bg-emerald-600 text-white font-black rounded-2xl shadow-xl shadow-emerald-200 hover:bg-emerald-700 transition-all">
                  {avatar ? "Change Photo" : "Upload Photo"}
                </button>
                {avatar && <button onClick={handleDeleteAvatar} className="w-full py-4 bg-rose-50 text-rose-600 font-black rounded-2xl hover:bg-rose-100 transition-all">Remove Current</button>}
                <button onClick={() => setShowAvatarModal(false)} className="w-full py-4 text-slate-400 font-black text-xs uppercase tracking-widest">Close Window</button>
              </div>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
            </motion.div>
          </div>
        )}

        {/* DELETE SURVEY MODAL */}
        {showSurveyModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowSurveyModal(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="relative w-full max-w-lg bg-white rounded-[2.5rem] overflow-hidden shadow-2xl">
              <div className="bg-rose-600 p-10 text-white relative">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10" />
                 <h2 className="text-3xl font-black tracking-tight italic mb-2">Wait!</h2>
                 <p className="text-white/80 font-bold opacity-80 uppercase tracking-widest text-[10px]">Deleting Account Identity</p>
              </div>
              <div className="p-10 space-y-8">
                <div className="space-y-4">
                  <p className="text-slate-900 font-black text-sm uppercase tracking-tight">Why are you leaving the ecosystem?</p>
                  <select value={deleteReason} onChange={(e) => setDeleteReason(e.target.value)} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-900 outline-none focus:border-rose-600 transition-all">
                    <option value="">Select a reason</option>
                    <option value="privacy">Security Concerns</option>
                    <option value="not_useful">Energy module not required</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-3">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Critical Notice</p>
                   <p className="text-xs font-bold text-slate-600 italic">● Your Energy logs and household telemetry will be permanently deleted.</p>
                   <p className="text-xs font-bold text-slate-600 italic">● Membership payments are non-refundable.</p>
                </div>
                <label className="flex items-center gap-4 cursor-pointer group">
                  <div className={`w-7 h-7 rounded-xl border-2 flex items-center justify-center transition-all ${termsAccepted ? 'bg-rose-600 border-rose-600' : 'bg-white border-slate-200 group-hover:border-rose-300'}`}>
                    {termsAccepted && <FiCheck className="text-white w-4 h-4" />}
                  </div>
                  <input type="checkbox" className="hidden" checked={termsAccepted} onChange={(e) => setTermsAccepted(e.target.checked)} />
                  <span className="text-xs font-black text-slate-900 uppercase tracking-tight">I accept account finality</span>
                </label>
                <div className="flex gap-4">
                  <button onClick={() => setShowSurveyModal(false)} className="flex-1 py-4 bg-slate-100 text-slate-900 font-black rounded-2xl hover:bg-slate-200 transition-all">Keep Profile</button>
                  <button onClick={handleRequestDeletion} disabled={!termsAccepted || isDeleting} className="flex-[1.5] py-4 bg-rose-600 text-white font-black rounded-2xl shadow-xl shadow-rose-200 hover:bg-rose-700 transition-all disabled:opacity-50">
                    {isDeleting ? "Processing..." : "Purge Account"}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* OTP MODAL */}
        {showOtpModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowOtpModal(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="relative w-full max-w-md bg-white rounded-[3rem] p-10 shadow-2xl flex flex-col items-center">
              <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-600 mb-8 animate-pulse"><FiShield className="w-8 h-8" /></div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tighter mb-4 italic">Security Check</h2>
              <p className="text-slate-500 font-bold text-sm mb-10 text-center px-4 leading-relaxed">Enter the 6-digit identity code sent to your registered email to confirm deletion.</p>
              
              <div className="flex justify-center gap-3 mb-10">
                {otpValues.map((val, index) => (
                  <input key={index} id={`otp-${index}`} type="text" maxLength="1" value={val} onChange={(e) => handleOtpInput(e, index)} className="w-12 h-16 text-2xl font-black text-center bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-rose-600 focus:bg-white outline-none transition-all" />
                ))}
              </div>

              <div className="w-full space-y-6">
                <div className="flex items-center justify-center gap-2 text-[10px] font-black text-slate-400 tracking-widest uppercase">
                   <FiCheckCircle className={timeLeft <= 30 ? 'text-rose-500' : 'text-emerald-500'} />
                   CODE EXPIRES IN {formatTime(timeLeft)}
                </div>
                <button onClick={handleConfirmDeletion} disabled={isDeleting || otpValues.join("").length !== 6} className="w-full py-5 bg-rose-600 text-white font-black rounded-3xl shadow-xl shadow-rose-200 hover:bg-rose-700 active:scale-[0.98] transition-all disabled:opacity-50">
                   {isDeleting ? "Finalizing..." : "Destroy Account Forever"}
                </button>
                <div className="text-center">
                  <button onClick={handleRequestDeletion} disabled={timeLeft > 0} className="text-[10px] font-black text-slate-400 hover:text-rose-600 uppercase tracking-widest disabled:opacity-30">Re-send Identity Code</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
    </div>
  );
};

export default UserProfile;