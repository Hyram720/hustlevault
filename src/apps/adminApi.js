// Admin API helper (Bearer session token kept in sessionStorage).
export const KEY = "hv_admin_token";
export const adminToken = () => sessionStorage.getItem(KEY);
export async function api(path, opts = {}) {
  const token = sessionStorage.getItem(KEY);
  const r = await fetch(`/api/hv-admin/${path}`, { ...opts, headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...(opts.headers || {}) } });
  if (r.status === 401) { sessionStorage.removeItem(KEY); throw Object.assign(new Error("Signed out"), { auth: true }); }
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error || "Request failed");
  return d;
}
