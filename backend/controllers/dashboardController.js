const { Alert, Region, Report } = require("../models");
exports.summary = async (req, res) => {
  const [regions, alerts, area, reports, bySeverity, byMonth] =
    await Promise.all([
      Region.countDocuments({ isActive: true }),
      Alert.countDocuments(),
      Alert.aggregate([
        { $group: { _id: null, v: { $sum: "$affectedAreaHectares" } } },
      ]),
      Report.countDocuments(),
      Alert.aggregate([{ $group: { _id: "$severity", count: { $sum: 1 } } }]),
      Alert.aggregate([
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m", date: "$detectedAt" } },
            alerts: { $sum: 1 },
            area: { $sum: "$affectedAreaHectares" },
          },
        },
        { $sort: { _id: 1 } },
        { $limit: 12 },
      ]),
    ]);
  res.json({
    summary: {
      regions,
      alerts,
      affectedAreaHectares: Number((area[0]?.v || 0).toFixed(1)),
      reports,
    },
    bySeverity,
    monthly: byMonth,
  });
};
exports.trends = async (req, res) => {
  const match = {};
  if (req.query.region && req.query.region !== "All") {
    const r = await Region.findOne({
      $or: [{ slug: req.query.region }, { name: req.query.region }],
    });
    if (r) match.region = r._id;
  }
  const months = Number(req.query.months || 8);
  const data = await Alert.aggregate([
    { $match: match },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m", date: "$detectedAt" } },
        loss: { $avg: "$lossPercentage" },
        area: { $sum: "$affectedAreaHectares" },
        alerts: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
    { $limit: months },
  ]);
  res.json({
    data: data.map((x) => ({
      month: x._id,
      loss: Number((x.loss || 0).toFixed(2)),
      area: Number((x.area || 0).toFixed(1)),
      alerts: x.alerts,
    })),
  });
};
