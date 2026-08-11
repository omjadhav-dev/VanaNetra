import { MapPin, Layers3 } from "lucide-react";

function Maps() {
  return (
    <div className="px-6 py-6 lg:px-7">
      <div className="mx-auto max-w-[1400px]">

        {/* Header */}
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-400">
          Geospatial view
        </p>

        <h1 className="mt-2 text-3xl font-semibold">
          Region severity map
        </h1>

        <p className="mt-2 text-sm text-gray-500">
          Explore monitored regions and their current deforestation risk.
        </p>

        {/*
        <div className="mt-6 overflow-hidden rounded-xl border border-[#26342c] bg-[#101713]">

          <div className="flex items-center justify-between border-b border-[#26342c] px-5 py-4">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-gray-600">
                Interactive map
              </p>

              <h2 className="mt-1 text-base font-semibold text-gray-200">
                Monitored forest regions
              </h2>
            </div>

            <button className="flex items-center gap-2 rounded-full border border-[#304037] px-3 py-2 text-xs text-gray-400 hover:text-white">
              <Layers3 size={15} />
              Layers
            </button>
          </div>

          <div className="relative h-[430px] overflow-hidden bg-[#0b120e]">

            <div
              className="absolute inset-0 opacity-40"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(67,91,77,.16) 1px, transparent 1px), linear-gradient(90deg, rgba(67,91,77,.16) 1px, transparent 1px)",
                backgroundSize: "45px 45px",
              }}
            />

            <div className="absolute left-[25%] top-[30%]">
              <MapPin className="text-red-400" size={30} />
            </div>

            <div className="absolute left-[48%] top-[48%]">
              <MapPin className="text-orange-400" size={30} />
            </div>

            <div className="absolute left-[68%] top-[28%]">
              <MapPin className="text-amber-400" size={30} />
            </div>

            <div className="absolute left-[58%] top-[68%]">
              <MapPin className="text-emerald-400" size={30} />
            </div>

            <div className="absolute inset-0 flex items-center justify-center">
              <div className="rounded-xl border border-[#304037] bg-[#0b100d]/90 px-7 py-5 text-center backdrop-blur">

                <MapPin
                  size={28}
                  className="mx-auto text-emerald-400"
                />

                <p className="mt-3 text-sm font-medium text-gray-200">
                  Forest monitoring map
                </p>

                <p className="mt-1 text-xs text-gray-500">
                  Interactive regional map will be displayed here
                </p>

              </div>
            </div>

            <div className="absolute bottom-4 left-4 rounded-lg border border-[#304037] bg-[#0b100d]/90 px-4 py-3 backdrop-blur">

              <p className="text-[10px] uppercase tracking-[0.15em] text-gray-600">
                Risk level
              </p>

              <div className="mt-2 flex gap-4 text-xs">
                <span className="text-red-400">● Critical</span>
                <span className="text-orange-400">● High</span>
                <span className="text-amber-400">● Medium</span>
                <span className="text-emerald-400">● Low</span>
              </div>

            </div>

          </div>
        </div>
        */}

      </div>
    </div>
  );
}

export default Maps;

// import { useMemo, useState } from "react";
// import { MapPin, Layers3, ShieldAlert } from "lucide-react";

// const MAP_REGIONS = [
//     { name: "Western Ghats Reserve", severity: "Critical", loss: "22.58%", area: "959.6 ha", alerts: 14 },
//     { name: "Kaziranga Corridor", severity: "High", loss: "17.00%", area: "697 ha", alerts: 9 },
//     { name: "Sundarbans Delta", severity: "High", loss: "9.00%", area: "369 ha", alerts: 7 },
//     { name: "Nilgiri Biosphere", severity: "Medium", loss: "4.00%", area: "164 ha", alerts: 5 },
//     { name: "Bandhavgarh Belt", severity: "Low", loss: "1.80%", area: "74 ha", alerts: 2 },
// ];

// function Maps() {
//   const regions = MAP_REGIONS;
//   const [selected, setSelected] = useState(regions[0].name);
//   const [layer, setLayer] = useState("Severity");

//   const active = useMemo(
//     () => MAP_REGIONS.find((region) => region.name === selected),
//     [selected],
//   );

//   const severityClass = {
//     Critical: "text-red-400",
//     High: "text-orange-400",
//     Medium: "text-amber-400",
//     Low: "text-emerald-400",
//   };

//   return (
//     <div className="px-6 py-8 lg:px-8">
//       <div className="mx-auto max-w-[1500px]">
//         <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-400">
//           Geospatial view
//         </p>
//         <h1 className="mt-3 text-4xl font-semibold">Region severity map</h1>
//         <p className="mt-2 text-sm text-gray-500">
//           Explore monitored regions and their current deforestation risk.
//         </p>

