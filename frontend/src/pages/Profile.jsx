import { useState } from "react";
import {
  User,
  Mail,
  Building2,
  ShieldCheck,
  Pencil,
  Save,
  X,
  CheckCircle2,
  BriefcaseBusiness,
} from "lucide-react";

function Profile() {
  const storedUser = JSON.parse(
    localStorage.getItem("forestwatch_user") || "{}"
  );

  const [editing, setEditing] = useState(false);
  const [notice, setNotice] = useState("");

  const [form, setForm] = useState({
    name: storedUser.name || "Forest Official",
    email: storedUser.email || "admin1@gmail.com",
    role: storedUser.role || "Official",
    department:
      storedUser.department || "Forest Monitoring Department",
    designation:
      storedUser.designation || "Monitoring Officer",
  });

  const handleChange = (e) => {
    setForm((current) => ({
      ...current,
      [e.target.name]: e.target.value,
    }));
  };

  const saveProfile = () => {
    const updatedUser = {
      ...storedUser,
      ...form,
    };

    localStorage.setItem(
      "forestwatch_user",
      JSON.stringify(updatedUser)
    );

    setEditing(false);
    setNotice("Profile updated successfully.");

    setTimeout(() => {
      setNotice("");
    }, 2000);
  };

  const cancelEdit = () => {
    setForm({
      name: storedUser.name || "Forest Official",
      email: storedUser.email || "admin1@gmail.com",
      role: storedUser.role || "Official",
      department:
        storedUser.department || "Forest Monitoring Department",
      designation:
        storedUser.designation || "Monitoring Officer",
    });

    setEditing(false);
  };

  return (
    <div className="px-6 py-7 lg:px-8">
      <div className="mx-auto max-w-[1100px]">

        {/* HEADER */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-400">
            Account
          </p>

          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            Official profile
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Manage your ForestWatch account and official information.
          </p>
        </div>

        {/* SUCCESS MESSAGE */}
        {notice && (
          <div className="fixed right-6 top-6 z-[60] flex items-center gap-2 rounded-lg border border-emerald-800 bg-[#10251b] px-4 py-3 text-sm text-emerald-300 shadow-xl">
            <CheckCircle2 size={17} />
            {notice}
          </div>
        )}

        {/* PROFILE CARD */}
        <div className="mt-7 overflow-hidden rounded-xl border border-[#26342c] bg-[#101713]">

          {/* PROFILE HEADER */}
          <div className="flex flex-col gap-5 border-b border-[#26342c] p-6 sm:flex-row sm:items-center sm:justify-between">

            <div className="flex items-center gap-4">

              {/* AVATAR */}
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-emerald-800 bg-emerald-950/60">
                <User
                  size={28}
                  className="text-emerald-400"
                />
              </div>

              <div>
                <h2 className="text-xl font-semibold text-gray-100">
                  {form.name}
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  {form.email}
                </p>

                <div className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-emerald-900 bg-emerald-950/40 px-3 py-1 text-[11px] text-emerald-400">
                  <ShieldCheck size={13} />
                  {form.role}
                </div>
              </div>

            </div>

            {/* EDIT / SAVE */}
            {!editing ? (
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#304037] px-4 py-2.5 text-sm text-gray-300 transition hover:border-emerald-700 hover:bg-[#141d18] hover:text-white"
              >
                <Pencil size={15} />
                Edit profile
              </button>
            ) : (
              <div className="flex gap-2">

                <button
                  type="button"
                  onClick={cancelEdit}
                  className="inline-flex items-center gap-2 rounded-lg border border-[#304037] px-4 py-2.5 text-sm text-gray-400 hover:text-white"
                >
                  <X size={15} />
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={saveProfile}
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-600"
                >
                  <Save size={15} />
                  Save changes
                </button>

              </div>
            )}

          </div>

          {/* INFORMATION */}
          <div className="p-6">

            <p className="mb-5 text-xs font-semibold uppercase tracking-[0.2em] text-gray-600">
              Account information
            </p>

            <div className="grid gap-5 md:grid-cols-2">

              {/* NAME */}
              <div>
                <label className="mb-2 block text-xs text-gray-500">
                  Full name
                </label>

                <div className="relative">
                  <User
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600"
                  />

                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    disabled={!editing}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-[#26342c] bg-[#0b100d] py-3 pl-10 pr-4 text-sm text-gray-200 outline-none transition focus:border-emerald-700 disabled:cursor-default disabled:text-gray-400"
                  />
                </div>
              </div>

              {/* EMAIL */}
              <div>
                <label className="mb-2 block text-xs text-gray-500">
                  Email address
                </label>

                <div className="relative">
                  <Mail
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600"
                  />

                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    disabled={!editing}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-[#26342c] bg-[#0b100d] py-3 pl-10 pr-4 text-sm text-gray-200 outline-none transition focus:border-emerald-700 disabled:cursor-default disabled:text-gray-400"
                  />
                </div>
              </div>

              {/* DESIGNATION */}
              <div>
                <label className="mb-2 block text-xs text-gray-500">
                  Designation
                </label>

                <div className="relative">
                  <BriefcaseBusiness
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600"
                  />

                  <input
                    type="text"
                    name="designation"
                    value={form.designation}
                    disabled={!editing}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-[#26342c] bg-[#0b100d] py-3 pl-10 pr-4 text-sm text-gray-200 outline-none transition focus:border-emerald-700 disabled:cursor-default disabled:text-gray-400"
                  />
                </div>
              </div>

              {/* DEPARTMENT */}
              <div>
                <label className="mb-2 block text-xs text-gray-500">
                  Department
                </label>

                <div className="relative">
                  <Building2
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600"
                  />

                  <input
                    type="text"
                    name="department"
                    value={form.department}
                    disabled={!editing}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-[#26342c] bg-[#0b100d] py-3 pl-10 pr-4 text-sm text-gray-200 outline-none transition focus:border-emerald-700 disabled:cursor-default disabled:text-gray-400"
                  />
                </div>
              </div>

              {/* ROLE */}
              <div>
                <label className="mb-2 block text-xs text-gray-500">
                  Account role
                </label>

                <div className="flex items-center gap-2 rounded-lg border border-[#26342c] bg-[#0b100d] px-4 py-3 text-sm text-gray-400">
                  <ShieldCheck
                    size={16}
                    className="text-emerald-500"
                  />
                  {form.role}
                </div>
              </div>

              {/* ACCOUNT STATUS */}
              <div>
                <label className="mb-2 block text-xs text-gray-500">
                  Account status
                </label>

                <div className="flex items-center gap-2 rounded-lg border border-[#26342c] bg-[#0b100d] px-4 py-3 text-sm text-emerald-400">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  Active
                </div>
              </div>

            </div>
          </div>

          {/* FOOTER */}
          <div className="border-t border-[#26342c] px-6 py-4">
            <p className="text-xs text-gray-600">
              Profile information is stored locally for this frontend
              demonstration.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}

export default Profile;