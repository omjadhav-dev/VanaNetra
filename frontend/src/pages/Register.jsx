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
    <div className="grid min-h-screen bg-[#080c0a] text-white md:grid-cols-2">
      <div className="hidden flex-col justify-between border-r border-[#26342c] bg-[#0d1511] p-10 lg:p-14 md:flex">
        <Link to="/" className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-700">
            <Leaf size={19} />
          </span>
          <span className="font-semibold">ForestWatch</span>
        </Link>

        <div className="max-w-xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#304037] px-3 py-1.5 text-xs text-gray-300">
            <ShieldCheck size={14} className="text-emerald-400" />
            Account Registration
          </span>

          <h1 className="mt-5 text-3xl font-semibold leading-tight lg:text-5xl">
            Join the forest monitoring network.
          </h1>

          <p className="mt-5 max-w-lg leading-7 text-gray-400">
            Create an official account for alerts and reporting, or use public
            analysis tools for satellite imagery.
          </p>
        </div>

        <p className="text-xs uppercase tracking-[0.24em] text-gray-600">
          Secure access · Activity is logged
        </p>
      </div>

      <div className="flex items-center justify-center bg-[#080c0a] px-6 py-10 sm:px-12">
        <div className="w-full max-w-md rounded-2xl border border-[#26342c] bg-[#101713] p-7 sm:p-9">
          <div className="mb-7">
            <p className="text-xs uppercase tracking-[0.22em] text-emerald-400">
              ForestWatch
            </p>
            <h2 className="mt-3 text-3xl font-semibold">Create account</h2>
            <p className="mt-2 text-sm text-gray-500">
              Register as an official or public user.
            </p>
          </div>

          {error && (
            <div className="mb-5 rounded-lg border border-red-900/70 bg-red-950/40 px-4 py-3 text-sm text-red-300">
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
                  className="w-full rounded-lg border border-[#304037] bg-[#080c0a] px-4 py-3 text-sm text-white outline-none transition placeholder:text-gray-700 focus:border-emerald-600"
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
                        : "border-[#304037] bg-[#080c0a] text-gray-400 hover:border-[#496255] hover:text-white"
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="w-full rounded-lg bg-emerald-700 px-4 py-3 text-sm font-semibold transition hover:bg-emerald-600"
            >
              Create account
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-gray-500">
            Already registered?{" "}
            <Link to="/login" className="font-medium text-emerald-400 hover:text-emerald-300">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Register;
