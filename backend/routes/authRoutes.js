const r = require("express").Router();
const c = require("../controllers/authController");
const { protect } = require("../middleware/auth");
r.post("/register", c.register);
r.post("/login", c.login);
r.get("/me", protect, c.me);
r.post("/logout", protect, c.logout);
r.patch("/profile", protect, c.updateProfile);
module.exports = r;
