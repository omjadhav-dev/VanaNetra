import { NavLink, Outlet, useNavigate } from "react-router-dom";
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

  const user = JSON.parse(
    localStorage.getItem("forestwatch_user") || "{}"
  );

  const signOut = () => {
    localStorage.removeItem("forestwatch_user");
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-[#080c0a] text-white">

      {/* SIDEBAR */}
      <aside className="fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-[#202b25] bg-[#0b100d]">

        {/* LOGO */}
        <div className="flex h-[72px] items-center gap-3 border-b border-[#202b25] px-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-700">
            <Leaf size={19} />
          </div>

          <div>
            <p className="font-semibold">
              ForestWatch
            </p>

            <p className="text-[9px] uppercase tracking-[0.2em] text-gray-600">
              Officials Console
            </p>
          </div>
        </div>

        {/* NAVIGATION */}
        <nav className="flex-1 px-3 py-6">

          <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-gray-600">
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
                    `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                      isActive
                        ? "bg-emerald-700 text-white shadow-sm"
                        : "text-gray-400 hover:bg-[#101713] hover:text-white"
                    }`
                  }
                >
                  <Icon size={18} />
                  {item.name}
                </NavLink>
              );
            })}
          </div>
        </nav>

        {/* PROFILE + SIGN OUT */}
        <div className="border-t border-[#202b25] p-3">

          {/* PROFILE BUTTON */}
          <button
            type="button"
            onClick={() => navigate("/dashboard/profile")}
            className="group mb-2 flex w-full items-center gap-3 rounded-lg border border-[#26342c] bg-[#101713] p-3 text-left transition hover:border-emerald-800 hover:bg-[#141d18]"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#304037] bg-emerald-950/40">
              <User
                size={16}
                className="text-emerald-400"
              />
            </div>

            <div className="min-w-0 flex-1">

              <p className="truncate text-sm text-gray-200">
                {user.name || "Forest Official"}
              </p>

              <p className="mt-0.5 truncate text-[11px] text-gray-500">
                {user.email || "admin1@gmail.com"}
              </p>

            </div>

            <ChevronRight
              size={15}
              className="shrink-0 text-gray-600 transition group-hover:translate-x-0.5 group-hover:text-emerald-400"
            />
          </button>

          {/* ROLE */}
          <div className="px-3 pb-2">
            <p className="text-[9px] uppercase tracking-[0.2em] text-emerald-500">
              {user.role || "Official"}
            </p>
          </div>

          {/* SIGN OUT */}
          <button
            type="button"
            onClick={signOut}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-gray-500 transition hover:bg-[#101713] hover:text-white"
          >
            <LogOut size={17} />
            Sign Out
          </button>

        </div>
      </aside>

      {/* PAGE CONTENT */}
      <main className="ml-64 min-h-screen">
        <Outlet />
      </main>

    </div>
  );
}

export default Dashboard;