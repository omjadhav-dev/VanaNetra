import { useState } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from "recharts";


// ============================================================
// REGIONS
// ============================================================

const REGIONS = [
  "Bandhavgarh Belt",
  "Kaziranga Corridor",
  "Nilgiri Biosphere",
  "Sundarbans Delta",
  "Western Ghats Reserve",
];


// ============================================================
// REGION DATA
// ============================================================

const REGION_DATA = {
  "Bandhavgarh Belt": [
    { month: "2025-12", loss: 4, area: 160, alerts: 8 },
    { month: "2026-01", loss: 5.5, area: 240, alerts: 10 },
    { month: "2026-02", loss: 8, area: 325, alerts: 14 },
    { month: "2026-03", loss: 7, area: 285, alerts: 12 },
    { month: "2026-04", loss: 9, area: 365, alerts: 16 },
    { month: "2026-05", loss: 11, area: 450, alerts: 19 },
    { month: "2026-06", loss: 10, area: 410, alerts: 17 },
    { month: "2026-07", loss: 12, area: 490, alerts: 21 },
  ],

  "Kaziranga Corridor": [
    { month: "2025-12", loss: 3, area: 130, alerts: 6 },
    { month: "2026-01", loss: 4.5, area: 190, alerts: 8 },
    { month: "2026-02", loss: 6.5, area: 260, alerts: 11 },
    { month: "2026-03", loss: 6, area: 230, alerts: 10 },
    { month: "2026-04", loss: 7.5, area: 310, alerts: 13 },
    { month: "2026-05", loss: 9, area: 380, alerts: 15 },
    { month: "2026-06", loss: 8.5, area: 350, alerts: 14 },
    { month: "2026-07", loss: 10, area: 420, alerts: 17 },
  ],

  "Nilgiri Biosphere": [
    { month: "2025-12", loss: 2, area: 80, alerts: 4 },
    { month: "2026-01", loss: 2.8, area: 110, alerts: 5 },
    { month: "2026-02", loss: 3.7, area: 145, alerts: 7 },
    { month: "2026-03", loss: 3.4, area: 130, alerts: 6 },
    { month: "2026-04", loss: 4.2, area: 170, alerts: 8 },
    { month: "2026-05", loss: 5.1, area: 205, alerts: 9 },
    { month: "2026-06", loss: 5.7, area: 190, alerts: 9 },
    { month: "2026-07", loss: 6.4, area: 230, alerts: 11 },
  ],

  "Sundarbans Delta": [
    { month: "2025-12", loss: 2.5, area: 100, alerts: 5 },
    { month: "2026-01", loss: 3.8, area: 165, alerts: 7 },
    { month: "2026-02", loss: 4.6, area: 220, alerts: 9 },
    { month: "2026-03", loss: 4.2, area: 195, alerts: 8 },
    { month: "2026-04", loss: 5.3, area: 270, alerts: 11 },
    { month: "2026-05", loss: 6.1, area: 330, alerts: 13 },
    { month: "2026-06", loss: 6.8, area: 300, alerts: 12 },
    { month: "2026-07", loss: 7.5, area: 365, alerts: 15 },
  ],

  "Western Ghats Reserve": [
    { month: "2025-12", loss: 4, area: 165, alerts: 7 },
    { month: "2026-01", loss: 6, area: 250, alerts: 11 },
    { month: "2026-02", loss: 8, area: 330, alerts: 14 },
    { month: "2026-03", loss: 7, area: 290, alerts: 12 },
    { month: "2026-04", loss: 9, area: 365, alerts: 16 },
    { month: "2026-05", loss: 11, area: 450, alerts: 19 },
    { month: "2026-06", loss: 10, area: 410, alerts: 17 },
    { month: "2026-07", loss: 12, area: 490, alerts: 21 },
  ],
};


// ============================================================
// TRENDS PAGE
// ============================================================

