import { useRef, useState, useEffect } from "react";
import { api } from "../lib/api";
import { Link, useLocation } from "react-router-dom";
import {
  UploadCloud,
  GitCompareArrows,
  FileImage,
  X,
  CheckCircle2,
  LoaderCircle,
  Images,
  Leaf,
  AlertTriangle,
  Download,
  TreePine,
  BarChart3,
  Target,
  Satellite,
  Layers,
  ShieldCheck,
  RotateCcw,
} from "lucide-react";
import ZoneMonitor from "../components/ZoneMonitor";

function severityColor(pct) {
  if (pct > 30) return "text-rose-600";
  if (pct > 15) return "text-amber-600";
  if (pct > 5) return "text-amber-500";
  return "text-emerald-600";
}

function severityBadge(pct) {
  if (pct > 30) return "bg-rose-100 text-rose-800 border-rose-200";
  if (pct > 15) return "bg-amber-100 text-amber-800 border-amber-200";
  if (pct > 5) return "bg-yellow-100 text-yellow-800 border-yellow-200";
  return "bg-emerald-100 text-emerald-800 border-emerald-200";
}

function severityLabel(pct) {
  if (pct > 30) return "Critical";
  if (pct > 15) return "High";
  if (pct > 5) return "Medium";
  return "Low";
}

