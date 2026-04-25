// src/models/Recommendation.js
import mongoose from "mongoose";

const recommendationSchema = new mongoose.Schema(
    {
        householdId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Household",
            required: true,
            index: true,
        },
        type: {
            type: String,
            enum: ["tips", "strategy", "prediction"],
            required: true,
            index: true,
        },

        // ── Tips — full AI response saved ────────────────────
        tips: [
            {
                title: { type: String, trim: true },
                description: { type: String, trim: true }, // = recommendation text
                problem: { type: String, trim: true },
                priority: { type: String, trim: true },
                category: { type: String, trim: true },
                learnMore: { type: String, trim: true },
                implementation: [{ type: String, trim: true }],
                expectedSavings: {
                    unitsPerMonth: { type: Number },
                    costLKR: { type: Number },
                },
            },
        ],

        // ── Strategies — full AI response saved ──────────────
        strategies: [
            {
                title: { type: String, trim: true },
                summary: { type: String, trim: true },
                details: [{ type: String, trim: true }],
                difficulty: { type: String, trim: true },
                priority: { type: String, trim: true },
                timeframe: { type: String, trim: true },
                learnMore: { type: String, trim: true },
                expectedSavings: {
                    unitsPerMonth: { type: Number },
                    costLKR: { type: Number },
                },
            },
        ],

        // ── Predictions — full table with cost ───────────────
        predictionTable: [
            {
                month: { type: String }, // "YYYY-MM"
                predictedConsumption: { type: Number },
                predictedCostLKR: { type: Number }, // ← was missing before
            },
        ],

        predictionInsights: [
            {
                title: { type: String, trim: true },
                description: { type: String, trim: true },
            },
        ],

        predictionSummary: { type: String, trim: true },

        // ── Meta ─────────────────────────────────────────────
        source: {
            type: String,
            enum: ["ai_generated", "admin_manual"],
            default: "ai_generated",
        },
        generatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
    },
    { timestamps: true }
);

export default mongoose.model("Recommendation", recommendationSchema);