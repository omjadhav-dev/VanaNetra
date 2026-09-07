import { Link, NavLink } from "react-router-dom";
import { Leaf, ScanSearch, ShieldCheck, LineChart } from "lucide-react";

function Header() {
  const navClass = ({ isActive }) =>
    `text-sm transition ${
      isActive
        ? "text-gray-900 font-medium"
        : "text-gray-500 hover:text-gray-900"
    }`;

  return (
    <header className="sticky top-0 z-50 border-b border-[#e2e8e4] bg-white/95 backdrop-blur">
      <nav className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-700 text-white">
            <Leaf size={19} />
          </span>

          <div>
            <p className="text-base font-semibold tracking-tight text-gray-900">VanaNetra</p>
            <p className="text-[9px] uppercase tracking-[0.2em] text-gray-500">
              Geospatial intelligence
            </p>
          </div>
        </Link>

        <div className="hidden items-center gap-7 md:flex">
          <NavLink to="/analyze" className={navClass}>
            Analyze
          </NavLink>
          <NavLink to="/transparency" className={navClass}>
            Public Dashboard
          </NavLink>
          <NavLink to="/login" className={navClass}>
            Officials
          </NavLink>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/transparency"
            className="hidden items-center gap-2 rounded-lg border border-[#c9d6cd] px-4 py-2 text-sm text-gray-600 transition hover:border-[#8fab9a] hover:bg-[#f0f4f1] hover:text-gray-900 sm:inline-flex"
          >
            <LineChart size={16} />
            Public Dashboard
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
