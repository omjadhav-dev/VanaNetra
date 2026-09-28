import { useEffect, useMemo, useState } from "react";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Circle,
  Popup,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import {
  Layers3,
  ShieldAlert,
  MapPin,
  RefreshCw,
} from "lucide-react";
import { api } from "../lib/api";

const FALLBACK_REGIONS = [
  {
    name: "Western Ghats Reserve",
    center: {
      type: "Point",
      coordinates: [73.5, 15.2],
    },
    severity: "Critical",
    loss: "22.58%",
    area: "959.6 ha",
    alerts: 14,
  },
  {
    name: "Kaziranga Corridor",
    center: {
      type: "Point",
      coordinates: [93.17, 26.58],
    },
    severity: "High",
    loss: "17.00%",
    area: "697 ha",
    alerts: 9,
  },
  {
    name: "Sundarbans Delta",
    center: {
      type: "Point",
      coordinates: [88.9, 21.95],
    },
    severity: "High",
    loss: "9.00%",
    area: "369 ha",
    alerts: 7,
  },
  {
    name: "Nilgiri Biosphere",
    center: {
      type: "Point",
      coordinates: [76.65, 11.4],
    },
    severity: "Medium",
    loss: "4.00%",
    area: "164 ha",
    alerts: 5,
  },
  {
    name: "Bandhavgarh Belt",
    center: {
      type: "Point",
      coordinates: [80.97, 23.68],
    },
    severity: "Low",
    loss: "1.80%",
    area: "74 ha",
    alerts: 2,
  },
];

const SEVERITY_COLORS = {
  Critical: "#dc2626",
  High: "#f97316",
  Medium: "#f59e0b",
  Low: "#10b981",
};

const SEVERITY_TEXT = {
  Critical: "text-red-600",
  High: "text-orange-500",
  Medium: "text-amber-500",
  Low: "text-emerald-600",
};

function getCenter(region) {
  if (
    region?.center?.coordinates &&
    region.center.coordinates.length >= 2
  ) {
    const [lng, lat] = region.center.coordinates;

    return [lat, lng];
  }

  if (
    Array.isArray(region?.center) &&
    region.center.length >= 2
  ) {
    return region.center;
  }

  return [20.5937, 78.9629];
}

function getStats(region) {
  const stats = region?.stats || {};

  const alerts = stats.alerts ?? region?.alerts ?? 0;

  const area = stats.area ?? region?.area ?? 0;

  const loss = stats.averageLoss ?? region?.loss ?? 0;

  let severity = region?.severity;

  if (!severity) {
    const numericLoss = Number(
      String(loss).replace("%", "")
    );

    if (numericLoss >= 18) {
      severity = "Critical";
    } else if (numericLoss >= 10) {
      severity = "High";
    } else if (numericLoss >= 4) {
      severity = "Medium";
    } else {
      severity = "Low";
    }
  }

  return {
    alerts,
    area:
      typeof area === "number"
        ? `${area} ha`
        : area,
    loss:
      typeof loss === "number"
        ? `${loss.toFixed(2)}%`
        : loss,
    severity,
  };
}

function FlyToRegion({ center }) {
  const map = useMap();

  useEffect(() => {
    if (!center) return;

    map.flyTo(center, 8, {
      duration: 0.8,
    });
  }, [center, map]);

  return null;
}

function ResizeMap() {
  const map = useMap();

  useEffect(() => {
    setTimeout(() => {
      map.invalidateSize();
    }, 100);
  }, [map]);

  return null;
}

