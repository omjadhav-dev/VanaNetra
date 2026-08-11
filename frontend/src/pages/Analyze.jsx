import { useRef, useState } from "react";
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
} from "lucide-react";

function Analyze() {
  const location = useLocation();

  // Automatically detect whether Analyze is opened from official dashboard
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

  // -----------------------------
  // SINGLE IMAGE UPLOAD
  // -----------------------------

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

    const imageUrl = URL.createObjectURL(file);

    setImage(file);
    setPreview(imageUrl);
    setResult(null);
    setStatus("idle");
  };

  // -----------------------------
  // BEFORE / AFTER UPLOAD
  // -----------------------------

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

  // -----------------------------
  // DRAG & DROP
  // -----------------------------

  const handleDrop = (e, side = "single") => {
    e.preventDefault();

    const file = e.dataTransfer.files?.[0];

    if (side === "single") {
      handleFile(file);
    } else {
      handleComparisonFile(file, side);
    }
  };

  // -----------------------------
  // CLEAR SINGLE IMAGE
  // -----------------------------

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

  // -----------------------------
  // CLEAR BEFORE / AFTER IMAGE
  // -----------------------------

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

  // -----------------------------
  // MODE SELECTION
  // -----------------------------

  const selectMode = (nextMode) => {
    setMode(nextMode);
    setResult(null);
    setStatus("idle");
  };

  // -----------------------------
  // ANALYSIS
  // -----------------------------

  const handleAnalyze = () => {
    if (mode === "landcover" && !image) {
      setStatus("error");

      setResult({
        message: "Upload a satellite image before starting analysis.",
      });

      return;
    }

    if (mode === "change" && (!beforeImage || !afterImage)) {
      setStatus("error");

      setResult({
        message:
          "Upload both the before and after satellite images to detect changes.",
      });

      return;
    }

    setStatus("processing");
    setResult(null);

    // Demo inference
    window.setTimeout(() => {
      setStatus("complete");

      if (mode === "landcover") {
        setResult({
          title: "Classification complete",
          value: "Forest dominant",
          details: [
            ["Forest", "61%"],
            ["Agriculture", "18%"],
            ["Barren", "9%"],
            ["Water", "7%"],
            ["Urban", "5%"],
          ],
        });
      } else {
        setResult({
          title: "Before / after comparison complete",
          value: "10.81% estimated loss",
          details: [
            ["Affected area", "184.2 ha"],
            ["Severity score", "21.6"],
            ["Confidence", "94%"],
            ["Region", region || "Default"],
          ],
        });
      }
    }, 1000);
  };

  // -----------------------------
  // BEFORE / AFTER UPLOAD BOX
  // -----------------------------

  const UploadBox = ({ side, file, preview: sidePreview, inputRef }) => {
    const isBefore = side === "before";
    const label = isBefore ? "Before image" : "After image";

    return (
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => handleDrop(e, side)}
        onClick={() => inputRef.current?.click()}
        className="relative flex min-h-[230px] cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-dashed border-[#304037] bg-[#101713] transition hover:border-emerald-600"
      >
        {sidePreview ? (
          <>
            <img
              src={sidePreview}
              alt={`${label} satellite imagery`}
              className="absolute inset-0 h-full w-full object-cover"
            />

            <div className="absolute inset-0 bg-black/25" />

            <div className="absolute left-4 top-4 rounded-full border border-white/15 bg-black/55 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-white backdrop-blur">
              {label}
            </div>

            <button
              type="button"
              onClick={(e) => clearComparisonImage(side, e)}
              className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-black/55 text-gray-200 hover:bg-white/10"
            >
              <X size={15} />
            </button>

            <div className="absolute bottom-0 left-0 right-0 bg-black/70 px-4 py-3 backdrop-blur">
              <p className="truncate text-xs text-white">{file.name}</p>
            </div>
          </>
        ) : (
          <div className="px-5 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-950/70 text-emerald-400">
              <UploadCloud size={24} />
            </div>

            <p className="text-base font-medium">{label}</p>

            <p className="mt-1.5 text-xs text-gray-500">
              Drop or click to upload
            </p>
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/jpg"
          onChange={(e) => handleComparisonFile(e.target.files?.[0], side)}
          className="hidden"
        />
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#080c0a] px-6 py-10 text-white sm:py-12">
      <div className="mx-auto max-w-7xl">
        {/* PUBLIC LOGO ONLY */}
        {!isOfficial && (
          <Link to="/" className="mb-6 flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-700">
              <Leaf size={19} />
            </span>

            <span className="font-semibold">ForestWatch</span>
          </Link>
        )}

        {/* PAGE HEADING */}

        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-400">
          {isOfficial ? "Official Analysis Console" : "Public Analysis Console"}
        </p>

        <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
          Analyze satellite imagery
        </h1>

        <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-500">
          Upload satellite imagery to classify land cover or compare images to
          detect changes across monitored regions.
        </p>

        {/* ANALYSIS MODE */}

        <div className="mt-6 flex flex-wrap gap-2.5">
          <button
            type="button"
            onClick={() => selectMode("landcover")}
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium transition ${
              mode === "landcover"
                ? "border-emerald-600 bg-emerald-700 text-white"
                : "border-[#304037] text-gray-400 hover:border-[#496255] hover:text-white"
            }`}
          >
            <UploadCloud size={17} />
            Land cover
          </button>

          <button
            type="button"
            onClick={() => selectMode("change")}
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium transition ${
              mode === "change"
                ? "border-emerald-600 bg-emerald-700 text-white"
                : "border-[#304037] text-gray-400 hover:border-[#496255] hover:text-white"
            }`}
          >
            <GitCompareArrows size={17} />
            Change detection
          </button>
        </div>

        {/* REGION */}

        <div className="mt-7">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-gray-500">
            Region (Optional)
          </p>

          <div className="flex flex-wrap gap-2.5">
            {regions.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setRegion(region === item ? "" : item)}
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm transition ${
                  region === item
                    ? "border-emerald-600 bg-emerald-700 text-white"
                    : "border-[#304037] text-gray-400 hover:border-[#496255] hover:text-white"
                }`}
              >
                <MapPin size={14} />
                {item}
              </button>
            ))}
          </div>
        </div>

        {/* MAIN CONTENT */}

        <div className="mt-7 grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
          {/* LEFT SIDE */}

          <div>
            {mode === "landcover" ? (
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleDrop(e)}
                onClick={() => fileInputRef.current?.click()}
                className="relative flex min-h-[300px] cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-dashed border-[#304037] bg-[#101713] transition hover:border-emerald-600"
              >
                {preview ? (
                  <>
                    <img
                      src={preview}
                      alt="Uploaded satellite imagery"
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
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-950/70 text-emerald-400">
                      <UploadCloud size={26} />
                    </div>

                    <p className="text-lg font-medium">
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
                  onChange={(e) => handleFile(e.target.files?.[0])}
                  className="hidden"
                />
              </div>
            ) : (
              <div className="rounded-xl border border-[#26342c] bg-[#101713] p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                      Before / after imagery
                    </p>

                    <p className="mt-1 text-xs text-gray-600">
                      Upload matching-area images from two dates.
                    </p>
                  </div>

                  <Images size={19} className="text-emerald-400" />
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

            {/* ANALYZE BUTTON */}

            <button
              type="button"
              onClick={handleAnalyze}
              disabled={status === "processing"}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-700 px-6 py-3 text-sm font-semibold transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {status === "processing" ? (
                <>
                  <LoaderCircle size={17} className="animate-spin" />
                  Running inference...
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

          {/* RIGHT SIDE - RESULTS */}

          <div className="rounded-xl border border-[#26342c] bg-[#101713] p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-gray-500">
                  Results
                </p>

                <h2 className="mt-1.5 text-lg font-semibold">
                  {status === "processing"
                    ? "Processing imagery"
                    : "Inference output"}
                </h2>
              </div>

              {status === "complete" && (
                <CheckCircle2 size={20} className="text-emerald-400" />
              )}
            </div>

            {/* IDLE */}

            {status === "idle" && (
              <p className="mt-7 text-sm leading-6 text-gray-500">
                {mode === "change"
                  ? "Upload both images to see the estimated change, affected area and severity."
                  : "Results will appear here after inference."}
              </p>
            )}

            {/* ERROR */}

            {status === "error" && (
              <div className="mt-7 rounded-lg border border-red-900/70 bg-red-950/30 p-4 text-sm text-red-300">
                {result?.message}
              </div>
            )}

            {/* PROCESSING */}

            {status === "processing" && (
              <div className="mt-7 space-y-3">
                <div className="h-2 animate-pulse rounded-full bg-emerald-900/70" />

                <div className="h-2 w-4/5 animate-pulse rounded-full bg-gray-800" />

                <div className="h-2 w-3/5 animate-pulse rounded-full bg-gray-800" />
              </div>
            )}

            {/* COMPLETE */}

            {status === "complete" && result && (
              <div className="mt-6">
                <p className="text-sm text-gray-500">{result.title}</p>

                <p className="mt-1.5 text-2xl font-semibold text-emerald-400">
                  {result.value}
                </p>

                {/* BEFORE / AFTER PREVIEW */}

                {mode === "change" && beforePreview && afterPreview && (
                  <div className="mt-5 grid grid-cols-2 gap-2">
                    <div className="overflow-hidden rounded-lg border border-[#26342c]">
                      <img
                        src={beforePreview}
                        alt="Before comparison"
                        className="h-24 w-full object-cover"
                      />

                      <p className="px-2 py-1.5 text-[10px] uppercase tracking-wider text-gray-500">
                        Before
                      </p>
                    </div>

                    <div className="overflow-hidden rounded-lg border border-[#26342c]">
                      <img
                        src={afterPreview}
                        alt="After comparison"
                        className="h-24 w-full object-cover"
                      />

                      <p className="px-2 py-1.5 text-[10px] uppercase tracking-wider text-gray-500">
                        After
                      </p>
                    </div>
                  </div>
                )}

                {/* RESULT DETAILS */}

                <div className="mt-5 divide-y divide-[#26342c] rounded-lg border border-[#26342c] bg-[#080c0a]">
                  {result.details.map(([label, value]) => (
                    <div
                      key={label}
                      className="flex items-center justify-between gap-4 px-4 py-3"
                    >
                      <span className="text-sm text-gray-500">{label}</span>

                      <span className="text-sm font-medium text-gray-200">
                        {value}
                      </span>
                    </div>
                  ))}
                </div>

                <p className="mt-4 text-xs leading-5 text-gray-600">
                  Demo frontend inference. Connect{" "}
                  <code className="mx-1 text-gray-500">handleAnalyze()</code> to
                  your ML/API response.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Analyze;
