import { useEffect, useState } from "react";
import { api } from "../lib/api";
import {
  Satellite, RefreshCw, CheckCircle2, Clock,
  AlertCircle, LoaderCircle, Calendar, ImageIcon,
  Zap, Info, CloudOff, Eye,
} from "lucide-react";
import RegionSelect from "./RegionSelect";

const API_BASE = import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:5000";
const MIN_TILE_BYTES = 5000; // tiles below this size are likely blank/cloudy

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
  });
}

function formatDateTime(d) {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function daysUntil(d) {
  if (!d) return null;
  return Math.ceil((new Date(d) - Date.now()) / (1000 * 60 * 60 * 24));
}

// ── Status pill ───────────────────────────────────────────────────────────────
function StatusPill({ status }) {
  const map = {
    ok:               { cls: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: <CheckCircle2 size={11} />, label: "On schedule" },
    due:              { cls: "bg-amber-50  text-amber-700  border-amber-200",     icon: <Clock size={11} />,        label: "Analysis due" },
    pending_baseline: { cls: "bg-blue-50   text-blue-700   border-blue-200",      icon: <Satellite size={11} />,    label: "Awaiting baseline" },
  };
  const { cls, icon, label } = map[status] || map.ok;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium ${cls}`}>
      {icon} {label}
    </span>
  );
}

// ── Tile quality badge ────────────────────────────────────────────────────────
function TileQuality({ snapshot }) {
  if (!snapshot) return null;
  // We store sizeBytes in the snapshot notes as a hint if available
  // Otherwise rely on whether the image loads correctly
  return null; // rendered inside SnapshotThumb
}

// ── Snapshot thumbnail ────────────────────────────────────────────────────────
function SnapshotThumb({ snapshot, label }) {
  const [imgState, setImgState] = useState("loading"); // loading | ok | blank | error

  const imageUrl   = snapshot?.imageUrl;
  const capturedAt = snapshot?.capturedAt;
  const src        = imageUrl ? `${API_BASE}${imageUrl}` : null;

  useEffect(() => {
    setImgState(src ? "loading" : "none");
  }, [src]);

  return (
    <div className="flex-1 min-w-0">
      {/* Label */}
      <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-500">
        {label}
      </p>

      {/* Image box */}
      <div
        className="relative overflow-hidden rounded-lg border border-[#dbe4de] bg-[#f0f4f1]"
        style={{ aspectRatio: "1/1" }}
      >
        {/* No snapshot at all */}
        {!src && (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 p-4 text-center">
            <ImageIcon size={28} className="text-gray-300" />
            <p className="text-[11px] text-gray-400 leading-snug">
              Not yet captured
            </p>
          </div>
        )}

        {/* Image loading */}
        {src && imgState === "loading" && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <LoaderCircle size={20} className="animate-spin text-emerald-600" />
          </div>
        )}

        {/* Actual image */}
        {src && (
          <img
            src={src}
            alt={label}
            className={`h-full w-full object-cover transition-opacity duration-300 ${
              imgState === "ok" ? "opacity-100" : "opacity-0 absolute inset-0"
            }`}
            onLoad={(e) => {
              // Check if image is all black (blank tile) by drawing to canvas
              try {
                const canvas  = document.createElement("canvas");
                canvas.width  = 16;
                canvas.height = 16;
                const ctx = canvas.getContext("2d");
                ctx.drawImage(e.target, 0, 0, 16, 16);
                const data = ctx.getImageData(0, 0, 16, 16).data;
                // If average brightness < 10 → it's a black/blank tile
                const avgBrightness = Array.from(data)
                  .filter((_, i) => i % 4 !== 3) // skip alpha
                  .reduce((sum, v) => sum + v, 0) / (16 * 16 * 3);
                setImgState(avgBrightness < 10 ? "blank" : "ok");
              } catch {
                setImgState("ok");
              }
            }}
            onError={() => setImgState("error")}
          />
        )}

        {/* Blank/black tile overlay */}
        {src && imgState === "blank" && (
          <>
            <img src={src} alt={label} className="h-full w-full object-cover opacity-30" />
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gray-900/70 p-4 text-center">
              <CloudOff size={24} className="text-amber-400" />
              <p className="text-[11px] font-semibold text-white leading-snug">
                Cloud-covered tile
              </p>
              <p className="text-[10px] text-gray-300 leading-snug">
                Sentinel couldn't see through clouds on this date. Use Trigger Now to re-fetch with a different date window.
              </p>
            </div>
          </>
        )}

        {/* Error */}
        {src && imgState === "error" && (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 p-4 text-center">
            <AlertCircle size={24} className="text-red-400" />
            <p className="text-[11px] text-gray-500">Could not load image</p>
          </div>
        )}

        {/* Label overlay (only on real images) */}
        {src && imgState === "ok" && (
          <div className="absolute left-2 top-2 flex items-center gap-1 rounded bg-black/60 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white backdrop-blur-sm">
            <Eye size={9} />
            {label}
          </div>
        )}

        {/* Quality badge */}
        {src && imgState === "ok" && (
          <div className="absolute bottom-2 right-2 rounded bg-emerald-700/80 px-1.5 py-0.5 text-[9px] font-semibold text-white backdrop-blur-sm">
            Real imagery
          </div>
        )}
      </div>

      {/* Caption */}
      <p className="mt-1 text-[11px] text-gray-500">
        {capturedAt ? `Captured: ${formatDate(capturedAt)}` : ""}
      </p>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function ZoneMonitor() {
  const [regions,      setRegions]      = useState([]);
  const [selectedId,   setSelectedId]   = useState("");
  const [selectedName, setSelectedName] = useState("");
  const [zoneData,     setZoneData]     = useState(null);
  const [loadingZones, setLoadingZones] = useState(true);
  const [loadingData,  setLoadingData]  = useState(false);
  const [triggering,   setTriggering]   = useState(false);
  const [notice,       setNotice]       = useState(null);

  // Load regions on mount
  useEffect(() => {
    api("/regions")
      .then((d) => {
        const list = d.regions || d || [];
        setRegions(list);
        if (list.length > 0) {
          setSelectedId(list[0]._id);
          setSelectedName(list[0].name);
        }
      })
      .catch(() => setRegions([]))
      .finally(() => setLoadingZones(false));
  }, []);

  // Load zone data on region change
  useEffect(() => {
    if (!selectedId) return;
    setLoadingData(true);
    setZoneData(null);
    api(`/snapshots/region/${selectedId}`)
      .then(setZoneData)
      .catch(() => setZoneData(null))
      .finally(() => setLoadingData(false));
  }, [selectedId]);

  const handleRegionChange = (name) => {
    const region = regions.find((r) => r.name === name);
    if (region) {
      setSelectedId(region._id);
      setSelectedName(region.name);
    }
  };

  const refreshZoneData = () => {
    if (!selectedId) return;
    setLoadingData(true);
    api(`/snapshots/region/${selectedId}`)
      .then(setZoneData)
      .catch(() => {})
      .finally(() => setLoadingData(false));
  };

  const handleTrigger = async () => {
    if (!selectedId || triggering) return;
    setTriggering(true);
    setNotice(null);
    try {
      await api(`/snapshots/trigger/${selectedId}`, { method: "POST", body: {} });
      setNotice({
        type: "success",
        msg:  "Pipeline triggered. The system will try up to 4 different date windows to find a clear (non-cloudy) tile. Click Refresh in 1–2 minutes.",
      });
    } catch (err) {
      setNotice({ type: "error", msg: err.message || "Trigger failed." });
    } finally {
      setTriggering(false);
    }
  };

  // Derive status
  const intervalDays = zoneData?.region?.monitoringIntervalDays || 15;
  const daysSinceLast = zoneData?.daysSinceLast ?? null;
  const regionStatus = !zoneData?.before
    ? "pending_baseline"
    : daysSinceLast !== null && daysSinceLast >= intervalDays
    ? "due"
    : "ok";

  const nextDays = daysUntil(zoneData?.nextScheduledAt);

  return (
    <div className="space-y-5">

      {/* ── How this works ── */}
      <div className="flex items-start gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
        <Info size={14} className="mt-0.5 shrink-0 text-blue-600" />
        <div className="text-[12px] text-blue-700 leading-relaxed">
          <strong>How Zone Monitor works:</strong> Every 15 days, the system automatically fetches
          a Sentinel-2 satellite image for each forest zone, compares it with the previous image
          using AI, and creates alerts if deforestation is detected.
          <br />
          <strong>Black or white images</strong> mean the satellite couldn't see through cloud cover
          on that date. Use <strong>Trigger Now</strong> to re-fetch with better date selection.
        </div>
      </div>

      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-700">
            <Satellite size={14} className="text-white" />
          </div>
          <div>
            <h2 className="text-[15px] font-bold text-gray-900">Zone Monitor</h2>
            <p className="text-[11px] text-gray-500">
              Automated Sentinel-2 surveillance · {regions.length} zones registered
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={refreshZoneData}
          disabled={loadingData}
          className="inline-flex items-center gap-1.5 rounded-full border border-[#c9d6cd] px-3 py-1.5 text-xs text-gray-600 transition hover:border-emerald-700 disabled:opacity-40"
        >
          <RefreshCw size={12} className={loadingData ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* ── Region selector ── */}
      <div>
        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-500">
          Select Zone ({regions.length} total)
        </p>
        {loadingZones ? (
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <LoaderCircle size={13} className="animate-spin" /> Loading zones…
          </div>
        ) : (
          <RegionSelect
            regions={regions}
            value={selectedName}
            onChange={handleRegionChange}
            allLabel="Select a zone…"
            allValue=""
            placeholder={`Search ${regions.length} regions…`}
          />
        )}
      </div>

      {/* ── Loading ── */}
      {loadingData && (
        <div className="flex items-center justify-center gap-2 rounded-xl border border-[#dbe4de] bg-white p-8 text-sm text-gray-400">
          <LoaderCircle size={16} className="animate-spin" /> Loading zone data…
        </div>
      )}

      {/* ── Zone data ── */}
      {!loadingData && zoneData && (
        <>
          {/* Schedule cards */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              {
                icon:  <Calendar size={14} className="text-emerald-600" />,
                label: "Last analysis",
                value: formatDateTime(zoneData.region?.lastAnalyzedAt),
              },
              {
                icon:  <Clock size={14} className="text-emerald-600" />,
                label: "Next scheduled",
                value: zoneData.nextScheduledAt
                  ? `${formatDate(zoneData.nextScheduledAt)}${nextDays !== null ? ` · ${nextDays > 0 ? `${nextDays}d` : "today"}` : ""}`
                  : "After baseline captured",
              },
              {
                icon:  <Satellite size={14} className="text-emerald-600" />,
                label: "Interval",
                value: `Every ${intervalDays} days`,
              },
              {
                icon:  <CheckCircle2 size={14} className="text-emerald-600" />,
                label: "Status",
                value: <StatusPill status={regionStatus} />,
              },
            ].map(({ icon, label, value }) => (
              <div key={label} className="rounded-xl border border-[#dbe4de] bg-white p-3.5">
                <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.16em] text-gray-500">
                  {icon} {label}
                </div>
                <div className="mt-1.5 text-[13px] font-medium text-gray-800">{value}</div>
              </div>
            ))}
          </div>

          {/* Image pair */}
          <div className="rounded-xl border border-[#dbe4de] bg-white p-4">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-500">
                Sentinel-2 Imagery Pair
              </p>
              <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
                <CloudOff size={11} />
                Black/white = cloud-covered — use Trigger Now to re-fetch
              </div>
            </div>

            <div className="flex gap-4">
              <SnapshotThumb
                snapshot={zoneData.before}
                label="Before (baseline)"
              />
              <SnapshotThumb
                snapshot={zoneData.after}
                label="After (latest)"
              />
            </div>

            {/* State messages */}
            {!zoneData.before && (
              <div className="mt-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-[12px] text-amber-700">
                <AlertCircle size={14} className="mt-0.5 shrink-0" />
                <span>
                  No baseline image yet for this zone. The satellite pipeline will capture
                  one automatically at 6:00 AM IST, or use Trigger Now below for an immediate fetch.
                </span>
              </div>
            )}
            {zoneData.before && !zoneData.after && (
              <div className="mt-4 flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2.5 text-[12px] text-blue-700">
                <Info size={14} className="mt-0.5 shrink-0" />
                <span>
                  Baseline captured. The system will automatically fetch the "After" image
                  in {nextDays !== null ? `${nextDays} day${nextDays !== 1 ? "s" : ""}` : "the next scheduled run"}.
                  You can also use Trigger Now to fetch it immediately.
                </span>
              </div>
            )}
            {zoneData.before && zoneData.after && (
              <div className="mt-4 flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-[12px] text-emerald-700">
                <CheckCircle2 size={14} className="mt-0.5 shrink-0" />
                <span>
                  Both images available. The AI has compared these and generated alerts
                  if vegetation loss was detected. Next cycle in {nextDays !== null ? `${nextDays} day${nextDays !== 1 ? "s" : ""}` : "—"}.
                </span>
              </div>
            )}
          </div>

          {/* Manual trigger */}
          <div className="rounded-xl border border-[#dbe4de] bg-white p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[13px] font-semibold text-gray-900">Manual Trigger</p>
                <p className="mt-0.5 text-[12px] text-gray-500 max-w-md">
                  Fetch new Sentinel-2 imagery immediately. The system now tries up to 4 different
                  date windows to find a cloud-free tile. Results appear after ~1–2 minutes — click Refresh.
                </p>
              </div>
              <button
                type="button"
                onClick={handleTrigger}
                disabled={triggering}
                className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2 text-xs font-semibold text-white transition hover:bg-emerald-800 disabled:opacity-50"
              >
                {triggering
                  ? <><LoaderCircle size={13} className="animate-spin" /> Triggering…</>
                  : <><Zap size={13} /> Trigger Now</>
                }
              </button>
            </div>

            {notice && (
              <div className={`mt-3 flex items-start gap-2 rounded-lg border px-3 py-2.5 text-[12px] ${
                notice.type === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-red-200 bg-red-50 text-red-700"
              }`}>
                {notice.type === "success"
                  ? <CheckCircle2 size={14} className="mt-0.5 shrink-0" />
                  : <AlertCircle  size={14} className="mt-0.5 shrink-0" />
                }
                {notice.msg}
              </div>
            )}
          </div>
        </>
      )}

      {!loadingData && !zoneData && selectedId && (
        <div className="flex items-center justify-center rounded-xl border border-[#dbe4de] bg-white p-8 text-sm text-gray-400">
          Could not load zone data. Check backend connection.
        </div>
      )}
    </div>
  );
}