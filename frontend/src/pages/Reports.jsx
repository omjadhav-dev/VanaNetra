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

// Approximate regional coordinates, used to geotag evidence entries.
const REGION_COORDS = {
  "Western Ghats Reserve": [15.2993, 74.124],
  "Kaziranga Corridor": [26.5775, 93.1714],
  "Sundarbans Delta": [21.9497, 88.9468],
  "Nilgiri Biosphere": [11.4102, 76.695],
  "Bandhavgarh Belt": [23.7143, 80.9407],
};

// Evidence entries backing each generated report. In production these
// would be pulled from the Alerts collection filtered by region/date range.
const buildEvidence = (region) => {
  const pool = [
    { region: "Western Ghats Reserve", loss: 22.58, area: 959.6, confidence: 97, severity: "Critical", status: "Verified" },
    { region: "Western Ghats Reserve", loss: 6.89, area: 292.8, confidence: 91, severity: "Medium", status: "Pending" },
    { region: "Kaziranga Corridor", loss: 17.0, area: 697, confidence: 88, severity: "High", status: "Verified" },
    { region: "Sundarbans Delta", loss: 9.0, area: 369, confidence: 84, severity: "High", status: "Pending" },
    { region: "Nilgiri Biosphere", loss: 4.0, area: 164, confidence: 76, severity: "Medium", status: "Resolved" },
    { region: "Bandhavgarh Belt", loss: 1.8, area: 74, confidence: 80, severity: "Low", status: "Resolved" },
  ];

  const filtered = region === "All regions" ? pool : pool.filter((e) => e.region === region);

  return filtered.map((entry, idx) => {
    const [lat, lng] = REGION_COORDS[entry.region];
    return {
      ...entry,
      id: `EV-${String(idx + 1).padStart(3, "0")}`,
      lat: (lat + idx * 0.01).toFixed(5),
      lng: (lng + idx * 0.01).toFixed(5),
    };
  });
};

const initialReports = [
  {
    id: "VN-2026-081",
    title: "Western Ghats Reserve — Forest Loss Alert Report",
    region: "Western Ghats Reserve",
    alerts: 12,
    date: "8/8/2026, 1:28:41 PM",
    officer: "R. Deshmukh",
    designation: "Monitoring Officer, Western Zone",
  },
  {
    id: "VN-2026-080",
    title: "All Regions — Forest Loss Alert Report",
    region: "All regions",
    alerts: 45,
    date: "8/8/2026, 1:28:26 PM",
    officer: "A. Iyer",
    designation: "Senior Monitoring Officer",
  },
  {
    id: "VN-2026-079",
    title: "All Regions — Forest Loss Alert Report",
    region: "All regions",
    alerts: 43,
    date: "8/8/2026, 1:18:26 PM",
    officer: "A. Iyer",
    designation: "Senior Monitoring Officer",
  },
];

