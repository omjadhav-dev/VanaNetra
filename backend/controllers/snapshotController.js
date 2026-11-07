const { Snapshot, Region } = require("../models");
const audit                = require("../utils/audit");
const { processRegion }    = require("../jobs/satelliteCron");


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
    action:     "snapshot.captured",
    actor:      req.user._id,
    actorLabel: req.user.fullName,
    targetType: "Snapshot",
    targetId:   s._id,
  });
  res.status(201).json({ snapshot: s });
};

exports.listByRegion = async (req, res) => {
  const { regionId } = req.params;

  const region = await Region.findById(regionId).select(
    "name lastAnalyzedAt monitoringIntervalDays center isActive"
  );

  if (!region) {
    return res.status(404).json({ message: "Region not found" });
  }

  // Latest before snapshot
  const beforeSnap = await Snapshot.findOne({
    region: region._id,
    type:   "before",
  }).sort({ capturedAt: -1 });

  // Latest after snapshot (may not exist if cycle just started)
  const afterSnap = await Snapshot.findOne({
    region: region._id,
    type:   "after",
  }).sort({ capturedAt: -1 });

  // Calculate next scheduled run
  let nextScheduledAt   = null;
  let daysSinceLast     = null;

  if (region.lastAnalyzedAt) {
    const msPerDay     = 1000 * 60 * 60 * 24;
    const intervalMs   = (region.monitoringIntervalDays || 15) * msPerDay;
    nextScheduledAt    = new Date(region.lastAnalyzedAt.getTime() + intervalMs);
    daysSinceLast      = Math.floor((Date.now() - region.lastAnalyzedAt) / msPerDay);
  }

  res.json({
    region: {
      _id:                    region._id,
      name:                   region.name,
      lastAnalyzedAt:         region.lastAnalyzedAt,
      monitoringIntervalDays: region.monitoringIntervalDays,
      isActive:               region.isActive,
    },
    before:         beforeSnap  || null,
    after:          afterSnap   || null,
    nextScheduledAt,
    daysSinceLast,
  });
};

exports.triggerRegion = async (req, res) => {
  const { regionId } = req.params;

  const region = await Region.findById(regionId);

  if (!region) {
    return res.status(404).json({ message: "Region not found" });
  }

  if (!region.isActive) {
    return res.status(400).json({ message: "Region is not active" });
  }

  console.log(
    `[snapshotController] Manual trigger for region "${region.name}" ` +
    `by ${req.user.fullName} (${req.user._id})`
  );

  await audit({
    action:     "satellite.manual_trigger",
    actor:      req.user._id,
    actorLabel: req.user.fullName,
    metadata:   { region: region.name },
  }).catch(() => null);


  res.status(202).json({
    message: `Pipeline triggered for "${region.name}". Results will appear in the zone monitor shortly.`,
    regionId: region._id,
  });

  // Run after response is sent so the HTTP request doesn't time out
  processRegion(region).catch((err) =>
    console.error(`[snapshotController] Manual trigger failed for "${region.name}":`, err.message)
  );
};