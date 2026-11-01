
const fs = require("fs");
const path = require("path");
const FormData = require("form-data");

const fetch = (...args) =>
  import("node-fetch").then(({ default: f }) => f(...args));

const { Region, Alert, Snapshot } = require("../models");
const audit = require("../utils/audit");
const verifyLegalZone = require("../utils/verifyLegalZone");
const { notifyOfficialsIfCritical } = require("../utils/emailService");
const { fetchAndSaveTile } = require("../services/sentinelService");

const AI_URL = process.env.AI_SERVICE_URL || "http://localhost:5001";

const CRON_SCHEDULE = "0 30 0 * * *";

/**
 * Send before + after image files to the Flask AI service.
 * Reuses the existing FormData/fetch pattern from analysisController.js.
 *
 * @param {string} beforePath - Absolute path to before PNG on disk
 * @param {string} afterPath  - Absolute path to after PNG on disk
 * @param {string} zoneId     - Region ID string (for logging in Flask)
 * @returns {Promise<object>} - AI service response JSON
 */
async function callAISentinel(beforePath, afterPath, zoneId) {
  const form = new FormData();
  form.append("zone_id", zoneId);
  form.append("before", fs.createReadStream(beforePath), {
    filename: path.basename(beforePath),
    contentType: "image/png",
  });
  form.append("after", fs.createReadStream(afterPath), {
    filename: path.basename(afterPath),
    contentType: "image/png",
  });

  const res = await fetch(`${AI_URL}/predict-sentinel`, {
    method: "POST",
    body: form,
    headers: form.getHeaders(),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `AI service returned ${res.status}`);
  }

  return res.json();
}
function buildResult(ai, region, beforeImageUrl, afterImageUrl) {
  return {
    mode: "change",
    source: "satellite-pipeline",
    region: region.name,
    regionId: region._id,
    lossPercentage: ai.vegetation_lost_pct,
    affectedAreaHectares: +(ai.pixels_lost / 10000).toFixed(1),
    severityScore: +(
      ai.vegetation_lost_pct * (region.sensitivityWeight || 1)
    ).toFixed(2),
    confidence: ai.confidence,
    beforeConfidence: ai.before_confidence,
    afterConfidence: ai.after_confidence,
    pixelsLost: ai.pixels_lost,
    totalPixels: ai.total_pixels,
    spotCount: ai.spot_count,
    lostTreeSpots: ai.lost_tree_spots,
    resultImageB64: ai.result_image_b64,
    ndvi: ai.ndvi, // NDVI pre-screen stats from Phase 1
    modelRun: ai.model_run, // whether SegFormer ran or was skipped
    beforeImageUrl,
    afterImageUrl,
  };
}

async function createAlert(result, region, legalStatus) {
  const coords = region.center?.coordinates || [0, 0];

  return Alert.create({
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
    legalStatus,
    legalVerifiedAt: new Date(),
    statusHistory: [
      {
        status: "Pending",
        changedByLabel: "System (satellite-pipeline)",
      },
    ],
  });
}

