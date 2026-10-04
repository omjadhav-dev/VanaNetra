const mongoose = require("mongoose");
const { Schema } = mongoose;

const reportSchema = new Schema(
  {
    reportId: {
      type: String,
      required: true,
      unique: true,
    },
    title: {
      type: String,
      required: true,
    },
    region: {
      type: Schema.Types.ObjectId,
      ref: "Region",
      default: null,
    },
    scope: {
      type: String,
      enum: ["single-region", "all-regions"],
      required: true,
    },
    periodStart: { type: Date, required: true },
    periodEnd: { type: Date, required: true },
    evidenceAlerts: [
      {
        alert: { type: Schema.Types.ObjectId, ref: "Alert" },
        lossPercentage: Number,
        affectedAreaHectares: Number,
        confidenceScore: Number,
        severity: String,
        statusAtGeneration: String,
        coordinates: [Number],
      },
    ],
    summary: {
      totalAlerts: Number,
      totalAffectedAreaHectares: Number,
      averageLossPercentage: Number,
      criticalCount: Number,
    },
    analysisSnapshot: {
      type: Schema.Types.Mixed,
      default: null,
    },
    fileUrl: {
      type: String,
      default: null,
    },
    classification: {
      type: String,
      enum: ["Public", "Restricted", "Confidential"],
      default: "Restricted",
    },
    generatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    generatedByLabel: {
      type: String,
      required: true,
    },
    designationAtGeneration: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

reportSchema.index({ region: 1, createdAt: -1 });

module.exports = mongoose.model("Report", reportSchema);
