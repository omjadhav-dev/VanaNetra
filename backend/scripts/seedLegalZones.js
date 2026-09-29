const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const mongoose = require("mongoose");
const LegalZone = require(path.join(__dirname, "../models/LegalZone"));
const zones = require(path.join(__dirname, "./legal_zones_seed.json"));

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  await LegalZone.deleteMany({});
  const inserted = await LegalZone.insertMany(zones);
  console.log(`✅ Inserted ${inserted.length} legal zones`);
  process.exit(0);
}).catch(err => { console.error(err); process.exit(1); });