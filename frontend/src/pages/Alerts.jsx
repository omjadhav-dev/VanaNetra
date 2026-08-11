import { useMemo, useState } from "react";
import { Radio, Check } from "lucide-react";

const initialAlerts = [
  {
    id: 1,
    severity: "High",
    region: "Western Ghats Reserve",
    loss: 6.89,
    area: 292.8,
    score: 12.4,
    detected: "2026-08-08",
    status: "New",
  },
  {
    id: 2,
    severity: "Critical",
    region: "Western Ghats Reserve",
    loss: 22.58,
    area: 959.6,
    score: 40.64,
    detected: "2026-08-08",
    status: "New",
  },
  {
    id: 3,
    severity: "High",
    region: "Sundarbans Delta",
    loss: 9,
    area: 369,
    score: 13.5,
    detected: "2026-08-02",
    status: "New",
  },
  {
    id: 4,
    severity: "Critical",
    region: "Kaziranga Corridor",
    loss: 17,
    area: 697,
    score: 20.4,
    detected: "2026-07-27",
    status: "New",
  },
  {
    id: 5,
    severity: "Medium",
    region: "Nilgiri Biosphere",
    loss: 4,
    area: 164,
    score: 4,
    detected: "2026-07-21",
    status: "New",
  },
];

const severityStyles = {
  Critical: "bg-red-700 text-white",
  High: "bg-red-500 text-white",
  Medium: "bg-amber-500 text-black",
  Low: "bg-emerald-500 text-black",
};

