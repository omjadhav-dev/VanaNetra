import { useMemo, useState } from "react";
import { Radio, Check, History, X, ChevronRight } from "lucide-react";

// Status workflow, in order. Every alert audit trail is a subsequence of this.
const STATUS_FLOW = [
  "Pending",
  "Under Review",
  "Verified",
  "Action Taken",
  "Resolved",
];

const nextStatus = (status) => {
  const index = STATUS_FLOW.indexOf(status);
  return index >= 0 && index < STATUS_FLOW.length - 1
    ? STATUS_FLOW[index + 1]
    : null;
};

// Confidence score is produced by the change-detection model (0-100).
// Severity is derived from % canopy loss so officials can triage without
// reading every alert: >=18% Critical, >=10% High, >=4% Medium, else Low.
const deriveSeverity = (loss) => {
  if (loss >= 18) return "Critical";
  if (loss >= 10) return "High";
  if (loss >= 4) return "Medium";
  return "Low";
};

const initialAlerts = [
  {
    id: 1,
    region: "Western Ghats Reserve",
    loss: 6.89,
    area: 292.8,
    score: 12.4,
    confidence: 91,
    detected: "2026-08-08",
    status: "Pending",
    history: [{ status: "Pending", by: "System (auto-detected)", at: "2026-08-08T09:12:00" }],
  },
  {
    id: 2,
    region: "Western Ghats Reserve",
    loss: 22.58,
    area: 959.6,
    score: 40.64,
    confidence: 97,
    detected: "2026-08-08",
    status: "Under Review",
    history: [
      { status: "Pending", by: "System (auto-detected)", at: "2026-08-08T09:15:00" },
      { status: "Under Review", by: "R. Deshmukh", at: "2026-08-08T14:02:00" },
    ],
  },
  {
    id: 3,
    region: "Sundarbans Delta",
    loss: 9,
    area: 369,
    score: 13.5,
    confidence: 84,
    detected: "2026-08-02",
    status: "Pending",
    history: [{ status: "Pending", by: "System (auto-detected)", at: "2026-08-02T07:40:00" }],
  },
  {
    id: 4,
    region: "Kaziranga Corridor",
    loss: 17,
    area: 697,
    score: 20.4,
    confidence: 88,
    detected: "2026-07-27",
    status: "Verified",
    history: [
      { status: "Pending", by: "System (auto-detected)", at: "2026-07-27T06:05:00" },
      { status: "Under Review", by: "A. Iyer", at: "2026-07-27T11:20:00" },
      { status: "Verified", by: "A. Iyer", at: "2026-07-28T09:00:00" },
    ],
  },
  {
    id: 5,
    region: "Nilgiri Biosphere",
    loss: 4,
    area: 164,
    score: 4,
    confidence: 76,
    detected: "2026-07-21",
    status: "Resolved",
    history: [
      { status: "Pending", by: "System (auto-detected)", at: "2026-07-21T08:00:00" },
      { status: "Under Review", by: "S. Nair", at: "2026-07-21T15:40:00" },
      { status: "Verified", by: "S. Nair", at: "2026-07-22T10:10:00" },
      { status: "Action Taken", by: "Field Unit 4", at: "2026-07-24T13:30:00" },
      { status: "Resolved", by: "S. Nair", at: "2026-07-26T17:00:00" },
    ],
  },
];

const severityStyles = {
  Critical: "bg-red-600 text-white",
  High: "bg-orange-500 text-white",
  Medium: "bg-amber-400 text-gray-900",
  Low: "bg-emerald-500 text-white",
};

const statusStyles = {
  Pending: "bg-gray-100 text-gray-600 border border-gray-200",
  "Under Review": "bg-amber-50 text-amber-700 border border-amber-200",
  Verified: "bg-blue-50 text-blue-700 border border-blue-200",
  "Action Taken": "bg-violet-50 text-violet-700 border border-violet-200",
  Resolved: "bg-emerald-50 text-emerald-700 border border-emerald-200",
};

function ConfidenceBar({ value }) {
  const color =
    value >= 85 ? "bg-emerald-500" : value >= 70 ? "bg-amber-400" : "bg-orange-400";

  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-gray-100">
        <div className={`h-full ${color}`} style={{ width: `${value}%` }} />
      </div>
      <span className="text-[12px] text-gray-500">{value}%</span>
    </div>
  );
}

