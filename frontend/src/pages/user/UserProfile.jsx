import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";
import Navbar from "../../components/Navbar";

// Import the Bootstrap Person icon
import { BsPersonFill } from "react-icons/bs";

const UserProfile = () => {
  const { user: authUser, login, logout } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // --- STATES ---
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

  // --- MODAL FLOW STATES ---
  const [showSurveyModal, setShowSurveyModal] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  
  const [deleteReason, setDeleteReason] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  
  const [otpValues, setOtpValues] = useState(["", "", "", "", "", ""]);
  const [timeLeft, setTimeLeft] = useState(0); 
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // --- FETCH DATA ---
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

  // --- OTP TIMER LOGIC ---
  useEffect(() => {
    if (showOtpModal && timeLeft > 0) {
      const timerId = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timerId);
    }
  }, [showOtpModal, timeLeft]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m : ${s < 10 ? '0' : ''}${s}s`;
  };

  // --- REAL-TIME VALIDATION ENGINE ---
  // ✅ Upgraded to accept allData so it can compare passwords
  const validateField = (name, value, allData = {}) => {
    let error = null;
    switch (name) {
      // Profile Validations
      case "name":
        if (!value.trim()) error = "Name is required";
        else if (value.trim().length > 30) error = "Must not exceed 30 characters";
        else if (!/^[A-Za-z ]+$/.test(value.trim())) error = "Only letters and spaces allowed";
        break;
      case "phone":
        if (!value.trim()) error = "Mobile number is required";
        else if (!/^(0[0-9]{9}|(77|76|74|78|75|71|70|72)[0-9]{7})$/.test(value.trim())) error = "Invalid mobile number";
        break;
      case "address":
        if (!value.trim()) error = "Address is required";
        else if (!/^[A-Za-z0-9/\-, ]+$/.test(value.trim())) error = "Invalid characters in address";
        else if (value.trim().length > 100) error = "Must not exceed 100 characters";
        break;
      case "city":
        if (!value.trim()) error = "City is required";
        else if (value.trim().length > 50) error = "Must not exceed 50 characters";
        else if (!/^[A-Za-z ]+$/.test(value.trim())) error = "Only English letters allowed";
        break;
        
      // Password Validations
      case "oldPassword":
        if (!value && (allData.newPassword || allData.confirmPassword)) {
          error = "Current password is required to change it";
        }
        break;
      case "newPassword":
        if (value && value.length < 6) {
          error = "Must be at least 6 characters";
        }
        break;
      case "confirmPassword":
        if (value && value !== allData.newPassword) {
          error = "Passwords do not match";
        }
        break;
      default:
        break;
    }
    return error;
  };

  // --- INPUT HANDLERS ---
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    const updatedForm = { ...formData, [name]: value };
    setFormData(updatedForm);
    
    const fieldError = validateField(name, value, updatedForm);
    setErrors((prev) => ({ ...prev, [name]: fieldError }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    const updatedPwdData = { ...passwordData, [name]: value };
    setPasswordData(updatedPwdData);
    
    // Validate current field
    const fieldError = validateField(name, value, updatedPwdData);
    setErrors((prev) => ({ ...prev, [name]: fieldError }));

    // Re-validate confirm password automatically if new password changes
    if (name === "newPassword" && updatedPwdData.confirmPassword) {
      const confirmError = validateField("confirmPassword", updatedPwdData.confirmPassword, updatedPwdData);
      setErrors((prev) => ({ ...prev, confirmPassword: confirmError }));
    }
  };

  // --- SAVE CHANGES HANDLER ---
  const handleSaveChanges = async (e) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });
    setIsSaving(true);

    let formIsValid = true;
    const newErrors = {};
    
    // 1. Re-run Profile validations
    Object.keys(formData).forEach((key) => {
      if(key === "email") return;
      const err = validateField(key, formData[key], formData);
      if (err) {
        newErrors[key] = err;
        formIsValid = false;
      }
    });

    // 2. Re-run Password validations
    const isChangingPassword = passwordData.oldPassword || passwordData.newPassword || passwordData.confirmPassword;
    if (isChangingPassword) {
      Object.keys(passwordData).forEach((key) => {
        const err = validateField(key, passwordData[key], passwordData);
        if (err) {
          newErrors[key] = err;
          formIsValid = false;
        }
      });
      // Final hard check to block submission if fields are missing
      if (!passwordData.oldPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
        formIsValid = false;
        if (!passwordData.oldPassword) newErrors.oldPassword = "Required to change password";
        if (!passwordData.newPassword) newErrors.newPassword = "Required";
        if (!passwordData.confirmPassword) newErrors.confirmPassword = "Required";
      }
    }

    if (!formIsValid) {
      setErrors((prev) => ({ ...prev, ...newErrors }));
      setIsSaving(false);
      return setMessage({ type: "error", text: "Please fix the errors below before saving." });
    }

    try {
      const { email, ...updateData } = formData;
      const profileRes = await api.put("/users/me", updateData);
      login(profileRes.data.user, localStorage.getItem("token"));
      
      let successMsg = "Profile updated successfully!";

      if (isChangingPassword) {
        await api.put("/users/me/change-password", { 
          oldPassword: passwordData.oldPassword, 
          newPassword: passwordData.newPassword 
        });
        successMsg = "Profile and password updated successfully!";
        setPasswordData({ oldPassword: "", newPassword: "", confirmPassword: "" }); 
      }

      setMessage({ type: "success", text: successMsg });

    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.message || "Failed to save changes. Please try again." });
    } finally {
      setIsSaving(false);
    }
  };

  // --- AVATAR MANAGEMENT LOGIC ---
  const handleAvatarClick = () => setShowAvatarModal(true);
  const handleUpdateAvatarClick = () => fileInputRef.current.click();

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const uploadData = new FormData();
    uploadData.append("avatar", file);
    try {
      const res = await api.put("/users/me/avatar", uploadData, { headers: { "Content-Type": "multipart/form-data" }});
      if (res.data.avatar && res.data.avatar.url) {
        setAvatar(res.data.avatar.url);
        login({ ...authUser, avatar: res.data.avatar.url }, localStorage.getItem("token"));
      }
      setMessage({ type: "success", text: "Avatar updated!" });
      setShowAvatarModal(false);
    } catch (err) {
      setMessage({ type: "error", text: "Avatar upload failed." });
    }
  };

  const handleDeleteAvatar = async () => {
    try {
      await api.delete("/users/me/avatar");
      setAvatar(null); 
      login({ ...authUser, avatar: null }, localStorage.getItem("token")); 
      setMessage({ type: "success", text: "Avatar removed successfully." });
      setShowAvatarModal(false); 
    } catch (err) {
      setMessage({ type: "error", text: "Failed to remove avatar." });
    }
  };

  // --- ACCOUNT DELETION LOGIC ---
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
      alert(err.response?.data?.message || "Failed to initiate deletion.");
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

  const handleOtpKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otpValues[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`).focus();
    }
  };

  const handleConfirmDeletion = async () => {
    const otpString = otpValues.join("");
    if (otpString.length !== 6) return alert("Please enter the full 6-digit OTP.");
    
    setIsDeleting(true);
    try {
      await api.delete("/users/me/delete-confirm", { data: { otp: otpString } });
      alert("Your account has been permanently deleted.");
      logout();
      navigate("/login"); 
    } catch (err) {
      alert(err.response?.data?.message || "Invalid OTP or deletion failed.");
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) return <div style={{ padding: "50px", textAlign: "center" }}>Loading...</div>;

  return (
    <div style={styles.fullPage}>
      <div style={styles.pageContainer}>
        <Navbar />
        
        {/* TOP HEADER CARD */}
        <div style={styles.topCard}>
          <div style={styles.userInfoWrapper}>
            <div style={styles.avatarWrapper} onMouseEnter={(e) => e.currentTarget.childNodes[1].style.opacity = 1} onMouseLeave={(e) => e.currentTarget.childNodes[1].style.opacity = 0}>
              {avatar ? (
                <img src={avatar} alt="Profile" style={styles.avatar} onClick={handleAvatarClick} />
              ) : (
                <div style={styles.defaultAvatarIcon} onClick={handleAvatarClick}>
                  <BsPersonFill size={60} color="#9ca3af" />
                </div>
              )}
              <div style={styles.avatarOverlay} onClick={handleAvatarClick}>Edit</div>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} style={{ display: "none" }} accept="image/*" />
            </div>
            
            <div style={styles.userDetails}>
              <h1 style={styles.userName}>{formData.name.toUpperCase()}</h1>
              <p style={styles.userMeta}>Member ID : {userId}</p>
              <p style={styles.userMeta}>Registration date : {createdAt ? new Date(createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : "N/A"}</p>
              <div style={styles.statusBadge}>✓ Active Member</div>
            </div>
          </div>
          <div style={styles.statsWidget}>
            <div style={styles.statsIcon}>⚡</div>
            <div>
              <h3 style={{ margin: 0, color: "#111827" }}>EnergyMate</h3>
              <p style={{ margin: 0, fontSize: "12px", color: "#6b7280" }}>Standard Account</p>
            </div>
          </div>
        </div>

        {message.text && (
          <div style={{ ...styles.alert, backgroundColor: message.type === "success" ? "#dcfce7" : "#fee2e2", color: message.type === "success" ? "#166534" : "#991b1b" }}>
            {message.text}
          </div>
        )}

        {/* MAIN CONTENT AREA */}
        <div style={styles.contentArea}>
          
          <form onSubmit={handleSaveChanges}>
            
            {/* 1. PROFILE SECTION */}
            <h2 style={styles.sectionTitle}>Personal Information</h2>
            <div style={styles.formGrid}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Full name</label>
                <input name="name" value={formData.name} onChange={handleProfileChange} style={{...styles.input, borderColor: errors.name ? "#ef4444" : "#d1d5db", backgroundColor: errors.name ? "#fef2f2" : "white"}} />
                {errors.name && <span style={styles.errorText}>{errors.name}</span>}
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Email (Read Only)</label>
                <input value={formData.email} disabled style={{ ...styles.input, backgroundColor: "#f3f4f6" }} />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Phone Number</label>
                <input name="phone" value={formData.phone} onChange={handleProfileChange} style={{...styles.input, borderColor: errors.phone ? "#ef4444" : "#d1d5db", backgroundColor: errors.phone ? "#fef2f2" : "white"}} />
                {errors.phone && <span style={styles.errorText}>{errors.phone}</span>}
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>City</label>
                <input name="city" value={formData.city} onChange={handleProfileChange} style={{...styles.input, borderColor: errors.city ? "#ef4444" : "#d1d5db", backgroundColor: errors.city ? "#fef2f2" : "white"}} />
                {errors.city && <span style={styles.errorText}>{errors.city}</span>}
              </div>
              <div style={{ ...styles.inputGroup, gridColumn: "span 2" }}>
                <label style={styles.label}>Address</label>
                <input name="address" value={formData.address} onChange={handleProfileChange} style={{...styles.input, borderColor: errors.address ? "#ef4444" : "#d1d5db", backgroundColor: errors.address ? "#fef2f2" : "white"}} />
                {errors.address && <span style={styles.errorText}>{errors.address}</span>}
              </div>
            </div>

            {/* 2. PASSWORD SECTION */}
            <div style={styles.passwordSection}>
              <h2 style={styles.sectionTitle}>Change Password <span style={{fontSize: "13px", color: "#6b7280", fontWeight: "normal"}}>(Optional)</span></h2>
              <div style={styles.passwordGrid}>
                
                {/* ✅ Dynamic Error Borders & Text added to Password Inputs */}
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Current password</label>
                  <input type="password" name="oldPassword" value={passwordData.oldPassword} onChange={handlePasswordChange} style={{...styles.input, borderColor: errors.oldPassword ? "#ef4444" : "#d1d5db", backgroundColor: errors.oldPassword ? "#fef2f2" : "white"}} />
                  {errors.oldPassword && <span style={styles.errorText}>{errors.oldPassword}</span>}
                </div>
                
                <div style={styles.inputGroup}>
                  <label style={styles.label}>New password</label>
                  <input type="password" name="newPassword" value={passwordData.newPassword} onChange={handlePasswordChange} style={{...styles.input, borderColor: errors.newPassword ? "#ef4444" : "#d1d5db", backgroundColor: errors.newPassword ? "#fef2f2" : "white"}} />
                  {errors.newPassword && <span style={styles.errorText}>{errors.newPassword}</span>}
                </div>
                
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Confirm new password</label>
                  <input type="password" name="confirmPassword" value={passwordData.confirmPassword} onChange={handlePasswordChange} style={{...styles.input, borderColor: errors.confirmPassword ? "#ef4444" : "#d1d5db", backgroundColor: errors.confirmPassword ? "#fef2f2" : "white"}} />
                  {errors.confirmPassword && <span style={styles.errorText}>{errors.confirmPassword}</span>}
                </div>

              </div>
            </div>

            {/* 3. BOTTOM ACTION ROW */}
            <div style={{ ...styles.actionRow, marginTop: "40px" }}>
              <button type="button" onClick={() => setShowSurveyModal(true)} style={styles.deleteBtn}>Account Delete</button>
              
              <button type="submit" disabled={isSaving || Object.values(errors).some(err => err !== null)} style={{...styles.saveChangesBtn, opacity: (isSaving || Object.values(errors).some(err => err !== null)) ? 0.7 : 1}}>
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
            
          </form>

        </div>
      </div>

      {/* ========================================= */}
      {/* AVATAR OPTIONS MODAL                        */}
      {/* ========================================= */}
      {showAvatarModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContentSmall}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h2 style={{ margin: 0, fontSize: "20px", color: "#1f2937" }}>Profile Photo</h2>
              <button onClick={() => setShowAvatarModal(false)} style={{ background: "none", border: "none", fontSize: "24px", cursor: "pointer", color: "#6b7280" }}>✕</button>
            </div>
            
            <div style={{ display: "flex", justifyContent: "center", marginBottom: "25px" }}>
              {avatar ? (
                <img 
                  src={avatar} 
                  alt="Profile Preview" 
                  style={{ width: "120px", height: "120px", borderRadius: "50%", objectFit: "cover", border: "4px solid #f3f4f6", boxShadow: "0 4px 6px rgba(0,0,0,0.05)" }} 
                />
              ) : (
                <div style={styles.defaultAvatarModalIcon}>
                  <BsPersonFill size={80} color="#9ca3af" />
                </div>
              )}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <button onClick={handleUpdateAvatarClick} style={styles.updateBtnFull}>
                {avatar ? "Update Photo" : "Upload Photo"}
              </button>
              {avatar && (
                <button onClick={handleDeleteAvatar} style={styles.dangerBtnFull}>Remove Photo</button>
              )}
              <button onClick={() => setShowAvatarModal(false)} style={styles.outlineBtnFull}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================= */}
      {/* SURVEY MODAL (Reason & Terms)               */}
      {/* ========================================= */}
      {showSurveyModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeaderSurvey}>
              <h2 style={{ margin: 0, fontSize: "18px" }}>Delete Profile</h2>
            </div>
            <div style={{ padding: "25px" }}>
              <p style={{ color: "#4b5563", fontSize: "15px", marginBottom: "20px" }}>
                We want to understand how to improve your experience. Why are you deleting your EnergyMate account?
              </p>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Reason <span style={{color: "red"}}>*</span></label>
                <select value={deleteReason} onChange={(e) => setDeleteReason(e.target.value)} style={{...styles.input, backgroundColor: "white"}}>
                  <option value="">Select an item</option>
                  <option value="privacy">Privacy concerns</option>
                  <option value="not_useful">No longer useful</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div style={styles.termsBox}>
                <p>By accepting these conditions you acknowledge your profile data and related history details will be removed from EnergyMate.</p>
                <p>Please note that your history details are non-recoverable.</p>
                <p>If you have made any payment related to your membership, we are not liable to refund your money back.</p>
              </div>
              <label style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "20px", cursor: "pointer", fontWeight: "600", color: "#374151" }}>
                <input type="checkbox" checked={termsAccepted} onChange={(e) => setTermsAccepted(e.target.checked)} style={{ width: "18px", height: "18px" }} />
                I Accept the Terms & Conditions
              </label>
              <div style={{ display: "flex", gap: "15px", marginTop: "30px" }}>
                <button onClick={() => setShowSurveyModal(false)} style={styles.outlineBtnFull}>Cancel</button>
                <button onClick={handleRequestDeletion} disabled={!termsAccepted || isDeleting} style={{...styles.dangerBtnFull, opacity: termsAccepted ? 1 : 0.5}}>
                  {isDeleting ? "Sending..." : "Account Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================= */}
      {/* OTP VALIDATION MODAL                        */}
      {/* ========================================= */}
      {showOtpModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContentOtp}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
              <h2 style={{ margin: 0, fontSize: "22px", color: "#1e3a8a" }}>Enter your OTP</h2>
              <button onClick={() => setShowOtpModal(false)} style={{ background: "none", border: "none", fontSize: "24px", cursor: "pointer", color: "#6b7280" }}>✕</button>
            </div>
            <p style={{ color: "#6b7280", marginBottom: "20px" }}>We have sent an OTP code to your registered email address.</p>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#9ca3af", fontWeight: "600", marginBottom: "20px" }}>
              ⏱️ <span>OTP expire in {formatTime(timeLeft)}</span>
            </div>
            <div style={{ display: "flex", gap: "10px", justifyContent: "space-between", marginBottom: "25px" }}>
              {otpValues.map((val, index) => (
                <input
                  key={index} id={`otp-${index}`} type="text" maxLength="1" value={val}
                  onChange={(e) => handleOtpInput(e, index)} onKeyDown={(e) => handleOtpKeyDown(e, index)}
                  style={styles.otpInput}
                />
              ))}
            </div>
            <p style={{ color: "#6b7280", marginBottom: "30px" }}>
              Didn't receive? <button onClick={handleRequestDeletion} disabled={timeLeft > 0} style={{ background: "none", border: "none", color: timeLeft > 0 ? "#9ca3af" : "#1e3a8a", fontWeight: "bold", cursor: timeLeft > 0 ? "default" : "pointer" }}>Resend OTP</button>
            </p>
            <button onClick={handleConfirmDeletion} disabled={isDeleting} style={styles.verifyBtnFull}>
              {isDeleting ? "Verifying..." : "Verify"}
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

// --- STYLES ---
const styles = {
  fullPage: { minHeight: "100vh", backgroundColor: "#f8fafc" },
  pageContainer: { maxWidth: "1000px", margin: "0 auto", padding: "40px 20px", fontFamily: "'Inter', sans-serif" },
  topCard: { backgroundColor: "white", borderRadius: "20px", padding: "30px", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 4px 20px rgba(0,0,0,0.03)", border: "1px solid #e2e8f0", marginBottom: "30px" },
  userInfoWrapper: { display: "flex", alignItems: "center", gap: "25px" },
  avatarWrapper: { position: "relative", width: "100px", height: "100px", cursor: "pointer" },
  avatar: { width: "100%", height: "100%", borderRadius: "20px", objectFit: "cover", boxShadow: "0 4px 10px rgba(0,0,0,0.05)", border: "2px solid #ecfdf5" },
  defaultAvatarIcon: { width: "100%", height: "100%", borderRadius: "20px", backgroundColor: "#f1f5f9", display: "flex", justifyContent: "center", alignItems: "center", border: "1px solid #e2e8f0" },
  defaultAvatarModalIcon: { width: "120px", height: "120px", borderRadius: "50%", backgroundColor: "#f1f5f9", display: "flex", justifyContent: "center", alignItems: "center", border: "4px solid #ecfdf5" },
  avatarOverlay: { position: "absolute", top: 0, left: 0, width: "100%", height: "100%", borderRadius: "20px", backgroundColor: "rgba(16,185,129,0.8)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", opacity: 0, transition: "0.2s", fontWeight: "bold" },
  userName: { margin: "0 0 10px 0", fontSize: "24px", color: "#0f172a", letterSpacing: "-0.5px", fontWeight: "800" },
  userMeta: { margin: "0 0 5px 0", fontSize: "14px", color: "#64748b", fontWeight: "500" },
  statusBadge: { display: "inline-block", marginTop: "8px", padding: "6px 14px", backgroundColor: "#ecfdf5", color: "#059669", borderRadius: "99px", fontSize: "12px", fontWeight: "700" },
  statsWidget: { display: "flex", alignItems: "center", gap: "15px", padding: "16px 24px", border: "1px solid #e2e8f0", borderRadius: "16px", backgroundColor: "#f8fafc" },
  statsIcon: { fontSize: "22px", backgroundColor: "#dcfce7", color: "#10b981", width: "44px", height: "44px", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "12px" },
  alert: { padding: "16px 20px", borderRadius: "12px", marginBottom: "20px", fontSize: "14px", fontWeight: "600", border: "1px solid transparent" },
  
  contentArea: { backgroundColor: "white", borderRadius: "24px", padding: "40px", boxShadow: "0 8px 32px rgba(0,0,0,0.03)", border: "1px solid #e2e8f0" },
  sectionTitle: { fontSize: "20px", color: "#0f172a", marginBottom: "24px", fontWeight: "700" },
  
  // Forms
  formGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "20px" },
  inputGroup: { display: "flex", flexDirection: "column", gap: "8px" },
  label: { fontSize: "13px", fontWeight: "700", color: "#475569", textTransform: "uppercase", letterSpacing: "0.5px" },
  input: { padding: "14px 16px", borderRadius: "12px", border: "1px solid #cbd5e1", fontSize: "15px", outline: "none", transition: "all 0.2s", color: "#1e293b", backgroundColor: "#f8fafc" },
  errorText: { color: "#ef4444", fontSize: "13px", marginTop: "4px", fontWeight: "600" },
  
  passwordSection: { border: "1px solid #e2e8f0", borderRadius: "16px", padding: "30px", marginTop: "30px", backgroundColor: "#f8fafc" },
  passwordGrid: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "20px" },

  actionRow: { display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #e2e8f0", paddingTop: "30px" },
  
  // Buttons
  deleteBtn: { padding: "12px 24px", backgroundColor: "#fef2f2", color: "#ef4444", border: "1px solid #fee2e2", borderRadius: "12px", fontWeight: "700", cursor: "pointer", transition: "all 0.2s" },
  saveChangesBtn: { padding: "14px 32px", backgroundColor: "#10b981", color: "white", border: "none", borderRadius: "12px", fontWeight: "700", cursor: "pointer", transition: "0.2s", boxShadow: "0 4px 12px rgba(16,185,129,0.3)" },

  // Modals
  modalOverlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(15,23,42,0.6)", zIndex: 2000, display: "flex", justifyContent: "center", alignItems: "center", backdropFilter: "blur(6px)" },
  modalContent: { backgroundColor: "white", borderRadius: "24px", width: "90%", maxWidth: "500px", overflow: "hidden", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)" },
  modalContentOtp: { backgroundColor: "white", borderRadius: "24px", width: "90%", maxWidth: "450px", padding: "40px", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)" },
  modalContentSmall: { backgroundColor: "white", borderRadius: "20px", width: "90%", maxWidth: "350px", padding: "30px", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)" },
  modalHeaderSurvey: { background: "linear-gradient(135deg, #10b981, #059669)", padding: "24px", color: "white" },
  termsBox: { border: "1px solid #e2e8f0", borderRadius: "12px", padding: "16px", fontSize: "14px", color: "#64748b", marginTop: "20px", display: "flex", flexDirection: "column", gap: "10px", backgroundColor: "#f8fafc" },
  outlineBtnFull: { flex: 1, padding: "14px", width: "100%", border: "1px solid #cbd5e1", borderRadius: "12px", background: "white", color: "#475569", fontWeight: "700", cursor: "pointer" },
  dangerBtnFull: { flex: 1, padding: "14px", width: "100%", border: "none", borderRadius: "12px", backgroundColor: "#ef4444", color: "white", fontWeight: "700", cursor: "pointer", transition: "0.2s" },
  updateBtnFull: { width: "100%", padding: "14px", backgroundColor: "#10b981", color: "white", border: "none", borderRadius: "12px", fontWeight: "700", cursor: "pointer", transition: "0.2s" },
  otpInput: { width: "48px", height: "60px", fontSize: "24px", textAlign: "center", borderRadius: "12px", border: "1px solid #cbd5e1", outline: "none", color: "#0f172a", fontWeight: "800", backgroundColor: "#f8fafc" },
  verifyBtnFull: { width: "100%", padding: "15px", backgroundColor: "#10b981", color: "white", border: "none", borderRadius: "12px", fontSize: "16px", fontWeight: "800", cursor: "pointer", boxShadow: "0 4px 12px rgba(16,185,129,0.3)" }
};

export default UserProfile;