function Alerts() {
  const [alerts, setAlerts] = useState(initialAlerts);
  const [severity, setSeverity] = useState("All");
  const [time, setTime] = useState("All time");
  const [notice, setNotice] = useState("");

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

    return alerts.filter((alert) => {
      const matchesSeverity =
        severity === "All" || alert.severity === severity;

      const age = Math.floor(
        (now - new Date(`${alert.detected}T00:00:00`)) / 86400000
      );

      const matchesTime = days === null || age <= days;

      return matchesSeverity && matchesTime;
    });
  }, [alerts, severity, time]);

  const stats = {
    total: alerts.length,
    unhandled: alerts.filter((a) => a.status === "New").length,
    critical: alerts.filter((a) => a.severity === "Critical").length,
    avgLoss:
      alerts.reduce((sum, a) => sum + a.loss, 0) /
      Math.max(alerts.length, 1),
  };

  const updateStatus = (id, status) => {
    setAlerts((current) =>
      current.map((alert) =>
        alert.id === id ? { ...alert, status } : alert
      )
    );

    setNotice(
      status === "Acknowledged"
        ? "Alert acknowledged."
        : "Alert resolved."
    );

    window.setTimeout(() => setNotice(""), 1800);
  };

  return (
    /*
      IMPORTANT:
      h-full + min-h-0 prevents the Alerts page from pushing
      the entire dashboard beyond the viewport.
    */
    <div className="h-full min-h-0 overflow-hidden px-5 py-5 lg:px-7">
      <div className="mx-auto flex h-full min-h-0 max-w-[1390px] flex-col">

        {/* HEADER */}
        <div className="flex shrink-0 items-start justify-between gap-4">
          <div>
            <h1 className="text-[32px] font-semibold leading-tight tracking-tight text-white">
              Alert operations
            </h1>

            <p className="mt-1.5 text-[15px] text-gray-500">
              Live deforestation alerts scored against region sensitivity
            </p>
          </div>

          <div className="mt-1 inline-flex shrink-0 items-center gap-2 rounded-full border border-[#26342c] px-3.5 py-2 text-xs text-gray-300">
            <Radio
              size={14}
              className="text-emerald-400"
            />
            <span>Live · 0 received</span>
          </div>
        </div>

        {/* NOTIFICATION */}
        {notice && (
          <div className="fixed right-5 top-5 z-[60] flex items-center gap-2 rounded-lg border border-emerald-800 bg-[#10251b] px-4 py-2.5 text-sm text-emerald-300 shadow-xl">
            <Check size={15} />
            {notice}
          </div>
        )}

        {/* STAT CARDS */}
        <div className="mt-5 grid shrink-0 grid-cols-2 overflow-hidden rounded-lg border border-[#26342c] bg-[#101713] lg:grid-cols-4">
          {[
            ["TOTAL ALERTS", stats.total],
            ["UNHANDLED", stats.unhandled],
            ["AVG LOSS", `${stats.avgLoss.toFixed(2)}%`],
            ["CRITICAL", stats.critical],
          ].map(([label, value], index) => (
            <div
              key={label}
              className={`
                px-5 py-4
                ${
                  index < 3
                    ? "border-b border-[#26342c] lg:border-b-0 lg:border-r"
                    : ""
                }
              `}
            >
              <p className="text-[11px] uppercase tracking-[0.22em] text-gray-500">
                {label}
              </p>

              <p className="mt-2 text-[27px] font-medium leading-none text-white">
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
                      : "border-[#26342c] text-gray-500 hover:border-[#496255] hover:text-white"
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
                      : "border-[#26342c] text-gray-500 hover:border-[#496255] hover:text-white"
                  }
                `}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        {/* TABLE CONTAINER */}
        <div
          className="
            mt-6
            min-h-0
            flex-1
            overflow-hidden
            rounded-lg
            border border-[#26342c]
            bg-[#101713]
          "
        >
          {/* 
            This is the ONLY scrollable section.
            The rest of the page stays fixed.
          */}
          <div className="h-full min-h-0 overflow-y-auto overflow-x-hidden">

            <table className="w-full table-fixed border-collapse">

              {/* TABLE HEADER */}
              <thead className="sticky top-0 z-10 bg-[#101713]">
                <tr className="border-b border-[#26342c] text-left">

                  <th className="w-[11%] px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500">
                    Severity
                  </th>

                  <th className="w-[21%] px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500">
                    Region
                  </th>

                  <th className="w-[9%] px-3 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500">
                    Loss %
                  </th>

                  <th className="w-[11%] px-3 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500">
                    Area (ha)
                  </th>

                  <th className="w-[9%] px-3 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500">
                    Score
                  </th>

                  <th className="w-[13%] px-3 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500">
                    Detected
                  </th>

                  <th className="w-[12%] px-3 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500">
                    Status
                  </th>

                  <th className="w-[14%] px-3 py-3" />
                </tr>
              </thead>

              {/* TABLE BODY */}
              <tbody>
                {filtered.map((alert) => (
                  <tr
                    key={alert.id}
                    className="
                      border-b border-[#202b25]
                      transition
                      last:border-0
                      hover:bg-[#141c17]
                    "
                  >

                    {/* SEVERITY */}
                    <td className="px-4 py-2.5">
                      <span
                        className={`
                          inline-flex
                          rounded-md
                          px-2.5
                          py-1.5
                          text-[10px]
                          font-bold
                          uppercase
                          tracking-wider
                          ${severityStyles[alert.severity]}
                        `}
                      >
                        {alert.severity}
                      </span>
                    </td>

                    {/* REGION */}
                    <td className="truncate px-4 py-2.5 text-[14px] font-medium text-gray-200">
                      {alert.region}
                    </td>

                    {/* LOSS */}
                    <td className="px-3 py-2.5 text-[14px]">
                      {alert.loss}
                    </td>

                    {/* AREA */}
                    <td className="px-3 py-2.5 text-[14px]">
                      {alert.area}
                    </td>

                    {/* SCORE */}
                    <td className="px-3 py-2.5 text-[14px]">
                      {alert.score}
                    </td>

                    {/* DATE */}
                    <td className="px-3 py-2.5 text-[14px] text-gray-500">
                      {new Date(
                        `${alert.detected}T00:00:00`
                      ).toLocaleDateString("en-IN")}
                    </td>

                    {/* STATUS */}
                    <td className="px-3 py-2.5 text-[14px] text-gray-500">
                      {alert.status}
                    </td>

                    {/* ACTION */}
                    <td className="px-3 py-2.5 text-right">
                      {alert.status === "New" && (
                        <button
                          type="button"
                          onClick={() =>
                            updateStatus(
                              alert.id,
                              "Acknowledged"
                            )
                          }
                          className="
                            whitespace-nowrap
                            rounded-full
                            border
                            border-[#304037]
                            px-3.5
                            py-1.5
                            text-[11px]
                            text-gray-300
                            transition
                            hover:border-emerald-700
                            hover:text-white
                          "
                        >
                          Acknowledge
                        </button>
                      )}

                      {alert.status === "Acknowledged" && (
                        <button
                          type="button"
                          onClick={() =>
                            updateStatus(
                              alert.id,
                              "Resolved"
                            )
                          }
                          className="
                            whitespace-nowrap
                            rounded-full
                            border
                            border-[#304037]
                            px-3.5
                            py-1.5
                            text-[11px]
                            text-gray-300
                            transition
                            hover:border-emerald-700
                            hover:text-white
                          "
                        >
                          Resolve
                        </button>
                      )}

                      {alert.status === "Resolved" && (
                        <span className="text-[11px] text-emerald-500">
                          Completed
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
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