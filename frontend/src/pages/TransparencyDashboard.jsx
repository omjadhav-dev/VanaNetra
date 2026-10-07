import { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { ShieldCheck, TreeDeciduous, MapPinned, TrendingDown, Info } from "lucide-react";

const severityClass = {
  Critical: "bg-red-50 text-red-600 border-red-200",
  High: "bg-orange-50 text-orange-600 border-orange-200",
  Medium: "bg-amber-50 text-amber-700 border-amber-200",
  Low: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

const deriveSeverity = (loss, criticalCount) => {
  if (criticalCount > 0) return "Critical";
  if (loss >= 10) return "High";
  if (loss >= 4) return "Medium";
  return "Low";
};

function TransparencyDashboard() {
  const [tab, setTab] = useState("overview");
  const [liveRegions, setLiveRegions] = useState([]);
  const [monthly, setMonthly] = useState([]);
  const [loading, setLoading] = useState(true);

  // This public page deliberately uses the public endpoints. The V2
  // /dashboard/summary endpoint is official-only, so it should not be used
  // to power this public component.
  useEffect(() => {
    Promise.all([api("/regions"), api("/alerts/public")])
      .then(([regionData, alertData]) => {
        const publicAlerts = alertData.alerts || [];
        const resolvedByRegion = publicAlerts.reduce((map, alert) => {
          if (alert.status === "Resolved") {
            const name = alert.region?.name || alert.region;
            map[name] = (map[name] || 0) + 1;
          }
          return map;
        }, {});

        setLiveRegions((regionData.regions || []).map((r) => ({
          region: r.name,
          severity: deriveSeverity(r.stats.averageLoss ?? 0, r.stats.critical ?? 0),
          loss: r.stats.averageLoss ?? 0,
          area: r.stats.area ?? 0,
          alerts: r.stats.alerts ?? 0,
          resolved: resolvedByRegion[r.name] || 0,
        })));

        const byMonth = publicAlerts.reduce((map, alert) => {
          if (!alert.detectedAt) return map;
          const date = new Date(alert.detectedAt);
          const key = date.toISOString().slice(0, 7);
          if (!map[key]) map[key] = { month: key, area: 0, alerts: 0 };
          map[key].alerts += 1;
          map[key].area += Number(alert.affectedAreaHectares || 0);
          return map;
        }, {});

        setMonthly(
          Object.values(byMonth)
            .sort((a, b) => a.month.localeCompare(b.month))
            .slice(-12)
            .map((m) => ({
              month: new Date(`${m.month}-01T00:00:00`).toLocaleString("en-IN", { month: "short" }),
              area: Number(m.area.toFixed(1)),
              alerts: m.alerts,
            }))
        );
      })
      .catch(() => {
        setLiveRegions([]);
        setMonthly([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const totals = useMemo(() => {
    const totalAlerts = liveRegions.reduce((s, r) => s + r.alerts, 0);
    const totalResolved = liveRegions.reduce((s, r) => s + r.resolved, 0);
    const totalArea = liveRegions.reduce((s, r) => s + r.area, 0);
    return {
      totalAlerts,
      totalResolved,
      totalArea: totalArea.toFixed(1),
      resolutionRate: ((totalResolved / Math.max(totalAlerts, 1)) * 100).toFixed(0),
    };
  }, [liveRegions]);

  return (
    <div className="min-h-screen bg-[#f6f9f7] px-6 py-10 text-gray-900 lg:px-8">
      <div className="mx-auto max-w-[1300px]">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-600">
          Public transparency
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-gray-900">
          Public deforestation dashboard
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-500">
          Aggregated, read-only figures on monitored regions, forest loss and
          alert resolution — published for public accountability. Individual
          evidence records, officer identities and internal audit trails are
          reserved for the official console.
        </p>

        {loading && <p className="mt-8 text-sm text-gray-400">Loading public data...</p>}

        {!loading && liveRegions.length === 0 && (
          <div className="mt-8 rounded-xl border border-dashed border-[#dbe4de] bg-white p-10 text-center text-sm text-gray-400">
            No public monitoring data is available yet.
          </div>
        )}

        {!loading && liveRegions.length > 0 && (
          <>
            {/* STATS — V1 UI */}
            <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
              {[
                [totals.totalAlerts, "Total alerts (rolling period)", TrendingDown],
                [`${totals.totalArea} ha`, "Cumulative affected area", TreeDeciduous],
                [liveRegions.length, "Monitored regions", MapPinned],
                [`${totals.resolutionRate}%`, "Alerts resolved", ShieldCheck],
              ].map(([value, label, Icon]) => (
                <div key={label} className="rounded-xl border border-[#dbe4de] bg-white p-5">
                  <Icon size={18} className="text-emerald-600" />
                  <p className="mt-3 text-2xl font-semibold text-gray-900">{value}</p>
                  <p className="mt-1 text-xs text-gray-500">{label}</p>
                </div>
              ))}
            </div>

            {/* TABS — V1 UI */}
            <div className="mt-8 flex gap-2">
              {[
                ["overview", "Region overview"],
                ["trend", "Loss trend"],
              ].map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTab(key)}
                  className={`rounded-full border px-4 py-2 text-sm transition ${
                    tab === key
                      ? "border-emerald-700 bg-emerald-700 text-white"
                      : "border-[#dbe4de] text-gray-500 hover:border-[#8fab9a] hover:text-gray-900"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {tab === "overview" && (
              <div className="mt-5 overflow-hidden rounded-xl border border-[#dbe4de] bg-white">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b border-[#e2e8e4] bg-[#f7faf8]">
                      <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500">Region</th>
                      <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500">Risk level</th>
                      <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500">Est. loss</th>
                      <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500">Affected area</th>
                      <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500">Alerts / resolved</th>
                    </tr>
                  </thead>
                  <tbody>
                    {liveRegions.map((r) => (
                      <tr key={r.region} className="border-b border-[#f0f4f1] last:border-0">
                        <td className="px-5 py-3.5 text-sm font-medium text-gray-800">{r.region}</td>
                        <td className="px-5 py-3.5">
                          <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-medium ${severityClass[r.severity]}`}>
                            {r.severity}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-sm text-gray-700">{r.loss}%</td>
                        <td className="px-5 py-3.5 text-sm text-gray-700">{r.area} ha</td>
                        <td className="px-5 py-3.5 text-sm text-gray-700">{r.alerts} / {r.resolved}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {tab === "trend" && (
              <div className="mt-5 rounded-xl border border-[#dbe4de] bg-white p-5 sm:p-6">
                <p className="text-xs font-medium uppercase tracking-[0.22em] text-gray-500">
                  Monthly affected area (ha) & alert volume — all regions
                </p>
                {monthly.length === 0 ? (
                  <p className="py-16 text-center text-sm text-gray-400">No public trend data available yet.</p>
                ) : (
                  <>
                    <div className="mt-4 h-[360px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={monthly} margin={{ top: 20, right: 15, left: 5, bottom: 10 }}>
                          <CartesianGrid horizontal={false} vertical={false} />
                          <XAxis dataKey="month" tick={{ fill: "#6b7d74", fontSize: 12 }} axisLine={{ stroke: "#c9d6cd" }} tickLine={{ stroke: "#c9d6cd" }} />
                          <YAxis tick={{ fill: "#6b7d74", fontSize: 12 }} axisLine={{ stroke: "#c9d6cd" }} tickLine={{ stroke: "#c9d6cd" }} />
                          <Tooltip contentStyle={{ backgroundColor: "#ffffff", border: "1px solid #c9d6cd", borderRadius: "8px", color: "#0b120e" }} labelStyle={{ color: "#4b6357" }} />
                          <Bar dataKey="area" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={26} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="mt-4 h-[220px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={monthly} margin={{ top: 10, right: 15, left: 5, bottom: 10 }}>
                          <CartesianGrid horizontal={false} vertical={false} />
                          <XAxis dataKey="month" tick={{ fill: "#6b7d74", fontSize: 12 }} axisLine={{ stroke: "#c9d6cd" }} tickLine={{ stroke: "#c9d6cd" }} />
                          <YAxis tick={{ fill: "#6b7d74", fontSize: 12 }} axisLine={{ stroke: "#c9d6cd" }} tickLine={{ stroke: "#c9d6cd" }} />
                          <Tooltip contentStyle={{ backgroundColor: "#ffffff", border: "1px solid #c9d6cd", borderRadius: "8px", color: "#0b120e" }} labelStyle={{ color: "#4b6357" }} formatter={(v) => [v, "Alerts"]} />
                          <Line type="monotone" dataKey="alerts" stroke="#3b996e" strokeWidth={3} dot={{ r: 3, fill: "#fff", stroke: "#3b996e", strokeWidth: 2 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </>
                )}
              </div>
            )}

            <div className="mt-6 flex items-start gap-2 rounded-lg border border-[#dbe4de] bg-white px-4 py-3 text-xs text-gray-500">
              <Info size={14} className="mt-0.5 shrink-0 text-gray-400" />
              Figures are aggregated from publicly visible verified, action-taken and resolved alerts.
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default TransparencyDashboard;
