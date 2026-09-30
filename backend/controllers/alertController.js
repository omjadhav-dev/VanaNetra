const { Alert, Region } = require("../models");
const audit = require("../utils/audit");
const { notifyOfficialsIfCritical } = require("../utils/emailService");
const FLOW = Alert.STATUS_FLOW;

function queryFilter(q) {
  const f = {};
  if (q.region && q.region !== "All") f.region = q.region;
  if (q.severity && q.severity !== "All") f.severity = q.severity;
  if (q.status && q.status !== "All") f.status = q.status;
  if (q.source && q.source !== "All") f.source = q.source;
  return f;
}

exports.list = async (req, res) => {
  const f = queryFilter(req.query);
  if (
    req.user &&
    req.user.role === "Official" &&
    req.user.jurisdictionRegions?.length &&
    !req.query.allRegions
  )
    f.region = { $in: req.user.jurisdictionRegions.map((x) => x._id) };
  const alerts = await Alert.find(f)
    .populate("region", "name slug center")
    .populate("assignedTo", "fullName email")
    .sort({ detectedAt: -1 });
  res.json({ alerts });
};

exports.get = async (req, res) => {
  const a = await Alert.findById(req.params.id)
    .populate("region")
    .populate("assignedTo", "fullName email")
    .populate("reportedBy", "fullName email");
  if (!a) return res.status(404).json({ message: "Alert not found" });
  res.json({ alert: a });
};

exports.create = async (req, res) => {
  const {
    region,
    coordinates,
    lossPercentage,
    affectedAreaHectares,
    confidenceScore = 90,
    beforeImageUrl = null,
    afterImageUrl = null,
    source = "manual-entry",
    reportedBy = null,
  } = req.body;

  if (
    !region ||
    !coordinates ||
    lossPercentage === undefined ||
    affectedAreaHectares === undefined
  )
    return res
      .status(400)
      .json({
        message:
          "region, coordinates, lossPercentage and affectedAreaHectares are required",
      });

  const r = await Region.findById(region);
  if (!r) return res.status(404).json({ message: "Region not found" });

  const severityScore = Number(
    (Number(lossPercentage) * Number(r.sensitivityWeight || 1)).toFixed(2),
  );
  const a = await Alert.create({
    region,
    location: { type: "Point", coordinates },
    source,
    lossPercentage,
    affectedAreaHectares,
    severityScore,
    confidenceScore,
    beforeImageUrl,
    afterImageUrl,
    reportedBy: reportedBy || req.user?._id,
  });

  await audit({
    action: "alert.created",
    actor: req.user?._id || null,
    actorLabel: req.user?.fullName || "System",
    targetType: "Alert",
    targetId: a._id,
    metadata: { source },
  });

  // Notify officials for High / Critical manual-entry alerts
  notifyOfficialsIfCritical(a, r.name);

  res.status(201).json({ alert: await a.populate("region", "name slug") });
};

exports.advance = async (req, res) => {
  const a = await Alert.findById(req.params.id).populate("region", "name");
  if (!a) return res.status(404).json({ message: "Alert not found" });

  const next = FLOW[FLOW.indexOf(a.status) + 1];
  if (!next)
    return res.status(400).json({ message: "Alert is already resolved" });

  const old = a.status;
  a.status = next;
  a.statusHistory.push({
    status: next,
    changedBy: req.user._id,
    changedByLabel: req.user.fullName,
    note: req.body.note || "",
  });
  if (next === "Verified" || next === "Action Taken" || next === "Resolved")
    a.isPubliclyVisible = true;
  await a.save();

  await audit({
    action: "alert.status_changed",
    actor: req.user._id,
    actorLabel: req.user.fullName,
    targetType: "Alert",
    targetId: a._id,
    metadata: { fromStatus: old, toStatus: next, note: req.body.note || "" },
    ipAddress: req.ip,
  });

  res.json({ alert: a });
};

exports.assign = async (req, res) => {
  const a = await Alert.findByIdAndUpdate(
    req.params.id,
    { assignedTo: req.body.userId },
    { new: true },
  ).populate("assignedTo", "fullName email");
  if (!a) return res.status(404).json({ message: "Alert not found" });
  res.json({ alert: a });
};

exports.stats = async (req, res) => {
  const base = queryFilter(req.query);
  const [
    total,
    critical,
    high,
    medium,
    low,
    pending,
    verified,
    resolved,
    area,
  ] = await Promise.all([
    Alert.countDocuments(base),
    Alert.countDocuments({ ...base, severity: "Critical" }),
    Alert.countDocuments({ ...base, severity: "High" }),
    Alert.countDocuments({ ...base, severity: "Medium" }),
    Alert.countDocuments({ ...base, severity: "Low" }),
    Alert.countDocuments({ ...base, status: "Pending" }),
    Alert.countDocuments({ ...base, status: "Verified" }),
    Alert.countDocuments({ ...base, status: "Resolved" }),
    Alert.aggregate([
      { $match: base },
      { $group: { _id: null, area: { $sum: "$affectedAreaHectares" } } },
    ]),
  ]);
  res.json({
    stats: {
      total,
      critical,
      high,
      medium,
      low,
      pending,
      verified,
      resolved,
      affectedAreaHectares: Number((area[0]?.area || 0).toFixed(1)),
    },
  });
};

exports.publicList = async (req, res) => {
  const alerts = await Alert.find({
    isPubliclyVisible: true,
    status: { $in: ["Verified", "Action Taken", "Resolved"] },
  })
    .populate("region", "name slug center")
    .select(
      "region location lossPercentage affectedAreaHectares severity status detectedAt",
    )
    .sort({ detectedAt: -1 });
  res.json({ alerts });
};
