require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const bcrypt = require("bcryptjs");
const connectDB = require("../config/db");
const { User, Region, Alert } = require("../models");
const regions = [
  {
    name: "Western Ghats Reserve",
    slug: "western-ghats-reserve",
    center: { type: "Point", coordinates: [73.5, 15.2] },
    baselineForestCoverHectares: 4235,
    sensitivityWeight: 1.8,
  },
  {
    name: "Kaziranga Corridor",
    slug: "kaziranga-corridor",
    center: { type: "Point", coordinates: [93.17, 26.58] },
    baselineForestCoverHectares: 4100,
    sensitivityWeight: 1.5,
  },
  {
    name: "Sundarbans Delta",
    slug: "sundarbans-delta",
    center: { type: "Point", coordinates: [88.9, 21.95] },
    baselineForestCoverHectares: 3900,
    sensitivityWeight: 1.4,
  },
  {
    name: "Nilgiri Biosphere",
    slug: "nilgiri-biosphere",
    center: { type: "Point", coordinates: [76.65, 11.4] },
    baselineForestCoverHectares: 3700,
    sensitivityWeight: 1.25,
  },
  {
    name: "Bandhavgarh Belt",
    slug: "bandhavgarh-belt",
    center: { type: "Point", coordinates: [80.97, 23.68] },
    baselineForestCoverHectares: 3600,
    sensitivityWeight: 1.1,
  },
];
(async () => {
  await connectDB();
  await User.deleteMany({});
  await Region.deleteMany({});
  await Alert.deleteMany({});
  const rs = await Region.insertMany(regions);
  const hash = await bcrypt.hash("Admin@123", 12);
  const [admin, official, pub] = await User.create([
    {
      fullName: "System Administrator",
      email: "admin@vananetra.local",
      passwordHash: hash,
      role: "Admin",
      designation: "System Administrator",
    },
    {
      fullName: "Forest Operations Official",
      email: "official@vananetra.local",
      passwordHash: hash,
      role: "Official",
      designation: "Forest Operations Officer",
      department: "Forest Protection",
    },
    {
      fullName: "Public Viewer",
      email: "public@vananetra.local",
      passwordHash: hash,
      role: "Public",
    },
  ]);
  official.jurisdictionRegions = rs.map((r) => r._id);
  await official.save();
  const vals = [
    [0, 22.58, 959.6, "Critical"],
    [1, 17, 697, "High"],
    [2, 9, 369, "Medium"],
    [3, 4, 164, "Medium"],
    [4, 1.8, 74, "Low"],
  ];
  for (let i = 0; i < vals.length; i++) {
    const [ri, loss, area] = vals[i];
    await Alert.create({
      region: rs[ri]._id,
      location: { type: "Point", coordinates: rs[ri].center.coordinates },
      lossPercentage: loss,
      affectedAreaHectares: area,
      severityScore: loss * regions[ri].sensitivityWeight,
      confidenceScore: 94 - i * 2,
      source: "satellite-pipeline",
      detectedAt: new Date(Date.now() - i * 86400000),
      status: i === 0 ? "Verified" : i === 1 ? "Under Review" : "Pending",
    });
  }
  console.log("Seed complete");
  process.exit(0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
