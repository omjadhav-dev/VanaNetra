import { useMemo, useState } from "react";
import { Download, FilePlus2, LoaderCircle } from "lucide-react";

const regions = [
  "All regions",
  "Bandhavgarh Belt",
  "Kaziranga Corridor",
  "Nilgiri Biosphere",
  "Sundarbans Delta",
  "Western Ghats Reserve",
];

const initialReports = [
  {
    id: "FW-2026-081",
    title: "Western Ghats Reserve — forest loss alert report",
    region: "Western Ghats Reserve",
    alerts: 12,
    date: "8/8/2026, 1:28:41 PM",
  },
  {
    id: "FW-2026-080",
    title: "All regions — forest loss alert report",
    region: "All regions",
    alerts: 45,
    date: "8/8/2026, 1:28:26 PM",
  },
  {
    id: "FW-2026-079",
    title: "All regions — forest loss alert report",
    region: "All regions",
    alerts: 43,
    date: "8/8/2026, 1:18:26 PM",
  },
  {
    id: "FW-2026-078",
    title: "All regions — forest loss alert report",
    region: "All regions",
    alerts: 43,
    date: "8/8/2026, 1:16:46 PM",
  },
  {
    id: "FW-2026-077",
    title: "All regions — forest loss alert report",
    region: "All regions",
    alerts: 42,
    date: "8/8/2026, 1:14:44 PM",
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
   * Creates a simple downloadable report.
   *
   * If you already have jsPDF installed, this function can
   * be replaced with a real PDF generator.
   */
  const downloadReport = (report) => {
    const content = [
      "FORESTWATCH",
      "FOREST LOSS ALERT REPORT",
      "",
      `Report ID: ${report.id}`,
      `Region: ${report.region}`,
      `Alerts: ${report.alerts}`,
      `Generated: ${report.date}`,
      "",
      "ForestWatch satellite monitoring report.",
    ].join("\n");

    const blob = new Blob([content], {
      type: "text/plain",
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `${report.id}.txt`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);

    setNotice("Report downloaded.");

    window.setTimeout(() => {
      setNotice("");
    }, 1800);
  };

  const generateReport = () => {
    setGenerating(true);

    window.setTimeout(() => {
      const newReport = {
        id: `FW-2026-${String(reports.length + 82).padStart(3, "0")}`,

        title:
          region === "All regions"
            ? "All regions — forest loss alert report"
            : `${region} — forest loss alert report`,

        region,

        alerts:
          region === "All regions" ? 45 : Math.floor(Math.random() * 20) + 5,

        date: new Date().toLocaleString("en-IN"),
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
    <div className="h-full min-h-0 overflow-hidden px-5 py-5 lg:px-7">
      <div className="mx-auto flex h-full min-h-0 max-w-[1390px] flex-col">
        {/* HEADER */}
        <div className="flex shrink-0 items-start justify-between gap-5">
          <div>
            <h1 className="text-[34px] font-semibold leading-tight tracking-tight text-white">
              Reports
            </h1>

            <p className="mt-2 text-[15px] text-gray-500">
              Generate and download PDF alert summaries
            </p>
          </div>

          {/* GENERATE REPORT */}
          <button
            type="button"
            onClick={generateReport}
            disabled={generating}
            className="
              inline-flex
              shrink-0
              items-center
              gap-2
              rounded-full
              bg-emerald-700
              px-5
              py-2.5
              text-sm
              font-semibold
              text-white
              transition
              hover:bg-emerald-600
              disabled:cursor-not-allowed
              disabled:opacity-60
            "
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
          <div
            className="
              fixed
              right-5
              top-5
              z-[60]
              rounded-lg
              border
              border-emerald-800
              bg-[#10251b]
              px-4
              py-2.5
              text-sm
              text-emerald-300
              shadow-xl
            "
          >
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
              className={`
                rounded-full
                border
                px-3
                py-1.5
                text-xs
                transition
                ${
                  region === item
                    ? "border-emerald-700 bg-emerald-700 text-white"
                    : "border-[#26342c] text-gray-500 hover:border-[#496255] hover:text-white"
                }
              `}
            >
              {item}
            </button>
          ))}
        </div>

        {/* REPORT LIST */}
        <div
          className="
    mt-5
    min-h-0
    flex-1
    w-full
    max-w-[1050px]
    overflow-hidden
    rounded-lg
    border
    border-[#26342c]
    bg-[#101713]
  "
        >
          <div className="h-full min-h-0 overflow-y-auto overflow-x-hidden">
            {filteredReports.map((report) => (
              <div
                key={report.id}
                className="
                  flex
                  min-h-[50px]
                  items-center
                  justify-between
                  gap-5
                  border-b
                  border-[#202b25]
                  px-5
                  py-4
                  transition
                  last:border-0
                  hover:bg-[#141c17]
                "
              >
                {/* REPORT INFORMATION */}
                <div className="min-w-0">
                  <h2 className="truncate text-[15px] font-semibold text-gray-200">
                    {report.title}
                  </h2>

                  <p className="mt-1.5 font-mono text-[13px] text-gray-500">
                    {report.alerts} alerts
                    <span className="mx-2 text-gray-700">•</span>
                    {report.date}
                  </p>
                </div>

                {/* DOWNLOAD */}
                <button
                  type="button"
                  onClick={() => downloadReport(report)}
                  className="
                    inline-flex
                    shrink-0
                    items-center
                    gap-2
                    rounded-full
                    border
                    border-[#304037]
                    px-4
                    py-2
                    text-xs
                    text-gray-300
                    transition
                    hover:border-emerald-700
                    hover:bg-[#141c17]
                    hover:text-white
                  "
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
