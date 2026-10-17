// Tiny, safe Markdown -> HTML. Every piece of user text is HTML-escaped first and only a fixed set
// of tags is emitted, so the output is sanitized by construction (no raw HTML passes through).
// Headings: "#"/"##" -> <h2>, "###"+ -> <h3> (the page title is the only <h1>).
export const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

export function safeUrl(u, { images = false } = {}) {
  const s = String(u || "").trim();
  if (/^https:\/\/[^\s"'<>]+$/i.test(s)) return s;
  if (!images && /^mailto:[^\s"'<>]+$/i.test(s)) return s;
  if (/^\/(?!\/)[^\s"'<>]*$/.test(s)) return s; // same-site path
  if (!images && /^#[\w-]+$/.test(s)) return s;
  return null;
}

export const slugify = (s) => String(s || "").toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);

function inline(raw) {
  const codes = [];
  // eslint-disable-next-line no-control-regex
  let s = String(raw).replace(/`([^`]+)`/g, (_, c) => { codes.push(c); return `\u0000${codes.length - 1}\u0000`; });
  s = esc(s);
  // images ![alt](url)
  s = s.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, (m, alt, url) => {
    const u = safeUrl(url.replace(/&amp;/g, "&"), { images: true });
    return u ? `<img src="${esc(u)}" alt="${alt}" loading="lazy">` : alt;
  });
  // links [text](url)
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, text, url) => {
    const u = safeUrl(url.replace(/&amp;/g, "&"));
    if (!u) return text;
    const ext = /^https:/i.test(u) && !/^https:\/\/hustlevault\.app(\/|$)/i.test(u);
    return `<a href="${esc(u)}"${ext ? ' rel="noopener nofollow" target="_blank"' : ""}>${text}</a>`;
  });
  s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>").replace(/__([^_]+)__/g, "<strong>$1</strong>");
  s = s.replace(/(^|[^*\w])\*([^*\n]+)\*(?!\w)/g, "$1<em>$2</em>").replace(/(^|[^_\w])_([^_\n]+)_(?!\w)/g, "$1<em>$2</em>");
  // eslint-disable-next-line no-control-regex
  s = s.replace(/\u0000(\d+)\u0000/g, (_, i) => `<code>${esc(codes[+i])}</code>`);
  return s;
}

export function renderMarkdown(md) {
  const lines = String(md || "").replace(/\r\n?/g, "\n").split("\n");
  const out = [], headings = [], used = new Set();
  let para = [], list = null, quote = [];
  const flushPara = () => { if (para.length) { out.push(`<p>${inline(para.join(" "))}</p>`); para = []; } };
  const flushList = () => { if (list) { out.push(`<${list.t}>${list.items.map((i) => `<li>${inline(i)}</li>`).join("")}</${list.t}>`); list = null; } };
  const flushQuote = () => { if (quote.length) { out.push(`<blockquote><p>${inline(quote.join(" "))}</p></blockquote>`); quote = []; } };
  const flush = () => { flushPara(); flushList(); flushQuote(); };
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^```/.test(line)) {
      flush();
      const code = [];
      for (i++; i < lines.length && !/^```/.test(lines[i]); i++) code.push(lines[i]);
      out.push(`<pre><code>${esc(code.join("\n"))}</code></pre>`);
      continue;
    }
    let m;
    if ((m = line.match(/^(#{1,6})\s+(.+?)\s*#*\s*$/))) {
      flush();
      const tag = m[1].length <= 2 ? "h2" : "h3";
      let id = slugify(m[2]) || "section"; let n = 2; while (used.has(id)) id = `${slugify(m[2])}-${n++}`; used.add(id);
      headings.push({ level: tag === "h2" ? 2 : 3, text: m[2].replace(/[*_`]/g, ""), id });
      out.push(`<${tag} id="${id}">${inline(m[2])}</${tag}>`);
    } else if (/^\s*(-{3,}|\*{3,})\s*$/.test(line)) { flush(); out.push("<hr>"); }
    else if ((m = line.match(/^\s*[-*+]\s+(.*)$/))) { flushPara(); flushQuote(); if (!list || list.t !== "ul") { flushList(); list = { t: "ul", items: [] }; } list.items.push(m[1]); }
    else if ((m = line.match(/^\s*\d+[.)]\s+(.*)$/))) { flushPara(); flushQuote(); if (!list || list.t !== "ol") { flushList(); list = { t: "ol", items: [] }; } list.items.push(m[1]); }
    else if ((m = line.match(/^>\s?(.*)$/))) { flushPara(); flushList(); quote.push(m[1]); }
    else if (!line.trim()) flush();
    else if (list && /^\s{2,}\S/.test(line)) list.items[list.items.length - 1] += " " + line.trim();
    else { flushList(); flushQuote(); para.push(line.trim()); }
  }
  flush();
  return { html: out.join("\n"), headings };
}

export const plainText = (md) => String(md || "").replace(/```[\s\S]*?```/g, " ").replace(/!\[[^\]]*\]\([^)]*\)/g, " ").replace(/\[([^\]]+)\]\([^)]*\)/g, "$1").replace(/[#>*_`~-]+/g, " ").replace(/\s+/g, " ").trim();
export const readMins = (md) => Math.max(1, Math.round(plainText(md).split(" ").length / 220));