function Reports() {
  const [reports, setReports] = useState(initialReports);
  const [region, setRegion] = useState("All regions");
  const [notice, setNotice] = useState("");
  const [generating, setGenerating] = useState(false);

  const filteredReports = useMemo(() => {
    if (region === "All regions") {
      return reports;
    }

    return reports.filter((report) => report.region === region);
  }, [reports, region]);

  /*
   * Generates a professional, legal-grade PDF report: letterhead,
   * executive summary, methodology, a geotagged evidence table with
   * per-alert coordinates/severity/confidence/status, and an officer
   * certification/signature block — suitable for enforcement handoff.
   */
  const downloadReport = (report) => {
    const evidence = buildEvidence(report.region);
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 48;
    let y = 56;

    // LETTERHEAD
    doc.setFillColor(6, 95, 70); // emerald-800
    doc.rect(0, 0, pageWidth, 6, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(15, 23, 22);
    doc.text("VANA-NETRA", margin, y);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(90, 100, 96);
    doc.text("Geospatial Deforestation Monitoring & Reporting Platform", margin, y + 14);

    doc.setFontSize(10);
    doc.setTextColor(15, 23, 22);
    doc.text("FOREST LOSS ALERT REPORT", pageWidth - margin, y, { align: "right" });
    doc.setFontSize(9);
    doc.setTextColor(90, 100, 96);
    doc.text(`Report ID: ${report.id}`, pageWidth - margin, y + 14, { align: "right" });

    y += 34;
    doc.setDrawColor(219, 228, 222);
    doc.line(margin, y, pageWidth - margin, y);
    y += 24;

    // METADATA TABLE
    const meta = [
      ["Region / scope", report.region],
      ["Reporting period", "Rolling 30-day monitoring window"],
      ["Alerts included", String(report.alerts)],
      ["Generated", report.date],
      ["Prepared by", `${report.officer} — ${report.designation}`],
      ["Classification", "Restricted — Official use / enforcement reference"],
    ];

    doc.setFontSize(10);
    meta.forEach(([label, value]) => {
      doc.setFont("helvetica", "bold");
      doc.setTextColor(70, 82, 76);
      doc.text(`${label}:`, margin, y);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(15, 23, 22);
      doc.text(String(value), margin + 140, y);
      y += 16;
    });

    y += 12;

    // EXECUTIVE SUMMARY
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 22);
    doc.text("Executive Summary", margin, y);
    y += 16;

    const totalArea = evidence.reduce((s, e) => s + e.area, 0).toFixed(1);
    const avgLoss = (evidence.reduce((s, e) => s + e.loss, 0) / Math.max(evidence.length, 1)).toFixed(2);
    const criticalCount = evidence.filter((e) => e.severity === "Critical").length;

    const summaryText =
      `This report summarizes ${evidence.length} deforestation alert${evidence.length === 1 ? "" : "s"} ` +
      `detected across ${report.region === "All regions" ? "all monitored regions" : report.region} during the ` +
      `reporting period, derived from automated satellite change-detection analysis. A cumulative affected area of ` +
      `${totalArea} hectares was identified, with an average estimated canopy loss of ${avgLoss}% per alert. ` +
      `${criticalCount} alert${criticalCount === 1 ? "" : "s"} ${criticalCount === 1 ? "was" : "were"} classified as ` +
      `Critical severity and warrant immediate field verification. Each entry below includes geotagged coordinates, ` +
      `model confidence, and current workflow status to support prioritized enforcement action.`;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(50, 60, 56);
    const summaryLines = doc.splitTextToSize(summaryText, pageWidth - margin * 2);
    doc.text(summaryLines, margin, y);
    y += summaryLines.length * 13 + 16;

    // METHODOLOGY
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 22);
    doc.text("Methodology", margin, y);
    y += 16;

    const methodText =
      "Satellite imagery is classified using a land-cover segmentation model, and change detection is performed " +
      "by comparing sequential imagery of the same coordinates. Severity is derived from percentage canopy loss " +
      "(Critical \u2265 18%, High \u2265 10%, Medium \u2265 4%, Low < 4%), and each detection carries a model confidence " +
      "score. Alerts above the configured threshold are escalated and tracked through a five-stage review workflow " +
      "(Pending \u2192 Under Review \u2192 Verified \u2192 Action Taken \u2192 Resolved), with every transition timestamped " +
      "and attributed to the acting officer for audit purposes.";

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(50, 60, 56);
    const methodLines = doc.splitTextToSize(methodText, pageWidth - margin * 2);
    doc.text(methodLines, margin, y);
    y += methodLines.length * 13 + 20;

    // EVIDENCE TABLE
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 22);
    doc.text("Geotagged Evidence Log", margin, y);
    y += 14;

    const colX = [margin, margin + 60, margin + 190, margin + 260, margin + 320, margin + 390, margin + 450];
    const headers = ["ID", "Region", "Coordinates", "Loss %", "Area (ha)", "Conf.", "Status"];

    const drawTableHeader = () => {
      doc.setFillColor(240, 244, 241);
      doc.rect(margin, y - 10, pageWidth - margin * 2, 18, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(70, 82, 76);
      headers.forEach((h, i) => doc.text(h, colX[i], y + 2));
      y += 18;
    };

    drawTableHeader();

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);

    evidence.forEach((e) => {
      if (y > 760) {
        doc.addPage();
        y = 56;
        drawTableHeader();
      }

      doc.setTextColor(15, 23, 22);
      doc.text(e.id, colX[0], y);
      doc.text(e.region, colX[1], y, { maxWidth: 125 });
      doc.text(`${e.lat}, ${e.lng}`, colX[2], y);
      doc.text(`${e.loss}%`, colX[3], y);
      doc.text(String(e.area), colX[4], y);
      doc.text(`${e.confidence}%`, colX[5], y);
      doc.text(e.status, colX[6], y);
      y += 16;
    });

    y += 20;

    // CERTIFICATION / SIGN-OFF
    if (y > 700) {
      doc.addPage();
      y = 56;
    }

    doc.setDrawColor(219, 228, 222);
    doc.line(margin, y, pageWidth - margin, y);
    y += 24;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 22);
    doc.text("Officer Certification", margin, y);
    y += 16;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(50, 60, 56);
    const certText =
      `I certify that the data contained in this report was generated by the VanaNetra monitoring system from ` +
      `satellite imagery and reflects the alert records as of the generation timestamp above. This document may be ` +
      `used to support field verification and enforcement proceedings.`;
    const certLines = doc.splitTextToSize(certText, pageWidth - margin * 2);
    doc.text(certLines, margin, y);
    y += certLines.length * 12 + 30;

    doc.line(margin, y, margin + 200, y);
    doc.line(pageWidth - margin - 200, y, pageWidth - margin, y);
    y += 12;
    doc.setFontSize(9);
    doc.text(`${report.officer}`, margin, y);
    doc.text("Date: _______________", pageWidth - margin - 200, y);
    y += 12;
    doc.setTextColor(120, 130, 126);
    doc.text(report.designation, margin, y);
    doc.text("Digital / physical signature", pageWidth - margin - 200, y);

    // FOOTER on every page
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 160, 155);
      doc.text(
        `VanaNetra · Confidential monitoring report · Page ${i} of ${pageCount}`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 24,
        { align: "center" }
      );
    }

    doc.save(`${report.id}.pdf`);

    setNotice("Report downloaded.");
    window.setTimeout(() => setNotice(""), 1800);
  };

  const generateReport = () => {
    setGenerating(true);

    window.setTimeout(() => {
      const evidence = buildEvidence(region);

      const newReport = {
        id: `VN-2026-${String(reports.length + 82).padStart(3, "0")}`,

        title:
          region === "All regions"
            ? "All Regions — Forest Loss Alert Report"
            : `${region} — Forest Loss Alert Report`,

        region,

        alerts: evidence.length,

        date: new Date().toLocaleString("en-IN"),

        officer: "You (current officer)",
        designation: "Monitoring Officer",
      };

      setReports((current) => [newReport, ...current]);

      setGenerating(false);

      setNotice("Report generated successfully.");

      window.setTimeout(() => {
        setNotice("");
      }, 1800);
    }, 700);
  };

  return (
    /*
      h-full + min-h-0 + overflow-hidden
      keeps the Reports page inside the dashboard viewport.
    */
    <div className="h-full min-h-0 overflow-hidden bg-[#f6f9f7] px-5 py-5 lg:px-7">
      <div className="mx-auto flex h-full min-h-0 max-w-[1390px] flex-col">
        {/* HEADER */}
        <div className="flex shrink-0 items-start justify-between gap-5">
          <div>
            <h1 className="text-[34px] font-semibold leading-tight tracking-tight text-gray-900">
              Reports
            </h1>

            <p className="mt-2 text-[15px] text-gray-500">
              Generate legal-grade PDF alert summaries with geotagged evidence
            </p>
          </div>

          {/* GENERATE REPORT */}
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

        {/* NOTIFICATION */}
        {notice && (
          <div className="fixed right-5 top-5 z-[60] rounded-lg border border-emerald-200 bg-[#ecfdf5] px-4 py-2.5 text-sm text-emerald-700 shadow-xl">
            {notice}
          </div>
        )}

        {/* REGION FILTERS */}
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

        {/* REPORT LIST */}
        <div className="mt-5 min-h-0 w-full max-w-[1050px] flex-1 overflow-hidden rounded-lg border border-[#dbe4de] bg-white">
          <div className="h-full min-h-0 overflow-y-auto overflow-x-hidden">
            {filteredReports.map((report) => (
              <div
                key={report.id}
                className="flex min-h-[64px] items-center justify-between gap-5 border-b border-[#f0f4f1] px-5 py-4 transition last:border-0 hover:bg-[#f7faf8]"
              >
                {/* REPORT INFORMATION */}
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

                {/* DOWNLOAD */}
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

            {/* EMPTY STATE */}
            {filteredReports.length === 0 && (
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
