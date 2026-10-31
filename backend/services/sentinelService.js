const fs    = require("fs");
const path  = require("path");
const fetch = (...args) =>
  import("node-fetch").then(({ default: f }) => f(...args));

const SH_TOKEN_URL   = "https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token";
const SH_PROCESS_URL = "https://sh.dataspace.copernicus.eu/api/v1/process";

const CLIENT_ID     = process.env.SENTINEL_CLIENT_ID;
const CLIENT_SECRET = process.env.SENTINEL_CLIENT_SECRET;

const SENTINEL_UPLOAD_DIR = path.join(__dirname, "..", "uploads", "sentinel");
const TILE_WIDTH           = 512;
const TILE_HEIGHT          = 512;
const BBOX_DELTA           = 0.15;   // ~16km box — slightly larger improves hit rate

// A tile smaller than this is almost certainly blank/cloud-covered
const MIN_TILE_BYTES = 5000;

// How many different date windows to try before giving up
const MAX_DATE_ATTEMPTS = 4;


let _cachedToken    = null;
let _tokenExpiresAt = 0;

async function getAccessToken() {
  if (_cachedToken && Date.now() < _tokenExpiresAt - 60_000) return _cachedToken;

  if (!CLIENT_ID || !CLIENT_SECRET) {
    throw new Error(
      "SENTINEL_CLIENT_ID and SENTINEL_CLIENT_SECRET must be set in .env"
    );
  }

  const body = new URLSearchParams({
    grant_type:    "client_credentials",
    client_id:     CLIENT_ID,
    client_secret: CLIENT_SECRET,
  });

  const res = await fetch(SH_TOKEN_URL, {
    method:  "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body:    body.toString(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Sentinel Hub token fetch failed (${res.status}): ${text}`);
  }

  const data       = await res.json();
  _cachedToken     = data.access_token;
  _tokenExpiresAt  = Date.now() + data.expires_in * 1000;
  console.log("[sentinelService] Token refreshed, valid for", data.expires_in, "s");
  return _cachedToken;
}


function buildBbox(lon, lat, delta = BBOX_DELTA) {
  return [
    +(lon - delta).toFixed(6),
    +(lat - delta).toFixed(6),
    +(lon + delta).toFixed(6),
    +(lat + delta).toFixed(6),
  ];
}


function buildProcessRequest(bbox, targetDate, windowDays = 20) {
  const from = new Date(targetDate);
  from.setDate(from.getDate() - windowDays);
  const to = new Date(targetDate);
  to.setDate(to.getDate() + 1);

  return {
    input: {
      bounds: {
        bbox,
        properties: { crs: "http://www.opengis.net/def/crs/EPSG/0/4326" },
      },
      data: [
        {
          type: "sentinel-2-l2a",
          dataFilter: {
            timeRange: {
              from: from.toISOString(),
              to:   to.toISOString(),
            },
            maxCloudCoverage: 50,
            mosaickingOrder: "leastCC", 
          },
        },
      ],
    },
    output: {
      width:  TILE_WIDTH,
      height: TILE_HEIGHT,
      responses: [{ identifier: "default", format: { type: "image/png" } }],
    },
    evalscript: `
      //VERSION=3
      function setup() {
        return {
          input:  [{ bands: ["B02", "B03", "B04"], units: "DN" }],
          output: { bands: 3 }
        };
      }
      function evaluatePixel(sample) {
        // True color with brightness boost (×3.5) for better visibility
        return [
          Math.min(sample.B04 / 10000 * 3.5 * 255, 255),
          Math.min(sample.B03 / 10000 * 3.5 * 255, 255),
          Math.min(sample.B02 / 10000 * 3.5 * 255, 255),
        ];
      }
    `,
  };
}

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
}

async function attemptTileFetch(bbox, targetDate, windowDays = 20) {
  const token   = await getAccessToken();
  const payload = buildProcessRequest(bbox, targetDate, windowDays);

  const res = await fetch(SH_PROCESS_URL, {
    method:  "POST",
    headers: {
      Authorization:  `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept:         "image/png",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Sentinel Hub process API failed (${res.status}): ${text}`);
  }

  const buffer = await res.arrayBuffer();
  return Buffer.from(buffer);
}

async function fetchAndSaveTile(region, date, type = "after") {
  const regionId       = region._id.toString();
  const [lon, lat]     = region.center.coordinates;
  const bbox           = buildBbox(lon, lat);
  const baseDateStr    = date instanceof Date
    ? date.toISOString().split("T")[0]
    : date;

  const saveDir  = path.join(SENTINEL_UPLOAD_DIR, regionId);
  ensureDir(saveDir);

  const filename = `${type}_${baseDateStr}.png`;
  const filePath = path.join(saveDir, filename);
  const imageUrl = `/uploads/sentinel/${regionId}/${filename}`;

  // Date windows to try
  const attempts = [
    { offsetDays: 0,   windowDays: 20 },
    { offsetDays: 30,  windowDays: 20 },
    { offsetDays: 60,  windowDays: 30 },
    { offsetDays: 90,  windowDays: 45 },
  ];

  let finalBuffer = null;
  let usedDate    = baseDateStr;

  for (let i = 0; i < Math.min(attempts.length, MAX_DATE_ATTEMPTS); i++) {
    const { offsetDays, windowDays } = attempts[i];
    const targetDate = new Date(date);
    targetDate.setDate(targetDate.getDate() - offsetDays);
    const targetDateStr = targetDate.toISOString().split("T")[0];

    console.log(
      `[sentinelService] Attempt ${i + 1}/${MAX_DATE_ATTEMPTS} for "${region.name}" ` +
      `| target=${targetDateStr} | window=${windowDays}d | bbox=${JSON.stringify(bbox)}`
    );

    try {
      const buffer = await attemptTileFetch(bbox, targetDate, windowDays);

      if (buffer.length >= MIN_TILE_BYTES) {
        console.log(
          `[sentinelService] ✓ Good tile found on attempt ${i + 1} ` +
          `(${buffer.length} bytes, date=${targetDateStr})`
        );
        finalBuffer = buffer;
        usedDate    = targetDateStr;
        break;
      } else {
        console.log(
          `[sentinelService] Blank tile on attempt ${i + 1} ` +
          `(${buffer.length} bytes) — likely cloud-covered, trying earlier date…`
        );
        // Save the blank tile as fallback but keep trying
        if (i === attempts.length - 1 && !finalBuffer) {
          finalBuffer = buffer; // use blank as last resort
        }
      }
    } catch (err) {
      console.warn(`[sentinelService] Attempt ${i + 1} failed: ${err.message}`);
    }
  }

  if (!finalBuffer) {
    throw new Error(
      `Could not fetch any tile for "${region.name}" after ${MAX_DATE_ATTEMPTS} attempts. ` +
      `Check Sentinel Hub credentials and region coordinates.`
    );
  }

  fs.writeFileSync(filePath, finalBuffer);

  const isBlank = finalBuffer.length < MIN_TILE_BYTES;
  console.log(
    `[sentinelService] Saved ${type} tile → ${imageUrl} ` +
    `(${finalBuffer.length} bytes, date=${usedDate}${isBlank ? ", BLANK/CLOUDY" : ", REAL IMAGERY"})`
  );

  return {
    filePath,
    imageUrl,
    bbox,
    date:        usedDate,
    regionId,
    isBlank,
    sizeBytes:   finalBuffer.length,
  };
}

module.exports = {
  fetchAndSaveTile,
  buildBbox,
  getAccessToken,
  MIN_TILE_BYTES,
};