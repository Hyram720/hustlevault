// In production the API is served by Netlify Functions on the same origin,
// so the base is empty (relative /api/* paths). In local dev, point at the
// Express server unless VITE_API_URL overrides it.
export const API = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "http://localhost:3001" : "");
