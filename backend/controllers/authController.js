const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { User, Region } = require("../models");
const audit = require("../utils/audit");
const tokenFor = (u) =>
  jwt.sign(
    { id: u._id, role: u.role },
    process.env.JWT_SECRET || "dev-secret",
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" },
  );
const safe = (u) => ({
  id: u._id,
  fullName: u.fullName,
  email: u.email,
  phone: u.phone,
  role: u.role,
  department: u.department,
  designation: u.designation,
  jurisdictionRegions: u.jurisdictionRegions || [],
  isActive: u.isActive,
  lastLoginAt: u.lastLoginAt,
});
exports.register = async (req, res) => {
  const {
    fullName,
    email,
    password,
    phone,
    accountType = "Public",
    department,
    designation,
  } = req.body;
  if (!fullName || !email || !password)
    return res
      .status(400)
      .json({ message: "Full name, email and password are required" });
  if (password.length < 6)
    return res
      .status(400)
      .json({ message: "Password must contain at least 6 characters" });
  if (await User.exists({ email: email.toLowerCase() }))
    return res.status(409).json({ message: "Email is already registered" });
  const role = accountType === "Official" ? "Official" : "Public";
  const passwordHash = await bcrypt.hash(password, 12);
  const u = await User.create({
    fullName,
    email: email.toLowerCase(),
    passwordHash,
    phone,
    role,
    department: role === "Official" ? department : null,
    designation: role === "Official" ? designation : null,
  });
  await audit({
    action: "login",
    actor: u._id,
    actorLabel: u.fullName,
    metadata: { event: "account_created" },
    ipAddress: req.ip,
  });
  res.status(201).json({ token: tokenFor(u), user: safe(u) });
};
exports.login = async (req, res) => {
  const { email, password } = req.body;
  const u = await User.findOne({ email: (email || "").toLowerCase() })
    .select("+passwordHash")
    .populate("jurisdictionRegions", "name slug");
  if (!u || !(await bcrypt.compare(password || "", u.passwordHash)))
    return res.status(401).json({ message: "Invalid email or password" });
  u.lastLoginAt = new Date();
  await u.save();
  await audit({
    action: "login",
    actor: u._id,
    actorLabel: u.fullName,
    ipAddress: req.ip,
  });
  res.json({ token: tokenFor(u), user: safe(u) });
};
exports.me = async (req, res) => res.json({ user: safe(req.user) });
exports.logout = async (req, res) => {
  await audit({
    action: "logout",
    actor: req.user._id,
    actorLabel: req.user.fullName,
    ipAddress: req.ip,
  });
  res.json({ message: "Signed out" });
};
exports.updateProfile = async (req, res) => {
  const allowed = ["fullName", "phone", "department", "designation"];
  allowed.forEach((k) => {
    if (req.body[k] !== undefined) req.user[k] = req.body[k];
  });
  if (req.body.password) {
    req.user.passwordHash = await bcrypt.hash(req.body.password, 12);
  }
  await req.user.save();
  res.json({ user: safe(req.user), message: "Profile updated" });
};