async function processRegion(region) {
  const regionId = region._id.toString();
  const regionName = region.name;

  console.log(
    `[satelliteCron] Processing region: "${regionName}" (${regionId})`,
  );


  const beforeSnap = await Snapshot.findOne({
    region: region._id,
    type: "before",
  }).sort({ capturedAt: -1 });

  const today = new Date();

  if (!beforeSnap) {
    console.log(
      `[satelliteCron] No before snapshot for "${regionName}" — fetching baseline.`,
    );

    const tile = await fetchAndSaveTile(region, today, "before");
    const coords = region.center?.coordinates || null;

    await Snapshot.create({
      region: region._id,
      type: "before",
      imageUrl: tile.imageUrl,
      capturedAt: today,
      capturedBy: null,
      notes: `Auto-fetched baseline by satellite pipeline on ${tile.date}`,
      ...(coords && {
        location: {
          type: "Point",
          coordinates: coords,
        },
      }),
    });


    await Region.updateOne({ _id: region._id }, { lastAnalyzedAt: today });

    await audit({
      action: "satellite.baseline_captured",
      actor: null,
      actorLabel: "System (satellite-pipeline)",
      metadata: { region: regionName, date: tile.date },
    }).catch(() => null);

    return {
      regionId,
      regionName,
      status: "baseline_captured",
      message: "First before snapshot saved. Analysis will run next cycle.",
    };
  }

  const intervalDays = region.monitoringIntervalDays || 15;
  const lastAnalyzed = region.lastAnalyzedAt || beforeSnap.capturedAt;
  const daysSinceLast = Math.floor(
    (today - lastAnalyzed) / (1000 * 60 * 60 * 24),
  );

  if (daysSinceLast < intervalDays) {
    const daysRemaining = intervalDays - daysSinceLast;
    console.log(
      `[satelliteCron] "${regionName}" — interval not elapsed. ` +
        `${daysSinceLast}/${intervalDays} days. Next run in ${daysRemaining} day(s).`,
    );
    return {
      regionId,
      regionName,
      status: "skipped",
      message: `Interval not elapsed. ${daysRemaining} day(s) remaining.`,
      daysSinceLast,
      intervalDays,
    };
  }

  console.log(`[satelliteCron] "${regionName}" — fetching after tile.`);
  const afterTile = await fetchAndSaveTile(region, today, "after");

  const coords = region.center?.coordinates || null;

  const afterSnap = await Snapshot.create({
    region: region._id,
    type: "after",
    imageUrl: afterTile.imageUrl,
    capturedAt: today,
    capturedBy: null,
    notes: `Auto-fetched by satellite pipeline on ${afterTile.date}`,
    ...(coords && {
      location: {
        type: "Point",
        coordinates: coords,
      },
    }),
  });

  console.log(`[satelliteCron] "${regionName}" — calling AI service.`);
  let ai;
  try {
    ai = await callAISentinel(
      beforeSnap.imageUrl.startsWith("/uploads")
        ? 
          path.join(__dirname, "..", beforeSnap.imageUrl)
        : beforeSnap.imageUrl,
      afterTile.filePath,
      regionId,
    );
  } catch (aiErr) {
    console.error(
      `[satelliteCron] AI call failed for "${regionName}":`,
      aiErr.message,
    );

    await Snapshot.deleteOne({ _id: afterSnap._id }).catch(() => null);
    if (afterTile?.filePath) fs.unlink(afterTile.filePath, () => null);

    return {
      regionId,
      regionName,
      status: "ai_error",
      message: aiErr.message,
    };
  }

  const result = buildResult(
    ai,
    region,
    beforeSnap.imageUrl,
    afterTile.imageUrl,
  );

  console.log(
    `[satelliteCron] "${regionName}" — AI result: ` +
      `model_run=${ai.model_run}  loss=${result.lossPercentage}%  ` +
      `confidence=${result.confidence}`,
  );


  let savedAlert = null;
  let legalStatus = "unverified";

  if (ai.model_run && result.lossPercentage > 0) {
    const coords = region.center?.coordinates || [0, 0];

    try {
      const { isLegal, zone } = await verifyLegalZone(coords);
      legalStatus = isLegal ? "legal" : "illegal";

      if (isLegal) {

        await audit({
          action: "analysis.legal_cut_detected",
          actor: null,
          actorLabel: "System (satellite-pipeline)",
          metadata: {
            region: regionName,
            legalZone: zone.name,
            permitNumber: zone.permitNumber,
            lossPercentage: result.lossPercentage,
            coords,
          },
        }).catch(() => null);

        console.log(
          `[satelliteCron] "${regionName}" — legal cut detected (zone: ${zone.name}). No alert.`,
        );
      } else {
        savedAlert = await createAlert(result, region, "illegal");

        await Snapshot.updateOne(
          { _id: afterSnap._id },
          { relatedAlert: savedAlert._id },
        );

        notifyOfficialsIfCritical(savedAlert, regionName, true);

        console.log(
          `[satelliteCron] "${regionName}" — ILLEGAL deforestation! ` +
            `Alert created: ${savedAlert._id}  severity=${savedAlert.severity}`,
        );
      }
    } catch (legalErr) {
      console.error(
        `[satelliteCron] Legal verification failed for "${regionName}":`,
        legalErr.message,
      );

      savedAlert = await createAlert(result, region, "unverified");
      notifyOfficialsIfCritical(savedAlert, regionName, false);
    }
  } else if (!ai.model_run) {
    console.log(
      `[satelliteCron] "${regionName}" — NDVI pre-screen: no significant change ` +
        `(delta=${ai.ndvi?.delta}). Skipping alert.`,
    );
  } else {
    console.log(
      `[satelliteCron] "${regionName}" — no vegetation loss detected.`,
    );
  }

  await Snapshot.deleteOne({ _id: beforeSnap._id });


  await Snapshot.updateOne(
    { _id: afterSnap._id },
    {
      type: "before",
      notes: `Promoted from after on ${today.toISOString().split("T")[0]}`,
    },
  );

  await Region.updateOne({ _id: region._id }, { lastAnalyzedAt: today });

  await audit({
    action: "satellite.analysis_complete",
    actor: null,
    actorLabel: "System (satellite-pipeline)",
    metadata: {
      region: regionName,
      lossPercentage: result.lossPercentage,
      modelRun: ai.model_run,
      legalStatus,
      alertId: savedAlert?._id || null,
      severity: savedAlert?.severity || null,
    },
  }).catch(() => null);

  return {
    regionId,
    regionName,
    status: savedAlert
      ? "alert_created"
      : ai.model_run
        ? "no_loss"
        : "ndvi_skipped",
    lossPercentage: result.lossPercentage,
    modelRun: ai.model_run,
    legalStatus,
    alertId: savedAlert?._id || null,
    severity: savedAlert?.severity || null,
  };
}

