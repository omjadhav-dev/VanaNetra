const r = require("express").Router();
const c = require("../controllers/adminController");
const { protect, allow } = require("../middleware/auth");
r.get("/users", protect, allow("Admin"), c.users);
r.patch("/users/:id/role", protect, allow("Admin"), c.setRole);
r.get("/audit", protect, allow("Admin", "Official"), c.audit);
module.exports = r;
