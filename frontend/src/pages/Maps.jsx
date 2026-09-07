import { useMemo, useRef, useState } from "react";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
  useMap,
} from "react-leaflet";
import html2canvas from "html2canvas";
import {
  Layers3,
  ShieldAlert,
  Camera,
  LoaderCircle,
  CheckCircle2,
} from "lucide-react";

// Monitored regions with real coordinates (India) and their latest
// aggregate stats. Each region can have multiple individual alert points.
const MAP_REGIONS = [
  {
    name: "Western Ghats Reserve",
    center: [15.2993, 74.124],
    severity: "Critical",
    loss: "22.58%",
    area: "959.6 ha",
    alerts: 14,
    points: [
      { lat: 15.31, lng: 74.14, severity: "Critical", loss: 22.58 },
      { lat: 15.27, lng: 74.1, severity: "High", loss: 12.1 },
      { lat: 15.34, lng: 74.09, severity: "Medium", loss: 6.4 },
    ],
  },
  {
    name: "Kaziranga Corridor",
    center: [26.5775, 93.1714],
    severity: "High",
    loss: "17.00%",
    area: "697 ha",
    alerts: 9,
    points: [
      { lat: 26.59, lng: 93.19, severity: "High", loss: 17.0 },
      { lat: 26.55, lng: 93.15, severity: "Medium", loss: 5.2 },
    ],
  },
  {
    name: "Sundarbans Delta",
    center: [21.9497, 88.9468],
    severity: "High",
    loss: "9.00%",
    area: "369 ha",
    alerts: 7,
    points: [
      { lat: 21.96, lng: 88.96, severity: "High", loss: 9.0 },
      { lat: 21.9, lng: 88.9, severity: "Low", loss: 2.1 },
    ],
  },
  {
    name: "Nilgiri Biosphere",
    center: [11.4102, 76.6950],
    severity: "Medium",
    loss: "4.00%",
    area: "164 ha",
    alerts: 5,
    points: [{ lat: 11.42, lng: 76.71, severity: "Medium", loss: 4.0 }],
  },
  {
    name: "Bandhavgarh Belt",
    center: [23.7143, 80.9407],
    severity: "Low",
    loss: "1.80%",
    area: "74 ha",
    alerts: 2,
    points: [{ lat: 23.72, lng: 80.95, severity: "Low", loss: 1.8 }],
  },
];

const severityHex = {
  Critical: "#dc2626",
  High: "#f97316",
  Medium: "#f59e0b",
  Low: "#10b981",
};

const severityClass = {
  Critical: "text-red-600",
  High: "text-orange-500",
  Medium: "text-amber-500",
  Low: "text-emerald-600",
};

// Recenters the map whenever the selected region changes.
function FlyToRegion({ center }) {
  const map = useMap();
  map.flyTo(center, 10, { duration: 0.9 });
  return null;
}

