const mongoose = require("mongoose");
const { Schema } = mongoose;

// Ordered workflow. Index in this array determines valid forward transitions.
const STATUS_FLOW = [
  "Pending",
  "Under Review",
  "Verified",
  "Action Taken",
  "Resolved",
];

/**
 * StatusHistoryEntry (embedded, not a standalone collection)
 * -----------------------------------------------------------
 * Every status transition on an alert is appended here, never mutated —
 * this is the audit trail backing the "Audit" column / modal on the
 * Alerts dashboard and the certification section of generated reports.
 */
const statusHistorySchema = new Schema(
  {
    status: {
      type: String,
      enum: STATUS_FLOW,
      required: true,
    },
    changedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null, // null = system-generated (e.g. initial "Pending" on detection)
    },
    changedByLabel: {
      // Denormalized display label (e.g. "System (auto-detected)"), kept
      // even if the referenced user is later deleted or renamed.
      type: String,
      required: true,
    },
    note: {
      type: String,
      default: "",
    },
    at: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false },
);

/**
 * Alert
 * ------
 * A single deforestation detection event produced by the change-detection
 * pipeline (or, for citizen reports, submitted by a public user with
 * photographic evidence). Severity is derived from lossPercentage and
 * should be recomputed server-side rather than trusted from the client.
 */
const alertSchema = new Schema(
  {
    region: {
      type: Schema.Types.ObjectId,
      ref: "Region",
      required: true,
      index: true,
    },

    // Precise point of detection, distinct from the region's center —
    // this is what the Maps page plots and what snapshots/reports geotag.
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
      },
    },

    source: {
      type: String,
      enum: ["satellite-pipeline", "citizen-report", "manual-entry"],
      default: "satellite-pipeline",
    },

    // --- Measurements from the change-detection model ---
    lossPercentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    affectedAreaHectares: {
      type: Number,
      required: true,
      min: 0,
    },
    severityScore: {
      // Composite score (e.g. loss% weighted by region sensitivity).
      type: Number,
      required: true,
    },
    confidenceScore: {
      // Model confidence, 0-100. Drives the confidence bar in the UI.
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },

    // Derived, not user-editable: Critical >=18%, High >=10%, Medium >=4%, else Low.
    severity: {
      type: String,
      enum: ["Low", "Medium", "High", "Critical"],
      required: true,
      index: true,
    },

    status: {
      type: String,
      enum: STATUS_FLOW,
      default: "Pending",
      index: true,
    },

    statusHistory: {
      type: [statusHistorySchema],
      default: () => [
        { status: "Pending", changedByLabel: "System (auto-detected)" },
      ],
    },

    // Evidence imagery
    beforeImageUrl: { type: String, default: null },
    afterImageUrl: { type: String, default: null },
    mapSnapshotUrl: { type: String, default: null },

    detectedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },

    // Set when a citizen submitted this (source = "citizen-report").
    reportedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // Officer currently assigned to investigate/verify.
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    isPubliclyVisible: {
      type: Boolean,
      default: false,
    },

    legalStatus: {
      type: String,
      enum: ["legal", "illegal", "unverified"],
      default: "unverified",
      index: true,
    },
    legalZone: {
      type: Schema.Types.ObjectId,
      ref: "LegalZone",
      default: null,
    },
    legalVerifiedAt: {
      type: Date,
      default: null,
    },

  },
  { timestamps: true },
);

alertSchema.index({ location: "2dsphere" });
alertSchema.index({ region: 1, status: 1 });
alertSchema.index({ detectedAt: -1 });

// Keep severity in sync with lossPercentage whenever it changes.
alertSchema.pre("validate", function computeSeverity(next) {
  if (this.isModified("lossPercentage") || this.isNew) {
    const loss = this.lossPercentage;
    this.severity =
      loss >= 18
        ? "Critical"
        : loss >= 10
          ? "High"
          : loss >= 4
            ? "Medium"
            : "Low";
  }
  next();
});

alertSchema.methods.advanceStatus = function advanceStatus(
  userId,
  userLabel,
  note = "",
) {
  const currentIndex = STATUS_FLOW.indexOf(this.status);
  const next = STATUS_FLOW[currentIndex + 1];
  if (!next) return false;

  this.status = next;
  this.statusHistory.push({
    status: next,
    changedBy: userId || null,
    changedByLabel: userLabel,
    note,
    at: new Date(),
  });
  return true;
};

alertSchema.statics.STATUS_FLOW = STATUS_FLOW;

module.exports = mongoose.model("Alert", alertSchema);
