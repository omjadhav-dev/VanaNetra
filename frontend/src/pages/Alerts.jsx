import { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";
import {
  Radio, Download, ChevronRight, Check,
  Calendar, RotateCcw, Satellite,
} from "lucide-react";
import RegionSelect from "../components/RegionSelect";

const STATUS_FLOW = ["Pending", "Under Review", "Verified", "Action Taken", "Resolved"];

const getNextActionLabel = (s) => {
  switch (s) {
    case "Pending":      return "Under Review";
    case "Under Review": return "Verify";
    case "Verified":     return "Take Action";
    case "Action Taken": return "Resolve";
    default:             return null;
  }
};

const nextStatus = (s) => {
  const i = STATUS_FLOW.indexOf(s);
  return i >= 0 && i < STATUS_FLOW.length - 1 ? STATUS_FLOW[i + 1] : null;
};

const deriveSeverity = (loss) => {
  if (loss >= 18) return "Critical";
  if (loss >= 10) return "High";
  if (loss >= 4)  return "Medium";
  return "Low";
};

const SEV_STYLE = {
  Critical: "bg-[#d91f11] text-white",
  High:     "bg-[#d97706] text-white",
  Medium:   "bg-[#eab308] text-gray-900",
  Low:      "bg-[#15803d] text-white",
};

const STATUS_STYLE = {
  Pending:        "bg-gray-100 text-gray-700",
  "Under Review": "bg-amber-50 text-amber-800",
  Verified:       "bg-blue-50 text-blue-800",
  "Action Taken": "bg-purple-50 text-purple-800",
  Resolved:       "bg-emerald-50 text-emerald-800",
};

const parseDate = (d) => {
  if (!d) return null;
  if (typeof d === "string" && d.includes("/")) {
    const [day, month, year] = d.split("/").map(Number);
    const dt = new Date(year, month - 1, day);
    return isNaN(dt) ? null : dt;
  }
  const dt = new Date(d);
  return isNaN(dt) ? null : dt;
};

// Helper: safely extract region name from alert
// Handles: populated object { name: "..." }, raw string name, ObjectId string, null
const extractRegionName = (regionField) => {
  if (!regionField) return null;
  if (typeof regionField === "object" && regionField.name) return regionField.name;
  if (typeof regionField === "string") {
    // If it looks like a MongoDB ObjectId (24 hex chars) it is unpopulated — return null
    if (/^[0-9a-f]{24}$/i.test(regionField)) return null;
    return regionField;
  }
  return null;
};

function Alerts() {
  const [alerts, setAlerts]           = useState([]);
  const [allRegions, setAllRegions]   = useState([]); // all 121 from /api/regions
  const [loading, setLoading]         = useState(true);
  const [selectedRegion, setSelectedRegion] = useState("All");
  const [severity, setSeverity]       = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sourceFilter, setSourceFilter] = useState("All");
  const [timeFilter, setTimeFilter]   = useState("Last 30 days");
  const [startDate, setStartDate]     = useState("");
  const [endDate, setEndDate]         = useState("");
  const [updatingId, setUpdatingId]   = useState(null);
  const [notice, setNotice]           = useState("");

  // Load all regions for the filter dropdown (independent of alerts)
  useEffect(() => {
    api("/regions")
      .then((d) => {
        const list = d.regions || d || [];
        setAllRegions(list.map((r) => (typeof r === "string" ? r : r.name)).filter(Boolean));
      })
      .catch(() => setAllRegions([]));
  }, []);

  useEffect(() => {
    api("/alerts")
      .then((d) => {
        const mapped = (d.alerts || []).map((a) => ({
          id:         a._id,
          // Use extractRegionName to handle unpopulated ObjectIds
          region:     extractRegionName(a.region) || "Unassigned",
          loss:       a.lossPercentage ?? 0,
          area:       a.affectedAreaHectares ?? 0,
          confidence: a.confidenceScore ?? 0,
          detected:   a.detectedAt || a.createdAt || "",
          status:     a.status || "Pending",
          severity:   a.severity || deriveSeverity(a.lossPercentage ?? 0),
          source:     a.source || "manual",
        }));
        setAlerts(mapped);
      })
      .catch(() => setAlerts([]))
      .finally(() => setLoading(false));
  }, []);

  // Use all 121 regions from API for the dropdown
  // Fall back to regions found in alerts if API hasn't loaded yet
  const regionNames = useMemo(() => {
    if (allRegions.length > 0) return allRegions;
    return Array.from(new Set(alerts.map((a) => a.region))).filter(
      (r) => r && r !== "Unassigned"
    );
  }, [allRegions, alerts]);

  const filtered = useMemo(() => {
    const now = new Date();
    const days =
      timeFilter === "Last 15 days" ? 15 :
      timeFilter === "Last 30 days" ? 30 :
      timeFilter === "Last 90 days" ? 90 : null;

    return alerts.filter((a) => {
      // If a specific region is selected, exclude Unassigned alerts
      if (selectedRegion !== "All" && a.region !== selectedRegion) return false;
      // When All is selected, still show Unassigned (they appear at the bottom)
      if (severity !== "All" && a.severity !== severity) return false;
      if (statusFilter !== "All" && a.status !== statusFilter) return false;
      if (sourceFilter === "Auto"   && a.source !== "satellite-pipeline") return false;
      if (sourceFilter === "Manual" && a.source === "satellite-pipeline") return false;

      const dt = parseDate(a.detected);
      if (!dt) return true;

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
  }, [alerts, selectedRegion, severity, statusFilter, sourceFilter, timeFilter, startDate, endDate]);

  const stats = {
    total:      alerts.length,
    critical:   alerts.filter((a) => a.severity === "Critical").length,
    unresolved: alerts.filter((a) => a.status !== "Resolved").length,
    auto:       alerts.filter((a) => a.source === "satellite-pipeline").length,
    manual:     alerts.filter((a) => a.source !== "satellite-pipeline").length,
    unassigned: alerts.filter((a) => a.region === "Unassigned").length,
    avgConf:    alerts.length
      ? Math.round(alerts.reduce((s, a) => s + Number(a.confidence || 0), 0) / alerts.length)
      : 0,
  };

  const handleAdvance = async (id) => {
    const current  = alerts.find((a) => a.id === id);
    const upcoming = current ? nextStatus(current.status) : null;
    if (!upcoming) return;
    setUpdatingId(id);
    try {
      await api(`/alerts/${id}/advance`, { method: "PATCH", body: {} });
      setAlerts((prev) => prev.map((a) => a.id === id ? { ...a, status: upcoming } : a));
      setNotice(`Moved to "${upcoming}"`);
      setTimeout(() => setNotice(""), 2200);
    } catch (err) {
      setNotice(`Failed: ${err.message}`);
      setTimeout(() => setNotice(""), 3000);
    } finally {
      setUpdatingId(null);
    }
  };

  const exportCSV = () => {
    const rows = filtered.map((a) =>
      `"${a.id}","${a.region}","${a.area}","${a.loss}","${a.confidence}","${a.detected}","${a.status}","${a.source}"`
    );
    const blob = new Blob(
      ["ID,Region,Area_ha,Loss_pct,Confidence,Detected,Status,Source\n", rows.join("\n")],
      { type: "text/csv" }
    );
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Alerts_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[#f7f8f4] p-5 md:p-6 space-y-4 font-sans text-gray-900">

      {/* Toast */}
      {notice && (
        <div className="fixed right-5 top-5 z-50 flex items-center gap-2 rounded-lg border border-emerald-300 bg-[#ecfdf5] px-3.5 py-2 text-xs font-semibold text-emerald-800 shadow-md">
          <Check size={14} /> {notice}
        </div>
      )}

      {/* ── HEADER ── */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight">Alert Operations</h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-[#d8f3dc] px-2.5 py-0.5 text-xs font-semibold text-[#1b4332]">
              <Radio size={11} className="animate-pulse text-[#2d6a4f]" />
              {stats.total} Total
            </span>
          </div>
          <p className="mt-0.5 text-xs text-gray-500">
            Live deforestation alerts scored against region sensitivity
          </p>
        </div>
        <button
          type="button"
          onClick={exportCSV}
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-xs hover:bg-gray-50"
        >
          <Download size={13} className="text-gray-500" /> Export CSV
        </button>
      </div>

      {/* ── STAT CARDS ── */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {[
          { label: "Critical",       value: stats.critical,   cls: "bg-[#fcdcdb] border-[#f5b8b5] text-[#b91c1c]" },
          { label: "Unresolved",     value: stats.unresolved, cls: "bg-[#cbd5e1] border-[#94a3b8] text-gray-900" },
          { label: "Avg Confidence", value: `${stats.avgConf}%`, cls: "bg-[#dcfce7] border-[#bbf7d0] text-[#15803d]" },
          { label: "Auto-detected",  value: stats.auto,       cls: "bg-emerald-50 border-emerald-200 text-emerald-800", icon: true },
          { label: "Manual uploads", value: stats.manual, cls: "bg-[#e2e8f0] border-[#cbd5e1] text-gray-900" },
        ].map(({ label, value, cls, icon }) => (
          <div key={label} className={`rounded-xl border px-4 py-3 ${cls}`}>
            <p className="text-xl font-bold leading-none">{value}</p>
            <p className="mt-1 flex items-center gap-1 text-xs font-medium">
              {icon && <Satellite size={11} />} {label}
            </p>
          </div>
        ))}
      </div>

      {/* ── FILTER TOOLBAR ── */}
      <div className="space-y-2 rounded-xl border border-gray-200 bg-white px-3 py-2.5 shadow-xs">
        <div className="flex flex-wrap items-center gap-3">

          {/* Region — searchable combobox */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-600">Region:</span>
            <RegionSelect
              regions={regionNames}
              value={selectedRegion}
              onChange={setSelectedRegion}
            />
          </div>

          {/* Severity pills */}
          <div className="flex items-center gap-1.5">
            {["All", "Critical", "High", "Medium", "Low"].map((item) => {
              const active = severity === item;
              const ac =
                item === "All"      ? "bg-[#1b4332] text-white" :
                item === "Critical" ? "bg-[#d91f11] text-white" :
                item === "High"     ? "bg-[#f59e0b] text-white" :
                item === "Medium"   ? "bg-[#fde047] text-gray-900" :
                                      "bg-[#22c55e] text-white";
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => setSeverity(item)}
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition ${active ? ac : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                >
                  {item}
                </button>
              );
            })}
          </div>

          {/* Status + Source + Time — right side */}
          <div className="ml-auto flex flex-wrap items-center gap-2">
            {/* Source filter */}
            <div className="flex items-center gap-1 rounded-lg border border-gray-200 bg-gray-50 p-0.5 text-xs">
              {["All", "Auto", "Manual"].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSourceFilter(s)}
                  className={`flex items-center gap-1 rounded-md px-2.5 py-1 transition ${
                    sourceFilter === s
                      ? "bg-[#1b4332] text-white font-semibold shadow-xs"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  {s === "Auto" && <Satellite size={11} />} {s}
                </button>
              ))}
            </div>

            {/* Status */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-gray-300 bg-white px-2 py-1 text-xs text-gray-700 focus:outline-none"
            >
              <option value="All">Status: All</option>
              {STATUS_FLOW.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>

            {/* Time */}
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              className="rounded-lg border border-gray-300 bg-white px-2 py-1 text-xs text-gray-700 focus:outline-none"
            >
              {["Last 15 days", "Last 30 days", "Last 90 days", "All time", "Custom range"].map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Custom date row */}
        {timeFilter === "Custom range" && (
          <div className="flex flex-wrap items-center gap-2.5 border-t border-gray-100 pt-2 text-xs">
            <span className="flex items-center gap-1.5 text-[11px] font-medium text-gray-500">
              <Calendar size={13} className="text-emerald-700" /> Date range:
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

      {/* ── TABLE ── */}
      <div className="overflow-x-auto rounded-xl border border-gray-900/30 bg-white shadow-xs">
        <table className="w-full min-w-[740px] border-collapse text-left">
          <thead>
            <tr className="border-b border-gray-900/20 bg-gray-100/70 text-[11px] font-semibold uppercase tracking-wider text-gray-600">
              <th className="w-20 border-r border-gray-900/10 px-3.5 py-2.5">Sev</th>
              <th className="border-r border-gray-900/10 px-3.5 py-2.5">Region</th>
              <th className="w-36 border-r border-gray-900/10 px-3 py-2.5">Loss / Area</th>
              <th className="w-24 border-r border-gray-900/10 px-3 py-2.5">Confidence</th>
              <th className="w-24 border-r border-gray-900/10 px-3 py-2.5">Detected</th>
              <th className="w-20 border-r border-gray-900/10 px-3 py-2.5">Source</th>
              <th className="w-28 border-r border-gray-900/10 px-3 py-2.5">Status</th>
              <th className="w-28 px-3 py-2.5 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-900/10 text-xs">
            {loading && (
              <tr><td colSpan={8} className="py-10 text-center text-gray-400">Loading alerts…</td></tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr><td colSpan={8} className="py-10 text-center text-gray-400">No alerts match the selected filters.</td></tr>
            )}
            {!loading && filtered.map((a) => {
              const actionLabel = getNextActionLabel(a.status);
              const isAuto      = a.source === "satellite-pipeline";
              return (
                <tr key={a.id} className="transition hover:bg-gray-50/80">
                  <td className="border-r border-gray-900/10 px-3.5 py-2.5">
                    <span className={`inline-block rounded px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${SEV_STYLE[a.severity] || "bg-gray-200 text-gray-800"}`}>
                      {a.severity}
                    </span>
                  </td>
                  <td className="border-r border-gray-900/10 px-3.5 py-2.5">
                    {a.region === "Unassigned" ? (
                      <span className="inline-flex items-center gap-1 rounded bg-gray-100 px-2 py-0.5 text-[11px] text-gray-400 italic">
                        Unassigned region
                      </span>
                    ) : (
                      <span className="font-semibold text-gray-900">{a.region}</span>
                    )}
                  </td>
                  <td className="border-r border-gray-900/10 px-3 py-2.5 whitespace-nowrap">
                    <span className="font-bold text-gray-900">{a.area} ha</span>
                    <span className="ml-1.5 font-semibold text-rose-600">-{a.loss}%</span>
                  </td>
                  <td className="border-r border-gray-900/10 px-3 py-2.5 font-medium text-gray-800">
                    {a.confidence}%
                  </td>
                  <td className="border-r border-gray-900/10 px-3 py-2.5 text-gray-600 whitespace-nowrap">
                    {parseDate(a.detected)?.toLocaleDateString("en-IN") || a.detected}
                  </td>
                  {/* Source badge */}
                  <td className="border-r border-gray-900/10 px-3 py-2.5">
                    {isAuto ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                        <Satellite size={9} /> Auto
                      </span>
                    ) : (
                      <span className="text-[11px] text-gray-400">Manual</span>
                    )}
                  </td>
                  <td className="border-r border-gray-900/10 px-3 py-2.5">
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-medium ${STATUS_STYLE[a.status] || "bg-gray-100 text-gray-700"}`}>
                      {a.status}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-right whitespace-nowrap">
                    {actionLabel ? (
                      <button
                        type="button"
                        disabled={updatingId === a.id}
                        onClick={() => handleAdvance(a.id)}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-700 transition hover:text-emerald-700 disabled:opacity-50"
                      >
                        › {actionLabel} <ChevronRight size={12} className="text-gray-400" />
                      </button>
                    ) : (
                      <span className="text-[11px] font-semibold text-emerald-700">✓ Resolved</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Alerts;