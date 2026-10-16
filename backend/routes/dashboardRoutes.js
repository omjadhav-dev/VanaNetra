const r = require("express").Router();
const c = require("../controllers/dashboardController");
const { protect, allow } = require("../middleware/auth");
r.get("/summary", protect, allow("Official", "Admin"), c.summary);
r.get("/trends", c.trends);
module.exports = r;
