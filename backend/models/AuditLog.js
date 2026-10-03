const mongoose = require("mongoose");
const { Schema } = mongoose;


const auditLogSchema = new Schema(
  {
    action: {
      type: String,
      enum: [
        "login",
        "logout",
        "alert.status_changed",
        "alert.created",
        "report.generated",
        "report.downloaded",
        "snapshot.captured",
        "user.role_changed",
        "region.updated",
        "analysis.run",
      ],
      required: true,
      index: true,
    },

    actor: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null, 
    },
    actorLabel: {
      type: String,
      required: true,
    },

    targetType: {
      type: String,
      enum: ["Alert", "Report", "Snapshot", "Region", "User", null],
      default: null,
    },
    targetId: {
      type: Schema.Types.ObjectId,
      default: null,
    },

    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },

    ipAddress: {
      type: String,
      default: null,
    },

    at: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: false },
);

auditLogSchema.index({ targetType: 1, targetId: 1, at: -1 });

module.exports = mongoose.model("AuditLog", auditLogSchema);
