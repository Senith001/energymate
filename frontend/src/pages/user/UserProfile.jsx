import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";
import Navbar from "../../components/Navbar";

// ✅ 1. Import the Bootstrap Person icon
import { BsPersonFill } from "react-icons/bs";

const UserProfile = () => {
  const { user: authUser, login, logout } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // --- STATES ---
  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: "", text: "" });

  const [formData, setFormData] = useState({
    name: "", email: "", phone: "", address: "", city: "",
  });
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

  const BACKEND_URL = "http://localhost:5001";

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

  // --- HANDLERS ---
  const handleProfileChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handlePasswordChange = (e) => setPasswordData({ ...passwordData, [e.target.name]: e.target.value });

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });
    try {
      const { email, ...updateData } = formData;
      const res = await api.put("/users/me", updateData);
      login(res.data.user, localStorage.getItem("token"));
      setMessage({ type: "success", text: "Profile updated successfully!" });
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.message || "Update failed." });
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });
    if (passwordData.newPassword !== passwordData.confirmPassword) return setMessage({ type: "error", text: "New passwords do not match." });
    try {
      await api.put("/users/me/change-password", { oldPassword: passwordData.oldPassword, newPassword: passwordData.newPassword });
      setMessage({ type: "success", text: "Password changed successfully!" });
      setPasswordData({ oldPassword: "", newPassword: "", confirmPassword: "" }); 
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.message || "Password change failed." });
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
              
              {/* ✅ 2. Conditional render for Main Avatar */}
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

        {/* MAIN CONTENT SPLIT */}
        <div style={styles.mainSplit}>
          <div style={styles.sidebar}>
            <button onClick={() => setActiveTab("profile")} style={activeTab === "profile" ? styles.activeTab : styles.tab}>My profile</button>
            <button onClick={() => setActiveTab("security")} style={activeTab === "security" ? styles.activeTab : styles.tab}>Change password</button>
            <button style={styles.tab}>My households</button>
            <button style={styles.tab}>My appliances</button>
            <button style={styles.tab}>Preferences</button>
            <button onClick={() => {logout(); navigate("/login");}} style={{...styles.tab, color: "#dc2626", marginTop: "auto", borderTop: "1px solid #e5e7eb"}}>Log out</button>
          </div>

          <div style={styles.contentArea}>
            {activeTab === "profile" && (
              <div>
                <form onSubmit={handleUpdateProfile}>
                  <div style={styles.formGrid}>
                    <div style={styles.inputGroup}>
                      <label style={styles.label}>Full name</label>
                      <input name="name" value={formData.name} onChange={handleProfileChange} style={styles.input} />
                    </div>
                    <div style={styles.inputGroup}>
                      <label style={styles.label}>Email (Read Only)</label>
                      <input value={formData.email} disabled style={{ ...styles.input, backgroundColor: "#f3f4f6" }} />
                    </div>
                    <div style={styles.inputGroup}>
                      <label style={styles.label}>Phone Number</label>
                      <input name="phone" value={formData.phone} onChange={handleProfileChange} style={styles.input} />
                    </div>
                    <div style={styles.inputGroup}>
                      <label style={styles.label}>City</label>
                      <input name="city" value={formData.city} onChange={handleProfileChange} style={styles.input} />
                    </div>
                    <div style={{ ...styles.inputGroup, gridColumn: "span 2" }}>
                      <label style={styles.label}>Address</label>
                      <input name="address" value={formData.address} onChange={handleProfileChange} style={styles.input} />
                    </div>
                  </div>
                  <div style={styles.actionRow}>
                    <button type="button" onClick={() => setShowSurveyModal(true)} style={styles.deleteBtn}>Account Delete</button>
                    <div style={{ display: "flex", gap: "10px" }}>
                      <button type="button" onClick={() => window.location.reload()} style={styles.resetBtn}>Reset</button>
                      <button type="submit" style={styles.updateBtn}>Update</button>
                    </div>
                  </div>
                </form>
              </div>
            )}

            {activeTab === "security" && (
              <div>
                <h2 style={{ fontSize: "20px", color: "#374151", marginBottom: "20px" }}>Change password</h2>
                <form onSubmit={handleChangePassword}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "20px", alignItems: "end" }}>
                    <div style={styles.inputGroup}>
                      <label style={styles.label}>Current password <span style={{color: "red"}}>*</span></label>
                      <input type="password" name="oldPassword" value={passwordData.oldPassword} onChange={handlePasswordChange} required style={styles.input} />
                    </div>
                    <div style={styles.inputGroup}>
                      <label style={styles.label}>New password <span style={{color: "red"}}>*</span></label>
                      <input type="password" name="newPassword" value={passwordData.newPassword} onChange={handlePasswordChange} required style={styles.input} />
                    </div>
                    <div style={styles.inputGroup}>
                      <label style={styles.label}>Confirm new password <span style={{color: "red"}}>*</span></label>
                      <input type="password" name="confirmPassword" value={passwordData.confirmPassword} onChange={handlePasswordChange} required style={styles.input} />
                    </div>
                  </div>
                  <div style={{ marginTop: "30px", display: "flex", justifyContent: "flex-end" }}>
                    <button type="submit" style={styles.updateBtn}>Change Password</button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ========================================= */}
      {/* 1. AVATAR OPTIONS MODAL                     */}
      {/* ========================================= */}
      {showAvatarModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContentSmall}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h2 style={{ margin: 0, fontSize: "20px", color: "#1f2937" }}>Profile Photo</h2>
              <button onClick={() => setShowAvatarModal(false)} style={{ background: "none", border: "none", fontSize: "24px", cursor: "pointer", color: "#6b7280" }}>✕</button>
            </div>
            
            <div style={{ display: "flex", justifyContent: "center", marginBottom: "25px" }}>
              {/* ✅ 3. Conditional render for Modal Preview */}
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
      {/* 2. SURVEY MODAL (Reason & Terms)            */}
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
      {/* 3. OTP VALIDATION MODAL                     */}
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
  fullPage: { minHeight: "100vh", backgroundColor: "#f9fafb" },
  pageContainer: { maxWidth: "1200px", margin: "0 auto", padding: "20px", fontFamily: "'Inter', Arial, sans-serif" },
  topCard: { backgroundColor: "white", borderRadius: "12px", padding: "30px", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", marginBottom: "30px" },
  userInfoWrapper: { display: "flex", alignItems: "center", gap: "25px" },
  avatarWrapper: { position: "relative", width: "100px", height: "100px", cursor: "pointer" },
  avatar: { width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover", boxShadow: "0 4px 10px rgba(0,0,0,0.1)" },
  
  // ✅ 4. New styles for the fallback generic avatar blocks
  defaultAvatarIcon: { width: "100%", height: "100%", borderRadius: "50%", backgroundColor: "#e5e7eb", display: "flex", justifyContent: "center", alignItems: "center", boxShadow: "0 4px 10px rgba(0,0,0,0.1)" },
  defaultAvatarModalIcon: { width: "120px", height: "120px", borderRadius: "50%", backgroundColor: "#e5e7eb", display: "flex", justifyContent: "center", alignItems: "center", border: "4px solid #f3f4f6", boxShadow: "0 4px 6px rgba(0,0,0,0.05)" },
  
  avatarOverlay: { position: "absolute", top: 0, left: 0, width: "100%", height: "100%", borderRadius: "50%", backgroundColor: "rgba(0,0,0,0.5)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", opacity: 0, transition: "0.3s" },
  userName: { margin: "0 0 10px 0", fontSize: "22px", color: "#1f2937", letterSpacing: "0.5px" },
  userMeta: { margin: "0 0 5px 0", fontSize: "13px", color: "#6b7280" },
  statusBadge: { display: "inline-block", marginTop: "8px", padding: "4px 12px", backgroundColor: "#e0f2fe", color: "#0284c7", borderRadius: "20px", fontSize: "12px", fontWeight: "600" },
  statsWidget: { display: "flex", alignItems: "center", gap: "15px", padding: "15px 25px", border: "1px solid #e5e7eb", borderRadius: "10px" },
  statsIcon: { fontSize: "24px", backgroundColor: "#fef08a", width: "40px", height: "40px", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%" },
  alert: { padding: "15px", borderRadius: "8px", marginBottom: "20px", fontSize: "14px", fontWeight: "500" },
  mainSplit: { display: "flex", gap: "30px", alignItems: "flex-start" },
  sidebar: { width: "250px", backgroundColor: "white", borderRadius: "12px", padding: "15px 0", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", display: "flex", flexDirection: "column", minHeight: "400px" },
  tab: { padding: "15px 25px", textAlign: "left", background: "none", border: "none", fontSize: "15px", color: "#4b5563", cursor: "pointer", transition: "0.2s" },
  activeTab: { padding: "15px 25px", textAlign: "left", background: "#3b82f6", border: "none", fontSize: "15px", color: "white", cursor: "pointer", fontWeight: "500" },
  contentArea: { flex: 1, backgroundColor: "white", borderRadius: "12px", padding: "40px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" },
  formGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "25px", marginBottom: "40px" },
  inputGroup: { display: "flex", flexDirection: "column", gap: "8px" },
  label: { fontSize: "13px", fontWeight: "600", color: "#374151" },
  input: { padding: "12px 15px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "14px", outline: "none" },
  actionRow: { display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #e5e7eb", paddingTop: "20px" },
  deleteBtn: { padding: "10px 20px", backgroundColor: "#ef4444", color: "white", border: "none", borderRadius: "6px", fontWeight: "500", cursor: "pointer" },
  resetBtn: { padding: "10px 25px", backgroundColor: "#9ca3af", color: "white", border: "none", borderRadius: "6px", fontWeight: "500", cursor: "pointer" },
  updateBtn: { padding: "10px 30px", backgroundColor: "#0284c7", color: "white", border: "none", borderRadius: "6px", fontWeight: "500", cursor: "pointer" },
  modalOverlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 2000, display: "flex", justifyContent: "center", alignItems: "center", backdropFilter: "blur(4px)" },
  modalContent: { backgroundColor: "white", borderRadius: "12px", width: "90%", maxWidth: "500px", overflow: "hidden", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)" },
  modalContentOtp: { backgroundColor: "white", borderRadius: "20px", width: "90%", maxWidth: "450px", padding: "40px", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)" },
  modalContentSmall: { backgroundColor: "white", borderRadius: "16px", width: "90%", maxWidth: "350px", padding: "25px", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)" },
  modalHeaderSurvey: { background: "linear-gradient(90deg, #3b82f6, #38bdf8)", padding: "20px 25px", color: "white" },
  termsBox: { border: "1px solid #64748b", borderRadius: "8px", padding: "15px", fontSize: "14px", color: "#4b5563", marginTop: "20px", display: "flex", flexDirection: "column", gap: "10px", backgroundColor: "#f8fafc" },
  outlineBtnFull: { flex: 1, padding: "12px", width: "100%", border: "1px solid #1e3a8a", borderRadius: "8px", background: "white", color: "#1e3a8a", fontWeight: "bold", cursor: "pointer" },
  dangerBtnFull: { flex: 1, padding: "12px", width: "100%", border: "none", borderRadius: "8px", backgroundColor: "#b91c1c", color: "white", fontWeight: "bold", cursor: "pointer", transition: "0.2s" },
  updateBtnFull: { width: "100%", padding: "12px", backgroundColor: "#0284c7", color: "white", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", transition: "0.2s" },
  otpInput: { width: "45px", height: "55px", fontSize: "24px", textAlign: "center", borderRadius: "8px", border: "1px solid #d1d5db", outline: "none", color: "#1f2937", fontWeight: "bold" },
  verifyBtnFull: { width: "100%", padding: "15px", backgroundColor: "#9ca3af", color: "white", border: "none", borderRadius: "12px", fontSize: "16px", fontWeight: "bold", cursor: "pointer" }
};

export default UserProfile;