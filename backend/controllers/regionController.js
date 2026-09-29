const { Region, Alert } = require("../models");
exports.list = async (req, res) => {
  const regions = await Region.find({ isActive: true })
    .populate("jurisdictionOfficials", "fullName email")
    .lean();
  const stats = await Promise.all(
    regions.map(async (r) => {
      const a = await Alert.find({ region: r._id }).lean();
      const area = a.reduce((s, x) => s + x.affectedAreaHectares, 0);
      const loss = a.length
        ? a.reduce((s, x) => s + x.lossPercentage, 0) / a.length
        : 0;
      return {
        ...r,
        stats: {
          alerts: a.length,
          area: Number(area.toFixed(1)),
          averageLoss: Number(loss.toFixed(2)),
          critical: a.filter((x) => x.severity === "Critical").length,
        },
      };
    }),
  );
  res.json({ regions: stats });
};
exports.get = async (req, res) => {
  const r = await Region.findOne({
    $or: [{ slug: req.params.id }, { _id: req.params.id }],
  }).lean();
  if (!r) return res.status(404).json({ message: "Region not found" });
  res.json({ region: r });
};
exports.create = async (req, res) => {
  const r = await Region.create(req.body);
  res.status(201).json({ region: r });
};
exports.update = async (req, res) => {
  const r = await Region.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!r) return res.status(404).json({ message: "Region not found" });
  res.json({ region: r });
};
