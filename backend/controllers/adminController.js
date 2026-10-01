const { User, AuditLog } = require("../models");
exports.users = async (req, res) =>
  res.json({
    users: await User.find()
      .select("-passwordHash")
      .populate("jurisdictionRegions", "name"),
  });
exports.setRole = async (req, res) => {
  const u = await User.findByIdAndUpdate(
    req.params.id,
    { role: req.body.role },
    { new: true, runValidators: true },
  );
  if (!u) return res.status(404).json({ message: "User not found" });
  res.json({ user: u });
};
exports.audit = async (req, res) =>
  res.json({
    logs: await AuditLog.find()
      .populate("actor", "fullName email")
      .sort({ at: -1 })
      .limit(200),
  });
