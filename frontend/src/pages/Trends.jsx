import { useMemo, useState } from "react";

const REGIONS = [
  "Bandhavgarh Belt",
  "Kaziranga Corridor",
  "Nilgiri Biosphere",
  "Sundarbans Delta",
  "Western Ghats Reserve",
];

const TREND_DATA = {
  "Bandhavgarh Belt": {
    loss: [4, 5.2, 6.5, 7.8, 7.1, 8.6, 10.2, 12],
    area: [165, 240, 325, 285, 365, 450, 410, 490],
  },

  "Kaziranga Corridor": {
    loss: [3.2, 4.4, 5.7, 6.9, 6.4, 7.5, 8.8, 10.4],
    area: [120, 190, 260, 235, 310, 380, 350, 420],
  },

  "Nilgiri Biosphere": {
    loss: [2, 2.8, 3.7, 3.4, 4.2, 5.1, 5.7, 6.4],
    area: [80, 110, 145, 130, 170, 205, 190, 230],
  },

  "Sundarbans Delta": {
    loss: [2.5, 3.8, 4.6, 4.2, 5.3, 6.1, 6.8, 7.5],
    area: [100, 165, 220, 195, 270, 330, 300, 365],
  },

  "Western Ghats Reserve": {
    loss: [4.5, 6.1, 8.2, 7.3, 9.1, 11.4, 10.3, 12.2],
    area: [190, 280, 370, 340, 430, 520, 470, 560],
  },
};

const MONTHS = [
  "2025-12",
  "2026-01",
  "2026-02",
  "2026-03",
  "2026-04",
  "2026-05",
  "2026-06",
  "2026-07",
];

