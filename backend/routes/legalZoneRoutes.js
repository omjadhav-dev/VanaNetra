const router = require("express").Router();
const LegalZone = require("../models/LegalZone");
const { protect, allow } = require("../middleware/auth");  // ← allow, not requireRole

// List all zones
router.get("/", protect, async (req, res) => {
  const zones = await LegalZone.find().sort({ createdAt: -1 });
  res.json({ zones });
});

// Add a zone (Admin only)
router.post("/", protect, allow("Admin"), async (req, res) => {  // ← allow("Admin")
  const zone = await LegalZone.create(req.body);
  res.status(201).json({ zone });
});

// Update / deactivate
router.patch("/:id", protect, allow("Admin"), async (req, res) => {  // ← allow("Admin")
  const zone = await LegalZone.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json({ zone });
});

module.exports = router;