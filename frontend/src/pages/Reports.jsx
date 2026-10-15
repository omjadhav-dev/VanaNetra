import { useMemo, useState } from "react";
import { jsPDF } from "jspdf";
import {
  Download,
  FilePlus2,
  LoaderCircle,
  FileText,
  ShieldCheck,
} from "lucide-react";

const regions = [
  "All regions",
  "Bandhavgarh Belt",
  "Kaziranga Corridor",
  "Nilgiri Biosphere",
  "Sundarbans Delta",
  "Western Ghats Reserve",
];

// Converts the real backend Report document into the fields expected by the
// V1 visual component. This is the key UI/logic bridge for this page.
const normalise = (r) => ({
  _id: r._id || r.id,
  id: r._id || r.id || r.reportId,
  reportId: r.reportId || r.id,
  title: r.title,
  region: r.region?.name || r.region || "All regions",
  alerts: r.summary?.totalAlerts ?? r.alerts ?? 0,
  date: r.createdAt ? new Date(r.createdAt).toLocaleString("en-IN") : r.date,
  officer: r.generatedByLabel || r.officer || "—",
  designation: r.designationAtGeneration || r.designation || "Monitoring Officer",
});

function Reports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [region, setRegion] = useState("All regions");
  const [notice, setNotice] = useState("");
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    api("/reports")
      .then((d) => setReports((d.reports || []).map(normalise)))
      .catch(() => setReports([]))
      .finally(() => setLoading(false));
  }, []);

  const filteredReports = useMemo(() => {
    if (region === "All regions") return reports;
    return reports.filter((report) => report.region === region);
  }, [reports, region]);

  const showNotice = (message) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2200);
  };

  // Real report generation. The V1 button/layout stays unchanged; only its
  // implementation is connected to the V2 backend.
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

  // Real PDF download from the backend, instead of the V1 fabricated/static
  // evidence PDF. The visual Download PDF button remains exactly the same.
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

  return (
    <div className="h-full min-h-0 overflow-hidden bg-[#f6f9f7] px-5 py-5 lg:px-7">
      <div className="mx-auto flex h-full min-h-0 max-w-[1390px] flex-col">
        {/* HEADER — V1 UI */}
        <div className="flex shrink-0 items-start justify-between gap-5">
          <div>
            <h1 className="text-[34px] font-semibold leading-tight tracking-tight text-gray-900">
              Reports
            </h1>
            <p className="mt-2 text-[15px] text-gray-500">
              Generate legal-grade PDF alert summaries with geotagged evidence
            </p>
          </div>

          <button
            type="button"
            onClick={generateReport}
            disabled={generating}
            className="inline-flex shrink-0 items-center gap-2 rounded-full bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {generating ? (
              <>
                <LoaderCircle size={17} className="animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <FilePlus2 size={17} />
                Generate report
              </>
            )}
          </button>
        </div>

        {notice && (
          <div className="fixed right-5 top-5 z-[60] flex items-center rounded-lg border border-emerald-200 bg-[#ecfdf5] px-4 py-2.5 text-sm text-emerald-700 shadow-xl">
            {notice}
          </div>
        )}

        {/* REGION FILTERS — V1 UI */}
        <div className="mt-6 flex shrink-0 flex-wrap gap-2.5">
          {regions.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setRegion(item)}
              className={`rounded-full border px-3 py-1.5 text-xs transition ${
                region === item
                  ? "border-emerald-700 bg-emerald-700 text-white"
                  : "border-[#dbe4de] text-gray-500 hover:border-[#8fab9a] hover:text-gray-900"
              }`}
            >
              {item}
            </button>
          ))}
        </div>

        {/* REPORT LIST — V1 UI */}
        <div className="mt-5 min-h-0 w-full max-w-[1050px] flex-1 overflow-hidden rounded-lg border border-[#dbe4de] bg-white">
          <div className="h-full min-h-0 overflow-y-auto overflow-x-hidden">
            {loading && (
              <div className="flex h-full items-center justify-center p-10">
                <LoaderCircle size={20} className="animate-spin text-emerald-600" />
                <span className="ml-2 text-sm text-gray-400">Loading reports...</span>
              </div>
            )}

            {!loading && filteredReports.map((report) => (
              <div
                key={report._id || report.id || report.reportId}
                className="flex min-h-[64px] items-center justify-between gap-5 border-b border-[#f0f4f1] px-5 py-4 transition last:border-0 hover:bg-[#f7faf8]"
              >
                <div className="flex min-w-0 items-start gap-3">
                  <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                    <FileText size={16} />
                  </div>

                  <div className="min-w-0">
                    <h2 className="truncate text-[15px] font-semibold text-gray-800">
                      {report.title}
                    </h2>
                    <p className="mt-1 font-mono text-[13px] text-gray-500">
                      {report.alerts} alerts
                      <span className="mx-2 text-gray-300">•</span>
                      {report.date}
                    </p>
                    <p className="mt-1 flex items-center gap-1.5 text-[11px] text-gray-400">
                      <ShieldCheck size={11} />
                      Prepared by {report.officer}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => downloadReport(report)}
                  className="inline-flex shrink-0 items-center gap-2 rounded-full border border-[#c9d6cd] px-4 py-2 text-xs text-gray-600 transition hover:border-emerald-700 hover:bg-[#f0f4f1] hover:text-gray-900"
                >
                  <Download size={15} />
                  Download PDF
                </button>
              </div>
            ))}

            {!loading && filteredReports.length === 0 && (
              <div className="flex h-full items-center justify-center p-10">
                <p className="text-sm text-gray-500">
                  No reports found for this region.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Reports;
