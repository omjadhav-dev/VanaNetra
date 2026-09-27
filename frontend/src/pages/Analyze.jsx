import { useRef, useState } from "react";
import { api } from "../lib/api";
import { Link, useLocation } from "react-router-dom";
import {
  UploadCloud,
  GitCompareArrows,
  MapPin,
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
} from "lucide-react";

function severityColor(pct) {
  if (pct > 30) return "text-red-600";
  if (pct > 15) return "text-orange-500";
  if (pct > 5) return "text-yellow-600";
  return "text-emerald-600";
}

function severityLabel(pct) {
  if (pct > 30) return "Critical";
  if (pct > 15) return "High";
  if (pct > 5) return "Medium";
  return "Low";
}

function Analyze() {
  const location = useLocation();
  const isOfficial = location.pathname.startsWith("/dashboard");

  const [mode, setMode] = useState("landcover");
  const [region, setRegion] = useState("");

  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);

  const [beforeImage, setBeforeImage] = useState(null);
  const [beforePreview, setBeforePreview] = useState(null);

  const [afterImage, setAfterImage] = useState(null);
  const [afterPreview, setAfterPreview] = useState(null);

  const [status, setStatus] = useState("idle");
  const [result, setResult] = useState(null);
  const [alertId, setAlertId] = useState(null);

  const [reportStatus, setReportStatus] = useState("idle");

  const fileInputRef = useRef(null);
  const beforeInputRef = useRef(null);
  const afterInputRef = useRef(null);

  const regions = [
    "Bandhavgarh Belt",
    "Kaziranga Corridor",
    "Nilgiri Biosphere",
    "Sundarbans Delta",
    "Western Ghats Reserve",
  ];

  const handleFile = (file) => {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setStatus("error");
      setResult({
        message: "Please upload a PNG or JPEG image.",
      });
      return;
    }

    if (preview) {
      URL.revokeObjectURL(preview);
    }

    setImage(file);
    setPreview(URL.createObjectURL(file));
    setResult(null);
    setStatus("idle");
  };

  const handleComparisonFile = (file, side) => {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setStatus("error");
      setResult({
        message: "Please upload a PNG or JPEG image.",
      });
      return;
    }

    const url = URL.createObjectURL(file);

    if (side === "before") {
      if (beforePreview) {
        URL.revokeObjectURL(beforePreview);
      }

      setBeforeImage(file);
      setBeforePreview(url);
    } else {
      if (afterPreview) {
        URL.revokeObjectURL(afterPreview);
      }

      setAfterImage(file);
      setAfterPreview(url);
    }

    setResult(null);
    setStatus("idle");
  };

  const handleDrop = (e, side = "single") => {
    e.preventDefault();

    const file = e.dataTransfer.files?.[0];

    if (side === "single") {
      handleFile(file);
    } else {
      handleComparisonFile(file, side);
    }
  };

  const clearImage = (e) => {
    e?.stopPropagation();

    if (preview) {
      URL.revokeObjectURL(preview);
    }

    setImage(null);
    setPreview(null);
    setResult(null);
    setStatus("idle");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const clearComparisonImage = (side, e) => {
    e?.stopPropagation();

    if (side === "before") {
      if (beforePreview) {
        URL.revokeObjectURL(beforePreview);
      }

      setBeforeImage(null);
      setBeforePreview(null);

      if (beforeInputRef.current) {
        beforeInputRef.current.value = "";
      }
    } else {
      if (afterPreview) {
        URL.revokeObjectURL(afterPreview);
      }

      setAfterImage(null);
      setAfterPreview(null);

      if (afterInputRef.current) {
        afterInputRef.current.value = "";
      }
    }

    setResult(null);
    setStatus("idle");
  };

  const selectMode = (m) => {
    setMode(m);
    setResult(null);
    setStatus("idle");
    setReportStatus("idle");
    setAlertId(null);
  };

  const handleAnalyze = async () => {
    if (mode === "landcover" && !image) {
      return;
    }

    if (mode === "change" && (!beforeImage || !afterImage)) {
      return;
    }

    setStatus("analyzing");
    setResult(null);
    setReportStatus("idle");
    setAlertId(null);

    try {
      const form = new FormData();

      form.append("mode", mode);

      if (region) {
        form.append("region", region);
      }

      if (image) {
        form.append("image", image);
      }

      if (beforeImage) {
        form.append("before", beforeImage);
      }

      if (afterImage) {
        form.append("after", afterImage);
      }

      const data = await api("/analysis", {
        method: "POST",
        body: form,
        form: true,
      });

      setResult(data.result);
      setAlertId(data.alertId || null);
      setStatus("done");
    } catch (e) {
      setStatus("error");

      setResult({
        message:
          e.message || "Analysis failed. Make sure the AI service is running.",
      });
    }
  };

  const handleGenerateReport = async () => {
    if (!result) {
      return;
    }

    setReportStatus("generating");

    try {
      const payload = {
        classification: "Restricted",
        analysisResult: result,
        alertId,
        periodStart: new Date(
          Date.now() - 30 * 86400000
        ).toISOString(),
        periodEnd: new Date().toISOString(),
      };

      const data = await api("/reports/generate", {
        method: "POST",
        body: payload,
      });

      const blob = await api(
        `/reports/${data.report._id}/download`
      );

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = `${data.report.reportId}.pdf`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      window.URL.revokeObjectURL(url);

      setReportStatus("done");
    } catch (error) {
      console.error(error);
      setReportStatus("error");
    }
  };

  const UploadBox = ({
    side,
    file,
    preview: sidePreview,
    inputRef,
  }) => {
    const label =
      side === "before" ? "Before image" : "After image";

    return (
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => handleDrop(e, side)}
        onClick={() => inputRef.current?.click()}
        className="relative flex min-h-[230px] cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-dashed border-[#c9d6cd] bg-white transition hover:border-emerald-600"
      >
        {sidePreview ? (
          <>
            <img
              src={sidePreview}
              alt={label}
              className="absolute inset-0 h-full w-full object-cover"
            />

            <div className="absolute inset-0 bg-black/25" />

            <div className="absolute left-4 top-4 rounded-full border border-white/15 bg-black/55 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-white backdrop-blur">
              {label}
            </div>

            <button
              type="button"
              onClick={(e) =>
                clearComparisonImage(side, e)
              }
              className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-black/55 text-gray-200 hover:bg-white/10"
            >
              <X size={15} />
            </button>

            <div className="absolute bottom-0 left-0 right-0 bg-black/70 px-4 py-3 backdrop-blur">
              <p className="truncate text-xs text-white">
                {file.name}
              </p>
            </div>
          </>
        ) : (
          <div className="px-5 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <UploadCloud size={24} />
            </div>

            <p className="text-base font-medium text-gray-900">
              {label}
            </p>

            <p className="mt-1.5 text-xs text-gray-500">
              Drop or click to upload
            </p>
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/jpg"
          onChange={(e) =>
            handleComparisonFile(
              e.target.files?.[0],
              side
            )
          }
          className="hidden"
        />
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#f6f9f7] px-6 py-10 text-gray-900 sm:py-12">
      <div className="mx-auto max-w-7xl">
        {!isOfficial && (
          <Link to="/" className="mb-6 flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-700">
              <Leaf size={19} className="text-white" />
            </span>

            <span className="font-semibold text-gray-900">
              VanaNetra
            </span>
          </Link>
        )}

        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-600">
          {isOfficial
            ? "Official Analysis Console"
            : "Public Analysis Console"}
        </p>

        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-gray-900 sm:text-5xl">
          Analyze satellite imagery
        </h1>

        <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-500">
          Upload satellite imagery to classify land cover or
          detect deforestation between two dates.
          {isOfficial &&
            " Government officials can generate a downloadable PDF report from any analysis."}
        </p>

        <div className="mt-6 flex flex-wrap gap-2.5">
          {[
            {
              id: "landcover",
              icon: <UploadCloud size={17} />,
              label: "Land cover",
            },
            {
              id: "change",
              icon: <GitCompareArrows size={17} />,
              label: "Change detection",
            },
          ].map(({ id, icon, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => selectMode(id)}
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium transition ${
                mode === id
                  ? "border-emerald-600 bg-emerald-700 text-white"
                  : "border-[#c9d6cd] text-gray-500 hover:border-[#8fab9a] hover:text-gray-900"
              }`}
            >
              {icon}
              {label}
            </button>
          ))}
        </div>

        <div className="mt-7">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-gray-500">
            Region (Optional)
          </p>

          <div className="flex flex-wrap gap-2.5">
            {regions.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() =>
                  setRegion(
                    region === item ? "" : item
                  )
                }
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm transition ${
                  region === item
                    ? "border-emerald-600 bg-emerald-700 text-white"
                    : "border-[#c9d6cd] text-gray-500 hover:border-[#8fab9a] hover:text-gray-900"
                }`}
              >
                <MapPin size={14} />
                {item}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-7 grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            {mode === "landcover" && (
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleDrop(e)}
                onClick={() =>
                  fileInputRef.current?.click()
                }
                className="relative flex min-h-[300px] cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-dashed border-[#c9d6cd] bg-white transition hover:border-emerald-600"
              >
                {preview ? (
                  <>
                    <img
                      src={preview}
                      alt="Satellite"
                      className="absolute inset-0 h-full w-full object-cover"
                    />

                    <div className="absolute inset-0 bg-black/25" />

                    <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between gap-4 bg-black/70 px-4 py-3 backdrop-blur">
                      <p className="truncate text-xs text-white">
                        {image.name}
                      </p>

                      <button
                        type="button"
                        onClick={clearImage}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/20 bg-black/40 text-gray-200 hover:bg-white/10"
                      >
                        <X size={15} />
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="text-center">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                      <UploadCloud size={26} />
                    </div>

                    <p className="text-lg font-medium text-gray-900">
                      Drop a satellite image
                    </p>

                    <p className="mt-1.5 text-sm text-gray-500">
                      Drag & drop or click to browse
                    </p>
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg"
                  onChange={(e) =>
                    handleFile(e.target.files?.[0])
                  }
                  className="hidden"
                />
              </div>
            )}

            {mode === "change" && (
              <div className="rounded-xl border border-[#dbe4de] bg-white p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                      Before / after imagery
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      Upload matching-area images from two dates
                      to detect vegetation loss.
                    </p>
                  </div>

                  <Images
                    size={19}
                    className="text-emerald-600"
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <UploadBox
                    side="before"
                    file={beforeImage}
                    preview={beforePreview}
                    inputRef={beforeInputRef}
                  />

                  <UploadBox
                    side="after"
                    file={afterImage}
                    preview={afterPreview}
                    inputRef={afterInputRef}
                  />
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={handleAnalyze}
              disabled={status === "analyzing"}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-700 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {status === "analyzing" ? (
                <>
                  <LoaderCircle
                    size={17}
                    className="animate-spin"
                  />
                  Running AI inference…
                </>
              ) : (
                <>
                  <FileImage size={17} />

                  {mode === "landcover"
                    ? "Classify land cover"
                    : "Compare before & after"}
                </>
              )}
            </button>
          </div>

          <div className="rounded-xl border border-[#dbe4de] bg-white p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-gray-500">
                  Results
                </p>

                <h2 className="mt-1.5 text-lg font-semibold text-gray-900">
                  {status === "analyzing"
                    ? "Running AI model…"
                    : "Inference output"}
                </h2>
              </div>

              {status === "done" && (
                <CheckCircle2
                  size={20}
                  className="text-emerald-600"
                />
              )}
            </div>

            {status === "idle" && (
              <p className="mt-7 text-sm leading-6 text-gray-500">
                {mode === "change"
                  ? "Upload a before and after image. The AI will highlight vegetation lost between the two dates."
                  : "Upload a satellite image to classify land cover and measure vegetation coverage."}
              </p>
            )}

            {status === "analyzing" && (
              <div className="mt-7 space-y-3">
                <div className="h-2 animate-pulse rounded-full bg-emerald-200" />
                <div className="h-2 w-4/5 animate-pulse rounded-full bg-gray-100" />
                <div className="h-2 w-3/5 animate-pulse rounded-full bg-gray-100" />

                <p className="mt-4 text-xs text-gray-400">
                  SegFormer semantic segmentation in progress…
                </p>
              </div>
            )}

            {status === "error" && (
              <div className="mt-7 flex gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">
                <AlertTriangle
                  size={16}
                  className="mt-0.5 shrink-0"
                />

                {result?.message ||
                  "Analysis failed. Ensure the AI service is running on port 5001."}
              </div>
            )}

            {status === "done" &&
              result &&
              result.mode === "change" && (
                <div className="mt-5 space-y-5">
                  {result.resultImageB64 && (
                    <div className="overflow-hidden rounded-xl border border-[#dbe4de]">
                      <img
                        src={`data:image/png;base64,${result.resultImageB64}`}
                        alt="Deforestation overlay"
                        className="w-full object-cover"
                      />

                      <p className="bg-gray-50 px-3 py-2 text-[10px] text-gray-500">
                        Red overlay = vegetation present before
                        but absent after
                      </p>
                    </div>
                  )}

                  <div className="flex items-start gap-3 rounded-lg border border-[#dbe4de] bg-[#f6f9f7] p-4">
                    <TreePine
                      size={20}
                      className="mt-0.5 shrink-0 text-emerald-600"
                    />

                    <div>
                      <p className="text-xs text-gray-500">
                        Vegetation loss
                      </p>

                      <p
                        className={`text-3xl font-bold ${severityColor(
                          result.lossPercentage
                        )}`}
                      >
                        {result.lossPercentage}%
                      </p>

                      <p
                        className={`mt-0.5 text-xs font-semibold ${severityColor(
                          result.lossPercentage
                        )}`}
                      >
                        {severityLabel(
                          result.lossPercentage
                        )}{" "}
                        severity
                      </p>
                    </div>
                  </div>

                  <div className="divide-y divide-[#dbe4de] rounded-lg border border-[#dbe4de]">
                    {[
                      [
                        "Model confidence",
                        `${result.confidence}%`,
                      ],
                      [
                        "Deforestation clusters",
                        result.spotCount,
                      ],
                      [
                        "Pixels lost",
                        result.pixelsLost?.toLocaleString(),
                      ],
                      ["Region", result.region],
                      [
                        "Before confidence",
                        `${result.beforeConfidence}%`,
                      ],
                      [
                        "After confidence",
                        `${result.afterConfidence}%`,
                      ],
                    ].map(([label, value]) => (
                      <div
                        key={label}
                        className="flex items-center justify-between gap-4 px-4 py-3"
                      >
                        <span className="text-sm text-gray-500">
                          {label}
                        </span>

                        <span className="text-sm font-medium text-gray-800">
                          {value}
                        </span>
                      </div>
                    ))}
                  </div>

                  {result.lostTreeSpots?.length > 0 && (
                    <div>
                      <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                        <Target size={13} />
                        Top deforestation clusters
                      </p>

                      <div className="max-h-40 overflow-y-auto rounded-lg border border-[#dbe4de] text-xs">
                        {result.lostTreeSpots
                          .slice(0, 10)
                          .map((spot) => (
                            <div
                              key={spot.id}
                              className="flex items-center justify-between border-b border-[#dbe4de] px-3 py-2 last:border-0"
                            >
                              <span className="text-gray-500">
                                Cluster #{spot.id} — (
                                {spot.centroid_x},{" "}
                                {spot.centroid_y})
                              </span>

                              <span className="font-medium text-gray-800">
                                {spot.pixels_lost.toLocaleString()}{" "}
                                px
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {result.legalStatus && (
                    <div
                      className={`flex items-start gap-3 rounded-lg border p-4 ${
                        result.legalStatus === "legal"
                          ? "border-emerald-200 bg-emerald-50"
                          : result.legalStatus === "illegal"
                            ? "border-red-200 bg-red-50"
                            : "border-yellow-200 bg-yellow-50"
                      }`}
                    >
                      <span className="mt-0.5 text-lg leading-none">
                        {result.legalStatus === "legal"
                          ? "✅"
                          : result.legalStatus === "illegal"
                            ? "🚨"
                            : "⚠️"}
                      </span>

                      <div className="flex-1">
                        {result.legalStatus ===
                          "legal" && (
                          <>
                            <p className="text-sm font-semibold text-emerald-800">
                              Legal Cutting Zone
                            </p>

                            <p className="mt-1 text-xs text-emerald-700">
                              This area is within a permitted
                              cutting zone. No alert has been
                              raised.
                            </p>

                            {result.legalZone && (
                              <div className="mt-2 divide-y divide-emerald-200 rounded border border-emerald-200">
                                {[
                                  [
                                    "Zone name",
                                    result.legalZone.name,
                                  ],
                                  [
                                    "Permit no.",
                                    result.legalZone
                                      .permitNumber,
                                  ],
                                  [
                                    "Valid until",
                                    result.legalZone
                                      .validUntil
                                      ? new Date(
                                          result.legalZone.validUntil
                                        ).toLocaleDateString()
                                      : "—",
                                  ],
                                ].map(
                                  ([label, value]) => (
                                    <div
                                      key={label}
                                      className="flex justify-between gap-4 px-3 py-2"
                                    >
                                      <span className="text-xs text-emerald-700">
                                        {label}
                                      </span>

                                      <span className="text-xs font-medium text-emerald-900">
                                        {value}
                                      </span>
                                    </div>
                                  )
                                )}
                              </div>
                            )}
                          </>
                        )}

                        {result.legalStatus ===
                          "illegal" && (
                          <>
                            <p className="text-sm font-semibold text-red-700">
                              Illegal Deforestation Detected
                            </p>

                            <p className="mt-1 text-xs text-red-600">
                              Coordinates do not match any
                              legal cutting zone. An alert has
                              been raised for official review.
                            </p>

                            {alertId && (
                              <p className="mt-2 text-xs text-red-500">
                                Alert ID:{" "}
                                <span className="font-mono font-semibold">
                                  {alertId}
                                </span>
                              </p>
                            )}
                          </>
                        )}

                        {result.legalStatus ===
                          "unverified" && (
                          <>
                            <p className="text-sm font-semibold text-yellow-800">
                              Verification Unavailable
                            </p>

                            <p className="mt-1 text-xs text-yellow-700">
                              Legal zone check failed. Alert
                              raised as unverified — pending
                              manual review.
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {isOfficial && (
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-800">
                        Official report
                      </p>

                      <p className="mb-3 text-xs text-emerald-700">
                        Generate and download a classified PDF
                        report based on this analysis and recent
                        regional alerts.
                      </p>

                      <button
                        type="button"
                        onClick={handleGenerateReport}
                        disabled={
                          reportStatus === "generating"
                        }
                        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:opacity-60"
                      >
                        {reportStatus === "generating" ? (
                          <>
                            <LoaderCircle
                              size={15}
                              className="animate-spin"
                            />
                            Generating PDF…
                          </>
                        ) : reportStatus === "done" ? (
                          <>
                            <CheckCircle2 size={15} />
                            Report downloaded
                          </>
                        ) : reportStatus === "error" ? (
                          <>
                            <AlertTriangle size={15} />
                            Report failed — retry
                          </>
                        ) : (
                          <>
                            <Download size={15} />
                            Generate &amp; download report
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              )}

            {status === "done" &&
              result &&
              result.mode === "landcover" && (
                <div className="mt-5 space-y-5">
                  <div className="flex items-start gap-3 rounded-lg border border-[#dbe4de] bg-[#f6f9f7] p-4">
                    <BarChart3
                      size={20}
                      className="mt-0.5 shrink-0 text-emerald-600"
                    />

                    <div>
                      <p className="text-xs text-gray-500">
                        Vegetation coverage
                      </p>

                      <p className="text-3xl font-bold text-emerald-700">
                        {result.vegetationPct}%
                      </p>

                      <p className="mt-0.5 text-xs font-semibold text-emerald-600">
                        {result.classification}
                      </p>
                    </div>
                  </div>

                  <div className="divide-y divide-[#dbe4de] rounded-lg border border-[#dbe4de]">
                    {[
                      [
                        "Model confidence",
                        `${result.confidence}%`,
                      ],
                      ["Region", result.region],
                    ].map(([label, value]) => (
                      <div
                        key={label}
                        className="flex items-center justify-between gap-4 px-4 py-3"
                      >
                        <span className="text-sm text-gray-500">
                          {label}
                        </span>

                        <span className="text-sm font-medium text-gray-800">
                          {value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Analyze;