function Trends() {
  const [region, setRegion] = useState("Bandhavgarh Belt");

  const data = useMemo(() => TREND_DATA[region], [region]);

  const maxLoss = 12;
  const maxArea = 600;

  /*
   * Creates points for the SVG line chart.
   */
  const linePoints = data.loss
    .map((value, index) => {
      const x = 20 + (index * 520) / (data.loss.length - 1);
      const y = 300 - (value / maxLoss) * 270;

      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="px-5 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1400px]">

        {/* Header */}
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Loss trends
        </h1>

        <p className="mt-2 text-base text-gray-500">
          Monthly forest loss and affected area per monitored region
        </p>

        {/* Region buttons */}
        <div className="mt-6 flex flex-wrap gap-2">
          {REGIONS.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setRegion(item)}
              className={`rounded-full border px-4 py-2.5 text-sm transition ${
                region === item
                  ? "border-emerald-700 bg-emerald-700 text-white"
                  : "border-[#26342c] text-gray-500 hover:border-[#3b5145] hover:text-gray-300"
              }`}
            >
              {item}
            </button>
          ))}
        </div>

        {/* Charts */}
        <div className="mt-6 grid gap-5 xl:grid-cols-2">

          {/* Forest loss chart */}
          <div className="rounded-xl border border-[#26342c] bg-[#101713] p-5 sm:p-6">

            <p className="text-xs uppercase tracking-[0.2em] text-gray-500">
              Forest loss % over time
            </p>

            <div className="mt-5 h-[330px] w-full">
              <svg
                viewBox="0 0 560 350"
                className="h-full w-full"
                preserveAspectRatio="none"
              >
                {/* Y axis */}
                <line
                  x1="20"
                  y1="30"
                  x2="20"
                  y2="300"
                  stroke="#52675c"
                />

                {/* X axis */}
                <line
                  x1="20"
                  y1="300"
                  x2="540"
                  y2="300"
                  stroke="#52675c"
                />

                {/* Y labels */}
                {[0, 3, 6, 9, 12].map((value) => {
                  const y = 300 - (value / maxLoss) * 270;

                  return (
                    <g key={value}>
                      <line
                        x1="15"
                        y1={y}
                        x2="20"
                        y2={y}
                        stroke="#52675c"
                      />

                      <text
                        x="0"
                        y={y + 4}
                        fill="#6f8980"
                        fontSize="12"
                      >
                        {value}
                      </text>
                    </g>
                  );
                })}

                {/* Line */}
                <polyline
                  points={linePoints}
                  fill="none"
                  stroke="#3c9b70"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Points */}
                {data.loss.map((value, index) => {
                  const x = 20 + (index * 520) / (data.loss.length - 1);
                  const y = 300 - (value / maxLoss) * 270;

                  return (
                    <circle
                      key={index}
                      cx={x}
                      cy={y}
                      r="3"
                      fill="#101713"
                      stroke="#3c9b70"
                      strokeWidth="2"
                    />
                  );
                })}

                {/* X labels */}
                {MONTHS.map((month, index) => {
                  const x =
                    20 + (index * 520) / (MONTHS.length - 1);

                  return (
                    <text
                      key={month}
                      x={x}
                      y="323"
                      textAnchor="middle"
                      fill="#6f8980"
                      fontSize="11"
                    >
                      {month}
                    </text>
                  );
                })}
              </svg>
            </div>

            {/* Legend */}
            <div className="mt-1 flex justify-center">
              <span className="flex items-center gap-2 text-sm text-emerald-400">
                <span className="h-2 w-2 rounded-full border-2 border-emerald-500" />
                Loss %
              </span>
            </div>
          </div>

          {/* Affected area chart */}
          <div className="rounded-xl border border-[#26342c] bg-[#101713] p-5 sm:p-6">

            <p className="text-xs uppercase tracking-[0.2em] text-gray-500">
              Affected area (ha) & alert volume
            </p>

            <div className="mt-5 h-[330px] w-full">
              <svg
                viewBox="0 0 560 350"
                className="h-full w-full"
                preserveAspectRatio="none"
              >
                {/* Y axis */}
                <line
                  x1="35"
                  y1="30"
                  x2="35"
                  y2="300"
                  stroke="#52675c"
                />

                {/* X axis */}
                <line
                  x1="35"
                  y1="300"
                  x2="540"
                  y2="300"
                  stroke="#52675c"
                />

                {/* Y labels */}
                {[0, 150, 300, 450, 600].map((value) => {
                  const y = 300 - (value / maxArea) * 270;

                  return (
                    <g key={value}>
                      <line
                        x1="30"
                        y1={y}
                        x2="35"
                        y2={y}
                        stroke="#52675c"
                      />

                      <text
                        x="0"
                        y={y + 4}
                        fill="#6f8980"
                        fontSize="12"
                      >
                        {value}
                      </text>
                    </g>
                  );
                })}

                {/* Bars */}
                {data.area.map((value, index) => {
                  const x = 45 + index * 62;
                  const height = (value / maxArea) * 270;
                  const y = 300 - height;

                  return (
                    <rect
                      key={index}
                      x={x}
                      y={y}
                      width="28"
                      height={height}
                      rx="4"
                      fill="#f59e0b"
                    />
                  );
                })}

                {/* X labels */}
                {MONTHS.map((month, index) => {
                  const x = 59 + index * 62;

                  return (
                    <text
                      key={month}
                      x={x}
                      y="323"
                      textAnchor="middle"
                      fill="#6f8980"
                      fontSize="11"
                    >
                      {month}
                    </text>
                  );
                })}
              </svg>
            </div>

            {/* Legend */}
            <div className="mt-1 flex justify-center gap-6 text-sm">
              <span className="flex items-center gap-2 text-red-400">
                <span className="h-3 w-3 bg-red-500" />
                Alerts
              </span>

              <span className="flex items-center gap-2 text-amber-400">
                <span className="h-3 w-3 bg-amber-500" />
                Hectares
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Trends;

// import { useState } from "react";
// import {
//   LineChart,
//   Line,
//   BarChart,
//   Bar,
//   XAxis,
//   YAxis,
//   CartesianGrid,
//   ResponsiveContainer,
//   Tooltip,
// } from "recharts";

// const REGIONS = [
//   "Bandhavgarh Belt",
//   "Kaziranga Corridor",
//   "Nilgiri Biosphere",
//   "Sundarbans Delta",
//   "Western Ghats Reserve",
// ];

// const REGION_DATA = {
//   "Bandhavgarh Belt": [
//     { month: "2025-12", loss: 4, area: 160, alerts: 8 },
//     { month: "2026-01", loss: 5.5, area: 240, alerts: 10 },
//     { month: "2026-02", loss: 8, area: 325, alerts: 14 },
//     { month: "2026-03", loss: 7, area: 285, alerts: 12 },
//     { month: "2026-04", loss: 9, area: 365, alerts: 16 },
//     { month: "2026-05", loss: 11, area: 450, alerts: 19 },
//     { month: "2026-06", loss: 10, area: 410, alerts: 17 },
//     { month: "2026-07", loss: 12, area: 490, alerts: 21 },
//   ],

