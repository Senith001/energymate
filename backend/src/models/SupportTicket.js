import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    sender: { type: String, enum: ["user", "admin"], required: true },
    text: { type: String, required: true },
    time: { type: Date, default: Date.now },
  },
  { _id: false }
);

const supportTicketSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    name: { type: String },
    email: { type: String },

    subject: { type: String, required: true },
    description: { type: String, required: true },

    category: { type: String, enum: ["Appliance Issue", "Room Issue", "Energy Target Issue", "Billing Issue", "Other"], default: "Other" },
    priority: { type: String, enum: ["High", "Medium", "Low"], default: "Medium" },

    status: { type: String, enum: ["Open", "In Progress", "Resolved"], default: "Open" },

    messages: { type: [messageSchema], default: [] },
  },
  { timestamps: true }
);

export default mongoose.model("SupportTicket", supportTicketSchema);