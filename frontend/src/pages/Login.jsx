import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Leaf, ShieldCheck } from "lucide-react";

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Email and password are required.");
      return;
    }

    localStorage.setItem(
      "forestwatch_user",
      JSON.stringify({ email, role: "Official" }),
    );

    navigate("/dashboard/alerts");
  };

  return (
    <div className="grid min-h-screen bg-[#080c0a] text-white md:grid-cols-2">
      <div className="hidden flex-col justify-between border-r border-[#26342c] bg-[#0d1511] p-10 lg:p-14 md:flex">
        <Link to="/" className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-700">
            <Leaf size={19} />
          </span>
          <span className="font-semibold">VanaNetra</span>
        </Link>

        <div className="max-w-xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#304037] px-3 py-1.5 text-xs text-gray-300">
            <ShieldCheck size={14} className="text-emerald-400" />
            Official Access
          </span>

          <h1 className="mt-5 text-3xl font-semibold leading-tight lg:text-5xl">
            Operations access for forestry officials.
          </h1>

          <p className="mt-5 max-w-lg leading-7 text-gray-400">
            Live deforestation alerts, region severity maps, loss trends and
            downloadable audit reports.
          </p>
        </div>

        <p className="text-xs uppercase tracking-[0.24em] text-gray-600">
          Restricted system · Activity is logged
        </p>
      </div>

      <div className="flex items-center justify-center bg-[#080c0a] px-6 py-12 sm:px-12">
        <div className="w-full max-w-md rounded-2xl border border-[#26342c] bg-[#101713] p-7 sm:p-9">
          <div className="mb-8">
            <p className="text-xs uppercase tracking-[0.22em] text-emerald-400">
              Officials Console
            </p>
            <h2 className="mt-3 text-3xl font-semibold">Sign in</h2>
            <p className="mt-2 text-sm text-gray-500">
              Use your official credentials.
            </p>
          </div>

          {error && (
            <div className="mb-5 rounded-lg border border-red-900/70 bg-red-950/40 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-2 block text-xs font-semibold tracking-[0.16em] text-gray-500">
                EMAIL
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="official@example.com"
                className="w-full rounded-lg border border-[#304037] bg-[#080c0a] px-4 py-3 text-sm text-white outline-none transition placeholder:text-gray-700 focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold tracking-[0.16em] text-gray-500">
                PASSWORD
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full rounded-lg border border-[#304037] bg-[#080c0a] px-4 py-3 text-sm text-white outline-none transition placeholder:text-gray-700 focus:border-emerald-600"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-lg bg-emerald-700 px-4 py-3 text-sm font-semibold transition hover:bg-emerald-600"
            >
              Sign in
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            No account?{" "}
            <Link to="/register" className="font-medium text-emerald-400 hover:text-emerald-300">
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
