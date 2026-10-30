const mongoose = require("mongoose");
const { Schema } = mongoose;


const regionSchema = new Schema(
  {
    name: {
      type:     String,
      required: true,
      unique:   true,
      trim:     true,
    },

    slug: {
      type:      String,
      required:  true,
      unique:    true,
      lowercase: true,
      index:     true,
    },

    center: {
      type: {
        type:    String,
        enum:    ["Point"],
        default: "Point",
      },
      coordinates: {
        // [longitude, latitude] — GeoJSON order
        type:     [Number],
        required: true,
      },
    },

    boundary: {
      type: {
        type:  String,
        enum:  ["Polygon"],
      },
      coordinates: {
        type: [[[Number]]], // array of linear rings
      },
    },

    baselineForestCoverHectares: {
      type:    Number,
      default: null,
    },

    sensitivityWeight: {
      // Used to scale the severity score for ecologically sensitive zones.
      type:    Number,
      default: 1,
      min:     0.1,
      max:     5,
    },

    jurisdictionOfficials: [
      {
        type: Schema.Types.ObjectId,
        ref:  "User",
      },
    ],

    isActive: {
      type:    Boolean,
      default: true,
    },

    
      type:    Date,
      default: null,
    },

    
    monitoringIntervalDays: {
      type:    Number,
      default: 15,
      min:     1,
      max:     90,
    },
  },
  { timestamps: true }
);

regionSchema.index({ center:   "2dsphere" });
regionSchema.index({ boundary: "2dsphere" });

module.exports = mongoose.model("Region", regionSchema);