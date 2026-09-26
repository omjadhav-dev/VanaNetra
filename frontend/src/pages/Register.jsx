import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Leaf,
  ArrowRight,
  User,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  Building2,
} from "lucide-react";
import { api, setSession } from "../lib/api";

export default function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    phone: "",
    accountType: "Public",
    department: "",
    designation: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const submit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError("");

    try {
      const data = await api("/auth/register", {
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
      setError(error.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "mt-2 w-full rounded-xl border border-[#dbe4de] bg-white py-3 px-4 text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100";

  return (
    <div className="min-h-screen bg-[#f6f9f7] text-gray-900 flex items-center justify-center p-6">

      <div className="w-full max-w-5xl overflow-hidden rounded-2xl border border-[#dbe4de] bg-white shadow-xl grid lg:grid-cols-2">

        {/* LEFT SIDE */}

        <div className="relative hidden lg:flex min-h-[680px] flex-col justify-between overflow-hidden bg-gradient-to-br from-[#064e3b] via-[#047857] to-[#065f46] p-10 text-white">

          {/* CLICKABLE LOGO */}

          <Link
            to="/"
            className="flex items-center gap-3 w-fit"
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

          <div>

            <p className="text-sm font-medium uppercase tracking-[0.25em] text-emerald-200">
              Forest Intelligence
            </p>

            <h1 className="mt-4 max-w-md text-4xl font-semibold leading-tight">

              Smarter Detection.
              <br />

              <span className="text-emerald-200">
                Greener Tomorrow.
              </span>

            </h1>

            <p className="mt-5 max-w-md text-sm leading-6 text-emerald-50/90">
              Create your VanaNetra account to explore
              forest intelligence, satellite analysis and
              deforestation monitoring.
            </p>

            <div className="mt-8 space-y-4">

              <div className="flex items-center gap-3">

                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10">
                  <Leaf size={17} />
                </div>

                <span className="text-sm text-emerald-50">
                  Forest monitoring
                </span>

              </div>

              <div className="flex items-center gap-3">

                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10">
                  <Building2 size={17} />
                </div>

                <span className="text-sm text-emerald-50">
                  Official operations
                </span>

              </div>

            </div>

          </div>

          <p className="text-xs text-emerald-100">
            VanaNetra Forest Monitoring System
          </p>

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
              className="flex items-center gap-2 text-emerald-700 mb-7 lg:hidden w-fit"
            >

              <Leaf size={22} />

              <span className="font-semibold">
                VanaNetra
              </span>

            </Link>

            {/* HEADING */}

            <p className="text-sm font-medium uppercase tracking-[0.18em] text-emerald-700">
              Registration
            </p>

            <h1 className="mt-2 text-3xl font-semibold text-gray-900">
              Create Account
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              Choose how you will use the platform.
            </p>

            {/* ERROR */}

            {error && (
              <div className="mt-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                {error}
              </div>
            )}

            {/* ACCOUNT TYPE */}

            <div className="grid grid-cols-2 gap-3 mt-6">

              {[
                ["Public", "Public explorer & analysis"],
                ["Official", "Forest monitoring console"],
              ].map(([value, text]) => (

                <button
                  type="button"
                  key={value}
                  onClick={() =>
                    setForm({
                      ...form,
                      accountType: value,
                    })
                  }
                  className={`rounded-xl border p-4 text-left transition ${
                    form.accountType === value
                      ? "border-emerald-600 bg-emerald-50 ring-1 ring-emerald-200"
                      : "border-[#dbe4de] bg-white hover:border-emerald-300"
                  }`}
                >

                  <p
                    className={`font-medium ${
                      form.accountType === value
                        ? "text-emerald-800"
                        : "text-gray-800"
                    }`}
                  >
                    {value}
                  </p>

                  <p className="mt-1 text-xs text-gray-500">
                    {text}
                  </p>

                </button>

              ))}

            </div>

            {/* FULL NAME */}

            <label className="block mt-5 text-sm font-medium text-gray-700">

              Full Name

              <div className="relative">

                <User
                  size={17}
                  className="absolute left-4 top-[25px] -translate-y-1/2 text-emerald-600"
                />

                <input
                  required
                  type="text"
                  placeholder="Enter your full name"
                  className={`${inputClass} pl-11`}
                  value={form.fullName}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      fullName: e.target.value,
                    })
                  }
                />

              </div>

            </label>

            {/* EMAIL + PHONE */}

            <div className="grid sm:grid-cols-2 gap-4 mt-4">

              <label className="text-sm font-medium text-gray-700">

                Email

                <div className="relative">

                  <Mail
                    size={16}
                    className="absolute left-4 top-[25px] -translate-y-1/2 text-emerald-600"
                  />

                  <input
                    required
                    type="email"
                    placeholder="Enter email"
                    className={`${inputClass} pl-10`}
                    value={form.email}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        email: e.target.value,
                      })
                    }
                  />

                </div>

              </label>

              <label className="text-sm font-medium text-gray-700">

                Phone

                <div className="relative">

                  <Phone
                    size={16}
                    className="absolute left-4 top-[25px] -translate-y-1/2 text-emerald-600"
                  />

                  <input
                    type="text"
                    placeholder="Phone number"
                    className={`${inputClass} pl-10`}
                    value={form.phone}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        phone: e.target.value,
                      })
                    }
                  />

                </div>

              </label>

            </div>

            {/* PASSWORD */}

            <label className="block mt-4 text-sm font-medium text-gray-700">

              Password

              <div className="relative">

                <Lock
                  size={17}
                  className="absolute left-4 top-[25px] -translate-y-1/2 text-emerald-600"
                />

                <input
                  required
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a password"
                  className={`${inputClass} pl-11 pr-11`}
                  value={form.password}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      password: e.target.value,
                    })
                  }
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(!showPassword)
                  }
                  className="absolute right-4 top-[25px] -translate-y-1/2 text-gray-400 hover:text-emerald-700"
                >

                  {showPassword ? (
                    <EyeOff size={17} />
                  ) : (
                    <Eye size={17} />
                  )}

                </button>

              </div>

            </label>

            {/* OFFICIAL FIELDS */}

            {form.accountType === "Official" && (

              <div className="grid sm:grid-cols-2 gap-4 mt-4">

                <label className="text-sm font-medium text-gray-700">

                  Department

                  <input
                    className={inputClass}
                    placeholder="Department"
                    value={form.department}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        department: e.target.value,
                      })
                    }
                  />

                </label>

                <label className="text-sm font-medium text-gray-700">

                  Designation

                  <input
                    className={inputClass}
                    placeholder="Designation"
                    value={form.designation}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        designation: e.target.value,
                      })
                    }
                  />

                </label>

              </div>

            )}

            {/* REGISTER BUTTON */}

            <button
              type="submit"
              disabled={loading}
              className="mt-6 w-full rounded-xl bg-emerald-700 py-3.5 font-medium text-white transition hover:bg-emerald-800 disabled:opacity-50"
            >

              {loading
                ? "Creating account..."
                : "Create Account"}

              <ArrowRight
                className="ml-2 inline"
                size={17}
              />

            </button>

            {/* LOGIN LINK */}

            <p className="mt-5 text-center text-sm text-gray-500">

              Already registered?{" "}

              <Link
                to="/login"
                className="font-medium text-emerald-700 hover:text-emerald-800"
              >
                Sign In
              </Link>

            </p>

          </form>

        </div>

      </div>

    </div>
  );
}