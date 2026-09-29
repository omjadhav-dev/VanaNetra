const mongoose = require("mongoose");
const { Schema } = mongoose;

const legalZoneSchema = new Schema(
  {
    name: { type: String, required: true },
    district: { type: String },
    state: { type: String, default: "Andhra Pradesh" },
    permitType: {
      type: String,
      enum: [
        "timber-harvest",
        "plantation-clearing",
        "roadwork",
        "mining",
        "other",
      ],
      default: "timber-harvest",
    },
    permitNumber: { type: String },
    validFrom: { type: Date },
    validUntil: { type: Date },

    // GeoJSON polygon — the actual legal cutting boundary
    boundary: {
      type: {
        type: String,
        enum: ["Polygon", "MultiPolygon"], // add MultiPolygon
        required: true,
      },
      coordinates: {
        type: mongoose.Schema.Types.Mixed, // flexible for both types
        required: true,
      },
    },

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

legalZoneSchema.index({ boundary: "2dsphere" });

module.exports = mongoose.model("LegalZone", legalZoneSchema);
