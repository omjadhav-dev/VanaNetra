
import io
import base64
import traceback
import logging
import time
from typing import Optional

import numpy as np
from flask import Flask, request, jsonify
from PIL import Image
import torch
import torch.nn.functional as F
from transformers import SegformerForSemanticSegmentation, SegformerImageProcessor
from sklearn.cluster import KMeans

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
log = logging.getLogger("vananetra-ai")

app = Flask(__name__)

# ---------------------------------------------------------------------------
# Model — loaded once at startup
# ---------------------------------------------------------------------------
log.info("Loading SegFormer model …")
PROCESSOR = SegformerImageProcessor.from_pretrained(
    "nvidia/segformer-b5-finetuned-ade-640-640"
)
MODEL = SegformerForSemanticSegmentation.from_pretrained(
    "nvidia/segformer-b5-finetuned-ade-640-640"
)
MODEL.eval()
log.info("Model ready.")

# ADE20K class ids that correspond to vegetation / trees / grass / plants
VEG_CLASSES = [4, 17, 72]   # grass=4, plant=17, tree=72
CONFIDENCE_TH = 0.45        # pixel probability threshold for "is vegetation"
MAX_CLUSTERS = 32            # maximum K-Means clusters for lost-tree spots

# ---------------------------------------------------------------------------
# NDVI thresholds — used for Sentinel pre-screening
# ---------------------------------------------------------------------------
# Any pixel with NDVI >= this is considered vegetated in the raw satellite data.
NDVI_VEG_THRESHOLD = 0.25

# Minimum NDVI delta (before_ndvi_mean - after_ndvi_mean) to consider
# a zone worth running the heavy SegFormer model on.
# Below this → no meaningful vegetation change → skip model, return no-change.
NDVI_CHANGE_THRESHOLD = 0.03

# ---------------------------------------------------------------------------
# Helpers — image I/O
# ---------------------------------------------------------------------------

def open_image_from_fileobj(fileobj) -> Image.Image:
    """Open an uploaded file object as RGB PIL image."""
    return Image.open(io.BytesIO(fileobj.read())).convert("RGB")


def open_image_from_bytes(data: bytes) -> Image.Image:
    """Open raw bytes as RGB PIL image — used by batch endpoint."""
    return Image.open(io.BytesIO(data)).convert("RGB")


def image_to_b64(img: Image.Image, fmt: str = "PNG") -> str:
    """Encode a PIL image to a base64 string."""
    buf = io.BytesIO()
    img.save(buf, format=fmt)
    return base64.b64encode(buf.getvalue()).decode()


# ---------------------------------------------------------------------------
# Helpers — NDVI (Option A: computed from RGB approximation)
# ---------------------------------------------------------------------------
# NOTE: True NDVI needs NIR band (B08 from Sentinel-2), which is not present
# in a standard RGB PNG.  Option A approximates NIR from the red channel
# relationship in vegetation-heavy satellite composites.  This is a
# well-known proxy used when only RGB is available.
#
# Option B upgrade path: when you switch to a 4-band evalscript, Sentinel Hub
# returns NDVI as the 4th channel.  Replace `compute_ndvi_rgb()` with a one-
# liner that reads `img_array[:, :, 3]` and you're done.  Nothing else changes.

def compute_ndvi_rgb(img_array: np.ndarray) -> np.ndarray:
    """
    Approximate NDVI from an RGB satellite image.
    Uses the relationship: NDVI_proxy = (G - R) / (G + R + 1e-8)
    This works reasonably well for Sentinel-2 true-color composites where
    green vegetation has notably higher G vs R reflectance.

    Returns a 2D float array in [-1, 1].
    """
    r = img_array[:, :, 0].astype(np.float32)
    g = img_array[:, :, 1].astype(np.float32)
    ndvi = (g - r) / (g + r + 1e-8)
    return ndvi


def ndvi_vegetation_mask(ndvi: np.ndarray) -> np.ndarray:
    """Binary mask: 1 where NDVI >= threshold (pixel is vegetated)."""
    return (ndvi >= NDVI_VEG_THRESHOLD).astype(np.uint8)


def ndvi_summary(ndvi: np.ndarray) -> dict:
    """Return basic stats for an NDVI map."""
    return {
        "mean": float(round(float(ndvi.mean()), 4)),
        "max":  float(round(float(ndvi.max()), 4)),
        "min":  float(round(float(ndvi.min()), 4)),
        "veg_pixel_pct": float(round(
            100 * float((ndvi >= NDVI_VEG_THRESHOLD).sum()) / ndvi.size, 2
        )),
    }