//   "Kaziranga Corridor": [
//     { month: "2025-12", loss: 3, area: 130, alerts: 6 },
//     { month: "2026-01", loss: 4.5, area: 190, alerts: 8 },
//     { month: "2026-02", loss: 6.5, area: 260, alerts: 11 },
//     { month: "2026-03", loss: 6, area: 230, alerts: 10 },
//     { month: "2026-04", loss: 7.5, area: 310, alerts: 13 },
//     { month: "2026-05", loss: 9, area: 380, alerts: 15 },
//     { month: "2026-06", loss: 8.5, area: 350, alerts: 14 },
//     { month: "2026-07", loss: 10, area: 420, alerts: 17 },
//   ],

//   "Nilgiri Biosphere": [
//     { month: "2025-12", loss: 2, area: 80, alerts: 4 },
//     { month: "2026-01", loss: 2.8, area: 110, alerts: 5 },
//     { month: "2026-02", loss: 3.7, area: 145, alerts: 7 },
//     { month: "2026-03", loss: 3.4, area: 130, alerts: 6 },
//     { month: "2026-04", loss: 4.2, area: 170, alerts: 8 },
//     { month: "2026-05", loss: 5.1, area: 205, alerts: 9 },
//     { month: "2026-06", loss: 5.7, area: 190, alerts: 9 },
//     { month: "2026-07", loss: 6.4, area: 230, alerts: 11 },
//   ],

//   "Sundarbans Delta": [
//     { month: "2025-12", loss: 2.5, area: 100, alerts: 5 },
//     { month: "2026-01", loss: 3.8, area: 165, alerts: 7 },
//     { month: "2026-02", loss: 4.6, area: 220, alerts: 9 },
//     { month: "2026-03", loss: 4.2, area: 195, alerts: 8 },
//     { month: "2026-04", loss: 5.3, area: 270, alerts: 11 },
//     { month: "2026-05", loss: 6.1, area: 330, alerts: 13 },
//     { month: "2026-06", loss: 6.8, area: 300, alerts: 12 },
//     { month: "2026-07", loss: 7.5, area: 365, alerts: 15 },
//   ],

//   "Western Ghats Reserve": [
//     { month: "2025-12", loss: 4, area: 165, alerts: 7 },
//     { month: "2026-01", loss: 6, area: 250, alerts: 11 },
//     { month: "2026-02", loss: 8, area: 330, alerts: 14 },
//     { month: "2026-03", loss: 7, area: 290, alerts: 12 },
//     { month: "2026-04", loss: 9, area: 365, alerts: 16 },
//     { month: "2026-05", loss: 11, area: 450, alerts: 19 },
//     { month: "2026-06", loss: 10, area: 410, alerts: 17 },
//     { month: "2026-07", loss: 12, area: 490, alerts: 21 },
//   ],
// };

// function Trends() {
//   const [selectedRegion, setSelectedRegion] =
//     useState("Bandhavgarh Belt");

//   const data = REGION_DATA[selectedRegion];

//   return (
//     <div className="min-h-screen bg-[#080c0a] px-6 py-6 text-white lg:px-8">
//       <div className="mx-auto max-w-[1400px]">

//         {/* PAGE HEADER */}
//         <div>
//           <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
//             Loss trends
//           </h1>

//           <p className="mt-2 text-base text-[#8ca59b]">
//             Monthly forest loss and affected area per monitored region
//           </p>
//         </div>

//         {/* REGION TABS */}
//         <div className="mt-6 flex flex-wrap gap-2.5">
//           {REGIONS.map((region) => {
//             const active = selectedRegion === region;

//             return (
//               <button
//                 key={region}
//                 type="button"
//                 onClick={() => setSelectedRegion(region)}
//                 className={`rounded-full border px-3 py-1.5 text-sm transition-all ${
//                   active
//                     ? "border-emerald-700 bg-[#287657] text-white"
//                     : "border-[#26342c] bg-transparent text-[#8ca59b] hover:border-[#3a5146] hover:text-white"
//                 }`}
//               >
//                 {region}
//               </button>
//             );
//           })}
//         </div>

//         {/* CHARTS */}
//         <div className="mt-6 grid gap-5 xl:grid-cols-2">

//           {/* LEFT - LOSS CHART */}
//           <div className="rounded-xl border border-[#26342c] bg-[#101713] p-5 sm:p-6">

//             <p className="text-xs font-medium uppercase tracking-[0.22em] text-[#91aaa0]">
//               Forest loss % over time
//             </p>

//             <div className="mt-4 h-[350px] w-full">
//               <ResponsiveContainer width="100%" height="100%">
//                 <LineChart
//                   data={data}
//                   margin={{
//                     top: 20,
//                     right: 15,
//                     left: 5,
//                     bottom: 10,
//                   }}
//                 >
//                   <CartesianGrid
//                     horizontal={false}
//                     vertical={false}
//                   />

