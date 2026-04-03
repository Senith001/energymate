import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
  {
    adminId: { 
      type: String, 
      required: true,
      index: true 
    }, // E.g., A001
    action: { 
      type: String, 
      required: true 
    }, // E.g., "DELETE_USER", "CHANGE_PASSWORD"
    targetId: { 
      type: String 
    }, // E.g., U150 (The ID of the account that was altered)
    details: { 
      type: String 
    }, // E.g., "Admin deleted user profile"
  },
  { timestamps: true } // Automatically adds createdAt and updatedAt
);

export default mongoose.model("AuditLog", auditLogSchema);