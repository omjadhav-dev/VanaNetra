import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useState } from "react";
import { api, clearSession } from "../lib/api";
import {
  Bell,
  Map,
  TrendingUp,
  FileText,
  ScanSearch,
  LogOut,
  User,
  Leaf,
  ChevronRight,
} from "lucide-react";

function Dashboard() {
  const navigate = useNavigate();

  const menuItems = [
    {
      name: "Alerts",
      path: "/dashboard/alerts",
      icon: Bell,
    },
    {
      name: "Maps",
      path: "/dashboard/maps",
      icon: Map,
    },
    {
      name: "Trends",
      path: "/dashboard/trends",
      icon: TrendingUp,
    },
    {
      name: "Reports",
      path: "/dashboard/reports",
      icon: FileText,
    },
    {
      name: "Analyze",
      path: "/dashboard/analyze",
      icon: ScanSearch,
    },
  ];

  const user = (() => {
    try {
      return JSON.parse(
        localStorage.getItem("vananetra_user") ||
        localStorage.getItem("forestwatch_user") ||
        "{}"
      );
    } catch {
      return {};
    }
  })();

  const [summary, setSummary] = useState(null);

  const signOut = async () => {
    try {
      await api("/auth/logout", {
        method: "POST",
      });
    } catch {}

    clearSession();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-[#f6f9f7] text-gray-900">

      {/* BALANCED SIDEBAR: w-56 (224px) */}
      <aside className="fixed inset-y-0 left-0 z-50 flex w-56 flex-col border-r border-[#e2e8e4] bg-[#ffffff]">

        {/* LOGO */}
        <Link to="/dashboard/alerts">
          <div className="flex h-16 items-center gap-3 border-b border-[#e2e8e4] px-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-700">
              <Leaf size={17} className="text-white" />
            </div>

            <div className="min-w-0">
              <p className="font-semibold text-sm leading-tight text-gray-900">
                VanaNetra
              </p>
              <p className="text-[9px] uppercase tracking-[0.18em] text-gray-500">
                Officials Console
              </p>
            </div>
          </div>
        </Link>

        {/* NAVIGATION */}
        <nav className="flex-1 px-3 py-5">
          <p className="mb-2.5 px-2.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-400">
            Operations
          </p>

          <div className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium transition ${
                      isActive
                        ? "bg-emerald-700 text-white shadow-xs font-semibold"
                        : "text-gray-600 hover:bg-[#f0f4f1] hover:text-gray-900"
                    }`
                  }
                >
                  <Icon size={17} />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
          </div>
        </nav>

        {/* PROFILE + SIGN OUT */}
        <div className="border-t border-[#e2e8e4] p-3">
          {/* PROFILE BUTTON */}
          <button
            type="button"
            onClick={() => navigate("/dashboard/profile")}
            className="group mb-2 flex w-full items-center gap-2.5 rounded-lg border border-[#dbe4de] bg-white p-2.5 text-left transition hover:border-emerald-700 hover:bg-[#f0f4f1]"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#c9d6cd] bg-emerald-100">
              <User size={15} className="text-emerald-700" />
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-gray-800 leading-tight">
                {user.name || "Forest Official"}
              </p>
              <p className="truncate text-[10px] text-gray-400 mt-0.5">
                {user.email || "admin1@gmail.com"}
              </p>
            </div>

            <ChevronRight
              size={14}
              className="shrink-0 text-gray-400 transition group-hover:translate-x-0.5 group-hover:text-emerald-600"
            />
          </button>

          {/* ROLE BADGE */}
          <div className="px-2 pb-1.5">
            <p className="text-[9px] uppercase tracking-[0.18em] text-emerald-600 font-bold">
              {user.role || "Official"}
            </p>
          </div>

          {/* SIGN OUT */}
          <button
            type="button"
            onClick={signOut}
            className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs text-gray-500 transition hover:bg-[#f0f4f1] hover:text-gray-900"
          >
            <LogOut size={15} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* PAGE CONTENT: Updated to ml-56 to match w-56 */}
      <main className="ml-56 min-h-screen">
        <Outlet />
      </main>

    </div>
  );
}

export default Dashboard;