//                   <XAxis
//                     dataKey="month"
//                     tick={{
//                       fill: "#71877e",
//                       fontSize: 12,
//                     }}
//                     axisLine={{
//                       stroke: "#52675d",
//                     }}
//                     tickLine={{
//                       stroke: "#52675d",
//                     }}
//                   />

//                   <YAxis
//                     domain={[0, 12]}
//                     ticks={[0, 3, 6, 9, 12]}
//                     tick={{
//                       fill: "#71877e",
//                       fontSize: 12,
//                     }}
//                     axisLine={{
//                       stroke: "#52675d",
//                     }}
//                     tickLine={{
//                       stroke: "#52675d",
//                     }}
//                   />

//                   <Tooltip
//                     contentStyle={{
//                       backgroundColor: "#101713",
//                       border: "1px solid #304037",
//                       borderRadius: "8px",
//                       color: "#fff",
//                     }}
//                     labelStyle={{
//                       color: "#8ca59b",
//                     }}
//                     formatter={(value) => [`${value}%`, "Loss"]}
//                   />

//                   <Line
//                     type="monotone"
//                     dataKey="loss"
//                     stroke="#3b996e"
//                     strokeWidth={3}
//                     dot={{
//                       r: 3,
//                       fill: "#101713",
//                       stroke: "#3b996e",
//                       strokeWidth: 2,
//                     }}
//                     activeDot={{
//                       r: 5,
//                       fill: "#3b996e",
//                     }}
//                   />
//                 </LineChart>
//               </ResponsiveContainer>
//             </div>

//             {/* LEGEND */}
//             <div className="flex justify-center">
//               <div className="flex items-center gap-2 text-sm text-[#3b996e]">
//                 <span className="h-2.5 w-2.5 rounded-full border-2 border-[#3b996e]" />
//                 Loss %
//               </div>
//             </div>
//           </div>

//           {/* RIGHT - AREA CHART */}
//           <div className="rounded-xl border border-[#26342c] bg-[#101713] p-5 sm:p-6">

//             <p className="text-xs font-medium uppercase tracking-[0.22em] text-[#91aaa0]">
//               Affected area (ha) & alert volume
//             </p>

//             <div className="mt-4 h-[350px] w-full">
//               <ResponsiveContainer width="100%" height="100%">
//                 <BarChart
//                   data={data}
//                   margin={{
//                     top: 20,
//                     right: 10,
//                     left: 5,
//                     bottom: 10,
//                   }}
//                 >
//                   <CartesianGrid
//                     horizontal={false}
//                     vertical={false}
//                   />

//                   <XAxis
//                     dataKey="month"
//                     tick={{
//                       fill: "#71877e",
//                       fontSize: 12,
//                     }}
//                     axisLine={{
//                       stroke: "#52675d",
//                     }}
//                     tickLine={{
//                       stroke: "#52675d",
//                     }}
//                   />

//                   <YAxis
//                     domain={[0, 600]}
//                     ticks={[0, 150, 300, 450, 600]}
//                     tick={{
//                       fill: "#71877e",
//                       fontSize: 12,
//                     }}
//                     axisLine={{
//                       stroke: "#52675d",
//                     }}
//                     tickLine={{
//                       stroke: "#52675d",
//                     }}
//                   />

//                   <Tooltip
//                     contentStyle={{
//                       backgroundColor: "#101713",
//                       border: "1px solid #304037",
//                       borderRadius: "8px",
//                       color: "#fff",
//                     }}
//                     labelStyle={{
//                       color: "#8ca59b",
//                     }}
//                     formatter={(value, name) => [
//                       name === "area"
//                         ? `${value} ha`
//                         : value,
//                       name === "area"
//                         ? "Hectares"
//                         : "Alerts",
//                     ]}
//                   />

//                   <Bar
//                     dataKey="area"
//                     fill="#f59e0b"
//                     radius={[4, 4, 0, 0]}
//                     barSize={25}
//                   />
//                 </BarChart>
//               </ResponsiveContainer>
//             </div>

//             {/* LEGEND */}
//             <div className="flex justify-center gap-6">
//               <div className="flex items-center gap-2 text-sm text-red-400">
//                 <span className="h-3 w-3 bg-red-500" />
//                 Alerts
//               </div>

//               <div className="flex items-center gap-2 text-sm text-amber-400">
//                 <span className="h-3 w-3 bg-amber-500" />
//                 Hectares
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// export default Trends;