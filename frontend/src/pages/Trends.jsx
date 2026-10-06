import { useEffect, useState } from "react";
import { api } from "../lib/api";
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, ReferenceLine,
} from "recharts";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

const REGIONS = [
  "All",
  "Bandhavgarh Belt",
  "Kaziranga Corridor",
  "Nilgiri Biosphere",
  "Sundarbans Delta",
  "Western Ghats Reserve",
];

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
  if (t === "up")   return <TrendingUp  size={16} className="text-red-500" />;
  if (t === "down") return <TrendingDown size={16} className="text-emerald-500" />;
  return <Minus size={16} className="text-gray-400" />;
}

function Trends() {
  const [selectedRegion, setSelectedRegion] = useState("All");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const q = selectedRegion === "All" ? "" : `?region=${encodeURIComponent(selectedRegion)}`;
    api(`/dashboard/trends${q}`)
      .then(d => setData(d.data || []))
      .catch(() => setData([]))
      .finally(()=> setLoading(false));
  }, [selectedRegion]);

  const latest   = data[data.length - 1];
  const previous = data[data.length - 2];
  const lossDelta = latest && previous ? +(latest.loss - previous.loss).toFixed(1) : null;

  return (
    <div className="min-h-screen bg-[#f6f9f7] px-6 py-6 text-gray-900 lg:px-8">
      <div className="mx-auto max-w-[1400px]">

        {/* HEADER */}
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-gray-900 sm:text-4xl">Loss trends</h1>
          <p className="mt-2 text-base text-[#4b6357]">
            Historical monthly aggregates from all AI change-detection analyses. Updates automatically with each new analysis run.
          </p>
        </div>

        {/* REGION FILTER */}
        <div className="mt-6 flex flex-wrap gap-2.5">
          {REGIONS.map(r => (
            <button key={r} type="button" onClick={() => setSelectedRegion(r)}
              className={`rounded-full border px-3 py-1.5 text-sm transition-all ${
                selectedRegion === r
                  ? "border-emerald-700 bg-emerald-700 text-white"
                  : "border-[#dbe4de] text-gray-500 hover:border-[#8fab9a] hover:text-gray-900"
              }`}>
              {r}
            </button>
          ))}
        </div>

        {/* LIVE LOADING / EMPTY STATE */}
        {loading && (
          <div className="mt-5 rounded-xl border border-[#dbe4de] bg-white p-8 text-center text-sm text-gray-400">
            Loading live trend data...
          </div>
        )}

        {!loading && data.length === 0 && (
          <div className="mt-5 rounded-xl border border-dashed border-[#dbe4de] bg-white p-12 text-center">
            <p className="text-sm font-medium text-gray-500">No trend data yet</p>
            <p className="mt-1 text-xs text-gray-400">Run change-detection analyses to populate this view.</p>
          </div>
        )}

        {/* SUMMARY CARDS */}
        {!loading && latest && (
          <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              ["Latest loss", `${latest.loss}%`, lossDelta !== null ? (lossDelta > 0 ? `▲ ${lossDelta}% vs prev` : lossDelta < 0 ? `▼ ${Math.abs(lossDelta)}% vs prev` : "Stable") : "—", lossDelta > 0 ? "text-red-500" : "text-emerald-600"],
              ["Latest area", `${latest.area} ha`, "Affected this month", "text-gray-500"],
              ["Alerts this month", latest.alerts, "Change-detection events", "text-gray-500"],
              ["Months tracked", data.length, "In selected region", "text-gray-500"],
            ].map(([label, value, sub, subColor]) => (
              <div key={label} className="rounded-xl border border-[#dbe4de] bg-white p-4">
                <p className="text-[11px] uppercase tracking-[0.2em] text-gray-500">{label}</p>
                <p className="mt-2 text-2xl font-semibold text-gray-900">{value}</p>
                <p className={`mt-1 text-xs ${subColor}`}>{sub}</p>
              </div>
            ))}
          </div>
        )}

        {/* CHARTS */}
        {!loading && data.length > 0 && (
        <div className="mt-5 grid gap-5 xl:grid-cols-2">

          {/* LOSS % LINE CHART */}
          <div className="rounded-xl border border-[#dbe4de] bg-white p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-[0.22em] text-[#4e6459]">Vegetation loss % over time</p>
              {!loading && <TrendIcon data={data} />}
            </div>
            <div className="mt-4 h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 20, right: 15, left: 5, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f4f1" vertical={false} />
                  <XAxis dataKey="month" tick={{ fill: "#6b7d74", fontSize: 12 }} axisLine={{ stroke: "#a9bab0" }} tickLine={false} />
                  <YAxis domain={[0, "auto"]} tick={{ fill: "#6b7d74", fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#fff", border: "1px solid #c9d6cd", borderRadius: "8px" }}
                    formatter={v => [`${v}%`, "Loss"]}
                  />
                  {/* mark the latest data point as "current" */}
                  {latest && <ReferenceLine x={latest.month} stroke="#3b996e" strokeDasharray="4 2" label={{ value: "latest", position: "top", fontSize: 10, fill: "#3b996e" }} />}
                  <Line type="monotone" dataKey="loss" stroke="#3b996e" strokeWidth={2.5}
                    dot={{ r: 3, fill: "#fff", stroke: "#3b996e", strokeWidth: 2 }}
                    activeDot={{ r: 5, fill: "#3b996e" }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* AREA + ALERTS BAR CHART */}
          <div className="rounded-xl border border-[#dbe4de] bg-white p-5 sm:p-6">
            <p className="text-xs font-medium uppercase tracking-[0.22em] text-[#4e6459]">Affected area (ha) per month</p>
            <div className="mt-4 h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 20, right: 10, left: 5, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f4f1" vertical={false} />
                  <XAxis dataKey="month" tick={{ fill: "#6b7d74", fontSize: 12 }} axisLine={{ stroke: "#a9bab0" }} tickLine={false} />
                  <YAxis tick={{ fill: "#6b7d74", fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={v => `${v} ha`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#fff", border: "1px solid #c9d6cd", borderRadius: "8px" }}
                    formatter={(v, name) => [name === "area" ? `${v} ha` : v, name === "area" ? "Hectares" : "Alerts"]}
                  />
                  <Bar dataKey="area" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={28} />
                  <Bar dataKey="alerts" fill="#3b996e" radius={[4, 4, 0, 0]} barSize={14} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 flex justify-center gap-6 text-xs">
              <div className="flex items-center gap-1.5 text-amber-500"><span className="h-3 w-3 rounded-sm bg-amber-400" />Hectares</div>
              <div className="flex items-center gap-1.5 text-emerald-600"><span className="h-3 w-3 rounded-sm bg-emerald-500" />Alert count</div>
            </div>
          </div>
        </div>
        )}

        <p className="mt-4 text-xs text-gray-400">
          Data sourced from all change-detection analyses. Each analysis run in the Analyze tab adds a data point to this graph automatically.
        </p>
      </div>
    </div>
  );
}

export default Trends;
