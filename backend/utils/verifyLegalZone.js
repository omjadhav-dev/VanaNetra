const { LegalZone } = require("../models");

async function verifyLegalZone(coordinates) {
  const [lng, lat] = coordinates;
  const now = new Date();

  const zone = await LegalZone.findOne({
    isActive: true,
    validFrom: { $lte: now },
    validUntil: { $gte: now },
    boundary: {
      $geoIntersects: {
        $geometry: { type: "Point", coordinates: [lng, lat] },
      },
    },
  });

  return { isLegal: !!zone, zone: zone || null };
}

module.exports = verifyLegalZone;