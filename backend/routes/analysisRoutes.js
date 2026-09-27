const router = require("express").Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const c = require("../controllers/analysisController");
const { protect } = require("../middleware/auth");

const dir = path.join(__dirname, "../uploads");

fs.mkdirSync(dir, { recursive: true });

const storage = multer.diskStorage({
  destination: dir,
  filename: (req, file, cb) =>
    cb(
      null,
      Date.now() +
        "-" +
        Math.round(Math.random() * 1e9) +
        path.extname(file.originalname).toLowerCase()
    ),
});

const upload = multer({
  storage,
  limits: {
    fileSize: 20 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) =>
    /^image\/(jpeg|png|jpg|webp)$/.test(file.mimetype)
      ? cb(null, true)
      : cb(new Error("Only image files are allowed")),
});

const fields = upload.fields([
  {
    name: "image",
    maxCount: 1,
  },
  {
    name: "before",
    maxCount: 1,
  },
  {
    name: "after",
    maxCount: 1,
  },
]);

router.post(
  "/",
  (req, res, next) => {
    const header = req.headers.authorization || "";

    if (header.startsWith("Bearer ")) {
      return protect(req, res, () => next());
    }

    next();
  },
  fields,
  c.analyze
);

router.post("/snapshot", protect, c.createSnapshot);

module.exports = router;