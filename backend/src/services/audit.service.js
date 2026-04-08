import AuditLog from "../models/AuditLog.js";

export const logAdminAction = async (adminId, action, targetId, details = "") => {
  try {
    await AuditLog.create({
      adminId,
      action,
      targetId,
      details,
    });
    console.log(`📝 Audit Log: [${adminId}] performed [${action}] on [${targetId}]`);
  } catch (err) {
    console.error("❌ Failed to save audit log:", err.message);
  }
};