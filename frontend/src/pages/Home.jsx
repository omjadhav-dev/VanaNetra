import { Link } from "react-router-dom";
import {
  ArrowRight,
  ShieldCheck,
  Satellite,
  ScanSearch,
  GitCompare,
  FileText,
  Bell,
} from "lucide-react";

import Forest from "../assets/Forest.png";
import BeforeAfter from "../assets/Before-After.png";

function Home() {
  const features = [
    {
      title: "Classify",
      description:
        "Satellite tiles are classified into forest, water, urban, agriculture or barren land cover.",
      icon: ScanSearch,
    },
    {
      title: "Compare",
      description:
        "Before/after imagery is compared to quantify canopy loss and affected hectares.",
      icon: GitCompare,
    },
    {
      title: "Alert",
      description:
        "Rule-based severity scoring escalates important events to forestry officials.",
      icon: Bell,
    },
    {
      title: "Report",
      description:
        "Region trends and downloadable summaries support field action and audits.",
      icon: FileText,
    },
  ];

  return (
    <div className="bg-[#080c0a]">
      <section className="relative min-h-[calc(100vh-72px)] overflow-hidden">
        <img
          src={Forest}
          alt="Forest landscape"
          className="absolute inset-0 h-full w-full object-cover"
        />

        <div className="absolute inset-0 bg-[#050806]/65" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/45 to-black/20" />

        <div className="relative z-10 mx-auto flex min-h-[calc(100vh-72px)] max-w-7xl items-center px-6 py-16">
          <div className="max-w-3xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/20 px-4 py-2 text-xs font-medium text-gray-200 backdrop-blur-md">
              <Satellite size={14} className="text-emerald-400" />
              Geospatial deforestation intelligence
            </div>

            <h1 className="text-4xl font-semibold leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-7xl">
              Forest loss, detected before the chainsaws move on.
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-7 text-gray-200 sm:text-lg">
              ForestWatch runs land-cover classification and change detection
              over satellite imagery, scores every loss event against region
              sensitivity, and pushes alerts to forestry officials.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/analyze"
                className="group inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-sm font-semibold text-gray-950 transition hover:bg-gray-100"
              >
                <ScanSearch size={17} />
                Analyze an image
                <ArrowRight
                  size={16}
                  className="transition-transform group-hover:translate-x-1"
                />
              </Link>

              <Link
                to="/login"
                className="inline-flex items-center gap-2 rounded-lg border border-white/30 bg-black/20 px-6 py-3 text-sm font-medium text-white backdrop-blur transition hover:bg-white/10"
              >
                <ShieldCheck size={17} />
                Officials Dashboard
              </Link>
            </div>

            <div className="mt-8 flex items-center gap-2 text-sm text-gray-300">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Satellite-powered monitoring and change detection
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-[#202b25] bg-[#0b100d] px-6 py-20">
        <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-400">
              Evidence & analysis
            </p>

            <h2 className="mt-3 text-3xl font-semibold leading-tight sm:text-4xl">
              From pixels to prosecution-ready evidence
            </h2>

            <p className="mt-5 max-w-xl leading-7 text-gray-400">
              Every comparison can produce an auditable record with measured
              loss, affected hectares and a computed severity score. Events
              above the configured threshold become alerts.
            </p>

            <div className="mt-8 grid grid-cols-2 gap-4">
              {[
                ["5", "LAND-COVER CLASSES"],
                ["4", "SEVERITY TIERS"],
                ["<60s", "INFERENCE TO ALERT"],
                ["PDF", "AUDIT REPORTS"],
              ].map(([value, label]) => (
                <div
                  key={label}
                  className="rounded-xl border border-[#26342c] bg-[#101713] p-5"
                >
                  <p className="text-2xl font-semibold">{value}</p>
                  <p className="mt-1 text-xs font-medium tracking-wide text-gray-500">
                    {label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-[#26342c] bg-[#101713]">
            <img
              src={BeforeAfter}
              alt="Before and after forest comparison"
              className="max-h-[620px] w-full object-cover"
            />
          </div>
        </div>
      </section>

      <section className="bg-[#080c0a] px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => {
              const Icon = feature.icon;

              return (
                <div
                  key={feature.title}
                  className="rounded-xl border border-[#26342c] bg-[#101713] p-6 transition hover:-translate-y-1 hover:border-[#3b5547]"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-950/70 text-emerald-400">
                    <Icon size={21} />
                  </div>

                  <h3 className="mt-6 text-xl font-semibold">
                    {feature.title}
                  </h3>

                  <p className="mt-3 text-sm leading-6 text-gray-400">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;
