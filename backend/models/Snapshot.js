const mongoose = require("mongoose");
const { Schema } = mongoose;

const snapshotSchema = new Schema(
  {
    region: {
      type: Schema.Types.ObjectId,
      ref: "Region",
      default: null,
      index: true,
    },

    relatedAlert: {
      type: Schema.Types.ObjectId,
      ref: "Alert",
      default: null,
    },

    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        default: undefined,
      },
    },

    type: {
      type: String,
      enum: ["satellite-timelapse", "map-capture", "before", "after"],
      required: true,
    },

    imageUrl: {
      type: String,
      required: true,
    },

    capturedAt: {
      // The real-world date the imagery represents (not upload time).
      type: Date,
      required: true,
    },

    capturedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null, // null for pipeline-ingested satellite imagery
    },

    notes: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

snapshotSchema.index({ location: "2dsphere" });
snapshotSchema.index({ region: 1, capturedAt: 1 });

module.exports = mongoose.model("Snapshot", snapshotSchema);
