// Chunked image upload to /api/hv-upload (server validates, resizes and re-encodes).
export const ACCEPT = ".png,.jpg,.jpeg,.webp,.svg,image/png,image/jpeg,image/webp,image/svg+xml";
export const MAX = 5 * 1024 * 1024;
export async function uploadImage(file, { purpose = "logo", token, editToken } = {}) {
  if (!file) throw new Error("Choose a file first.");
  if (file.size > MAX) throw new Error("That file is over 5 MB.");
  if (!/\.(png|jpe?g|webp|svg)$/i.test(file.name || "") && !/^image\/(png|jpeg|webp|svg\+xml)$/.test(file.type)) throw new Error("Please choose a PNG, JPG, WebP or SVG file.");
  const auth = token ? { Authorization: `Bearer ${token}` } : {};
  const call = async (path, opts) => {
    const r = await fetch(`/api/hv-upload/${path}`, opts);
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(d.error || "Upload failed — please try again.");
    return d;
  };
  const s = await call("start", { method: "POST", headers: { "Content-Type": "application/json", ...auth }, body: JSON.stringify({ size: file.size, purpose, editToken }) });
  for (let i = 0; i < s.parts; i++) {
    const part = file.slice(i * s.chunkSize, (i + 1) * s.chunkSize);
    await call(`chunk?id=${s.id}&n=${i}`, { method: "PUT", headers: { "Content-Type": "application/octet-stream", "x-upload-key": s.key, ...auth }, body: part });
  }
  return call("finish", { method: "POST", headers: { "Content-Type": "application/json", ...auth }, body: JSON.stringify({ id: s.id, key: s.key }) });
}
