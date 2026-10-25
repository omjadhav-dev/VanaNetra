# 🌿 VANA-NETRA

**Geospatial Deforestation Monitoring & Alert Management Platform**

VANA-NETRA is a full-stack geospatial intelligence platform for detecting, tracking, and managing deforestation events across monitored forest regions in India. It combines an AI-powered change-detection microservice with a role-gated web application to give forestry officials and citizens a unified tool for environmental accountability.

---

## 📌 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Features](#features)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Database Models](#database-models)
- [User Roles](#user-roles)
- [AI Microservice](#ai-microservice)

---

## Overview

VANA-NETRA (वन नेत्र — "Forest Eye") provides:

- **Automated deforestation detection** via a SegFormer-based semantic segmentation model
- **Geospatial alerting** with severity scoring, confidence metrics, and legal zone verification
- **Officials-only dashboard** for triaging alerts through a structured audit-trail workflow
- **Public-facing interface** for citizens to submit reports, explore the map, and view transparency data
- **Legal-grade PDF exports** and a transparency dashboard for accountability and governance

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                     Client                          │
│          React 19 + Vite + Tailwind CSS             │
│    Leaflet/OpenStreetMap · Recharts · Redux          │
└──────────────────┬──────────────────────────────────┘
                   │ REST
┌──────────────────▼──────────────────────────────────┐
│               Node.js / Express API                 │
│   Auth · Alerts · Regions · Reports · Snapshots     │
│   Dashboard · Analysis · Admin · Legal Zones        │
└──────────┬───────────────────────┬──────────────────┘
           │ Mongoose              │ HTTP (node-fetch)
┌──────────▼────────┐   ┌──────────▼──────────────────┐
│  MongoDB Atlas    │   │    Python AI Microservice    │
│  6 collections    │   │  Flask · SegFormer · PyTorch │
└───────────────────┘   └─────────────────────────────┘
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, Vite 8, Tailwind CSS 4, Redux Toolkit |
| **Maps** | Leaflet.js, React-Leaflet, OpenStreetMap |
| **Charts** | Recharts |
| **PDF Export** | jsPDF, html2canvas |
| **Backend** | Node.js, Express 4 |
| **Database** | MongoDB Atlas (Mongoose ODM) |
| **Auth** | JWT (jsonwebtoken), bcryptjs |
| **File Upload** | Multer |
| **Email** | Nodemailer (Gmail) |
| **PDF Generation** | PDFKit |
| **AI Microservice** | Python, Flask, HuggingFace Transformers |
| **Model** | `nvidia/segformer-b5-finetuned-ade-640-640` |
| **ML Libraries** | PyTorch, torchvision, scikit-learn, Pillow, NumPy |

---

## Features

### 🗺️ Geospatial Map
- Interactive Leaflet/OpenStreetMap map with alert markers
- GeoJSON polygon overlays for monitored regions and legal protection zones
- Spatial querying with `2dsphere` indexes (MongoDB)

### 🤖 AI-Powered Analysis
- Upload before/after satellite imagery for automated deforestation detection
- SegFormer semantic segmentation identifies vegetation loss
- Returns `lossPercentage`, `affectedAreaHectares`, `confidenceScore`, and K-Means clustered deforestation hotspots

### 🚨 Alert Management
- Auto-derived severity levels: `Low` / `Medium` / `High` / `Critical` (based on loss percentage thresholds)
- Sources: `satellite-pipeline`, `citizen-report`, `manual-entry`
- Legal status tagging: `legal` / `illegal` / `unverified` against seeded legal zone boundaries

### 📋 Audit-Trail Workflow
- Structured 5-stage status flow: `Pending → Under Review → Verified → Action Taken → Resolved`
- Every status transition is appended to an immutable `statusHistory` array — never mutated
- Denormalized `changedByLabel` preserves attribution even after user deletion

### 📊 Officials Dashboard
- KPIs: total alerts, active regions, pending/resolved counts, area affected
- Filterable alert table with assignment, severity, and status views
- Role-gated: accessible only to `Official` and `Admin` roles

### 🔍 Transparency Dashboard
- Public-facing view of aggregated deforestation metrics by region
- Publicly visible alerts only (`isPubliclyVisible: true`)

### 📄 Legal-Grade PDF Reports
- Server-side PDF generation with PDFKit
- Client-side PDF export with jsPDF + html2canvas
- Certifications section backed by the `statusHistory` audit trail

### 📸 Map Snapshots
- Capture geotag-stamped map states and link them to alerts or reports

### 🔔 Email Notifications
- Nodemailer integration for alert assignment and status update notifications

### 👥 Citizen Reports
- Public users can submit deforestation reports with photographic evidence (Multer upload)
- Reports enter the same alert workflow for official review

---

## Project Structure

```
VANA-NETRA/
├── frontend/                   # React + Vite SPA
│   └── src/
│       ├── pages/
│       │   ├── Home.jsx
│       │   ├── Maps.jsx
│       │   ├── Alerts.jsx
│       │   ├── Analyze.jsx
│       │   ├── Dashboard.jsx
│       │   ├── TransparencyDashboard.jsx
│       │   ├── Reports.jsx
│       │   ├── Trends.jsx
│       │   ├── Login.jsx
│       │   ├── Register.jsx
│       │   └── Profile.jsx
│       ├── components/         # Header, Footer
│       ├── layout/             # MainLayout
│       └── lib/api.js          # Axios/fetch client
│
├── backend/                    # Express API
│   ├── server.js
│   ├── config/db.js
│   ├── middleware/auth.js      # JWT guard
│   ├── models/
│   │   ├── Alert.js            # Core model with audit trail
│   │   ├── Region.js           # GeoJSON regions
│   │   ├── User.js             # Role-based users
│   │   ├── Snapshot.js
│   │   ├── Report.js
│   │   ├── LegalZone.js
│   │   └── AuditLog.js
│   ├── controllers/            # Business logic per domain
│   ├── routes/                 # Express routers
│   ├── utils/
│   │   ├── audit.js
│   │   ├── emailService.js
│   │   └── verifyLegalZone.js
│   └── scripts/seedLegalZones.js
│
└── ai_service/                 # Python Flask microservice
    ├── app.py                  # SegFormer inference endpoint
    └── requirements.txt
```

---

## Getting Started

### Prerequisites

- Node.js ≥ 18
- Python ≥ 3.10
- MongoDB Atlas URI (or local MongoDB)

### 1. Clone the repository

```bash
git clone https://github.com/<your-username>/VANA-NETRA.git
cd VANA-NETRA
```

### 2. Start the Backend

```bash
cd backend
npm install
# Create .env (see Environment Variables section)
npm run dev        # nodemon server.js on :5000
```

Seed legal zone data:
```bash
npm run seed
node scripts/seedLegalZones.js
```

### 3. Start the Frontend

```bash
cd frontend
npm install
npm run dev        # Vite dev server on :5173
```

### 4. Start the AI Microservice

```bash
cd ai_service
pip install -r requirements.txt
python app.py      # Flask on :5001
```

> The SegFormer model downloads automatically from HuggingFace on first run (~500 MB).

---

## Environment Variables

Create `backend/.env`:

```env
PORT=5000
MONGODB_URI=<your-mongodb-atlas-uri>
JWT_SECRET=<strong-random-secret>
JWT_EXPIRES_IN=7d
CLIENT_ORIGIN=http://localhost:5173
AI_SERVICE_URL=http://localhost:5001
EMAIL_SERVICE=gmail
EMAIL_USER=<your-gmail>
EMAIL_PASS=<gmail-app-password>
```

---

## API Reference

| Method | Route | Access | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | Public | Register a new user |
| `POST` | `/api/auth/login` | Public | Login, returns JWT |
| `GET` | `/api/regions` | Public | List all monitored regions |
| `GET` | `/api/alerts` | Official/Admin | List and filter alerts |
| `POST` | `/api/alerts` | Public | Submit a citizen report |
| `PATCH` | `/api/alerts/:id/status` | Official/Admin | Advance alert status (audit-logged) |
| `GET` | `/api/dashboard` | Official/Admin | KPI summary for the dashboard |
| `POST` | `/api/analysis` | Public | Run AI change detection on images |
| `GET` | `/api/reports` | Official/Admin | List generated reports |
| `POST` | `/api/reports` | Official/Admin | Generate a PDF report |
| `GET` | `/api/snapshots` | Official/Admin | List map snapshots |
| `POST` | `/api/snapshots` | Official/Admin | Save a map snapshot |
| `GET` | `/api/legal-zones` | Public | List legal protection zones |
| `GET` | `/api/admin/users` | Admin | Manage users |
| `GET` | `/api/health` | Public | Service health check |

---

## Database Models

| Model | Description |
|---|---|
| `Alert` | Core deforestation event with severity scoring, legal status, and full `statusHistory` audit trail |
| `Region` | Monitored forest region with GeoJSON `center` (Point) and optional `boundary` (Polygon) |
| `User` | Account with roles (`Public`, `Official`, `Admin`) and assigned jurisdiction regions |
| `Snapshot` | Saved geotag-stamped map state linked to an alert or report |
| `Report` | Generated PDF report referencing alerts, regions, and audit trail |
| `LegalZone` | Protected zone boundary used for legal/illegal classification of alerts |
| `AuditLog` | System-level action log for admin auditing |

---

## User Roles

| Role | Capabilities |
|---|---|
| `Public` | Submit citizen reports, view map, use AI analysis tool, view transparency dashboard |
| `Official` | All public access + full alerts dashboard, status workflow, snapshot and report management |
| `Admin` | All official access + user management, system-wide admin controls |

---

## AI Microservice

**Endpoint:** `POST /predict`

Accepts a multipart form with `before` and `after` image files.

**Pipeline:**
1. Load both images into the `nvidia/segformer-b5-finetuned-ade-640-640` model
2. Extract vegetation probability masks using ADE20K vegetation class IDs (`grass=4`, `plant=17`, `tree=72`)
3. Compute pixel-level forest loss between before/after masks
4. Run K-Means clustering (up to 32 clusters) to identify discrete deforestation hotspots
5. Return `lossPercentage`, `affectedAreaHectares`, `confidenceScore`, and clustered `hotspots` as GeoJSON-ready coordinates

**Health check:** `GET /health`

---

## License

This project was developed as part of an academic portfolio at **K. J. Somaiya Institute of Technology**.