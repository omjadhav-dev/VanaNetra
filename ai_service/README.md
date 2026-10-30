# VanaNetra AI Microservice

Flask service that wraps the SegFormer deforestation model.
Runs on **port 5001** and is called by the Node.js backend.

## Setup

```bash
cd ai_service
pip install -r requirements.txt
python app.py
```

The first run downloads ~340 MB of SegFormer weights from Hugging Face (cached afterwards).

## Endpoints

### `GET /health`
Returns `{"status": "ok"}`.

### `POST /predict`
Multipart form fields:

| Field    | Required for         | Description          |
|----------|----------------------|----------------------|
| `mode`   | always               | `"change"` or `"landcover"` |
| `image`  | `mode=landcover`     | single satellite image |
| `before` | `mode=change`        | earlier satellite image |
| `after`  | `mode=change`        | later satellite image |

#### Change detection response
```json
{
  "mode": "change",
  "vegetation_lost_pct": 12.4,
  "pixels_lost": 48200,
  "total_pixels": 388800,
  "confidence": 91.3,
  "before_confidence": 90.7,
  "after_confidence": 91.9,
  "result_image_b64": "<base64 PNG with red overlay>",
  "lost_tree_spots": [
    { "id": 1, "centroid_x": 320, "centroid_y": 210, "pixels_lost": 3200 },
    ...
  ],
  "spot_count": 32
}
```

#### Land cover response
```json
{
  "mode": "landcover",
  "vegetation_pct": 61.2,
  "confidence": 89.5,
  "classification": "High vegetation"
}
```

## Environment variables

| Variable        | Default                    | Description                    |
|-----------------|----------------------------|--------------------------------|
| `AI_SERVICE_URL`| `http://localhost:5001`     | Set in backend `.env`          |
