import mongoose from "mongoose";

const applianceUsageLogSchema = new mongoose.Schema(
  {
    householdId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Household",
      required: true,
    },
    applianceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appliance",
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    // Store hours instead of exact kWh because most homes do not have appliance-level smart metering.
    hoursUsed: {
      type: Number,
      required: true,
      min: 0,
      max: 24,
    },
    source: {
      type: String,
      enum: ["manual", "default"],
      default: "manual",
    },
  },
  { timestamps: true }
);

// Keep one daily log per appliance to avoid duplicate entries for the same day.
applianceUsageLogSchema.index(
  { householdId: 1, applianceId: 1, date: 1 },
  { unique: true }
);

export default mongoose.model("ApplianceUsageLog", applianceUsageLogSchema);
