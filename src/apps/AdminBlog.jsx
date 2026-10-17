// Admin → Blog: write, preview and publish posts (Markdown, sanitized on render).
import { useCallback, useEffect, useMemo, useState } from "react";
import { C } from "./ui";
import { api } from "./adminApi";
import { LogoPicker } from "./AdminSponsors";
import { renderMarkdown, slugify } from "../../shared/markdown.js";
import { MD_CSS } from "../blog/BlogPost";

const small = { background: "none", border: `1px solid ${C.borderH}`, color: C.muted, padding: "6px 10px", borderRadius: 4, cursor: "pointer", fontSize: 12 };
const toLocalInput = (iso) => { const d = iso ? new Date(iso) : new Date(); const z = new Date(d.getTime() - d.getTimezoneOffset() * 60000); return z.toISOString().slice(0, 16); };
const fmt = (iso) => new Date(iso).toLocaleString("en-US", { timeZone: "America/New_York", dateStyle: "medium", timeStyle: "short" }) + " ET";
const BLANK = { title: "", slug: "", excerpt: "", body: "## First heading\n\nWrite your post here. Use **bold**, *italic*, [links](https://example.com), lists and ### sub-headings.\n", status: "draft", publishAt: "", cover: "", coverAlt: "" };

function Editor({ post, staticSlugs, onSaved, onClose }) {
  const [f, setF] = useState(() => ({ ...BLANK, ...post, publishAt: toLocalInput(post?.publishAt) }));
  const [slugTouched, setSlugTouched] = useState(!!post?.id);
  const [coverUrls, setCoverUrls] = useState(post?.cover ? { cover: `/api/media/${post.cover}/cover.webp` } : null);
  const [msg, setMsg] = useState("");
  const html = useMemo(() => renderMarkdown(f.body).html, [f.body]);
  const set = (k) => (e) => {
    const v = e.target.value;
    setF((x) => ({ ...x, [k]: v, ...(k === "title" && !slugTouched ? { slug: slugify(v) } : {}) }));
  };
  const save = async (status) => {
    setMsg("Saving…");
    const body = { ...f, status: status || f.status, publishAt: new Date(f.publishAt).toISOString() };
    try {
      const d = post?.id ? await api(`posts?id=${post.id}`, { method: "PUT", body: JSON.stringify(body) }) : await api("posts", { method: "POST", body: JSON.stringify(body) });
      setMsg(d.post.status === "published" ? (Date.parse(d.post.publishAt) > Date.now() ? `Scheduled for ${fmt(d.post.publishAt)} ✓` : "Published ✓") : "Draft saved ✓");
      onSaved(d.post);
    } catch (e) { setMsg(e.message); }
  };
  const lab = (t, extra) => <label className="hv-lab">{t}{extra && <span style={{ color: C.dim, fontWeight: 400 }}> {extra}</span>}</label>;
  return (
    <div className="hv-card" style={{ padding: 18, marginBottom: 16 }}>
      <style>{MD_CSS}{`.hv-ed-grid{display:grid;gap:14px;grid-template-columns:1fr}@media(min-width:980px){.hv-ed-grid{grid-template-columns:1fr 1fr}}`}</style>
      <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", marginBottom: 10 }}>
        <div>{lab("Title")}<input className="hv-in" name="title" style={{ padding: "9px 10px" }} maxLength={140} value={f.title} onChange={set("title")} /></div>
        <div>{lab("Slug", "(URL: /blog/" + (f.slug || "…") + ")")}<input className="hv-in" name="slug" style={{ padding: "9px 10px" }} maxLength={80} value={f.slug} onChange={(e) => { setSlugTouched(true); setF({ ...f, slug: slugify(e.target.value) }); }} />{staticSlugs.includes(f.slug) && <div style={{ color: C.red, fontSize: 12 }}>That slug is taken.</div>}</div>
      </div>
      <div style={{ marginBottom: 10 }}>{lab("Excerpt / meta description", `(${f.excerpt.length}/300 — aim for 120–160)`)}<textarea className="hv-in" name="excerpt" rows={2} maxLength={300} style={{ padding: "9px 10px", fontSize: 14 }} value={f.excerpt} onChange={set("excerpt")} /></div>
      <div className="hv-ed-grid">
        <div>{lab("Body (Markdown)", "— # or ## = section heading, ### = sub-heading")}<textarea className="hv-in" name="body" rows={22} style={{ fontFamily: "ui-monospace,monospace", fontSize: 13, padding: 10 }} value={f.body} onChange={set("body")} /></div>
        <div>{lab("Live preview")}<div className="hv-md" data-testid="md-preview" style={{ border: `1px solid ${C.border}`, borderRadius: 6, padding: "4px 16px", maxHeight: 520, overflow: "auto", background: C.bg }}><h1 style={{ fontSize: 28, fontWeight: 900, margin: "14px 0" }}>{f.title || "Title"}</h1><div dangerouslySetInnerHTML={{ __html: html }} /></div></div>
      </div>
      <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", marginTop: 12 }}>
        <div>{lab("Cover image (optional)")}<LogoPicker purpose="cover" value={f.cover} urls={coverUrls} onChange={(id, u) => { setF((x) => ({ ...x, cover: id })); setCoverUrls(u); }} /></div>
        <div>
          {lab("Cover alt text")}<input className="hv-in" name="coverAlt" style={{ padding: "9px 10px", marginBottom: 10 }} maxLength={160} value={f.coverAlt} onChange={set("coverAlt")} />
          {lab("Publish date", "(your time)")}<input className="hv-in" name="publishAt" type="datetime-local" style={{ padding: "9px 10px", marginBottom: 10 }} value={f.publishAt} onChange={set("publishAt")} />
          {lab("Status")}<select className="hv-in" name="status" style={{ padding: "9px 10px" }} value={f.status} onChange={set("status")}><option value="draft">Draft (not public)</option><option value="published">Published</option></select>
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 14, alignItems: "center", flexWrap: "wrap" }}>
        <button className="hv-btn hv-ghost" style={{ width: "auto", padding: "10px 16px" }} onClick={() => save("draft")} data-testid="post-save-draft">Save draft</button>
        <button className="hv-btn" style={{ width: "auto", padding: "10px 16px" }} onClick={() => confirm("Publish this post on the public blog?") && save("published")} data-testid="post-publish">Publish</button>
        <button style={small} onClick={onClose}>Close</button>
        <span style={{ fontSize: 13, color: C.muted }}>{msg}</span>
      </div>
    </div>
  );
}

