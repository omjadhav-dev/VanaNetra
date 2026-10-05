const { Snapshot } = require("../models");
const audit = require("../utils/audit");
exports.list = async (req, res) => {
  const f = {};
  if (req.query.region) f.region = req.query.region;
  const snapshots = await Snapshot.find(f)
    .populate("region", "name")
    .sort({ capturedAt: 1 });
  res.json({ snapshots });
};
exports.create = async (req, res) => {
  const s = await Snapshot.create({ ...req.body, capturedBy: req.user._id });
  await audit({
    action: "snapshot.captured",
    actor: req.user._id,
    actorLabel: req.user.fullName,
    targetType: "Snapshot",
    targetId: s._id,
  });
  res.status(201).json({ snapshot: s });
};
