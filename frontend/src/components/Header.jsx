import { Link, NavLink } from "react-router-dom";
import { Leaf, ScanSearch, ShieldCheck } from "lucide-react";

function Header() {
  const navClass = ({ isActive }) =>
    `text-sm transition ${
      isActive
        ? "text-white"
        : "text-gray-400 hover:text-white"
    }`;

  return (
    <header className="sticky top-0 z-50 border-b border-[#202b25] bg-[#080c0a]/95 backdrop-blur">
      <nav className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-700 text-white">
            <Leaf size={19} />
          </span>

          <div>
            <p className="text-base font-semibold tracking-tight">VanaNetra</p>
            <p className="text-[9px] uppercase tracking-[0.2em] text-gray-500">
              Geospatial intelligence
            </p>
          </div>
        </Link>

        <div className="hidden items-center gap-7 md:flex">
          <NavLink to="/analyze" className={navClass}>
            Analyze
          </NavLink>
          <NavLink to="/login" className={navClass}>
            Officials
          </NavLink>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/analyze"
            className="hidden items-center gap-2 rounded-lg border border-[#304037] px-4 py-2 text-sm text-gray-300 transition hover:border-[#496255] hover:bg-[#101713] hover:text-white sm:inline-flex"
          >
            <ScanSearch size={16} />
            Analyze
          </Link>

          <Link
            to="/login"
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-600"
          >
            <ShieldCheck size={16} />
            Official Login
          </Link>
        </div>
      </nav>
    </header>
  );
}

export default Header;
