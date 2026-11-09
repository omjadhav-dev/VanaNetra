const r = require("express").Router();
const c = require("../controllers/snapshotController");
const { protect, allow } = require("../middleware/auth");

r.get("/",    c.list);
r.post("/",   protect, c.create);

r.get("/region/:regionId", protect, c.listByRegion);


r.post("/trigger/:regionId", protect, allow("Official", "Admin"), c.triggerRegion);

module.exports = r;