function Trends() {
  const [selectedRegion, setSelectedRegion] =
    useState("Bandhavgarh Belt");

  const data = REGION_DATA[selectedRegion];

  return (
    <div className="min-h-screen bg-[#080c0a] px-6 py-6 text-white lg:px-8">
      <div className="mx-auto max-w-[1400px]">

        {/* =====================================================
            PAGE HEADER
        ===================================================== */}

        <div>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Loss trends
          </h1>

          <p className="mt-2 text-base text-[#8ca59b]">
            Monthly forest loss and affected area per monitored region
          </p>
        </div>


        {/*
        <div className="mt-6 flex flex-wrap gap-2.5">
          {REGIONS.map((region) => {
            const active = selectedRegion === region;

            return (
              <button
                key={region}
                type="button"
                onClick={() => setSelectedRegion(region)}
                className={`rounded-full border px-3 py-1.5 text-sm transition-all ${
                  active
                    ? "border-emerald-700 bg-[#287657] text-white"
                    : "border-[#26342c] bg-transparent text-[#8ca59b] hover:border-[#3a5146] hover:text-white"
                }`}
              >
                {region}
              </button>
            );
          })}
        </div>
        */}


        {/*
        <div className="mt-6 grid gap-5 xl:grid-cols-2">



          <div className="rounded-xl border border-[#26342c] bg-[#101713] p-5 sm:p-6">

            <p className="text-xs font-medium uppercase tracking-[0.22em] text-[#91aaa0]">
              Forest loss % over time
            </p>

            <div className="mt-4 h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={data}
                  margin={{
                    top: 20,
                    right: 15,
                    left: 5,
                    bottom: 10,
                  }}
                >

                  <CartesianGrid
                    horizontal={false}
                    vertical={false}
                  />

                  <XAxis
                    dataKey="month"
                    tick={{
                      fill: "#71877e",
                      fontSize: 12,
                    }}
                    axisLine={{
                      stroke: "#52675d",
                    }}
                    tickLine={{
                      stroke: "#52675d",
                    }}
                  />

                  <YAxis
                    domain={[0, 12]}
                    ticks={[0, 3, 6, 9, 12]}
                    tick={{
                      fill: "#71877e",
                      fontSize: 12,
                    }}
                    axisLine={{
                      stroke: "#52675d",
                    }}
                    tickLine={{
                      stroke: "#52675d",
                    }}
                  />

                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#101713",
                      border: "1px solid #304037",
                      borderRadius: "8px",
                      color: "#fff",
                    }}
                    labelStyle={{
                      color: "#8ca59b",
                    }}
                    formatter={(value) => [`${value}%`, "Loss"]}
                  />

                  <Line
                    type="monotone"
                    dataKey="loss"
                    stroke="#3b996e"
                    strokeWidth={3}
                    dot={{
                      r: 3,
                      fill: "#101713",
                      stroke: "#3b996e",
                      strokeWidth: 2,
                    }}
                    activeDot={{
                      r: 5,
                      fill: "#3b996e",
                    }}
                  />

                </LineChart>
              </ResponsiveContainer>
            </div>


            <div className="flex justify-center">
              <div className="flex items-center gap-2 text-sm text-[#3b996e]">
                <span className="h-2.5 w-2.5 rounded-full border-2 border-[#3b996e]" />
                Loss %
              </div>
            </div>

          </div>


          <div className="rounded-xl border border-[#26342c] bg-[#101713] p-5 sm:p-6">

            <p className="text-xs font-medium uppercase tracking-[0.22em] text-[#91aaa0]">
              Affected area (ha) & alert volume
            </p>

            <div className="mt-4 h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data}
                  margin={{
                    top: 20,
                    right: 10,
                    left: 5,
                    bottom: 10,
                  }}
                >

                  <CartesianGrid
                    horizontal={false}
                    vertical={false}
                  />

                  <XAxis
                    dataKey="month"
                    tick={{
                      fill: "#71877e",
                      fontSize: 12,
                    }}
                    axisLine={{
                      stroke: "#52675d",
                    }}
                    tickLine={{
                      stroke: "#52675d",
                    }}
                  />

                  <YAxis
                    domain={[0, 600]}
                    ticks={[0, 150, 300, 450, 600]}
                    tick={{
                      fill: "#71877e",
                      fontSize: 12,
                    }}
                    axisLine={{
                      stroke: "#52675d",
                    }}
                    tickLine={{
                      stroke: "#52675d",
                    }}
                  />

                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#101713",
                      border: "1px solid #304037",
                      borderRadius: "8px",
                      color: "#fff",
                    }}
                    labelStyle={{
                      color: "#8ca59b",
                    }}
                    formatter={(value, name) => [
                      name === "area"
                        ? `${value} ha`
                        : value,
                      name === "area"
                        ? "Hectares"
                        : "Alerts",
                    ]}
                  />

                  <Bar
                    dataKey="area"
                    fill="#f59e0b"
                    radius={[4, 4, 0, 0]}
                    barSize={25}
                  />

                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="flex justify-center gap-6">

              <div className="flex items-center gap-2 text-sm text-red-400">
                <span className="h-3 w-3 bg-red-500" />
                Alerts
              </div>

              <div className="flex items-center gap-2 text-sm text-amber-400">
                <span className="h-3 w-3 bg-amber-500" />
                Hectares
              </div>

            </div>

          </div>

        </div>
        */}


      </div>
    </div>
  );
}


export default Trends;