export default function AdminBlog({ onOut }) {
  const [posts, setPosts] = useState(null), [staticSlugs, setStatic] = useState([]), [editing, setEditing] = useState(null), [err, setErr] = useState("");
  const load = useCallback(async () => { try { const d = await api("posts"); setPosts(d.posts); setStatic(d.staticSlugs); } catch (e) { if (e.auth) onOut(); else setErr(e.message); } }, [onOut]);
  useEffect(() => { load(); }, [load]);
  const del = async (p) => { if (!confirm(`Delete "${p.title}"? This can't be undone.`)) return; try { await api(`posts?id=${p.id}`, { method: "DELETE" }); if (editing?.id === p.id) setEditing(null); load(); } catch (e) { setErr(e.message); } };
  if (err) return <div style={{ color: C.red }}>{err}</div>;
  if (!posts) return <div style={{ color: C.muted }}>Loading…</div>;
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6, flexWrap: "wrap", gap: 10 }}>
        <h1 style={{ fontSize: 26, fontWeight: 900 }}>Blog</h1>
        <button className="hv-btn" style={{ width: "auto", padding: "9px 16px" }} onClick={() => setEditing({})} data-testid="post-new">+ New post</button>
      </div>
      <p style={{ fontSize: 13, color: C.dim, marginBottom: 14 }}>Drafts are private. Published posts appear on <a href="/blog" target="_blank" rel="noopener" style={{ color: C.gold }}>/blog</a>, the sitemap and the <a href="/blog/rss.xml" target="_blank" rel="noopener" style={{ color: C.gold }}>RSS feed</a> once their publish date arrives. The {staticSlugs.length} original articles are built into the site and aren't edited here.</p>
      {editing && <Editor key={editing.id || "new"} post={editing.id ? editing : null} staticSlugs={staticSlugs} onSaved={(p) => { setEditing(p); load(); }} onClose={() => setEditing(null)} />}
      {posts.length === 0 && <div style={{ color: C.dim }}>No posts yet.</div>}
      {posts.map((p) => (
        <div key={p.id} className="hv-card" style={{ padding: 14, marginBottom: 8, display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }} data-post={p.id}>
          <div style={{ flex: 1, minWidth: 220 }}>
            <b>{p.title}</b> <span style={{ fontSize: 11, fontWeight: 800, color: p.status === "published" ? C.green : C.gold }}>{p.status === "published" ? (Date.parse(p.publishAt) > Date.now() ? "SCHEDULED" : "PUBLISHED") : "DRAFT"}</span>
            <div style={{ fontSize: 12, color: C.dim }}>/blog/{p.slug} · {fmt(p.publishAt)} · updated {fmt(p.updatedAt)}</div>
          </div>
          {p.status === "published" && <a href={`/blog/${p.slug}`} target="_blank" rel="noopener" style={{ ...small, textDecoration: "none" }}>View</a>}
          <button style={small} onClick={() => setEditing(p)}>Edit</button>
          <button style={{ ...small, color: C.red, borderColor: `${C.red}80` }} onClick={() => del(p)}>Delete</button>
        </div>
      ))}
    </div>
  );
}
