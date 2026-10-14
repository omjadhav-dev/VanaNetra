const r = require("express").Router();
const c = require("../controllers/reportController");
const { protect, allow } = require("../middleware/auth");
r.get("/", protect, allow("Official", "Admin"), c.list);
r.post("/generate", protect, allow("Official", "Admin"), c.generate);
r.get("/:id/download", protect, allow("Official", "Admin"), c.download);
module.exports = r;
