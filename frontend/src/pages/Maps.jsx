import { useEffect, useMemo, useState } from "react";
import {
  MapContainer, TileLayer, CircleMarker,
  Circle, Popup, Tooltip, useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { RefreshCw, Calendar, RotateCcw } from "lucide-react";
import { api } from "../lib/api";
import RegionSelect from "../components/RegionSelect";

// ── Fallback data (shown if API fails) ───────────────────────────────────────
const FALLBACK_REGIONS = [
  { name: "Western Ghats Reserve",  center: { type: "Point", coordinates: [73.5, 15.2]  }, severity: "Critical" },
  { name: "Kaziranga Corridor",     center: { type: "Point", coordinates: [93.17, 26.58] }, severity: "High"     },
  { name: "Sundarbans Delta",       center: { type: "Point", coordinates: [88.9, 21.95]  }, severity: "High"     },
  { name: "Nilgiri Biosphere",      center: { type: "Point", coordinates: [76.65, 11.4]  }, severity: "Medium"   },
  { name: "Bandhavgarh Belt",       center: { type: "Point", coordinates: [80.97, 23.68] }, severity: "Low"      },
];

const SEVERITY_COLORS = {
  Critical:   "#dc2626",
  High:       "#f97316",
  Medium:     "#f59e0b",
  Low:        "#10b981",
  Monitored:  "#6b7280", // neutral grey — region has no alerts yet
};

const BASEMAP_TILES = {
  satellite: {
    name:        "Satellite",
    url:         "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "Esri, Maxar, Earthstar Geographics",
  },
  streets: {
    name:        "Streets",
    url:         "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  },
  terrain: {
    name:        "Terrain",
    url:         "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://opentopomap.org">OpenTopoMap</a>',
  },
};

function getCenter(region) {
  if (region?.center?.coordinates?.length >= 2) {
    const [lng, lat] = region.center.coordinates;
    return [lat, lng];
  }
  return [20.5937, 78.9629];
}

function deriveSeverityFromLoss(loss) {
  const n = Number(String(loss).replace("%", ""));
  if (n >= 18) return "Critical";
  if (n >= 10) return "High";
  if (n >= 4)  return "Medium";
  return "Low";
}

function getStats(region, regionsWithAlerts) {
  const s      = region?.stats || {};
  const alerts = s.alerts ?? region?.alerts ?? 0;
  const area   = s.area   ?? region?.area   ?? 0;
  const loss   = s.averageLoss ?? region?.loss ?? 0;

  // Only assign a severity when the region actually has alerts.
  // Regions with no detections are "Monitored" (neutral) — not "Low".
  const hasAlerts = alerts > 0 || (regionsWithAlerts && regionsWithAlerts.has(region.name));
  const severity  = hasAlerts
    ? (region?.severity || deriveSeverityFromLoss(loss))
    : "Monitored";

  return {
    alerts,
    area:     typeof area === "number" ? `${area} ha` : (area || "0 ha"),
    loss:     typeof loss === "number" ? `${loss.toFixed(2)}%` : (loss || "0.00%"),
    severity,
  };
}

function FlyToTarget({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.flyTo(center, zoom || 6, { duration: 1.0 });
  }, [center, zoom, map]);
  return null;
}

function ResizeMap() {
  const map = useMap();
  useEffect(() => {
    const t = setTimeout(() => map.invalidateSize(), 150);
    return () => clearTimeout(t);
  }, [map]);
  return null;
}

export default function Maps() {
  const [allRegions, setAllRegions] = useState(FALLBACK_REGIONS);
  const [alerts, setAlerts]         = useState([]);
  const [loading, setLoading]       = useState(true);

  const [selectedRegion,   setSelectedRegion]   = useState("All");
  const [selectedSeverity, setSelectedSeverity] = useState("All");
  const [basemap,          setBasemap]           = useState("satellite");
  const [timeFilter,       setTimeFilter]        = useState("Last 30 days");
  const [startDate,        setStartDate]         = useState("");
  const [endDate,          setEndDate]           = useState("");

  const loadMapData = async () => {
    setLoading(true);
    try {
      const [regionRes, alertRes] = await Promise.all([
        api("/regions"),
        api("/alerts?allRegions=true"),
      ]);
      const regions = regionRes.regions || [];
      if (regions.length > 0) setAllRegions(regions);
      setAlerts(alertRes.alerts || []);
    } catch {
      setAllRegions(FALLBACK_REGIONS);
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadMapData(); }, []);

  // ── Only show region markers that have at least one alert ────────────────
  // For performance with 121 regions — show all as small dots, highlight those with alerts
  const regionsWithAlerts = useMemo(() => {
    const nameSet = new Set(
      alerts.map((a) => a?.region?.name || a?.region).filter(Boolean)
    );
    return new Set(nameSet);
  }, [alerts]);

  // ── Filter alert pins ─────────────────────────────────────────────────────
  const filteredAlerts = useMemo(() => {
    const now  = new Date();
    const days =
      timeFilter === "Last 15 days" ? 15 :
      timeFilter === "Last 30 days" ? 30 :
      timeFilter === "Last 90 days" ? 90 : null;

    return alerts
      .map((a) => {
        const coords = a?.location?.coordinates;
        if (!coords || coords.length < 2) return null;
        const [lng, lat] = coords;
        return {
          id:          a._id,
          lat, lng,
          regionName:  a?.region?.name || a?.region || "Unknown",
          severity:    a.severity || "Low",
          loss:        a.lossPercentage ?? 0,
          area:        a.affectedAreaHectares ?? 0,
          confidence:  a.confidenceScore ?? 0,
          detectedAt:  a.detectedAt || a.createdAt,
          status:      a.status || "Pending",
        };
      })
      .filter(Boolean)
      .filter((a) => {
        if (selectedRegion   !== "All" && a.regionName !== selectedRegion) return false;
        if (selectedSeverity !== "All" && a.severity   !== selectedSeverity) return false;
        if (!a.detectedAt) return true;
        const dt = new Date(a.detectedAt);
        if (isNaN(dt)) return true;
        if (timeFilter === "Custom range") {
          if (startDate && dt < new Date(startDate)) return false;
          if (endDate) {
            const e = new Date(endDate); e.setHours(23, 59, 59, 999);
            if (dt > e) return false;
          }
          return true;
        }
        if (days === null) return true;
        return Math.floor((now - dt) / 86400000) <= days;
      });
  }, [alerts, selectedRegion, selectedSeverity, timeFilter, startDate, endDate]);

  // ── Map center ────────────────────────────────────────────────────────────
  const targetCenter = useMemo(() => {
    if (selectedRegion === "All") return [21.5, 80.0];
    const match = allRegions.find((r) => r.name === selectedRegion);
    return match ? getCenter(match) : [21.5, 80.0];
  }, [selectedRegion, allRegions]);

  const targetZoom = selectedRegion === "All" ? 5 : 8;

  // ── Regions to show on map:
  // When a region is selected → show only that one with big circle
  // When "All" → show only regions that have alerts (keeps map clean)
  const visibleRegions = useMemo(() => {
    if (selectedRegion !== "All") {
      return allRegions.filter((r) => r.name === selectedRegion);
    }
    // Only show regions that have alerts — keeps 121-region map clean
    if (regionsWithAlerts.size > 0) {
      return allRegions.filter((r) => regionsWithAlerts.has(r.name));
    }
    // Fallback: show all (no alerts yet)
    return allRegions;
  }, [allRegions, selectedRegion, regionsWithAlerts]);

  return (
    <div className="min-h-screen bg-[#f7f8f4] p-6 font-sans text-gray-900 space-y-4 md:p-8">

      {/* ── HEADER ── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold tracking-tight">Geospatial Intelligence Map</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Real-time mapping of deforestation alerts and canopy risk perimeters
          </p>
        </div>
        <button
          type="button"
          onClick={loadMapData}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 shadow-xs transition hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw size={13} className={loading ? "animate-spin text-emerald-700" : "text-gray-500"} />
          Sync Telemetry
        </button>
      </div>

      {/* ── FILTER TOOLBAR ── */}
      <div className="space-y-3 rounded-xl border border-gray-200 bg-white p-3 shadow-xs">
        <div className="flex flex-wrap items-center gap-3">

          {/* Region — searchable combobox */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-600">Region:</span>
            <RegionSelect
              regions={allRegions}
              value={selectedRegion}
              onChange={setSelectedRegion}
              allLabel="All Monitored Regions"
            />
          </div>

          {/* Severity pills */}
          <div className="flex items-center gap-1.5">
            {["All", "Critical", "High", "Medium", "Low"].map((item) => {
              const active = selectedSeverity === item;
              const ac =
                item === "All"      ? "bg-[#1b4332] text-white font-bold" :
                item === "Critical" ? "bg-[#d91f11] text-white font-bold" :
                item === "High"     ? "bg-[#f59e0b] text-white font-bold" :
                item === "Medium"   ? "bg-[#fde047] text-gray-900 font-bold" :
                                      "bg-[#22c55e] text-white font-bold";
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => setSelectedSeverity(item)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition ${active ? ac : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                >
                  {item}
                </button>
              );
            })}
          </div>

          {/* Right — basemap + time */}
          <div className="ml-auto flex items-center gap-2">
            <div className="flex items-center gap-1 rounded-lg border border-gray-200 bg-gray-100 p-1 text-xs">
              {Object.entries(BASEMAP_TILES).map(([key, t]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setBasemap(key)}
                  className={`rounded-md px-2.5 py-1 transition ${basemap === key ? "bg-white font-bold shadow-xs text-gray-900" : "text-gray-600 hover:text-gray-900"}`}
                >
                  {t.name}
                </button>
              ))}
            </div>
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              className="rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs text-gray-700 focus:outline-none"
            >
              {["Last 15 days", "Last 30 days", "Last 90 days", "All time", "Custom range"].map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Custom date range */}
        {timeFilter === "Custom range" && (
          <div className="flex flex-wrap items-center gap-2.5 border-t border-gray-100 pt-2 text-xs">
            <span className="flex items-center gap-1.5 text-[11px] font-medium text-gray-500">
              <Calendar size={13} className="text-emerald-700" /> Date interval:
            </span>
            <div className="flex items-center gap-1.5">
              <label className="text-[10px] font-bold text-gray-500">FROM:</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                className="rounded border border-gray-300 bg-gray-50 px-2 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-600" />
            </div>
            <div className="flex items-center gap-1.5">
              <label className="text-[10px] font-bold text-gray-500">TO:</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
                className="rounded border border-gray-300 bg-gray-50 px-2 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-600" />
            </div>
            {(startDate || endDate) && (
              <button type="button" onClick={() => { setStartDate(""); setEndDate(""); }}
                className="flex items-center gap-1 text-[11px] font-medium text-gray-500 hover:text-rose-600">
                <RotateCcw size={11} /> Reset
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── MAP ── */}
      <div className="relative overflow-hidden rounded-xl border border-gray-900/30 bg-white shadow-xs">
        <MapContainer
          center={targetCenter}
          zoom={targetZoom}
          scrollWheelZoom={true}
          style={{ height: "640px", width: "100%" }}
        >
          <FlyToTarget center={targetCenter} zoom={targetZoom} />
          <ResizeMap />

          <TileLayer
            attribution={BASEMAP_TILES[basemap].attribution}
            url={BASEMAP_TILES[basemap].url}
          />

          {/* Region markers — only regions with alerts shown in "All" mode */}
          {visibleRegions.map((region) => {
            const center     = getCenter(region);
            const stats      = getStats(region, regionsWithAlerts);
            const isSelected = selectedRegion === region.name;
            const color      = SEVERITY_COLORS[stats.severity] || "#10b981";

            return (
              <div key={region._id || region.name}>
                <CircleMarker
                  center={center}
                  radius={isSelected ? 11 : 7}
                  pathOptions={{
                    color,
                    fillColor: color,
                    fillOpacity: isSelected ? 0.9 : 0.6,
                    weight: isSelected ? 3 : 1.5,
                  }}
                >
                  <Tooltip
                    direction="top"
                    offset={[0, -10]}
                    opacity={1}
                    permanent={isSelected}
                  >
                    <div className="rounded bg-gray-900 px-2 py-1 text-xs font-semibold text-white shadow-sm whitespace-nowrap">
                      {region.name}
                      <span className="ml-1 text-[10px] font-normal opacity-75">({stats.severity})</span>
                    </div>
                  </Tooltip>
                  <Popup>
                    <div className="min-w-[180px] p-0.5 font-sans">
                      <div className="mb-2 flex items-center justify-between border-b border-gray-100 pb-1.5">
                        <span className="font-bold text-sm text-gray-900">{region.name}</span>
                        <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-bold text-gray-700">{stats.severity}</span>
                      </div>
                      <div className="space-y-1 text-xs text-gray-600">
                        <p className="flex justify-between"><span>Loss:</span><strong className="text-rose-600">{stats.loss}</strong></p>
                        <p className="flex justify-between"><span>Affected:</span><strong>{stats.area}</strong></p>
                        <p className="flex justify-between"><span>Alerts:</span><strong>{stats.alerts}</strong></p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedRegion(region.name)}
                        className="mt-3 w-full rounded bg-[#1b4332] px-2.5 py-1 text-xs font-semibold text-white transition hover:bg-[#2d6a4f]"
                      >
                        Inspect Region
                      </button>
                    </div>
                  </Popup>
                </CircleMarker>

                {isSelected && (
                  <Circle
                    center={center}
                    radius={35000}
                    pathOptions={{
                      color,
                      fillColor: color,
                      fillOpacity: 0.08,
                      weight: 1.5,
                      dashArray: "4 6",
                    }}
                  />
                )}
              </div>
            );
          })}

          {/* Alert pins */}
          {filteredAlerts.map((a, idx) => (
            <CircleMarker
              key={a.id || `${a.lat}-${a.lng}-${idx}`}
              center={[a.lat, a.lng]}
              radius={6}
              pathOptions={{
                color:       "#ffffff",
                fillColor:   SEVERITY_COLORS[a.severity] || "#dc2626",
                fillOpacity: 0.95,
                weight:      1.5,
              }}
            >
              <Tooltip direction="top" offset={[0, -7]} opacity={0.95}>
                <div className="rounded bg-white px-1.5 py-0.5 text-[11px] font-semibold text-gray-900 shadow-xs">
                  {a.regionName}: <span className="text-rose-600">-{a.loss}%</span>
                </div>
              </Tooltip>
              <Popup>
                <div className="min-w-[190px] p-0.5 font-sans">
                  <div className="mb-2 flex items-center gap-1.5 border-b border-gray-100 pb-1.5">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: SEVERITY_COLORS[a.severity] }} />
                    <strong className="text-xs text-gray-900">Deforestation Event</strong>
                  </div>
                  <div className="space-y-1 text-xs text-gray-600">
                    <p className="flex justify-between"><span>Region:</span><strong className="text-gray-800">{a.regionName}</strong></p>
                    <p className="flex justify-between"><span>Loss:</span><strong className="text-rose-600">-{a.loss}%</strong></p>
                    <p className="flex justify-between"><span>Area:</span><strong>{a.area} ha</strong></p>
                    <p className="flex justify-between"><span>Confidence:</span><strong className="text-emerald-700">{a.confidence}%</strong></p>
                    <p className="flex justify-between"><span>Status:</span><strong>{a.status}</strong></p>
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>

        {/* Legend */}
        <div className="pointer-events-none absolute bottom-4 left-4 z-[400] rounded-lg border border-gray-300 bg-white/95 px-3.5 py-2.5 shadow-md">
          <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-gray-500">Canopy Risk</p>
          <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-gray-700">
            {Object.entries(SEVERITY_COLORS).map(([name, hex]) => (
              <span key={name} className="flex items-center gap-1">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: hex }} />
                {name === "Monitored" ? "Monitored (no alerts)" : name}
              </span>
            ))}
          </div>
        </div>

        {/* Status badge */}
        <div className="pointer-events-none absolute right-4 top-4 z-[400] rounded-lg border border-gray-300 bg-white/95 px-3 py-1.5 text-xs text-gray-600 shadow-md">
          <span>Layer: </span>
          <strong className="capitalize text-gray-900">{BASEMAP_TILES[basemap].name}</strong>
          <span className="mx-1 text-gray-300">|</span>
          <span className="font-semibold text-emerald-700">{filteredAlerts.length} alerts</span>
          <span className="mx-1 text-gray-300">|</span>
          <span className="font-semibold text-gray-700">{visibleRegions.length} regions shown</span>
        </div>
      </div>
    </div>
  );
}