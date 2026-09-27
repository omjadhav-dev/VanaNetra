const { Region, Alert, Snapshot } = require("../models");
const audit = require("../utils/audit");
const { notifyOfficialsIfCritical } = require("../utils/emailService");
const FormData = require("form-data");
const fetch = (...args) =>
  import("node-fetch").then(({ default: f }) => f(...args));
const fs = require("fs");
const verifyLegalZone = require("../utils/verifyLegalZone");

const AI_URL = process.env.AI_SERVICE_URL || "http://localhost:5001";

async function callAI(files, mode) {
  const form = new FormData();

  form.append("mode", mode);

  const append = (key) => {
    const f = files[key]?.[0];

    if (f) {
      form.append(key, fs.createReadStream(f.path), {
        filename: f.originalname,
        contentType: f.mimetype,
      });
    }
  };

  append("image");
  append("before");
  append("after");

  const res = await fetch(`${AI_URL}/predict`, {
    method: "POST",
    body: form,
    headers: form.getHeaders(),
  });

  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(e.error || "AI service error");
  }

  return res.json();
}

function buildResult(ai, mode, region, files) {
  if (mode === "change") {
    return {
      mode,
      region: region?.name || "Unspecified",
      regionId: region?._id || null,
      lossPercentage: ai.vegetation_lost_pct,
      affectedAreaHectares: +(ai.pixels_lost / 10000).toFixed(1),
      severityScore: +(
        ai.vegetation_lost_pct * (region?.sensitivityWeight || 1)
      ).toFixed(2),
      confidence: ai.confidence,
      beforeConfidence: ai.before_confidence,
      afterConfidence: ai.after_confidence,
      pixelsLost: ai.pixels_lost,
      totalPixels: ai.total_pixels,
      spotCount: ai.spot_count,
      lostTreeSpots: ai.lost_tree_spots,
      resultImageB64: ai.result_image_b64,
      beforeImageUrl: files.before?.[0]
        ? `/uploads/${files.before[0].filename}`
        : null,
      afterImageUrl: files.after?.[0]
        ? `/uploads/${files.after[0].filename}`
        : null,
    };
  }

  return {
    mode,
    region: region?.name || "Unspecified",
    classification: ai.classification,
    vegetationPct: ai.vegetation_pct,
    confidence: ai.confidence,
    imageUrl: files.image?.[0]
      ? `/uploads/${files.image[0].filename}`
      : null,
  };
}

exports.analyze = async (req, res) => {
  const mode = req.body.mode || "landcover";

  if (!["landcover", "change"].includes(mode)) {
    return res.status(400).json({
      message: "Only land cover and change detection analysis are supported.",
    });
  }

  if (!req.files?.image?.[0] && !req.files?.before?.[0]) {
    return res.status(400).json({
      message: "Upload an image",
    });
  }

  if (mode === "change" && !req.files?.after?.[0]) {
    return res.status(400).json({
      message: "Before and after images are required",
    });
  }

  if (mode === "landcover" && !req.files?.image?.[0]) {
    return res.status(400).json({
      message: "A satellite image is required for land cover analysis",
    });
  }

  const region = await Region.findOne({
    $or: [
      {
        name: req.body.region,
      },
      {
        slug: req.body.region,
      },
    ],
  }).catch(() => null);

  let ai;

  try {
    ai = await callAI(req.files, mode);
  } catch (err) {
    console.error("AI service error:", err.message);

    return res.status(502).json({
      message: `AI service unavailable: ${err.message}`,
    });
  }

  const result = buildResult(ai, mode, region, req.files);

  let savedAlert = null;

  if (mode === "change" && result.lossPercentage > 0 && region) {
    try {
      const coords = region.center?.coordinates || [0, 0];

      const { isLegal, zone } = await verifyLegalZone(coords);

      if (isLegal) {
        result.legalStatus = "legal";

        result.legalZone = {
          name: zone.name,
          permitNumber: zone.permitNumber,
          validUntil: zone.validUntil,
        };

        await audit({
          action: "analysis.legal_cut_detected",
          actor: req.user?._id || null,
          actorLabel: req.user?.fullName || "Public Analysis",
          metadata: {
            region: result.region,
            legalZone: zone.name,
            permitNumber: zone.permitNumber,
            lossPercentage: result.lossPercentage,
            coords,
          },
        }).catch(() => null);
      } else {
        result.legalStatus = "illegal";

        savedAlert = await Alert.create({
          region: region._id,
          lossPercentage: result.lossPercentage,
          affectedAreaHectares: result.affectedAreaHectares,
          severityScore: result.severityScore,
          confidenceScore: result.confidence,
          status: "Pending",
          source: "satellite-pipeline",
          detectedAt: new Date(),
          beforeImageUrl: result.beforeImageUrl,
          afterImageUrl: result.afterImageUrl,
          location: {
            type: "Point",
            coordinates: coords,
          },
          legalStatus: "illegal",
          legalVerifiedAt: new Date(),
          statusHistory: [
            {
              status: "Pending",
              changedByLabel: req.user
                ? req.user.fullName
                : "Public Analysis",
            },
          ],
        });

        if (savedAlert) {
          notifyOfficialsIfCritical(savedAlert, region.name, true);
        }
      }
    } catch (e) {
      console.error("Legal verification failed:", e.message);

      result.legalStatus = "unverified";

      savedAlert = await Alert.create({
        region: region._id,
        lossPercentage: result.lossPercentage,
        affectedAreaHectares: result.affectedAreaHectares,
        severityScore: result.severityScore,
        confidenceScore: result.confidence,
        status: "Pending",
        source: "satellite-pipeline",
        detectedAt: new Date(),
        beforeImageUrl: result.beforeImageUrl,
        afterImageUrl: result.afterImageUrl,
        location: {
          type: "Point",
          coordinates: region.center?.coordinates || [0, 0],
        },
        legalStatus: "unverified",
        legalVerifiedAt: new Date(),
        statusHistory: [
          {
            status: "Pending",
            changedByLabel: "System (verification failed)",
          },
        ],
      });
    }
  }

  await audit({
    action: "analysis.run",
    actor: req.user?._id || null,
    actorLabel: req.user?.fullName || "Public Analysis",
    metadata: {
      mode,
      region: result.region,
    },
  }).catch(() => null);

  res.json({
    result,
    alertId: savedAlert?._id || null,
  });
};

exports.createSnapshot = async (req, res) => {
  const s = await Snapshot.create({
    ...req.body,
    capturedBy: req.user?._id || null,
  });

  res.status(201).json({
    snapshot: s,
  });
};