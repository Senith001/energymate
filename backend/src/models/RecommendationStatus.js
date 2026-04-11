import mongoose from "mongoose";

const recommendationStatusSchema = new mongoose.Schema(
  {
    householdId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Household",
      required: true,
    },
    templateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RecommendationTemplate",
      required: true,
    },
    // FIX: removed manual `updatedAt` field — it conflicted with timestamps: true.
    // Mongoose's timestamps option manages both createdAt and updatedAt automatically.
    status: {
      type: String,
      enum: ["active", "applied", "dismissed"],
      default: "active",
    },
  },
  { timestamps: true } // handles createdAt + updatedAt automatically
);

recommendationStatusSchema.index(
  { householdId: 1, templateId: 1 },
  { unique: true }
);

export default mongoose.model("RecommendationStatus", recommendationStatusSchema);