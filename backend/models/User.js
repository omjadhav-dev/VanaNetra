const mongoose = require("mongoose");
const { Schema } = mongoose;

/**
 * User
 * -----
 * Covers both forestry officials (who triage alerts, generate reports,
 * capture map snapshots) and public/citizen accounts (who can submit
 * reports and use the public analysis tools). Role gates dashboard access.
 */
const userSchema = new Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    passwordHash: {
      type: String,
      required: true,
      select: false, // never returned by default queries
    },

    phone: {
      type: String,
      trim: true,
    },

    role: {
      type: String,
      enum: ["Official", "Public", "Admin"],
      default: "Public",
      index: true,
    },

    // Official-only fields
    department: {
      type: String,
      trim: true,
      default: null,
    },
    designation: {
      type: String,
      trim: true,
      default: null,
    },
    jurisdictionRegions: [
      {
        type: Schema.Types.ObjectId,
        ref: "Region",
      },
    ],

    isActive: {
      type: Boolean,
      default: true,
    },

    lastLoginAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

userSchema.index({ role: 1, isActive: 1 });

module.exports = mongoose.model("User", userSchema);