function AuditTrailModal({ alert, onClose }) {
  if (!alert) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-lg rounded-xl border border-[#dbe4de] bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#e2e8e4] px-5 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-gray-500">
              Audit trail
            </p>
            <h3 className="mt-1 text-base font-semibold text-gray-900">
              {alert.region}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
          >
            <X size={16} />
          </button>
        </div>

        <div className="max-h-[360px] overflow-y-auto px-5 py-4">
          <ol className="relative space-y-5 border-l border-[#dbe4de] pl-5">
            {alert.history.map((entry, idx) => (
              <li key={idx} className="relative">
                <span className="absolute -left-[25px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full border-2 border-emerald-600 bg-white" />
                <p className="text-sm font-medium text-gray-900">{entry.status}</p>
                <p className="mt-0.5 text-xs text-gray-500">
                  {entry.by} ·{" "}
                  {new Date(entry.at).toLocaleString("en-IN", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </p>
              </li>
            ))}
          </ol>
        </div>

        <div className="border-t border-[#e2e8e4] px-5 py-3 text-xs text-gray-400">
          Every status change is timestamped and attributed for legal-grade traceability.
        </div>
      </div>
    </div>
  );
}

function Alerts() {
  const [alerts, setAlerts] = useState(initialAlerts);
  const [severity, setSeverity] = useState("All");
  const [time, setTime] = useState("All time");
  const [notice, setNotice] = useState("");
  const [trailAlert, setTrailAlert] = useState(null);

  const withSeverity = useMemo(
    () => alerts.map((a) => ({ ...a, severity: deriveSeverity(a.loss) })),
    [alerts]
  );

  const filtered = useMemo(() => {
    const now = new Date("2026-08-10T00:00:00");

    const days =
      time === "Last 7 days"
        ? 7
        : time === "Last 30 days"
        ? 30
        : time === "Last 90 days"
        ? 90
        : null;

    return withSeverity.filter((alert) => {
      const matchesSeverity =
        severity === "All" || alert.severity === severity;

      const age = Math.floor(
        (now - new Date(`${alert.detected}T00:00:00`)) / 86400000
      );

      const matchesTime = days === null || age <= days;

      return matchesSeverity && matchesTime;
    });
  }, [withSeverity, severity, time]);

  const stats = {
    total: alerts.length,
    unresolved: alerts.filter((a) => a.status !== "Resolved").length,
    critical: withSeverity.filter((a) => a.severity === "Critical").length,
    avgConfidence:
      alerts.reduce((sum, a) => sum + a.confidence, 0) /
      Math.max(alerts.length, 1),
  };

  const advanceStatus = (id) => {
    setAlerts((current) =>
      current.map((alert) => {
        if (alert.id !== id) return alert;

        const upcoming = nextStatus(alert.status);
        if (!upcoming) return alert;

        return {
          ...alert,
          status: upcoming,
          history: [
            ...alert.history,
            {
              status: upcoming,
              by: "You (current officer)",
              at: new Date().toISOString(),
            },
          ],
        };
      })
    );

    const alert = alerts.find((a) => a.id === id);
    const upcoming = alert ? nextStatus(alert.status) : null;

    setNotice(upcoming ? `Alert moved to "${upcoming}".` : "");
    window.setTimeout(() => setNotice(""), 1800);
  };

  return (
    /*
      IMPORTANT:
      h-full + min-h-0 prevents the Alerts page from pushing
      the entire dashboard beyond the viewport.
    */
    <div className="h-full min-h-0 overflow-hidden bg-[#f6f9f7] px-5 py-5 lg:px-7">
      <div className="mx-auto flex h-full min-h-0 max-w-[1450px] flex-col">

        {/* HEADER */}
        <div className="flex shrink-0 items-start justify-between gap-4">
          <div>
            <h1 className="text-[32px] font-semibold leading-tight tracking-tight text-gray-900">
              Alert operations
            </h1>

            <p className="mt-1.5 text-[15px] text-gray-500">
              Live deforestation alerts scored against region sensitivity
            </p>
          </div>

          <div className="mt-1 inline-flex shrink-0 items-center gap-2 rounded-full border border-[#dbe4de] bg-white px-3.5 py-2 text-xs text-gray-600">
            <Radio size={14} className="text-emerald-600" />
            <span>Live · 0 received</span>
          </div>
        </div>

        {/* NOTIFICATION */}
        {notice && (
          <div className="fixed right-5 top-5 z-[60] flex items-center gap-2 rounded-lg border border-emerald-200 bg-[#ecfdf5] px-4 py-2.5 text-sm text-emerald-700 shadow-xl">
            <Check size={15} />
            {notice}
          </div>
        )}

        {/* AUDIT TRAIL MODAL */}
        <AuditTrailModal alert={trailAlert} onClose={() => setTrailAlert(null)} />

        {/* STAT CARDS */}
        <div className="mt-5 grid shrink-0 grid-cols-2 overflow-hidden rounded-lg border border-[#dbe4de] bg-white lg:grid-cols-4">
          {[
            ["TOTAL ALERTS", stats.total],
            ["UNRESOLVED", stats.unresolved],
            ["AVG CONFIDENCE", `${stats.avgConfidence.toFixed(0)}%`],
            ["CRITICAL", stats.critical],
          ].map(([label, value], index) => (
            <div
              key={label}
              className={`
                px-5 py-4
                ${
                  index < 3
                    ? "border-b border-[#dbe4de] lg:border-b-0 lg:border-r"
                    : ""
                }
              `}
            >
              <p className="text-[11px] uppercase tracking-[0.22em] text-gray-500">
                {label}
              </p>

              <p className="mt-2 text-[27px] font-medium leading-none text-gray-900">
                {value}
              </p>
            </div>
          ))}
        </div>

        {/* FILTERS */}
        <div className="mt-4 flex shrink-0 flex-wrap items-center justify-between gap-3">

          {/* SEVERITY */}
          <div className="flex flex-wrap gap-2">
            {["All", "Critical", "High", "Medium", "Low"].map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setSeverity(item)}
                className={`
                  rounded-full border px-3 py-1 mt-2
                  text-xs transition
                  ${
                    severity === item
                      ? "border-emerald-700 bg-emerald-700 text-white"
                      : "border-[#dbe4de] text-gray-500 hover:border-[#8fab9a] hover:text-gray-900"
                  }
                `}
              >
                {item}
              </button>
            ))}
          </div>

          {/* TIME */}
          <div className="flex flex-wrap gap-2">
            {[
              "All time",
              "Last 7 days",
              "Last 30 days",
              "Last 90 days",
            ].map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setTime(item)}
                className={`
                  rounded-full border px-3 py-1 mt-2
                  text-xs transition
                  ${
                    time === item
                      ? "border-emerald-700 bg-emerald-700 text-white"
                      : "border-[#dbe4de] text-gray-500 hover:border-[#8fab9a] hover:text-gray-900"
                  }
                `}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        {/* TABLE CONTAINER */}
        <div className="mt-6 min-h-0 flex-1 overflow-hidden rounded-lg border border-[#dbe4de] bg-white">
          {/*
            This is the ONLY scrollable section.
            The rest of the page stays fixed.
          */}
          <div className="h-full min-h-0 overflow-y-auto overflow-x-hidden">

            <table className="w-full table-fixed border-collapse">

              {/* TABLE HEADER */}
              <thead className="sticky top-0 z-10 bg-white">
                <tr className="border-b border-[#dbe4de] text-left">
                  <th className="w-[10%] px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500">
                    Severity
                  </th>
                  <th className="w-[17%] px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500">
                    Region
                  </th>
                  <th className="w-[8%] px-3 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500">
                    Loss %
                  </th>
                  <th className="w-[10%] px-3 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500">
                    Area (ha)
                  </th>
                  <th className="w-[12%] px-3 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500">
                    Confidence
                  </th>
                  <th className="w-[11%] px-3 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500">
                    Detected
                  </th>
                  <th className="w-[13%] px-3 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500">
                    Status
                  </th>
                  <th className="w-[9%] px-3 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500">
                    Audit
                  </th>
                  <th className="w-[10%] px-3 py-3" />
                </tr>
              </thead>

              {/* TABLE BODY */}
              <tbody>
                {filtered.map((alert) => {
                  const upcoming = nextStatus(alert.status);

                  return (
                    <tr
                      key={alert.id}
                      className="border-b border-[#f0f4f1] transition last:border-0 hover:bg-[#f7faf8]"
                    >
                      {/* SEVERITY */}
                      <td className="px-4 py-2.5">
                        <span
                          className={`inline-flex rounded-md px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider ${severityStyles[alert.severity]}`}
                        >
                          {alert.severity}
                        </span>
                      </td>

                      {/* REGION */}
                      <td className="truncate px-4 py-2.5 text-[14px] font-medium text-gray-800">
                        {alert.region}
                      </td>

                      {/* LOSS */}
                      <td className="px-3 py-2.5 text-[14px] text-gray-700">
                        {alert.loss}
                      </td>

                      {/* AREA */}
                      <td className="px-3 py-2.5 text-[14px] text-gray-700">
                        {alert.area}
                      </td>

                      {/* CONFIDENCE */}
                      <td className="px-3 py-2.5">
                        <ConfidenceBar value={alert.confidence} />
                      </td>

                      {/* DATE */}
                      <td className="px-3 py-2.5 text-[14px] text-gray-500">
                        {new Date(`${alert.detected}T00:00:00`).toLocaleDateString("en-IN")}
                      </td>

                      {/* STATUS */}
                      <td className="px-3 py-2.5">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium ${statusStyles[alert.status]}`}>
                          {alert.status}
                        </span>
                      </td>

                      {/* AUDIT */}
                      <td className="px-3 py-2.5">
                        <button
                          type="button"
                          onClick={() => setTrailAlert(alert)}
                          className="inline-flex items-center gap-1.5 text-[11px] text-gray-500 hover:text-emerald-700"
                        >
                          <History size={13} />
                          {alert.history.length}
                        </button>
                      </td>

                      {/* ACTION */}
                      <td className="px-3 py-2.5 text-right">
                        {upcoming ? (
                          <button
                            type="button"
                            onClick={() => advanceStatus(alert.id)}
                            className="inline-flex items-center gap-1 whitespace-nowrap rounded-full border border-[#c9d6cd] px-3.5 py-1.5 text-[11px] text-gray-600 transition hover:border-emerald-700 hover:text-gray-900"
                          >
                            {upcoming}
                            <ChevronRight size={12} />
                          </button>
                        ) : (
                          <span className="text-[11px] text-emerald-600">Completed</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {filtered.length === 0 && (
              <div className="p-10 text-center">
                <p className="text-sm text-gray-500">
                  No alerts match the selected filters.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Alerts;
