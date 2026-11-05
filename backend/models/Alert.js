const mongoose = require("mongoose");
const { Schema } = mongoose;


const STATUS_FLOW = [
  "Pending",
  "Under Review",
  "Verified",
  "Action Taken",
  "Resolved",
];


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


const alertSchema = new Schema(
  {
    region: {
      type: Schema.Types.ObjectId,
      ref: "Region",
      required: true,
      index: true,
    },

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

      type: Number,
      required: true,
    },
    confidenceScore: {

      type: Number,
      required: true,
      min: 0,
      max: 100,
    },

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