def ndvi_pre_screen(before_arr: np.ndarray, after_arr: np.ndarray) -> dict:
    """
    Fast NDVI comparison of before/after arrays.
    Returns:
        {
            "before": <ndvi_summary>,
            "after":  <ndvi_summary>,
            "delta":  float,           # before_mean - after_mean (positive = loss)
            "skip_model": bool,        # True if delta is below threshold
            "pixel_loss_pct_ndvi": float  # quick vegetation loss estimate from NDVI
        }
    """
    before_ndvi = compute_ndvi_rgb(before_arr)
    after_ndvi  = compute_ndvi_rgb(after_arr)

    before_mask = ndvi_vegetation_mask(before_ndvi)
    after_mask  = ndvi_vegetation_mask(after_ndvi)

    # Pixels that were vegetated before but not after
    lost_mask  = ((before_mask == 1) & (after_mask == 0)).astype(np.uint8)
    total_px   = before_arr.shape[0] * before_arr.shape[1]
    lost_px    = int(lost_mask.sum())
    loss_pct   = round(100 * lost_px / total_px, 2)

    delta = round(float(before_ndvi.mean()) - float(after_ndvi.mean()), 4)

    return {
        "before": ndvi_summary(before_ndvi),
        "after":  ndvi_summary(after_ndvi),
        "delta":  delta,
        "skip_model": delta < NDVI_CHANGE_THRESHOLD,
        "pixel_loss_pct_ndvi": loss_pct,
        "lost_pixels_ndvi": lost_px,
        "total_pixels": total_px,
    }


# ---------------------------------------------------------------------------
# Helpers — SegFormer inference (unchanged from original logic)
# ---------------------------------------------------------------------------

def get_vegetation_mask(image: Image.Image):
    """
    Run SegFormer on a PIL image.
    Returns (binary uint8 mask of shape HxW, mean_confidence float).
    """
    w, h = image.size
    inputs = PROCESSOR(images=image, return_tensors="pt")

    with torch.no_grad():
        logits = MODEL(**inputs).logits          # (1, num_classes, H', W')

    logits = F.interpolate(logits, size=(h, w), mode="bilinear", align_corners=False)
    probs  = torch.softmax(logits, dim=1).squeeze(0).numpy()  # (C, H, W)

    veg_prob   = sum(probs[c] for c in VEG_CLASSES)           # (H, W)
    confidence = float(probs.max(axis=0).mean() * 100)
    mask       = (veg_prob >= CONFIDENCE_TH).astype(np.uint8)
    return mask, confidence


def mask_to_result_image(after_img: Image.Image, lost_mask: np.ndarray) -> str:
    """Overlay red tint on lost-vegetation pixels; return base64 PNG."""
    after_arr = np.array(after_img)
    result    = after_arr.copy()
    red       = np.array([220, 30, 30])
    sel       = lost_mask == 1
    result[sel] = (0.45 * after_arr[sel] + 0.55 * red).astype(np.uint8)

    out = Image.fromarray(result)
    buf = io.BytesIO()
    out.save(buf, format="PNG")
    return base64.b64encode(buf.getvalue()).decode()


def find_lost_clusters(mask: np.ndarray, k: int = MAX_CLUSTERS):
    """K-Means cluster the lost-vegetation pixels; return list of spot dicts."""
    coords = np.column_stack(np.where(mask))
    if len(coords) == 0:
        return []
    k      = min(k, len(coords))
    km     = KMeans(n_clusters=k, random_state=42, n_init=10)
    labels = km.fit_predict(coords)
    spots  = []
    for label in range(k):
        pts = coords[labels == label]
        spots.append({
            "id":          int(label + 1),
            "centroid_x":  int(pts[:, 1].mean()),
            "centroid_y":  int(pts[:, 0].mean()),
            "pixels_lost": int(len(pts)),
        })
    spots.sort(key=lambda s: s["pixels_lost"], reverse=True)
    return spots


# ---------------------------------------------------------------------------
# Core analysis logic — shared by all endpoints
# ---------------------------------------------------------------------------