async function runPipeline() {
  const startedAt = new Date();
  console.log(
    `\n[satelliteCron] ====== Pipeline run started at ${startedAt.toISOString()} ======`,
  );

  let regions;
  try {
    regions = await Region.find({ isActive: true });
  } catch (dbErr) {
    console.error("[satelliteCron] Failed to fetch regions:", dbErr.message);
    return;
  }

  if (!regions.length) {
    console.log("[satelliteCron] No active regions found. Skipping.");
    return;
  }

  console.log(
    `[satelliteCron] Processing ${regions.length} active region(s) …`,
  );

  const runLog = [];

  for (const region of regions) {
    try {
      const result = await processRegion(region);
      runLog.push(result);
    } catch (err) {
      console.error(
        `[satelliteCron] Unhandled error for region "${region.name}":`,
        err.message,
      );
      runLog.push({
        regionId: region._id.toString(),
        regionName: region.name,
        status: "error",
        message: err.message,
      });
    }
  }

  const duration = ((Date.now() - startedAt) / 1000).toFixed(1);
  const counts = runLog.reduce((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1;
    return acc;
  }, {});

  console.log(
    `[satelliteCron] ====== Pipeline complete in ${duration}s ======`,
  );
  console.log("[satelliteCron] Summary:", JSON.stringify(counts));
  console.log("[satelliteCron] Run log:", JSON.stringify(runLog, null, 2));
  console.log(
    `[satelliteCron] ============================================================\n`,
  );
}

function startSatelliteCron() {
  // Lazy-require node-cron so it only loads when this function is called
  const cron = require("node-cron");

  if (!cron.validate(CRON_SCHEDULE)) {
    console.error("[satelliteCron] Invalid cron schedule:", CRON_SCHEDULE);
    return;
  }

  cron.schedule(
    CRON_SCHEDULE,
    () => {
      runPipeline().catch((err) =>
        console.error("[satelliteCron] Pipeline crashed:", err.message),
      );
    },
    {
      timezone: "Asia/Kolkata",
    },
  );

  console.log(
    `[satelliteCron] Scheduled — runs at 06:00 AM IST daily (schedule: "${CRON_SCHEDULE}")`,
  );
}

module.exports = {
  startSatelliteCron,
  runPipeline, // exported so manual trigger route can call it
  processRegion, // exported for single-region manual trigger
};
