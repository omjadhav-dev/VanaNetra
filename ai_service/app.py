"""
VanaNetra AI Microservice
Wraps the SegFormer deforestation model and exposes a REST endpoint.
Run: pip install flask transformers torch torchvision pillow numpy scikit-learn
     python app.py
"""

import io, base64, traceback
import numpy as np
from flask import Flask, request, jsonify
from PIL import Image
import torch
import torch.nn.functional as F
from transformers import SegformerForSemanticSegmentation, SegformerImageProcessor
from sklearn.cluster import KMeans

app = Flask(__name__)

# ---------------------------------------------------------------------------
# Model – loaded once at startup
# ---------------------------------------------------------------------------
print("Loading SegFormer model …")
PROCESSOR = SegformerImageProcessor.from_pretrained(
    "nvidia/segformer-b5-finetuned-ade-640-640"
)
MODEL = SegformerForSemanticSegmentation.from_pretrained(
    "nvidia/segformer-b5-finetuned-ade-640-640"
)
MODEL.eval()
print("Model ready.")

# ADE20K class ids that correspond to vegetation / trees / grass / plants
VEG_CLASSES   = [4, 17, 72]   # grass, plant, tree
CONFIDENCE_TH = 0.45           # pixel threshold for "is vegetation"
MAX_CLUSTERS  = 32             # maximum K-Means clusters for lost-tree spots


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def open_image(fileobj) -> Image.Image:
    return Image.open(io.BytesIO(fileobj.read())).convert("RGB")


def get_vegetation_mask(image: Image.Image):
    """Return (binary uint8 mask, mean_confidence_float)."""
    w, h = image.size
    inputs = PROCESSOR(images=image, return_tensors="pt")

    with torch.no_grad():
        logits = MODEL(**inputs).logits          # (1, num_classes, H', W')

    logits = F.interpolate(logits, size=(h, w), mode="bilinear", align_corners=False)
    probs  = torch.softmax(logits, dim=1).squeeze(0).numpy()   # (C, H, W)

    veg_prob = sum(probs[c] for c in VEG_CLASSES)              # (H, W)
    confidence = float(probs.max(axis=0).mean() * 100)
    mask = (veg_prob >= CONFIDENCE_TH).astype(np.uint8)
    return mask, confidence


def mask_to_result_image(after_img: Image.Image, lost_mask: np.ndarray) -> str:
    """Overlay red tint on lost-vegetation pixels; return base64 PNG."""
    after_arr   = np.array(after_img)
    result      = after_arr.copy()
    red         = np.array([220, 30, 30])
    sel         = lost_mask == 1
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
    k = min(k, len(coords))
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
# Route
# ---------------------------------------------------------------------------

@app.route("/predict", methods=["POST"])
def predict():
    try:
        mode = request.form.get("mode", "landcover")

        # ── CHANGE DETECTION ────────────────────────────────────────────────
        if mode == "change":
            if "before" not in request.files or "after" not in request.files:
                return jsonify({"error": "before and after images are required"}), 400

            before_img = open_image(request.files["before"])
            after_img  = open_image(request.files["after"])

            # Normalise sizes
            after_img = after_img.resize(before_img.size, Image.LANCZOS)
            total_px  = before_img.size[0] * before_img.size[1]

            before_mask, before_conf = get_vegetation_mask(before_img)
            after_mask,  after_conf  = get_vegetation_mask(after_img)

            lost_mask = ((before_mask == 1) & (after_mask == 0)).astype(np.uint8)

            lost_px        = int(lost_mask.sum())
            loss_pct       = round(100 * lost_px / total_px, 2)
            avg_confidence = round((before_conf + after_conf) / 2, 1)

            result_b64 = mask_to_result_image(after_img, lost_mask)
            spots      = find_lost_clusters(lost_mask)

            return jsonify({
                "mode":              "change",
                "vegetation_lost_pct": loss_pct,
                "pixels_lost":       lost_px,
                "total_pixels":      total_px,
                "confidence":        avg_confidence,
                "before_confidence": round(before_conf, 1),
                "after_confidence":  round(after_conf, 1),
                "result_image_b64":  result_b64,   # PNG, base64-encoded
                "lost_tree_spots":   spots[:20],   # top 20 clusters
                "spot_count":        len(spots),
            })

        # ── LAND COVER ──────────────────────────────────────────────────────
        else:
            if "image" not in request.files:
                return jsonify({"error": "image is required"}), 400

            img = open_image(request.files["image"])
            mask, confidence = get_vegetation_mask(img)

            total_px = mask.size
            veg_px   = int(mask.sum())
            veg_pct  = round(100 * veg_px / total_px, 2)

            return jsonify({
                "mode":         "landcover",
                "vegetation_pct": veg_pct,
                "confidence":   round(confidence, 1),
                "classification": (
                    "High vegetation"   if veg_pct > 55 else
                    "Moderate vegetation" if veg_pct > 30 else
                    "Low vegetation"
                ),
            })

    except Exception:
        traceback.print_exc()
        return jsonify({"error": "Inference failed"}), 500


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "service": "vananetra-ai"})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=False)
