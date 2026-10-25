require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const connectDB = require("./config/db");
const app = express();
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
    credentials: true,
  }),
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.get("/api/health", (req, res) =>
  res.json({ status: "ok", service: "vananetra-backend", time: new Date() }),
);
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/regions", require("./routes/regionRoutes"));
app.use("/api/alerts", require("./routes/alertRoutes"));
app.use("/api/dashboard", require("./routes/dashboardRoutes"));
app.use("/api/reports", require("./routes/reportRoutes"));
app.use("/api/snapshots", require("./routes/snapshotRoutes"));
app.use("/api/analysis", require("./routes/analysisRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/api/legal-zones", require("./routes/legalZoneRoutes"));
app.use((err, req, res, next) => {
  console.error(err);
  res
    .status(err.status || 500)
    .json({ message: err.message || "Server error" });
});
const PORT = process.env.PORT || 5000;
connectDB().then(() =>
  app.listen(PORT, () => console.log(`VanaNetra API running on ${PORT}`)),
);
module.exports = app;