//         <div className="mt-8 grid gap-5 lg:grid-cols-[280px_1fr]">
//           <div className="rounded-xl border border-[#26342c] bg-[#101713] p-4">
//             <div className="mb-4 flex items-center justify-between">
//               <p className="text-xs uppercase tracking-[0.18em] text-gray-500">
//                 Regions
//               </p>
//               <Layers3 size={16} className="text-gray-600" />
//             </div>

//             <div className="space-y-1">
//               {regions.map((region) => (
//                 <button
//                   key={region.name}
//                   onClick={() => setSelected(region.name)}
//                   className={`w-full rounded-lg px-3 py-3 text-left transition ${
//                     selected === region.name
//                       ? "bg-emerald-950/70 text-white"
//                       : "text-gray-500 hover:bg-[#151e19] hover:text-white"
//                   }`}
//                 >
//                   <p className="text-sm font-medium">{region.name}</p>
//                   <p className={`mt-1 text-xs ${severityClass[region.severity]}`}>
//                     {region.severity} · {region.loss}
//                   </p>
//                 </button>
//               ))}
//             </div>
//           </div>

//           <div className="overflow-hidden rounded-xl border border-[#26342c] bg-[#101713]">
//             <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#26342c] p-5">
//               <div>
//                 <p className="text-xs uppercase tracking-[0.18em] text-gray-600">
//                   Selected region
//                 </p>
//                 <h2 className="mt-1 text-lg font-semibold">{active.name}</h2>
//               </div>

//               <div className="flex gap-2">
//                 {["Severity", "Loss", "Alerts"].map((item) => (
//                   <button
//                     key={item}
//                     onClick={() => setLayer(item)}
//                     className={`rounded-full border px-3 py-2 text-xs ${
//                       layer === item
//                         ? "border-emerald-700 bg-emerald-700 text-white"
//                         : "border-[#304037] text-gray-500"
//                     }`}
//                   >
//                     {item}
//                   </button>
//                 ))}
//               </div>
//             </div>

//             <div className="relative min-h-[470px] overflow-hidden bg-[#0b120e]">
//               <div
//                 className="absolute inset-0 opacity-50"
//                 style={{
//                   backgroundImage:
//                     "linear-gradient(rgba(67,91,77,.16) 1px, transparent 1px), linear-gradient(90deg, rgba(67,91,77,.16) 1px, transparent 1px)",
//                   backgroundSize: "44px 44px",
//                 }}
//               />

//               <div className="absolute left-[18%] top-[23%] h-24 w-28 rounded-[55%] border border-emerald-800/60 bg-emerald-900/20" />
//               <div className="absolute left-[42%] top-[37%] h-36 w-44 rounded-[48%] border border-orange-700/50 bg-orange-900/20" />
//               <div className="absolute left-[65%] top-[22%] h-28 w-36 rounded-[55%] border border-red-700/60 bg-red-900/25" />
//               <div className="absolute left-[50%] top-[65%] h-24 w-32 rounded-[55%] border border-emerald-700/50 bg-emerald-900/20" />

//               <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
//                 <MapPin size={42} className="mx-auto text-emerald-400" />
//                 <p className="mt-3 text-sm font-medium">{active.name}</p>
//                 <p className={`mt-1 text-xs ${severityClass[active.severity]}`}>
//                   {layer}: {layer === "Severity" ? active.severity : layer === "Loss" ? active.loss : `${active.alerts} alerts`}
//                 </p>
//               </div>

//               <div className="absolute bottom-5 left-5 rounded-lg border border-[#304037] bg-[#0b100d]/90 p-4 backdrop-blur">
//                 <p className="text-xs uppercase tracking-[0.15em] text-gray-600">
//                   Risk legend
//                 </p>
//                 <div className="mt-3 flex flex-wrap gap-4 text-xs">
//                   <span className="text-red-400">● Critical</span>
//                   <span className="text-orange-400">● High</span>
//                   <span className="text-amber-400">● Medium</span>
//                   <span className="text-emerald-400">● Low</span>
//                 </div>
//               </div>

//               <div className="absolute right-5 top-5 rounded-lg border border-[#304037] bg-[#0b100d]/90 p-4">
//                 <div className="flex items-center gap-2 text-sm text-gray-300">
//                   <ShieldAlert size={16} className={severityClass[active.severity]} />
//                   {active.severity} risk
//                 </div>
//                 <p className="mt-2 text-xs text-gray-600">
//                   {active.area} affected
//                 </p>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// export default Maps;
