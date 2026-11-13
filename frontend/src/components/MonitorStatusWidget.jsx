import { useEffect, useState } from "react";
import { api } from "../lib/api";
import {
  Satellite,
  CheckCircle2,
  Clock,
  AlertCircle,
  LoaderCircle,
} from "lucide-react";

function formatDateTime(dateStr) {
  if (!dateStr) return "Never";
  return new Date(dateStr).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function MonitorStatusWidget() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api("/dashboard/monitor-status")
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-[#dbe4de] bg-white px-4 py-3 text-xs text-gray-400">
        <LoaderCircle size={13} className="animate-spin" />
        Loading monitor status…
      </div>
    );
  }

  if (!data) return null;

  const dueCount = (data.regions || []).filter(
    (r) => r.status === "due",
  ).length;
  const okCount = (data.regions || []).filter((r) => r.status === "ok").length;
  const pendingCount = (data.regions || []).filter(
    (r) => r.status === "pending_baseline",
  ).length;

  return (
    <div className="overflow-hidden rounded-xl border border-[#dbe4de] bg-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#e2e8e4] px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-700">
            <Satellite size={13} className="text-white" />
          </div>
          <p className="text-[12px] font-semibold text-gray-800">
            Satellite Monitoring
          </p>
        </div>
        <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-medium text-emerald-700">
          {data.totalActive} regions active
        </span>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 divide-x divide-[#e2e8e4]">
        <div className="px-4 py-3 text-center">
          <div className="flex items-center justify-center gap-1 text-emerald-600">
            <CheckCircle2 size={13} />
            <span className="text-[18px] font-semibold text-gray-900">
              {okCount}
            </span>
          </div>
          <p className="mt-0.5 text-[10px] uppercase tracking-[0.14em] text-gray-500">
            On schedule
          </p>
        </div>

        <div className="px-4 py-3 text-center">
          <div className="flex items-center justify-center gap-1 text-amber-500">
            <Clock size={13} />
            <span className="text-[18px] font-semibold text-gray-900">
              {dueCount}
            </span>
          </div>
          <p className="mt-0.5 text-[10px] uppercase tracking-[0.14em] text-gray-500">
            Analysis due
          </p>
        </div>

        <div className="px-4 py-3 text-center">
          <div className="flex items-center justify-center gap-1 text-blue-500">
            <AlertCircle size={13} />
            <span className="text-[18px] font-semibold text-gray-900">
              {pendingCount}
            </span>
          </div>
          <p className="mt-0.5 text-[10px] uppercase tracking-[0.14em] text-gray-500">
            Pending baseline
          </p>
        </div>
      </div>

      {/* Last run */}
      <div className="border-t border-[#e2e8e4] px-4 py-2.5">
        <p className="text-[11px] text-gray-500">
          Last pipeline run:{" "}
          <span className="font-medium text-gray-700">
            {formatDateTime(data.lastRunAt)}
          </span>
        </p>
      </div>
    </div>
  );
}

export default MonitorStatusWidget;
