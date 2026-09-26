import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Leaf,
  ShieldCheck,
  ArrowRight,
  Mail,
  Lock,
  Eye,
  EyeOff,
} from "lucide-react";
import { api, setSession } from "../lib/api";

export default function Login() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const submit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError("");

    try {
      const data = await api("/auth/login", {
        method: "POST",
        body: form,
      });

      setSession(data);

      if (data.user.role === "Public") {
        navigate("/");
      } else {
        navigate("/dashboard");
      }
    } catch (error) {
      setError(error.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f6f9f7] text-gray-900 flex items-center justify-center p-6">
      <div className="w-full max-w-5xl overflow-hidden rounded-2xl border border-[#dbe4de] bg-white shadow-xl grid lg:grid-cols-2">

        {/* LEFT SIDE */}

        <div className="relative hidden lg:flex min-h-[620px] flex-col justify-between overflow-hidden bg-gradient-to-br from-[#064e3b] via-[#047857] to-[#065f46] p-10 text-white">

          {/* CLICKABLE LOGO */}

          <Link
            to="/"
            className="relative z-10 flex items-center gap-3 w-fit"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/15 border border-white/20">
              <Leaf size={22} />
            </div>

            <div>
              <p className="text-lg font-semibold">
                VanaNetra
              </p>

              <p className="text-[10px] uppercase tracking-[0.2em] text-emerald-100">
                AI-Powered Forest Protection
              </p>
            </div>
          </Link>

          {/* CONTENT */}

          <div className="relative z-10">

            <p className="text-sm font-medium uppercase tracking-[0.25em] text-emerald-200">
              Official Access
            </p>

            <h1 className="mt-4 max-w-md text-4xl font-semibold leading-tight">
              Smarter Detection.
              <br />

              <span className="text-emerald-200">
                Greener Tomorrow.
              </span>
            </h1>

            <p className="mt-5 max-w-md text-sm leading-6 text-emerald-50/90">
              Monitor forest loss, verify satellite detections,
              and maintain an auditable response workflow.
            </p>

          </div>

          {/* FOOTER */}

          <div className="relative z-10 flex items-center gap-2 text-xs text-emerald-100">
            <ShieldCheck size={16} />

            Restricted operations console
          </div>

        </div>

        {/* RIGHT SIDE */}

        <div className="flex items-center justify-center p-7 sm:p-10">

          <form
            onSubmit={submit}
            className="w-full max-w-md"
          >

            {/* MOBILE LOGO */}

            <Link
              to="/"
              className="flex items-center gap-2 text-emerald-700 mb-8 lg:hidden w-fit"
            >
              <Leaf size={22} />

              <span className="font-semibold">
                VanaNetra
              </span>
            </Link>

            {/* HEADING */}

            <div>

              <p className="text-sm font-medium uppercase tracking-[0.18em] text-emerald-700">
                Official Access
              </p>

              <h2 className="mt-2 text-3xl font-semibold text-gray-900">
                Welcome Back
              </h2>

              <p className="mt-2 text-sm text-gray-500">
                Sign in to your VanaNetra account.
              </p>

            </div>

            {/* ERROR */}

            {error && (
              <div className="mt-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                {error}
              </div>
            )}

            {/* EMAIL */}

            <label className="block mt-7 text-sm font-medium text-gray-700">

              Email Address

              <div className="relative mt-2">

                <Mail
                  size={17}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-600"
                />

                <input
                  type="email"
                  required
                  placeholder="Enter your email"
                  value={form.email}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      email: e.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-[#dbe4de] bg-white py-3 pl-11 pr-4 text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                />

              </div>

            </label>

            {/* PASSWORD */}

            <label className="block mt-5 text-sm font-medium text-gray-700">

              Password

              <div className="relative mt-2">

                <Lock
                  size={17}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-600"
                />

                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      password: e.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-[#dbe4de] bg-white py-3 pl-11 pr-11 text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(!showPassword)
                  }
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-emerald-700"
                >
                  {showPassword ? (
                    <EyeOff size={17} />
                  ) : (
                    <Eye size={17} />
                  )}
                </button>

              </div>

            </label>

            {/* LOGIN BUTTON */}

            <button
              type="submit"
              disabled={loading}
              className="mt-7 w-full rounded-xl bg-emerald-700 py-3.5 font-medium text-white transition hover:bg-emerald-800 disabled:opacity-50"
            >

              {loading
                ? "Signing in..."
                : "Sign In"}

              <ArrowRight
                className="ml-2 inline"
                size={17}
              />

            </button>

            {/* REGISTER */}

            <p className="mt-6 text-center text-sm text-gray-500">

              Don't have an account?{" "}

              <Link
                to="/register"
                className="font-medium text-emerald-700 hover:text-emerald-800"
              >
                Register
              </Link>

            </p>

            {/* FOOTER */}

            <div className="mt-8 border-t border-[#e2e8e4] pt-5 text-center">

              <p className="text-xs text-gray-400">
                VanaNetra Forest Monitoring System
              </p>

            </div>

          </form>

        </div>

      </div>
    </div>
  );
}