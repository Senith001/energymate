import mongoose from "mongoose";

const feedbackSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    name: { type: String, trim: true },
    email: { type: String, trim: true },
    subject: { type: String, required: true },
    category: { type: String, enum: ["Dashboard", "Rooms", "Appliances", "Support", "Other"], default: "Other" },
    message: { type: String, required: true },
    rating: { type: Number, min: 1, max: 5, default: 5 },

    status: { type: String, enum: ["Submitted", "Reviewed"], default: "Submitted" },
    showOnHome: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model("Feedback", feedbackSchema);