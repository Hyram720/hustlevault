import { useLocation } from "react-router-dom";
import { useSEO } from "./seo";

// Direct requests for unknown URLs never load this app. Netlify serves public/404.html
// with HTTP 404. This route covers in-app navigation after a real page has already loaded.
export default function NotFound() {
  const { pathname } = useLocation();
  useSEO({
    title: "Page not found – Hustle Vault",
    description: "That page is not on Hustle Vault.",
    path: pathname || "/404",
    noindex: true,
  });
  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "72px 24px", color: "#FFFFFF", fontFamily: "Georgia, serif" }}>
      <h1 style={{ color: "#C6FF00", letterSpacing: 2, fontSize: 28, textTransform: "uppercase" }}>Page not found</h1>
      <p style={{ marginTop: 16, fontSize: 18 }}>That address is not on Hustle Vault.</p>
      <p style={{ marginTop: 16 }}><a href="/" style={{ color: "#C6FF00" }}>Back to the homepage</a></p>
    </main>
  );
}
