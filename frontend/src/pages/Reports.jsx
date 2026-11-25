import { useMemo, useState, useEffect } from "react";
import { api } from "../lib/api";
import RegionSelect from "../components/RegionSelect";
import {
  Download,
  FilePlus2,
  LoaderCircle,
  FileText,
  ShieldCheck,
  Calendar,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  FileBarChart,
} from "lucide-react";

const normalise = (r) => ({
  _id: r._id || r.id,
  id: r._id || r.id || r.reportId,
  reportId: r.reportId || r.id,
  title: r.title,
  region: r.region?.name || r.region || "All regions",
  alerts: r.summary?.totalAlerts ?? r.alerts ?? 0,
  date: r.createdAt ? new Date(r.createdAt).toLocaleString("en-IN") : r.date,
  rawDate: r.createdAt || r.date,
  officer: r.generatedByLabel || r.officer || "System Generated",
  designation:
    r.designationAtGeneration || r.designation || "Monitoring Officer",
  classification: r.classification || "Restricted",
});

function Reports() {
  const [reports, setReports] = useState([]);
  const [availableRegions, setAvailableRegions] = useState(["All regions"]);
  const [selectedRegion, setSelectedRegion] = useState("All");
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [generating, setGenerating] = useState(false);

  // Filter Parameters (Search input removed)
  const [region, setRegion] = useState("All regions");
  const [timeFilter, setTimeFilter] = useState("Last 30 days");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [severityScope, setSeverityScope] = useState("All");

  // Pagination (10 records per page)
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    // 1. Fetch Dynamic Regions
    api("/regions")
      .then((res) => {
        const raw = Array.isArray(res) ? res : res.regions || [];
        const names = raw
          .map((r) => (typeof r === "string" ? r : r.name))
          .filter(Boolean);
        setAvailableRegions(["All regions", ...Array.from(new Set(names))]);
      })
      .catch(() => {});

    // 2. Fetch Reports
    api("/reports")
      .then((d) => {
        const mapped = (d.reports || []).map(normalise);
        setReports(mapped);
        if (availableRegions.length <= 1) {
          const names = mapped.map((r) => r.region).filter(Boolean);
          if (names.length)
            setAvailableRegions(["All regions", ...Array.from(new Set(names))]);
        }
      })
      .catch(() => setReports([]))
      .finally(() => setLoading(false));
  }, []);

  const showNotice = (message) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2500);
  };

  const generateReport = async () => {
    setGenerating(true);
    try {
      const { report } = await api("/reports/generate", {
        method: "POST",
        body: {
          regionId: region === "All regions" ? "All" : region,
          title:
            region === "All regions"
              ? "All Regions — Forest Loss Alert Report"
              : `${region} — Forest Loss Alert Report`,
          classification: "Restricted",
        },
      });
      setReports((current) => [normalise(report), ...current]);
      showNotice("Report generated successfully.");
    } catch (err) {
      showNotice(`Error: ${err.message}`);
    } finally {
      setGenerating(false);
    }
  };

  const downloadReport = async (report) => {
    try {
      const blob = await api(`/reports/${report._id}/download`);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${report.reportId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showNotice("Report downloaded.");
    } catch (err) {
      showNotice(`Download failed: ${err.message}`);
    }
  };

  // Filter Pipeline (Without search constraint)
  const filteredReports = useMemo(() => {
    const now = new Date();
    const days =
      timeFilter === "Last 15 days"
        ? 15
        : timeFilter === "Last 30 days"
          ? 30
          : timeFilter === "Last 90 days"
            ? 90
            : null;

    return reports.filter((report) => {
      // Region
      const matchesRegion =
        region === "All regions" || report.region === region;

      // Severity / Alert Count Scope
      let matchesScope = true;
      if (severityScope === "High Activity") matchesScope = report.alerts >= 10;
      if (severityScope === "Moderate")
        matchesScope = report.alerts > 0 && report.alerts < 10;
      if (severityScope === "Zero Incidents")
        matchesScope = report.alerts === 0;

      if (!matchesRegion || !matchesScope) return false;

      // Timeframe
      if (!report.rawDate) return true;
      const reportDate = new Date(report.rawDate);
      if (isNaN(reportDate.getTime())) return true;

      if (timeFilter === "Custom range") {
        const time = reportDate.getTime();
        if (startDate) {
          const s = new Date(startDate);
          s.setHours(0, 0, 0, 0);
          if (time < s.getTime()) return false;
        }
        if (endDate) {
          const e = new Date(endDate);
          e.setHours(23, 59, 59, 999);
          if (time > e.getTime()) return false;
        }
        return true;
      }

      if (days === null) return true;
      const age = Math.floor((now.getTime() - reportDate.getTime()) / 86400000);
      return age >= 0 && age <= days;
    });
  }, [reports, region, timeFilter, startDate, endDate, severityScope]);

  // Pagination Math (10 items per page)
  const totalPages = Math.ceil(filteredReports.length / itemsPerPage) || 1;
  const paginatedReports = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredReports.slice(start, start + itemsPerPage);
  }, [filteredReports, currentPage]);

  return (
    <div className="w-full min-h-screen bg-[#f7f8f4] text-gray-900 font-sans p-6 md:p-8 space-y-5">
      {notice && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2 rounded-lg border border-emerald-300 bg-[#ecfdf5] px-4 py-2.5 text-xs font-semibold text-emerald-800 shadow-lg">
          <ShieldCheck size={14} />
          {notice}
        </div>
      )}

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold tracking-tight text-gray-900">
            Legal Audit Reports
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Generate and export authenticated PDF dossiers with geotagged
            satellite overlays
          </p>
        </div>

        <button
          type="button"
          onClick={generateReport}
          disabled={generating}
          className="inline-flex items-center gap-2 rounded-lg bg-[#1b4332] px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-[#2d6a4f] disabled:opacity-60"
        >
          {generating ? (
            <>
              <LoaderCircle size={14} className="animate-spin" />
              Compiling dossier...
            </>
          ) : (
            <>
              <FilePlus2 size={14} />
              Generate report
            </>
          )}
        </button>
      </div>

      {/* FILTER TOOLBAR (Without Search Box) */}
      <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Left: Region Dropdown */}
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

          {/* Center: Severity Scope Direct Selector */}
          <div className="flex items-center gap-1.5">
            {["All", "High Activity", "Moderate", "Zero Incidents"].map(
              (item) => {
                const isSelected = severityScope === item;
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => {
                      setSeverityScope(item);
                      setCurrentPage(1);
                    }}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                      isSelected
                        ? "bg-[#1b4332] text-white font-bold"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {item}
                  </button>
                );
              },
            )}
          </div>

          {/* Right: Timeframe Dropdown */}
          <div className="flex items-center gap-2">
            <select
              value={timeFilter}
              onChange={(e) => {
                setTimeFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="text-xs font-medium bg-white border border-gray-300 rounded-lg px-2.5 py-1.5 text-gray-700 hover:border-gray-400 focus:outline-none"
            >
              <option value="Last 15 days">Last 15 days</option>
              <option value="Last 30 days">Last 30 days</option>
              <option value="Last 90 days">Last 90 days</option>
              <option value="All time">All time</option>
              <option value="Custom range">Custom range...</option>
            </select>
          </div>
        </div>

        {/* Custom Date Interval Bar */}
        {timeFilter === "Custom range" && (
          <div className="flex flex-wrap items-center justify-end gap-2.5 pt-2 border-t border-gray-100 text-xs">
            <div className="flex items-center gap-1.5 text-gray-500 mr-auto text-[11px] font-medium">
              <Calendar size={13} className="text-emerald-700" />
              <span>Select filing window:</span>
            </div>

            <div className="flex items-center gap-1.5">
              <label className="text-gray-500 text-[10px] font-bold">
                FROM:
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-gray-50 border border-gray-300 rounded px-2 py-0.5 text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-emerald-600"
              />
            </div>

            <div className="flex items-center gap-1.5">
              <label className="text-gray-500 text-[10px] font-bold">TO:</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-gray-50 border border-gray-300 rounded px-2 py-0.5 text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-emerald-600"
              />
            </div>

            {(startDate || endDate) && (
              <button
                type="button"
                onClick={() => {
                  setStartDate("");
                  setEndDate("");
                  setCurrentPage(1);
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

      {/* FULL-WIDTH REPORTS LIST WITH CRISP BORDERS */}
      <div className="bg-white rounded-xl border border-gray-900/30 shadow-xs overflow-hidden">
        {loading && (
          <div className="flex flex-col items-center justify-center p-12 text-sm text-gray-400">
            <LoaderCircle
              size={24}
              className="animate-spin text-emerald-700 mb-2"
            />
            <span>Loading verified legal summaries...</span>
          </div>
        )}

        {!loading && filteredReports.length === 0 && (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <FileBarChart size={32} className="text-gray-400 mb-2" />
            <p className="text-sm font-semibold text-gray-700">
              No reports matched your query
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Try resetting your date interval or region filter.
            </p>
          </div>
        )}

        {!loading && filteredReports.length > 0 && (
          <div className="divide-y divide-gray-900/15">
            {paginatedReports.map((report) => (
              <div
                key={report._id || report.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-5 py-4 transition hover:bg-gray-50/80"
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800">
                    <FileText size={17} />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h2 className="truncate text-sm font-bold text-gray-900 leading-tight">
                        {report.title}
                      </h2>
                      <span className="inline-block px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-gray-100 text-gray-600">
                        {report.classification}
                      </span>
                    </div>

                    <p className="mt-1 font-mono text-xs text-gray-500">
                      <span className="font-semibold text-gray-800">
                        {report.alerts} incidents logged
                      </span>
                      <span className="mx-2 text-gray-300">•</span>
                      <span>Region: {report.region}</span>
                      <span className="mx-2 text-gray-300">•</span>
                      <span>{report.date}</span>
                    </p>

                    <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-gray-400">
                      <ShieldCheck size={12} className="text-emerald-700" />
                      <span>Authorized by {report.officer}</span>
                      <span className="text-gray-300">/</span>
                      <span className="font-mono text-[10px]">
                        ID: {report.reportId}
                      </span>
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => downloadReport(report)}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-gray-700 shadow-xs transition hover:border-emerald-700 hover:text-emerald-800 self-end sm:self-center"
                >
                  <Download size={13} className="text-gray-500" />
                  Download PDF
                </button>
              </div>
            ))}
          </div>
        )}

        {/* 10-ITEM PAGINATION SWITCHER */}
        {!loading && filteredReports.length > 0 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-900/15 text-xs text-gray-500 bg-gray-50/70">
            <span>
              Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
              {Math.min(currentPage * itemsPerPage, filteredReports.length)} of{" "}
              {filteredReports.length} reports
            </span>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="p-1 border border-gray-300 rounded hover:bg-white disabled:opacity-40"
              >
                <ChevronLeft size={14} />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <button
                    key={page}
                    type="button"
                    onClick={() => setCurrentPage(page)}
                    className={`px-2.5 py-1 text-xs font-semibold rounded ${
                      currentPage === page
                        ? "bg-[#1b4332] text-white"
                        : "border border-gray-300 hover:bg-white text-gray-700"
                    }`}
                  >
                    {page}
                  </button>
                ),
              )}

              <button
                type="button"
                onClick={() =>
                  setCurrentPage((p) => Math.min(p + 1, totalPages))
                }
                disabled={currentPage === totalPages}
                className="p-1 border border-gray-300 rounded hover:bg-white disabled:opacity-40"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Reports;
