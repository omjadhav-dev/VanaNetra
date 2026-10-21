const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
export const getToken = () => localStorage.getItem("vananetra_token");
export async function api(path, { method = "GET", body, form = false } = {}) {
  const headers = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (!form) headers["Content-Type"] = "application/json";
  const r = await fetch(`${API}${path}`, {
    method,
    headers,
    body: form ? body : body ? JSON.stringify(body) : undefined,
  });
  const data = (await (r.headers.get("content-type") || "").includes(
    "application/json",
  ))
    ? r.json()
    : r.blob();
  if (!r.ok) throw new Error(data.message || "Request failed");
  return data;
}
export function setSession(data) {
  localStorage.setItem("vananetra_token", data.token);
  localStorage.setItem("vananetra_user", JSON.stringify(data.user));
}
export function clearSession() {
  localStorage.removeItem("vananetra_token");
  localStorage.removeItem("vananetra_user");
}
export { API };
