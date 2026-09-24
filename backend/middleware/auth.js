const jwt = require("jsonwebtoken");
const { User } = require("../models");

async function protect(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    if (!header.startsWith("Bearer "))
      return res.status(401).json({ message: "Authentication required" });
    const token = header.slice(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "dev-secret");
    const user = await User.findById(decoded.id).populate(
      "jurisdictionRegions",
      "name slug",
    );
    if (!user || !user.isActive)
      return res
        .status(401)
        .json({ message: "Account is inactive or unavailable" });
    req.user = user;
    next();
  } catch (e) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}
function allow(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role))
      return res
        .status(403)
        .json({ message: "You do not have permission for this action" });
    next();
  };
}
module.exports = { protect, allow };