def run_change_detection(
    before_img: Image.Image,
    after_img: Image.Image,
    source: str = "manual",
) -> dict:
    """
    Run full change detection pipeline.

    For source="sentinel":
      - NDVI pre-screen runs first (fast, CPU-only)
      - If delta < NDVI_CHANGE_THRESHOLD → return early, skip SegFormer
      - If delta >= threshold → run SegFormer as usual
      - NDVI stats always included in response for logging

    For source="manual":
      - No NDVI pre-screen (user already selected meaningful images)
      - SegFormer runs unconditionally (original behavior preserved)
    """
    t0 = time.time()

    # Normalise sizes — after must match before
    after_img = after_img.resize(before_img.size, Image.LANCZOS)

    before_arr = np.array(before_img)
    after_arr  = np.array(after_img)
    total_px   = before_arr.shape[0] * before_arr.shape[1]

    ndvi_info  = None
    skipped    = False

    # ── NDVI pre-screen (Sentinel only) ─────────────────────────────────────
    if source == "sentinel":
        ndvi_info = ndvi_pre_screen(before_arr, after_arr)
        log.info(
            "NDVI pre-screen: delta=%.4f  skip=%s  ndvi_loss_pct=%.2f%%",
            ndvi_info["delta"],
            ndvi_info["skip_model"],
            ndvi_info["pixel_loss_pct_ndvi"],
        )

        if ndvi_info["skip_model"]:
            # No meaningful change detected — return lightweight result
            skipped = True
            elapsed = round(time.time() - t0, 2)
            return {
                "mode":                 "change",
                "source":               source,
                "model_run":            False,       # SegFormer was NOT run
                "skip_reason":          "ndvi_delta_below_threshold",
                "ndvi":                 ndvi_info,
                "vegetation_lost_pct":  0.0,
                "pixels_lost":          0,
                "total_pixels":         total_px,
                "confidence":           None,
                "before_confidence":    None,
                "after_confidence":     None,
                "result_image_b64":     None,
                "lost_tree_spots":      [],
                "spot_count":           0,
                "processing_time_s":    elapsed,
            }

    # ── SegFormer inference ──────────────────────────────────────────────────
    before_mask, before_conf = get_vegetation_mask(before_img)
    after_mask,  after_conf  = get_vegetation_mask(after_img)

    lost_mask  = ((before_mask == 1) & (after_mask == 0)).astype(np.uint8)
    lost_px    = int(lost_mask.sum())
    loss_pct   = round(100 * lost_px / total_px, 2)
    avg_conf   = round((before_conf + after_conf) / 2, 1)

    result_b64 = mask_to_result_image(after_img, lost_mask)
    spots      = find_lost_clusters(lost_mask)
    elapsed    = round(time.time() - t0, 2)

    log.info(
        "Change detection done: loss=%.2f%%  confidence=%.1f%%  spots=%d  time=%.2fs",
        loss_pct, avg_conf, len(spots), elapsed,
    )

    return {
        "mode":                 "change",
        "source":               source,
        "model_run":            True,
        "ndvi":                 ndvi_info,   # None for manual, dict for sentinel
        "vegetation_lost_pct":  loss_pct,
        "pixels_lost":          lost_px,
        "total_pixels":         total_px,
        "confidence":           avg_conf,
        "before_confidence":    round(before_conf, 1),
        "after_confidence":     round(after_conf, 1),
        "result_image_b64":     result_b64,
        "lost_tree_spots":      spots[:20],  # top 20 clusters
        "spot_count":           len(spots),
        "processing_time_s":    elapsed,
    }


def run_landcover(image: Image.Image, source: str = "manual") -> dict:
    """Land cover analysis — unchanged logic, source param added for logging."""
    t0 = time.time()

    mask, confidence = get_vegetation_mask(image)
    total_px = mask.size
    veg_px   = int(mask.sum())
    veg_pct  = round(100 * veg_px / total_px, 2)
    elapsed  = round(time.time() - t0, 2)

    return {
        "mode":             "landcover",
        "source":           source,
        "vegetation_pct":   veg_pct,
        "confidence":       round(confidence, 1),
        "classification": (
            "High vegetation"     if veg_pct > 55 else
            "Moderate vegetation" if veg_pct > 30 else
            "Low vegetation"
        ),
        "processing_time_s": elapsed,
    }


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.route("/predict", methods=["POST"])
def predict():
    """
    Original endpoint — fully backward compatible.
    New optional field: `source` = "manual" (default) | "sentinel"
    When source="sentinel", NDVI pre-screen runs before SegFormer.
    """
    try:
        mode   = request.form.get("mode", "landcover")
        source = request.form.get("source", "manual")

        if mode not in ("landcover", "change"):
            return jsonify({"error": "mode must be 'landcover' or 'change'"}), 400

        # ── change detection ─────────────────────────────────────────────────
        if mode == "change":
            if "before" not in request.files or "after" not in request.files:
                return jsonify({"error": "before and after images are required"}), 400

            before_img = open_image_from_fileobj(request.files["before"])
            after_img  = open_image_from_fileobj(request.files["after"])
            result     = run_change_detection(before_img, after_img, source)
            return jsonify(result)

        # ── land cover ───────────────────────────────────────────────────────
        else:
            if "image" not in request.files:
                return jsonify({"error": "image is required"}), 400

            img    = open_image_from_fileobj(request.files["image"])
            result = run_landcover(img, source)
            return jsonify(result)

    except Exception:
        traceback.print_exc()
        return jsonify({"error": "Inference failed"}), 500