export default function Analyze() {
  const location = useLocation();
  const isOfficial = location.pathname.startsWith("/dashboard");

  const [mode, setMode] = useState("landcover");
  const [region, setRegion] = useState("");
  const [availableRegions, setAvailableRegions] = useState([]);

  // Single mode
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);

  // Compare mode
  const [beforeImage, setBeforeImage] = useState(null);
  const [beforePreview, setBeforePreview] = useState(null);
  const [afterImage, setAfterImage] = useState(null);
  const [afterPreview, setAfterPreview] = useState(null);

  // Result overlay toggle: 'overlay' | 'raw_after' | 'raw_before'
  const [activeImageView, setActiveImageView] = useState("overlay");

  const [status, setStatus] = useState("idle");
  const [result, setResult] = useState(null);
  const [alertId, setAlertId] = useState(null);
  const [reportStatus, setReportStatus] = useState("idle");

  const fileInputRef = useRef(null);
  const beforeInputRef = useRef(null);
  const afterInputRef = useRef(null);

  // 1. Fetch dynamic regions from database
  useEffect(() => {
    api("/regions")
      .then((res) => {
        const raw = Array.isArray(res) ? res : res.regions || [];
        const names = raw.map((r) => (typeof r === "string" ? r : r.name)).filter(Boolean);
        setAvailableRegions(Array.from(new Set(names)));
      })
      .catch(() => {
        setAvailableRegions([
          "Sundarbans Delta",
          "Kaziranga Corridor",
          "Nilgiri Biosphere",
          "Bandhavgarh Belt",
          "Western Ghats Reserve",
        ]);
      });
  }, []);

  const handleFile = (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setStatus("error");
      setResult({ message: "Please upload a valid PNG or JPEG satellite image." });
      return;
    }
    if (preview) URL.revokeObjectURL(preview);
    setImage(file);
    setPreview(URL.createObjectURL(file));
    setResult(null);
    setStatus("idle");
  };

  const handleComparisonFile = (file, side) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setStatus("error");
      setResult({ message: "Please upload a valid PNG or JPEG satellite image." });
      return;
    }
    const url = URL.createObjectURL(file);
    if (side === "before") {
      if (beforePreview) URL.revokeObjectURL(beforePreview);
      setBeforeImage(file);
      setBeforePreview(url);
    } else {
      if (afterPreview) URL.revokeObjectURL(afterPreview);
      setAfterImage(file);
      setAfterPreview(url);
    }
    setResult(null);
    setStatus("idle");
  };

  const clearSingle = (e) => {
    e?.stopPropagation();
    if (preview) URL.revokeObjectURL(preview);
    setImage(null);
    setPreview(null);
    setResult(null);
    setStatus("idle");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const clearCompare = (side, e) => {
    e?.stopPropagation();
    if (side === "before") {
      if (beforePreview) URL.revokeObjectURL(beforePreview);
      setBeforeImage(null);
      setBeforePreview(null);
      if (beforeInputRef.current) beforeInputRef.current.value = "";
    } else {
      if (afterPreview) URL.revokeObjectURL(afterPreview);
      setAfterImage(null);
      setAfterPreview(null);
      if (afterInputRef.current) afterInputRef.current.value = "";
    }
    setResult(null);
    setStatus("idle");
  };

  const handleAnalyze = async () => {
    if (mode === "landcover" && !image) return;
    if (mode === "change" && (!beforeImage || !afterImage)) return;

    setStatus("analyzing");
    setResult(null);
    setReportStatus("idle");
    setAlertId(null);

    try {
      const form = new FormData();
      form.append("mode", mode);
      if (region) form.append("region", region);
      if (image) form.append("image", image);
      if (beforeImage) form.append("before", beforeImage);
      if (afterImage) form.append("after", afterImage);

      const data = await api("/analysis", {
        method: "POST",
        body: form,
        form: true,
      });

      setResult(data.result);
      setAlertId(data.alertId || null);
      setActiveImageView("overlay");
      setStatus("done");
    } catch (e) {
      setStatus("error");
      setResult({
        message: e.message || "Semantic segmentation inference failed. Confirm AI engine is active on port 5001.",
      });
    }
  };

  const handleGenerateReport = async () => {
    if (!result) return;
    setReportStatus("generating");
    try {
      const payload = {
        classification: "Restricted",
        analysisResult: result,
        alertId,
        periodStart: new Date(Date.now() - 30 * 86400000).toISOString(),
        periodEnd: new Date().toISOString(),
      };

      const data = await api("/reports/generate", {
        method: "POST",
        body: payload,
      });

      const blob = await api(`/reports/${data.report._id}/download`);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${data.report.reportId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      setReportStatus("done");
    } catch (err) {
      console.error(err);
      setReportStatus("error");
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#f7f8f4] text-gray-900 font-sans p-6 md:p-8 space-y-5">
      
      {/* 1. HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          {!isOfficial && (
            <Link to="/" className="mb-3 inline-flex items-center gap-2 text-emerald-800 font-bold text-sm">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-700 text-white">
                <Leaf size={14} />
              </span>
              VanaNetra Public Portal
            </Link>
          )}
          <h1 className="text-[28px] font-bold tracking-tight text-gray-900 leading-tight">
            Satellite Semantic Analysis
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Classify canopy composition or run dual-temporal change detection to measure deforestation clusters
          </p>
        </div>

        {/* AI Model Status Tag */}
        <div className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-xs">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>SegFormer-B4: Online</span>
        </div>
      </div>

      {/* 2. MODE & SCOPE TOOLBAR */}
      <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        {/* Mode Selector Tabs */}
        <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-lg text-xs font-medium">
          {[
            { id: "landcover", label: "Land Cover", icon: UploadCloud },
            { id: "change", label: "Change Detection", icon: GitCompareArrows },
            ...(isOfficial ? [{ id: "zone-monitor", label: "Zone Monitor", icon: Satellite }] : []),
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => {
                setMode(id);
                setResult(null);
                setStatus("idle");
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md transition ${
                mode === id
                  ? "bg-[#1b4332] text-white font-bold shadow-xs"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>

        {/* Right: Dynamic Region Dropdown */}
        {mode !== "zone-monitor" && (
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-gray-600">Assigned Reserve:</label>
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="text-xs font-medium bg-gray-50 border border-gray-300 rounded-lg px-3 py-1.5 text-gray-800 hover:border-gray-400 focus:outline-none focus:ring-1 focus:ring-emerald-600"
            >
              <option value="">Auto-Detect from Coordinates</option>
              {availableRegions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* ZONE MONITOR TAB */}
      {mode === "zone-monitor" && isOfficial && (
        <div className="rounded-xl border border-gray-900/30 bg-white p-5 shadow-xs">
          <ZoneMonitor />
        </div>
      )}

      {/* WORKSPACE GRID: INPUTS & OUTPUTS */}
      {mode !== "zone-monitor" && (
        <div className="grid gap-5 lg:grid-cols-12 items-start">
          
          {/* LEFT: FILE UPLOAD CONTAINER (5 Columns) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="rounded-xl border border-gray-900/30 bg-white p-4 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
                <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-gray-600">
                  {mode === "landcover" ? "Target Raster Input" : "Dual-Temporal Rasters"}
                </h3>
                <span className="text-[11px] text-gray-400">PNG / JPEG Supported</span>
              </div>

              {/* Single Land Cover Upload */}
              {mode === "landcover" && (
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    handleFile(e.dataTransfer.files?.[0]);
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  className="relative flex min-h-[260px] cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-dashed border-gray-300 bg-gray-50/70 transition hover:border-emerald-600 hover:bg-gray-50"
                >
                  {preview ? (
                    <>
                      <img src={preview} alt="Target" className="absolute inset-0 h-full w-full object-cover" />
                      <div className="absolute inset-0 bg-black/25" />
                      <div className="absolute bottom-0 inset-x-0 bg-black/75 px-3 py-2 text-white flex items-center justify-between backdrop-blur-xs">
                        <span className="truncate text-xs font-mono">{image?.name}</span>
                        <button
                          type="button"
                          onClick={clearSingle}
                          className="p-1 rounded-full bg-white/20 hover:bg-white/40 text-white"
                        >
                          <X size={13} />
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="text-center p-6">
                      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-800">
                        <UploadCloud size={22} />
                      </div>
                      <p className="text-sm font-semibold text-gray-800">Upload Satellite Scene</p>
                      <p className="text-xs text-gray-400 mt-1">Drag and drop or browse local files</p>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/jpg"
                    onChange={(e) => handleFile(e.target.files?.[0])}
                    className="hidden"
                  />
                </div>
              )}

              {/* Dual Change Detection Upload */}
              {mode === "change" && (
                <div className="grid gap-3 sm:grid-cols-2">
                  {/* Before Box */}
                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      handleComparisonFile(e.dataTransfer.files?.[0], "before");
                    }}
                    onClick={() => beforeInputRef.current?.click()}
                    className="relative flex min-h-[200px] cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-dashed border-gray-300 bg-gray-50/70 transition hover:border-emerald-600"
                  >
                    {beforePreview ? (
                      <>
                        <img src={beforePreview} alt="Before" className="absolute inset-0 h-full w-full object-cover" />
                        <span className="absolute left-2.5 top-2.5 rounded bg-black/60 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white backdrop-blur-xs">
                          T1 Baseline
                        </span>
                        <button
                          type="button"
                          onClick={(e) => clearCompare("before", e)}
                          className="absolute right-2 top-2 p-1 rounded-full bg-black/50 text-white hover:bg-black/75"
                        >
                          <X size={12} />
                        </button>
                        <div className="absolute bottom-0 inset-x-0 bg-black/70 px-2.5 py-1 text-[10px] text-white truncate font-mono">
                          {beforeImage?.name}
                        </div>
                      </>
                    ) : (
                      <div className="text-center p-3">
                        <Images size={20} className="mx-auto text-gray-400 mb-1" />
                        <p className="text-xs font-semibold text-gray-700">T1 Baseline Image</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">Prior date sweep</p>
                      </div>
                    )}
                    <input
                      ref={beforeInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/jpg"
                      onChange={(e) => handleComparisonFile(e.target.files?.[0], "before")}
                      className="hidden"
                    />
                  </div>

                  {/* After Box */}
                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      handleComparisonFile(e.dataTransfer.files?.[0], "after");
                    }}
                    onClick={() => afterInputRef.current?.click()}
                    className="relative flex min-h-[200px] cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-dashed border-gray-300 bg-gray-50/70 transition hover:border-emerald-600"
                  >
                    {afterPreview ? (
                      <>
                        <img src={afterPreview} alt="After" className="absolute inset-0 h-full w-full object-cover" />
                        <span className="absolute left-2.5 top-2.5 rounded bg-black/60 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white backdrop-blur-xs">
                          T2 Current
                        </span>
                        <button
                          type="button"
                          onClick={(e) => clearCompare("after", e)}
                          className="absolute right-2 top-2 p-1 rounded-full bg-black/50 text-white hover:bg-black/75"
                        >
                          <X size={12} />
                        </button>
                        <div className="absolute bottom-0 inset-x-0 bg-black/70 px-2.5 py-1 text-[10px] text-white truncate font-mono">
                          {afterImage?.name}
                        </div>
                      </>
                    ) : (
                      <div className="text-center p-3">
                        <Images size={20} className="mx-auto text-gray-400 mb-1" />
                        <p className="text-xs font-semibold text-gray-700">T2 Recent Image</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">Subsequent pass</p>
                      </div>
                    )}
                    <input
                      ref={afterInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/jpg"
                      onChange={(e) => handleComparisonFile(e.target.files?.[0], "after")}
                      className="hidden"
                    />
                  </div>
                </div>
              )}

              {/* Action Button */}
              <button
                type="button"
                onClick={handleAnalyze}
                disabled={
                  status === "analyzing" ||
                  (mode === "landcover" && !image) ||
                  (mode === "change" && (!beforeImage || !afterImage))
                }
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#1b4332] py-2.5 text-xs font-semibold text-white shadow-xs transition hover:bg-[#2d6a4f] disabled:opacity-50"
              >
                {status === "analyzing" ? (
                  <>
                    <LoaderCircle size={15} className="animate-spin" />
                    Executing Neural Segmentation...
                  </>
                ) : (
                  <>
                    <FileImage size={15} />
                    {mode === "landcover" ? "Classify Vegetation Index" : "Compute Canopy Change Vector"}
                  </>
                )}
              </button>
            </div>
          </div>

          {/* RIGHT: ANALYTICAL RESULTS & DOSSIER (7 Columns) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="rounded-xl border border-gray-900/30 bg-white p-5 shadow-xs space-y-4 min-h-[380px]">
              
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-gray-600">
                    Model Inference Telemetry
                  </h3>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    {status === "done" ? `Completed for ${result?.region || "Assigned Sector"}` : "Awaiting input payload"}
                  </p>
                </div>
                {status === "done" && (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                    <CheckCircle2 size={16} /> Verified Output
                  </span>
                )}
              </div>

              {/* Idle State */}
              {status === "idle" && (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Layers size={36} className="text-gray-300 mb-2" />
                  <p className="text-sm font-semibold text-gray-700">Ready for Inference</p>
                  <p className="text-xs text-gray-400 max-w-sm mt-1">
                    Upload your high-resolution satellite rasters to calculate vegetative canopy health scores.
                  </p>
                </div>
              )}

              {/* Analyzing State */}
              {status === "analyzing" && (
                <div className="space-y-4 py-12">
                  <div className="flex items-center justify-between text-xs font-medium text-emerald-800">
                    <span>Extracting spectral bands...</span>
                    <span>78%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-emerald-100">
                    <div className="h-full w-4/5 animate-pulse rounded-full bg-emerald-700" />
                  </div>
                  <p className="text-center text-xs text-gray-400 font-mono">
                    SegFormer spatial attention weights evaluating pixel variations...
                  </p>
                </div>
              )}

              {/* Error State */}
              {status === "error" && (
                <div className="flex items-start gap-3 rounded-lg border border-rose-200 bg-rose-50 p-4 text-xs text-rose-700">
                  <AlertTriangle size={16} className="shrink-0 mt-0.5 text-rose-600" />
                  <div>
                    <strong className="font-semibold">Analysis Failed</strong>
                    <p className="mt-0.5">{result?.message}</p>
                  </div>
                </div>
              )}

              {/* DONE: CHANGE DETECTION OUTPUT */}
              {status === "done" && result && result.mode === "change" && (
                <div className="space-y-4">
                  
                  {/* Segmentation Viewer with Overlay Toggles */}
                  {result.resultImageB64 && (
                    <div className="overflow-hidden rounded-xl border border-gray-900/25 bg-gray-900">
                      <div className="relative aspect-video w-full bg-black">
                        <img
                          src={
                            activeImageView === "overlay"
                              ? `data:image/png;base64,${result.resultImageB64}`
                              : activeImageView === "raw_after"
                              ? afterPreview
                              : beforePreview
                          }
                          alt="Inference View"
                          className="h-full w-full object-cover"
                        />

                        {/* Interactive Layer Pills on Top of Image */}
                        <div className="absolute top-3 left-3 flex items-center gap-1 bg-black/60 p-1 rounded-lg backdrop-blur-md text-[10px] font-bold">
                          <button
                            type="button"
                            onClick={() => setActiveImageView("overlay")}
                            className={`px-2 py-0.5 rounded transition ${
                              activeImageView === "overlay" ? "bg-rose-600 text-white" : "text-gray-300 hover:text-white"
                            }`}
                          >
                            Deforestation Overlay (AI)
                          </button>
                          <button
                            type="button"
                            onClick={() => setActiveImageView("raw_after")}
                            className={`px-2 py-0.5 rounded transition ${
                              activeImageView === "raw_after" ? "bg-white text-gray-900" : "text-gray-300 hover:text-white"
                            }`}
                          >
                            T2 (Current)
                          </button>
                          <button
                            type="button"
                            onClick={() => setActiveImageView("raw_before")}
                            className={`px-2 py-0.5 rounded transition ${
                              activeImageView === "raw_before" ? "bg-white text-gray-900" : "text-gray-300 hover:text-white"
                            }`}
                          >
                            T1 (Baseline)
                          </button>
                        </div>
                      </div>
                      <div className="bg-gray-50 px-3.5 py-1.5 border-t border-gray-200 text-[11px] text-gray-500 flex justify-between">
                        <span>Red Polygons: Segmented vegetation canopy loss</span>
                        <span className="font-mono">Sensor: Sentinel-2 Multispectral</span>
                      </div>
                    </div>
                  )}

                  {/* Primary Loss Score Banner */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-3.5">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Canopy Loss</p>
                      <p className={`text-2xl font-bold mt-1 ${severityColor(result.lossPercentage)}`}>
                        {result.lossPercentage}%
                      </p>
                      <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${severityBadge(result.lossPercentage)}`}>
                        {severityLabel(result.lossPercentage)} Severity
                      </span>
                    </div>

                    <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-3.5">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Confidence</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">{result.confidence}%</p>
                      <p className="text-[10px] text-emerald-700 font-semibold mt-1.5">Statistical Peak</p>
                    </div>

                    <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-3.5">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Hotspot Clusters</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">{result.spotCount || 1}</p>
                      <p className="text-[10px] text-gray-500 mt-1.5">{result.pixelsLost?.toLocaleString()} px impacted</p>
                    </div>
                  </div>

                  {/* Legal Zone Verification Banner */}
                  {result.legalStatus && (
                    <div
                      className={`rounded-lg border p-3.5 text-xs ${
                        result.legalStatus === "legal"
                          ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                          : result.legalStatus === "illegal"
                          ? "border-rose-200 bg-rose-50 text-rose-900"
                          : "border-amber-200 bg-amber-50 text-amber-900"
                      }`}
                    >
                      <div className="flex items-center gap-2 font-bold text-sm">
                        <span>{result.legalStatus === "legal" ? "✅" : result.legalStatus === "illegal" ? "🚨" : "⚠️"}</span>
                        <span>
                          {result.legalStatus === "legal"
                            ? "Permitted Harvest Zone"
                            : result.legalStatus === "illegal"
                            ? "Unsanctioned Encroachment Detected"
                            : "Zone Check Unverified"}
                        </span>
                      </div>
                      <p className="mt-1 text-[11px] opacity-90">
                        {result.legalStatus === "legal"
                          ? `Coordinates coincide with authorized timber plot (${result.legalZone?.name || "Permit Verified"}). No violation flagged.`
                          : result.legalStatus === "illegal"
                          ? "Canopy gap lies outside legal forestry lease boundaries. Automated enforcement alert generated."
                          : "Jurisdiction check unavailable. Queued for regional forest officer verification."}
                      </p>
                    </div>
                  )}

                  {/* Official PDF Generation Action */}
                  {isOfficial && (
                    <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-3.5 flex items-center justify-between gap-4">
                      <div>
                        <p className="text-xs font-bold text-gray-900">Legal Enforcement Dossier</p>
                        <p className="text-[11px] text-gray-500 mt-0.5">
                          Download signed PDF with coordinates, spectral graphs, and satellite evidence
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={handleGenerateReport}
                        disabled={reportStatus === "generating"}
                        className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-[#1b4332] px-3.5 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-[#2d6a4f] disabled:opacity-60"
                      >
                        {reportStatus === "generating" ? (
                          <>
                            <LoaderCircle size={13} className="animate-spin" />
                            Compiling PDF...
                          </>
                        ) : reportStatus === "done" ? (
                          <>
                            <CheckCircle2 size={13} />
                            Report Downloaded
                          </>
                        ) : (
                          <>
                            <Download size={13} />
                            Export Classified PDF
                          </>
                        )}
                      </button>
                    </div>
                  )}

                </div>
              )}

              {/* DONE: LAND COVER OUTPUT */}
              {status === "done" && result && result.mode === "landcover" && (
                <div className="space-y-4">
                  <div className="flex items-center gap-4 rounded-xl border border-gray-200 bg-gray-50/80 p-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800 shrink-0">
                      <BarChart3 size={24} />
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Vegetation Density</p>
                      <p className="text-3xl font-bold text-emerald-800 mt-0.5">{result.vegetationPct}%</p>
                      <p className="text-xs font-semibold text-emerald-700 mt-0.5">{result.classification || "Dense Canopy"}</p>
                    </div>
                  </div>

                  <div className="divide-y divide-gray-100 rounded-lg border border-gray-200 text-xs">
                    <div className="flex justify-between py-2.5 px-3.5">
                      <span className="text-gray-500">Inference Confidence</span>
                      <strong className="text-gray-900">{result.confidence}%</strong>
                    </div>
                    <div className="flex justify-between py-2.5 px-3.5">
                      <span className="text-gray-500">Assigned Region</span>
                      <strong className="text-gray-900">{result.region || "Auto-Bound Sector"}</strong>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>

        </div>
      )}

    </div>
  );
}