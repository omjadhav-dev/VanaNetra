const { AuditLog } = require("../models");
module.exports = async function audit({
  action,
  actor = null,
  actorLabel = "System",
  targetType = null,
  targetId = null,
  metadata = {},
  ipAddress = null,
}) {
  try {
    return await AuditLog.create({
      action,
      actor,
      actorLabel,
      targetType,
      targetId,
      metadata,
      ipAddress,
    });
  } catch (e) {
    console.error("audit:", e.message);
  }
};
