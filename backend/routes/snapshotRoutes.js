const r = require("express").Router();
const c = require("../controllers/snapshotController");
const { protect } = require("../middleware/auth");
r.get("/", c.list);
r.post("/", protect, c.create);
module.exports = r;