function Maps() {
  const regions = MAP_REGIONS;
  const [selected, setSelected] = useState(regions[0].name);
  const [capturing, setCapturing] = useState(false);
  const [captured, setCaptured] = useState(false);
  const mapWrapRef = useRef(null);

  const active = useMemo(
    () => regions.find((region) => region.name === selected),
    [selected]
  );

  const allPoints = useMemo(
    () => regions.flatMap((region) => region.points.map((p) => ({ ...p, region: region.name }))),
    [regions]
  );

  // Captures the current map view (with markers) as a PNG the official
  // can attach as photographic/geospatial evidence to an incident report.
  const captureSnapshot = async () => {
    if (!mapWrapRef.current) return;

    setCapturing(true);

    try {
      const canvas = await html2canvas(mapWrapRef.current, {
        useCORS: true,
        logging: false,
      });

      const dataUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `vananetra-snapshot-${selected
        .toLowerCase()
        .replace(/\s+/g, "-")}-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setCaptured(true);
      window.setTimeout(() => setCaptured(false), 2000);
    } finally {
      setCapturing(false);
    }
  };

  return (
    <div className="bg-[#f6f9f7] px-6 py-8 lg:px-8">
      <div className="mx-auto max-w-[1500px]">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-600">
          Geospatial view
        </p>
        <h1 className="mt-3 text-4xl font-semibold text-gray-900">Region alert map</h1>
        <p className="mt-2 text-sm text-gray-500">
          Live OpenStreetMap view of monitored regions and individual alert locations.
          Officials can capture a timestamped snapshot as evidence.
        </p>

        <div className="mt-8 grid gap-5 lg:grid-cols-[280px_1fr]">
          <div className="rounded-xl border border-[#dbe4de] bg-white p-4">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.18em] text-gray-500">
                Regions
              </p>
              <Layers3 size={16} className="text-gray-400" />
            </div>

            <div className="space-y-1">
              {regions.map((region) => (
                <button
                  key={region.name}
                  onClick={() => setSelected(region.name)}
                  className={`w-full rounded-lg px-3 py-3 text-left transition ${
                    selected === region.name
                      ? "bg-emerald-50 text-gray-900"
                      : "text-gray-500 hover:bg-[#f0f4f1] hover:text-gray-900"
                  }`}
                >
                  <p className="text-sm font-medium">{region.name}</p>
                  <p className={`mt-1 text-xs ${severityClass[region.severity]}`}>
                    {region.severity} · {region.loss}
                  </p>
                </button>
              ))}
            </div>

            <div className="mt-5 border-t border-[#e2e8e4] pt-4">
              <p className="mb-3 text-xs uppercase tracking-[0.15em] text-gray-500">
                Risk legend
              </p>
              <div className="space-y-2 text-xs">
                <span className="flex items-center gap-2 text-red-600">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-600" /> Critical
                </span>
                <span className="flex items-center gap-2 text-orange-500">
                  <span className="h-2.5 w-2.5 rounded-full bg-orange-500" /> High
                </span>
                <span className="flex items-center gap-2 text-amber-500">
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> Medium
                </span>
                <span className="flex items-center gap-2 text-emerald-600">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-600" /> Low
                </span>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-[#dbe4de] bg-white">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e2e8e4] p-5">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-gray-500">
                  Selected region
                </p>
                <h2 className="mt-1 text-lg font-semibold text-gray-900">{active.name}</h2>
              </div>

              <button
                type="button"
                onClick={captureSnapshot}
                disabled={capturing}
                className="inline-flex items-center gap-2 rounded-full bg-emerald-700 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {capturing ? (
                  <>
                    <LoaderCircle size={14} className="animate-spin" />
                    Capturing...
                  </>
                ) : captured ? (
                  <>
                    <CheckCircle2 size={14} />
                    Saved
                  </>
                ) : (
                  <>
                    <Camera size={14} />
                    Take snapshot
                  </>
                )}
              </button>
            </div>

            <div ref={mapWrapRef} className="relative min-h-[520px] overflow-hidden">
              <MapContainer
                center={active.center}
                zoom={9}
                scrollWheelZoom
                style={{ height: "520px", width: "100%" }}
              >
                <FlyToRegion center={active.center} />

                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {allPoints.map((point, idx) => (
                  <CircleMarker
                    key={idx}
                    center={[point.lat, point.lng]}
                    radius={point.region === active.name ? 11 : 7}
                    pathOptions={{
                      color: severityHex[point.severity],
                      fillColor: severityHex[point.severity],
                      fillOpacity: point.region === active.name ? 0.75 : 0.4,
                      weight: point.region === active.name ? 2 : 1,
                    }}
                  >
                    <Popup>
                      <div className="text-sm">
                        <p className="font-semibold">{point.region}</p>
                        <p className="mt-1 text-xs">
                          Severity: <strong>{point.severity}</strong>
                        </p>
                        <p className="text-xs">Canopy loss: {point.loss}%</p>
                        <p className="mt-1 text-[10px] text-gray-500">
                          {point.lat.toFixed(4)}, {point.lng.toFixed(4)}
                        </p>
                      </div>
                    </Popup>
                  </CircleMarker>
                ))}
              </MapContainer>

              <div className="pointer-events-none absolute right-4 top-4 z-[400] rounded-lg border border-[#dbe4de] bg-white/95 p-4 shadow-sm backdrop-blur">
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <ShieldAlert size={16} className={severityClass[active.severity]} />
                  {active.severity} risk
                </div>
                <p className="mt-2 text-xs text-gray-500">{active.area} affected · {active.alerts} alerts</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Maps;
