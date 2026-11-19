import { useEffect, useRef, useState } from "react";
import { ChevronDown, Search, X } from "lucide-react";

export default function RegionSelect({
  regions = [],
  value,
  onChange,
  allLabel    = "All Regions",
  allValue    = "All",
  placeholder = "Search region…",
  className   = "",
}) {
  const [open,  setOpen]  = useState(false);
  const [query, setQuery] = useState("");
  const wrapperRef        = useRef(null);
  const inputRef          = useRef(null);

  const names = regions
    .map((r) => (typeof r === "string" ? r : r.name))
    .filter(Boolean);

  const filtered = query.trim()
    ? names.filter((n) => n.toLowerCase().includes(query.toLowerCase()))
    : names;

  const displayValue = !value || value === allValue ? allLabel : value;

  useEffect(() => {
    const handle = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  const select = (name) => {
    onChange(name);
    setOpen(false);
    setQuery("");
  };

  return (
    <div ref={wrapperRef} className={`relative ${className}`} style={{ zIndex: open ? 1000 : "auto" }}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded-lg border border-gray-300 bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-800 transition hover:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-600"
      >
        <span className="max-w-[150px] truncate">{displayValue}</span>
        <ChevronDown
          size={13}
          className={`shrink-0 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {/* Dropdown — fixed z-index above Leaflet */}
      {open && (
        <div
          className="absolute left-0 top-full mt-1 w-72 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl"
          style={{ zIndex: 1000 }}
        >
          {/* Search */}
          <div className="flex items-center gap-2 border-b border-gray-100 px-3 py-2.5">
            <Search size={13} className="shrink-0 text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={placeholder}
              className="flex-1 bg-transparent text-xs text-gray-800 placeholder-gray-400 focus:outline-none"
            />
            {query && (
              <button type="button" onClick={() => setQuery("")}
                className="shrink-0 text-gray-400 hover:text-gray-700">
                <X size={12} />
              </button>
            )}
          </div>

          {/* Options */}
          <ul className="max-h-60 overflow-y-auto py-1">
            {/* All option */}
            {!query && (
              <li>
                <button
                  type="button"
                  onClick={() => select(allValue)}
                  className={`w-full px-3 py-2 text-left text-xs transition hover:bg-emerald-50 hover:text-emerald-800 ${
                    value === allValue || !value
                      ? "bg-emerald-50 font-semibold text-emerald-800"
                      : "text-gray-700"
                  }`}
                >
                  {allLabel}
                </button>
              </li>
            )}

            {filtered.length === 0 ? (
              <li className="px-3 py-4 text-center text-xs text-gray-400">
                No regions found for "{query}"
              </li>
            ) : (
              filtered.map((name) => (
                <li key={name}>
                  <button
                    type="button"
                    onClick={() => select(name)}
                    className={`w-full px-3 py-1.5 text-left text-xs transition hover:bg-emerald-50 hover:text-emerald-800 ${
                      value === name
                        ? "bg-emerald-50 font-semibold text-emerald-800"
                        : "text-gray-700"
                    }`}
                  >
                    {name}
                  </button>
                </li>
              ))
            )}
          </ul>

          {/* Footer */}
          <div className="border-t border-gray-100 px-3 py-1.5 text-[10px] text-gray-400">
            {filtered.length} of {names.length} regions
            {query && ` matching "${query}"`}
          </div>
        </div>
      )}
    </div>
  );
}