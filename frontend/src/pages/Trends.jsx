import { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";
import RegionSelect from "../components/RegionSelect";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  ReferenceLine,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
  RotateCcw,
  SlidersHorizontal,
  RefreshCw,
  BarChart2,
} from "lucide-react";

function trend(data) {
  if (data.length < 2) return "flat";
  const last = data[data.length - 1].loss;
  const prev = data[data.length - 2].loss;
  if (last > prev + 0.5) return "up";
  if (last < prev - 0.5) return "down";
  return "flat";
}

function TrendIcon({ data }) {
  const t = trend(data);
  if (t === "up")
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600">
        <TrendingUp size={15} /> Rising trend
      </span>
    );
  if (t === "down")
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
        <TrendingDown size={15} /> Decreasing
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold text-gray-400">
      <Minus size={15} /> Stable
    </span>
  );
}

function Trends() {
  const [data, setData] = useState([]);
  const [availableRegions, setAvailableRegions] = useState(["All"]);
  const [loading, setLoading] = useState(true);

  // Filter Parameters
  const [selectedRegion, setSelectedRegion] = useState("All");
  const [selectedSeverity, setSelectedSeverity] = useState("All");
  const [timeHorizon, setTimeHorizon] = useState("6m");
  const [metricView, setMetricView] = useState("loss"); // 'loss' | 'area' | 'both'
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // 1. Fetch Dynamic Regions from Database
  useEffect(() => {
    api("/regions")
      .then((res) => {
        const raw = Array.isArray(res) ? res : res.regions || [];
        const names = raw
          .map((r) => (typeof r === "string" ? r : r.name))
          .filter(Boolean);
        setAvailableRegions(["All", ...Array.from(new Set(names))]);
      })
      .catch(() => {
        // Fallback: If no /regions endpoint, will infer from trend records
      });
  }, []);

  // 2. Fetch Trend Data based on Region & Severity
  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (selectedRegion !== "All") params.append("region", selectedRegion);
    if (selectedSeverity !== "All") params.append("severity", selectedSeverity);

    api(`/dashboard/trends?${params.toString()}`)
      .then((d) => {
        const list = d.data || [];
        setData(list);
        // Fallback populating regions if /regions endpoint was unavailable
        if (availableRegions.length <= 1) {
          const names = list.map((item) => item.region).filter(Boolean);
          if (names.length)
            setAvailableRegions(["All", ...Array.from(new Set(names))]);
        }
      })
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, [selectedRegion, selectedSeverity]);

  // 3. Client-Side Time Horizon / Custom Range Slicing
  const filteredData = useMemo(() => {
    if (!data.length) return [];
    let slice = [...data];

    if (timeHorizon === "6m") {
      slice = slice.slice(-6);
    } else if (timeHorizon === "12m") {
      slice = slice.slice(-12);
    } else if (timeHorizon === "custom") {
      if (startDate) {
        slice = slice.filter(
          (item) => !item.month || item.month >= startDate.slice(0, 7),
        );
      }
      if (endDate) {
        slice = slice.filter(
          (item) => !item.month || item.month <= endDate.slice(0, 7),
        );
      }
    }
    return slice;
  }, [data, timeHorizon, startDate, endDate]);

  const latest = filteredData[filteredData.length - 1];
  const previous = filteredData[filteredData.length - 2];
  const lossDelta =
    latest && previous ? +(latest.loss - previous.loss).toFixed(1) : null;
  const totalArea = filteredData
    .reduce((acc, curr) => acc + (Number(curr.area) || 0), 0)
    .toFixed(1);
  const totalAlerts = filteredData.reduce(
    (acc, curr) => acc + (Number(curr.alerts) || 0),
    0,
  );

  return (
    <div className="w-full min-h-screen bg-[#f7f8f4] text-gray-900 font-sans p-6 md:p-8 space-y-5">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold tracking-tight text-gray-900 leading-tight">
            Loss Trends & Analytics
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Historical aggregates and seasonal change patterns across monitored
            forest canopies
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Metric View Switcher */}
          <div className="inline-flex rounded-lg border border-gray-300 bg-white p-1 text-xs">
            {[
              { id: "loss", label: "Loss %" },
              { id: "area", label: "Area (ha)" },
              { id: "both", label: "Both" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setMetricView(tab.id)}
                className={`px-3 py-1 rounded-md transition font-medium ${
                  metricView === tab.id
                    ? "bg-[#1b4332] text-white shadow-xs font-semibold"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* METRIC KPI CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#fcdcdb] p-4 rounded-xl border border-[#f5b8b5]">
          <p className="text-2xl font-bold text-[#b91c1c] leading-none">
            {latest ? `${latest.loss}%` : "—"}
          </p>
          <p className="text-xs font-semibold text-[#b91c1c] mt-1.5">
            Latest Loss Index
          </p>
          <p className="text-[11px] text-[#b91c1c]/80 mt-0.5">
            {lossDelta !== null
              ? lossDelta > 0
                ? `▲ +${lossDelta}% vs prev`
                : `▼ ${lossDelta}% vs prev`
              : "Baseline"}
          </p>
        </div>

        <div className="bg-[#cbd5e1] p-4 rounded-xl border border-[#94a3b8]">
          <p className="text-2xl font-bold text-gray-900 leading-none">
            {totalArea} ha
          </p>
          <p className="text-xs font-semibold text-gray-800 mt-1.5">
            Total Affected Area
          </p>
          <p className="text-[11px] text-gray-600 mt-0.5">
            Across {filteredData.length} active intervals
          </p>
        </div>

        <div className="bg-[#dcfce7] p-4 rounded-xl border border-[#bbf7d0]">
          <p className="text-2xl font-bold text-[#15803d] leading-none">
            {totalAlerts}
          </p>
          <p className="text-xs font-semibold text-[#15803d] mt-1.5">
            AI Detections Logged
          </p>
          <p className="text-[11px] text-[#15803d]/80 mt-0.5">
            Verified change-points
          </p>
        </div>

        <div className="bg-[#e2e8f0] p-4 rounded-xl border border-[#cbd5e1]">
          <p className="text-2xl font-bold text-gray-900 leading-none">
            {selectedRegion === "All" ? "Pan-Reserve" : selectedRegion}
          </p>
          <p className="text-xs font-semibold text-gray-700 mt-1.5">
            Active Scope
          </p>
          <p className="text-[11px] text-gray-600 mt-0.5">
            {availableRegions.length - 1} database zones registered
          </p>
        </div>
      </div>

      {/* FILTER TOOLBAR */}
      <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Left: Dynamic Region Dropdown */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-gray-600">
              Region:
            </label>
            <RegionSelect
              regions={availableRegions.filter((r) => r !== "All")}
              value={selectedRegion}
              onChange={setSelectedRegion}
              allLabel="All Monitored Regions"
            />
          </div>

          {/* Center: Severity Filter Pills */}
          <div className="flex items-center gap-1.5">
            {["All", "Critical", "High", "Medium", "Low"].map((item) => {
              const isSelected = selectedSeverity === item;
              let activeColor = "bg-[#1b4332] text-white font-bold";
              if (item === "Critical")
                activeColor = "bg-[#d91f11] text-white font-bold";
              if (item === "High")
                activeColor = "bg-[#f59e0b] text-white font-bold";
              if (item === "Medium")
                activeColor = "bg-[#fde047] text-gray-900 font-bold";
              if (item === "Low")
                activeColor = "bg-[#22c55e] text-white font-bold";

              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => setSelectedSeverity(item)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                    isSelected
                      ? activeColor
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {item}
                </button>
              );
            })}
          </div>

          {/* Right: Time Horizon Dropdown */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-gray-600">
              Period:
            </label>
            <select
              value={timeHorizon}
              onChange={(e) => setTimeHorizon(e.target.value)}
              className="text-xs font-medium bg-white border border-gray-300 rounded-lg px-2.5 py-1.5 text-gray-700 hover:border-gray-400 focus:outline-none"
            >
              <option value="6m">Last 6 months</option>
              <option value="12m">Last 12 months</option>
              <option value="all">All time records</option>
              <option value="custom">Custom interval...</option>
            </select>
          </div>
        </div>

        {/* Custom Date Interval Bar */}
        {timeHorizon === "custom" && (
          <div className="flex flex-wrap items-center justify-end gap-2.5 pt-2 border-t border-gray-100 text-xs">
            <div className="flex items-center gap-1.5 text-gray-500 mr-auto text-[11px] font-medium">
              <Calendar size={13} className="text-emerald-700" />
              <span>Select trend window (Month/Year):</span>
            </div>

            <div className="flex items-center gap-1.5">
              <label className="text-gray-500 text-[10px] font-bold">
                FROM:
              </label>
              <input
                type="month"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-gray-50 border border-gray-300 rounded px-2 py-0.5 text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-emerald-600"
              />
            </div>

            <div className="flex items-center gap-1.5">
              <label className="text-gray-500 text-[10px] font-bold">TO:</label>
              <input
                type="month"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-gray-50 border border-gray-300 rounded px-2 py-0.5 text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-emerald-600"
              />
            </div>

            {(startDate || endDate) && (
              <button
                type="button"
                onClick={() => {
                  setStartDate("");
                  setEndDate("");
                }}
                className="inline-flex items-center gap-1 text-[11px] text-gray-500 hover:text-rose-600 ml-1 font-medium"
              >
                <RotateCcw size={11} />
                <span>Reset</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* LOADING & EMPTY STATES */}
      {loading && (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center text-sm text-gray-400">
          <RefreshCw
            size={20}
            className="mx-auto mb-2 animate-spin text-emerald-700"
          />
          Aggregating regional trend metrics...
        </div>
      )}

      {!loading && filteredData.length === 0 && (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center">
          <BarChart2 size={28} className="mx-auto mb-2 text-gray-400" />
          <p className="text-sm font-semibold text-gray-700">
            No trend points available
          </p>
          <p className="mt-1 text-xs text-gray-400">
            No change-detection records match the selected region or date
            filter.
          </p>
        </div>
      )}

      {/* CHARTS CONTAINER WITH VISIBLE SLEEK BORDERS */}
      {!loading && filteredData.length > 0 && (
        <div
          className={`grid gap-5 ${metricView === "both" ? "xl:grid-cols-2" : "grid-cols-1"}`}
        >
          {/* 1. VEGETATION LOSS % TIMELINE */}
          {(metricView === "loss" || metricView === "both") && (
            <div className="rounded-xl border border-gray-900/30 bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-gray-600">
                    Deforestation Loss Rate (% Canopy Gap)
                  </h3>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    Sequential change detection over time
                  </p>
                </div>
                <TrendIcon data={filteredData} />
              </div>

              <div className="mt-4 h-[320px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={filteredData}
                    margin={{ top: 20, right: 15, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#f0f4f1"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="month"
                      tick={{ fill: "#6b7d74", fontSize: 11 }}
                      axisLine={{ stroke: "#a9bab0" }}
                      tickLine={false}
                    />
                    <YAxis
                      domain={[0, "auto"]}
                      tick={{ fill: "#6b7d74", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => `${v}%`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#fff",
                        border: "1px solid #c9d6cd",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                      formatter={(v) => [`${v}%`, "Canopy Loss"]}
                    />
                    {latest && (
                      <ReferenceLine
                        x={latest.month}
                        stroke="#1b4332"
                        strokeDasharray="4 2"
                        label={{
                          value: "current",
                          position: "top",
                          fontSize: 10,
                          fill: "#1b4332",
                        }}
                      />
                    )}
                    <Line
                      type="monotone"
                      dataKey="loss"
                      stroke="#15803d"
                      strokeWidth={2.5}
                      dot={{
                        r: 3,
                        fill: "#fff",
                        stroke: "#15803d",
                        strokeWidth: 2,
                      }}
                      activeDot={{ r: 5, fill: "#15803d" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* 2. AFFECTED HECTARES & ALERT VOLUME BAR CHART */}
          {(metricView === "area" || metricView === "both") && (
            <div className="rounded-xl border border-gray-900/30 bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-gray-600">
                    Affected Area (Hectares) & Cluster Alerts
                  </h3>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    Gross coverage impacted per observation run
                  </p>
                </div>
                <div className="flex items-center gap-4 text-[11px] font-medium">
                  <span className="flex items-center gap-1 text-amber-700">
                    <span className="h-2.5 w-2.5 rounded-sm bg-amber-500" />{" "}
                    Area (ha)
                  </span>
                  <span className="flex items-center gap-1 text-emerald-800">
                    <span className="h-2.5 w-2.5 rounded-sm bg-emerald-600" />{" "}
                    Incidents
                  </span>
                </div>
              </div>

              <div className="mt-4 h-[320px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={filteredData}
                    margin={{ top: 20, right: 10, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#f0f4f1"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="month"
                      tick={{ fill: "#6b7d74", fontSize: 11 }}
                      axisLine={{ stroke: "#a9bab0" }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: "#6b7d74", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => `${v}ha`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#fff",
                        border: "1px solid #c9d6cd",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                      formatter={(v, name) => [
                        name === "area" ? `${v} ha` : v,
                        name === "area" ? "Hectares" : "Alerts Count",
                      ]}
                    />
                    <Bar
                      dataKey="area"
                      fill="#f59e0b"
                      radius={[4, 4, 0, 0]}
                      barSize={26}
                    />
                    <Bar
                      dataKey="alerts"
                      fill="#1b4332"
                      radius={[4, 4, 0, 0]}
                      barSize={14}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}

      {/* FOOTER AUDIT NOTE */}
      <div className="flex items-center justify-between text-xs text-gray-400 pt-2 border-t border-gray-200">
        <p>Telemetry updated live from pipeline change-detection analyses.</p>
        <p>Coordinate reference: WGS 84 / UTM Zone 44N</p>
      </div>
    </div>
  );
}

export default Trends;