@app.route("/predict-sentinel", methods=["POST"])
def predict_sentinel():
    """
    Dedicated Sentinel endpoint — called by the Node cron job.

    Expects multipart form with:
      - before  : RGB PNG tile from Sentinel Hub (before period)
      - after   : RGB PNG tile from Sentinel Hub (after period)
      - zone_id : (optional) region/zone identifier for logging

    Always runs NDVI pre-screen first.
    Returns model_run=False if NDVI delta is below threshold (no change).
    Returns full SegFormer result if significant change detected.

    Option B upgrade: when switching to 4-band evalscript, Sentinel Hub
    returns NDVI as band 4. Pass ndvi_band=true in form and this endpoint
    will read channel 3 of the image directly instead of computing NDVI_proxy.
    The rest of the pipeline is identical.
    """
    try:
        if "before" not in request.files or "after" not in request.files:
            return jsonify({"error": "before and after images are required"}), 400

        zone_id    = request.form.get("zone_id", "unknown")
        before_img = open_image_from_fileobj(request.files["before"])
        after_img  = open_image_from_fileobj(request.files["after"])

        log.info("Sentinel prediction requested for zone_id=%s", zone_id)

        result = run_change_detection(before_img, after_img, source="sentinel")
        result["zone_id"] = zone_id
        return jsonify(result)

    except Exception:
        traceback.print_exc()
        return jsonify({"error": "Inference failed"}), 500


@app.route("/predict-batch", methods=["POST"])
def predict_batch():
    """
    Batch endpoint for the cron pipeline.
    Processes multiple zone image pairs in one HTTP call.

    Expects JSON body:
    {
      "zones": [
        {
          "zone_id": "region-mongo-id",
          "before_b64": "<base64 PNG>",
          "after_b64":  "<base64 PNG>"
        },
        ...
      ]
    }

    Returns:
    {
      "results": [
        {
          "zone_id": "...",
          "success": true,
          "result": { ...change detection result... }
        },
        {
          "zone_id": "...",
          "success": false,
          "error": "..."
        }
      ],
      "total": 3,
      "processed": 3,
      "failed": 0
    }

    NOTE: Images are passed as base64 strings (not multipart) because
    this endpoint is called server-to-server (Node → Flask), not from
    a browser. Base64 adds ~33% size overhead — acceptable for this use case.
    For high-frequency production use, switch to multipart streaming.
    """
    try:
        body  = request.get_json(force=True)
        zones = body.get("zones", [])

        if not zones:
            return jsonify({"error": "zones list is empty"}), 400

        if len(zones) > 50:
            return jsonify({"error": "Maximum 50 zones per batch"}), 400

        results   = []
        failed    = 0
        processed = 0

        for zone in zones:
            zone_id    = zone.get("zone_id", "unknown")
            before_b64 = zone.get("before_b64")
            after_b64  = zone.get("after_b64")

            if not before_b64 or not after_b64:
                results.append({
                    "zone_id": zone_id,
                    "success": False,
                    "error":   "Missing before_b64 or after_b64",
                })
                failed += 1
                continue

            try:
                before_bytes = base64.b64decode(before_b64)
                after_bytes  = base64.b64decode(after_b64)
                before_img   = open_image_from_bytes(before_bytes)
                after_img    = open_image_from_bytes(after_bytes)

                log.info("Batch: processing zone_id=%s", zone_id)
                result = run_change_detection(before_img, after_img, source="sentinel")
                result["zone_id"] = zone_id

                results.append({
                    "zone_id": zone_id,
                    "success": True,
                    "result":  result,
                })
                processed += 1

            except Exception as e:
                log.error("Batch zone %s failed: %s", zone_id, str(e))
                results.append({
                    "zone_id": zone_id,
                    "success": False,
                    "error":   str(e),
                })
                failed += 1

        return jsonify({
            "results":   results,
            "total":     len(zones),
            "processed": processed,
            "failed":    failed,
        })

    except Exception:
        traceback.print_exc()
        return jsonify({"error": "Batch inference failed"}), 500


@app.route("/health", methods=["GET"])
def health():
    """Extended health check — includes model info and config."""
    return jsonify({
        "status":  "ok",
        "service": "vananetra-ai",
        "model":   "nvidia/segformer-b5-finetuned-ade-640-640",
        "config": {
            "veg_classes":          VEG_CLASSES,
            "confidence_threshold": CONFIDENCE_TH,
            "ndvi_veg_threshold":   NDVI_VEG_THRESHOLD,
            "ndvi_change_threshold": NDVI_CHANGE_THRESHOLD,
            "max_clusters":         MAX_CLUSTERS,
        },
        "endpoints": ["/predict", "/predict-sentinel", "/predict-batch", "/health"],
    })


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    log.info("VanaNetra AI service starting on port 5001 …")
    app.run(host="0.0.0.0", port=5001, debug=False)