export default function Maps() {
  const [regions, setRegions] =
    useState(FALLBACK_REGIONS);

  const [alerts, setAlerts] = useState([]);

  const [selectedRegion, setSelectedRegion] =
    useState(FALLBACK_REGIONS[0].name);

  const [loading, setLoading] = useState(true);

  const loadMapData = async () => {
    setLoading(true);

    try {
      const regionResponse = await api(
        "/regions"
      );

      const backendRegions =
        regionResponse.regions || [];

      if (backendRegions.length > 0) {
        setRegions(backendRegions);

        setSelectedRegion((current) => {
          const exists = backendRegions.some(
            (region) =>
              region.name === current
          );

          return exists
            ? current
            : backendRegions[0].name;
        });
      }

      try {
        const alertResponse = await api(
          "/alerts?allRegions=true"
        );

        setAlerts(
          alertResponse.alerts || []
        );
      } catch {
        setAlerts([]);
      }
    } catch {
      setRegions(FALLBACK_REGIONS);
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMapData();
  }, []);

  const activeRegion = useMemo(() => {
    return (
      regions.find(
        (region) =>
          region.name === selectedRegion
      ) || regions[0]
    );
  }, [regions, selectedRegion]);

  const activeCenter = useMemo(() => {
    return getCenter(activeRegion);
  }, [activeRegion]);

  const activeStats = useMemo(() => {
    return getStats(activeRegion);
  }, [activeRegion]);

  const alertMarkers = useMemo(() => {
    return alerts
      .map((alert) => {
        const coordinates =
          alert?.location?.coordinates;

        if (
          !coordinates ||
          coordinates.length < 2
        ) {
          return null;
        }

        const [lng, lat] = coordinates;

        return {
          id: alert._id,
          lat,
          lng,
          regionName:
            alert?.region?.name ||
            "Unknown Region",
          severity:
            alert.severity || "Low",
          lossPercentage:
            alert.lossPercentage ?? 0,
          affectedArea:
            alert.affectedAreaHectares ?? 0,
          confidence:
            alert.confidenceScore ?? 0,
          status:
            alert.status || "Pending",
        };
      })
      .filter(Boolean);
  }, [alerts]);

  const selectedAlerts = useMemo(() => {
    return alertMarkers.filter(
      (alert) =>
        alert.regionName ===
        activeRegion?.name
    );
  }, [alertMarkers, activeRegion]);

  return (
    <div className="bg-[#f6f9f7] px-6 py-8 lg:px-8">

      <div className="mx-auto max-w-[1500px]">

        {/* HEADER */}

        <div className="flex flex-wrap items-end justify-between gap-4">

          <div>

            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-600">
              Geospatial View
            </p>

            <h1 className="mt-3 text-4xl font-semibold text-gray-900">
              Region Alert Map
            </h1>

            <p className="mt-2 max-w-3xl text-sm text-gray-500">
              Interactive map showing monitored forest
              regions and deforestation alerts detected
              through VanaNetra.
            </p>

          </div>

          <button
            onClick={loadMapData}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg border border-[#dbe4de] bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:border-emerald-400 hover:text-emerald-700 disabled:opacity-60"
          >

            <RefreshCw
              size={15}
              className={
                loading
                  ? "animate-spin"
                  : ""
              }
            />

            Refresh Map

          </button>

        </div>

        {/* MAIN */}

        <div className="mt-8 grid gap-5 lg:grid-cols-[280px_1fr]">

          {/* REGION SIDEBAR */}

          <div className="rounded-xl border border-[#dbe4de] bg-white p-4">

            <div className="mb-4 flex items-center justify-between">

              <p className="text-xs uppercase tracking-[0.18em] text-gray-500">
                Monitored Regions
              </p>

              <Layers3
                size={16}
                className="text-gray-400"
              />

            </div>

            <div className="space-y-1">

              {regions.map((region) => {
                const stats =
                  getStats(region);

                const active =
                  selectedRegion ===
                  region.name;

                return (
                  <button
                    key={
                      region._id ||
                      region.name
                    }
                    onClick={() =>
                      setSelectedRegion(
                        region.name
                      )
                    }
                    className={`w-full rounded-lg px-3 py-3 text-left transition ${
                      active
                        ? "bg-emerald-50"
                        : "hover:bg-gray-50"
                    }`}
                  >

                    <div className="flex items-start justify-between gap-2">

                      <p className="text-sm font-medium text-gray-800">
                        {region.name}
                      </p>

                      <MapPin
                        size={15}
                        className={
                          SEVERITY_TEXT[
                            stats.severity
                          ]
                        }
                      />

                    </div>

                    <p
                      className={`mt-1 text-xs ${
                        SEVERITY_TEXT[
                          stats.severity
                        ]
                      }`}
                    >
                      {stats.severity} ·{" "}
                      {stats.loss}
                    </p>

                  </button>
                );
              })}

            </div>

            {/* LEGEND */}

            <div className="mt-5 border-t border-[#e2e8e4] pt-4">

              <p className="mb-3 text-xs uppercase tracking-[0.15em] text-gray-500">
                Risk Legend
              </p>

              <div className="space-y-2">

                {Object.entries(
                  SEVERITY_COLORS
                ).map(
                  ([severity, color]) => (
                    <div
                      key={severity}
                      className="flex items-center gap-2 text-xs text-gray-600"
                    >

                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{
                          backgroundColor:
                            color,
                        }}
                      />

                      {severity}

                    </div>
                  )
                )}

              </div>

            </div>

          </div>

          {/* MAP */}

          <div className="overflow-hidden rounded-xl border border-[#dbe4de] bg-white">

            {/* MAP HEADER */}

            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e2e8e4] p-5">

              <div>

                <p className="text-xs uppercase tracking-[0.18em] text-gray-500">
                  Selected Region
                </p>

                <h2 className="mt-1 text-lg font-semibold text-gray-900">
                  {activeRegion?.name ||
                    "India"}
                </h2>

                <p className="mt-1 text-xs text-gray-500">

                  {activeStats.area} affected ·{" "}

                  {activeStats.alerts} alerts ·{" "}

                  {activeStats.loss} loss

                </p>

              </div>

              <div
                className={`rounded-full bg-gray-50 px-3 py-2 text-xs font-semibold ${
                  SEVERITY_TEXT[
                    activeStats.severity
                  ]
                }`}
              >
                {activeStats.severity} Risk
              </div>

            </div>

            {/* MAP CONTAINER */}

            <div className="relative">

              <MapContainer
                center={activeCenter}
                zoom={5}
                scrollWheelZoom={true}
                style={{
                  height: "550px",
                  width: "100%",
                }}
              >

                <FlyToRegion
                  center={activeCenter}
                />

                <ResizeMap />

                {/* OPEN STREET MAP */}

                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/* REGION MARKERS */}

                {regions.map((region) => {
                  const center =
                    getCenter(region);

                  const stats =
                    getStats(region);

                  const isActive =
                    region.name ===
                    activeRegion?.name;

                  return (
                    <CircleMarker
                      key={
                        region._id ||
                        region.name
                      }
                      center={center}
                      radius={
                        isActive ? 13 : 8
                      }
                      pathOptions={{
                        color:
                          SEVERITY_COLORS[
                            stats.severity
                          ],
                        fillColor:
                          SEVERITY_COLORS[
                            stats.severity
                          ],
                        fillOpacity:
                          isActive
                            ? 0.8
                            : 0.45,
                        weight:
                          isActive ? 3 : 2,
                      }}
                    >

                      <Popup>

                        <div className="min-w-[190px]">

                          <h3 className="font-semibold text-gray-900">
                            {region.name}
                          </h3>

                          <div className="mt-2 space-y-1 text-xs text-gray-600">

                            <p>
                              Risk:{" "}
                              <strong>
                                {stats.severity}
                              </strong>
                            </p>

                            <p>
                              Forest Loss:{" "}
                              <strong>
                                {stats.loss}
                              </strong>
                            </p>

                            <p>
                              Affected Area:{" "}
                              <strong>
                                {stats.area}
                              </strong>
                            </p>

                            <p>
                              Alerts:{" "}
                              <strong>
                                {stats.alerts}
                              </strong>
                            </p>

                          </div>

                          <button
                            onClick={() =>
                              setSelectedRegion(
                                region.name
                              )
                            }
                            className="mt-3 w-full rounded-md bg-emerald-700 px-3 py-2 text-xs font-semibold text-white"
                          >
                            View Region
                          </button>

                        </div>

                      </Popup>

                    </CircleMarker>
                  );
                })}

                {/* SELECTED REGION RADIUS */}

                {activeRegion && (
                  <Circle
                    center={activeCenter}
                    radius={30000}
                    pathOptions={{
                      color:
                        SEVERITY_COLORS[
                          activeStats.severity
                        ],
                      fillColor:
                        SEVERITY_COLORS[
                          activeStats.severity
                        ],
                      fillOpacity: 0.06,
                      weight: 2,
                      dashArray: "6 8",
                    }}
                  />
                )}

                {/* DEFORESTATION ALERTS */}

                {selectedAlerts.map(
                  (alert, index) => (
                    <CircleMarker
                      key={
                        alert.id ||
                        `${alert.lat}-${alert.lng}-${index}`
                      }
                      center={[
                        alert.lat,
                        alert.lng,
                      ]}
                      radius={9}
                      pathOptions={{
                        color:
                          SEVERITY_COLORS[
                            alert.severity
                          ],
                        fillColor:
                          SEVERITY_COLORS[
                            alert.severity
                          ],
                        fillOpacity: 0.95,
                        weight: 2,
                      }}
                    >

                      <Popup>

                        <div className="min-w-[210px]">

                          <div className="flex items-center gap-2">

                            <span
                              className="h-2.5 w-2.5 rounded-full"
                              style={{
                                backgroundColor:
                                  SEVERITY_COLORS[
                                    alert.severity
                                  ],
                              }}
                            />

                            <p className="font-semibold">
                              Deforestation Alert
                            </p>

                          </div>

                          <div className="mt-3 space-y-1 text-xs text-gray-600">

                            <p>
                              Region:{" "}
                              <strong>
                                {alert.regionName}
                              </strong>
                            </p>

                            <p>
                              Severity:{" "}
                              <strong>
                                {alert.severity}
                              </strong>
                            </p>

                            <p>
                              Loss:{" "}
                              <strong>
                                {alert.lossPercentage}%
                              </strong>
                            </p>

                            <p>
                              Affected Area:{" "}
                              <strong>
                                {alert.affectedArea} ha
                              </strong>
                            </p>

                            <p>
                              Confidence:{" "}
                              <strong>
                                {alert.confidence}%
                              </strong>
                            </p>

                            <p>
                              Status:{" "}
                              <strong>
                                {alert.status}
                              </strong>
                            </p>

                            <p className="pt-2 text-[10px] text-gray-400">
                              {alert.lat.toFixed(
                                5
                              )}
                              ,{" "}
                              {alert.lng.toFixed(
                                5
                              )}
                            </p>

                          </div>

                        </div>

                      </Popup>

                    </CircleMarker>
                  )
                )}

              </MapContainer>

              {/* MAP OVERLAY */}

              <div className="pointer-events-none absolute right-4 top-4 z-[400] rounded-lg border border-[#dbe4de] bg-white/95 p-4 shadow-sm">
                <div className="flex items-center gap-2">

                  <ShieldAlert
                    size={16}
                    className={
                      SEVERITY_TEXT[
                        activeStats.severity
                      ]
                    }
                  />

                  <span className="text-sm font-medium text-gray-700">
                    {activeStats.severity} Risk
                  </span>

                </div>

                <p className="mt-2 text-xs text-gray-500">
                  {activeStats.area} affected ·{" "}
                  {activeStats.alerts} alerts
                </p>

              </div>

              <div className="pointer-events-none absolute bottom-4 left-4 z-[400] rounded-lg border border-[#dbe4de] bg-white/95 px-3 py-2 shadow-sm">

                <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-gray-400">
                  Map Data
                </p>

                <p className="mt-0.5 text-xs font-medium text-gray-700">
                  OpenStreetMap
                </p>

              </div>

            </div>

          </div>

        </div>

        {/* SUMMARY */}

        <div className="mt-5 grid gap-4 sm:grid-cols-3">

          <div className="rounded-xl border border-[#dbe4de] bg-white p-4">

            <p className="text-xs uppercase tracking-[0.15em] text-gray-400">
              Monitored Regions
            </p>

            <p className="mt-2 text-2xl font-semibold text-gray-900">
              {regions.length}
            </p>

          </div>

          <div className="rounded-xl border border-[#dbe4de] bg-white p-4">

            <p className="text-xs uppercase tracking-[0.15em] text-gray-400">
              Total Mapped Alerts
            </p>

            <p className="mt-2 text-2xl font-semibold text-gray-900">
              {alertMarkers.length}
            </p>

          </div>

          <div className="rounded-xl border border-[#dbe4de] bg-white p-4">

            <p className="text-xs uppercase tracking-[0.15em] text-gray-400">
              Selected Region Alerts
            </p>

            <p className="mt-2 text-2xl font-semibold text-gray-900">
              {selectedAlerts.length ||
                activeStats.alerts}
            </p>

          </div>

        </div>

      </div>

    </div>
  );
}