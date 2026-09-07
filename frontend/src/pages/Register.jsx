import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Leaf, ShieldCheck } from "lucide-react";

function Register() {
  const navigate = useNavigate();
  const [accountType, setAccountType] = useState("");
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    phone: "",
  });

  const handleChange = (e) => {
    setFormData((current) => ({
      ...current,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (!accountType) {
      setError("Please select an account type.");
      return;
    }

    localStorage.setItem(
      "forestwatch_user",
      JSON.stringify({
        email: formData.email,
        name: formData.fullName,
        role: accountType,
      }),
    );

    if (accountType === "Official") {
      navigate("/dashboard/alerts");
    } else {
      navigate("/analyze");
    }
  };

  return (
    <div className="grid min-h-screen bg-[#f6f9f7] text-gray-900 md:grid-cols-2">
      <div className="hidden flex-col justify-between border-r border-[#dbe4de] bg-gradient-to-br from-emerald-700 to-emerald-900 p-10 text-white lg:p-14 md:flex">
        <Link to="/" className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-700">
            <Leaf size={19} />
          </span>
          <span className="font-semibold text-white">VanaNetra</span>
        </Link>

        <div className="max-w-xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/30 px-3 py-1.5 text-xs text-emerald-50">
            <ShieldCheck size={14} className="text-emerald-200" />
            Account Registration
          </span>

          <h1 className="mt-5 text-3xl font-semibold leading-tight lg:text-5xl">
            Join the forest monitoring network.
          </h1>

          <p className="mt-5 max-w-lg leading-7 text-emerald-50/90">
            Create an official account for alerts and reporting, or use public
            analysis tools for satellite imagery.
          </p>
        </div>

        <p className="text-xs uppercase tracking-[0.24em] text-emerald-100/70">
          Secure access · Activity is logged
        </p>
      </div>

      <div className="flex items-center justify-center bg-[#f6f9f7] px-6 py-10 sm:px-12">
        <div className="w-full max-w-md rounded-2xl border border-[#dbe4de] bg-[#ffffff] p-7 sm:p-9">
          <div className="mb-7">
            <p className="text-xs uppercase tracking-[0.22em] text-emerald-600">
              VanaNetra
            </p>
            <h2 className="mt-3 text-3xl font-semibold text-gray-900">Create account</h2>
            <p className="mt-2 text-sm text-gray-500">
              Register as an official or public user.
            </p>
          </div>

          {error && (
            <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {[
              ["fullName", "FULL NAME", "text", "Enter your full name"],
              ["email", "EMAIL", "email", "official@example.com"],
              ["password", "PASSWORD", "password", "Create a password"],
              ["phone", "PHONE", "tel", "Enter your phone number"],
            ].map(([name, label, type, placeholder]) => (
              <div key={name}>
                <label className="mb-2 block text-xs font-semibold tracking-[0.16em] text-gray-500">
                  {label}
                </label>
                <input
                  name={name}
                  type={type}
                  value={formData[name]}
                  onChange={handleChange}
                  placeholder={placeholder}
                  required
                  className="w-full rounded-lg border border-[#c9d6cd] bg-white px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-emerald-600"
                />
              </div>
            ))}

            <div>
              <label className="mb-2 block text-xs font-semibold tracking-[0.16em] text-gray-500">
                ACCOUNT TYPE
              </label>

              <div className="grid grid-cols-2 gap-3">
                {["Official", "Public"].map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setAccountType(accountType === type ? "" : type)}
                    className={`rounded-lg border px-4 py-3 text-sm font-medium transition ${
                      accountType === type
                        ? "border-emerald-600 bg-emerald-700 text-white"
                        : "border-[#c9d6cd] bg-white text-gray-500 hover:border-[#8fab9a] hover:text-gray-900"
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="w-full rounded-lg bg-emerald-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-600"
            >
              Create account
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-gray-500">
            Already registered?{" "}
            <Link to="/login" className="font-medium text-emerald-600 hover:text-emerald-700">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Register;
