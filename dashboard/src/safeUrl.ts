// Links and image sources that come from the engine are operator-controlled strings, not trusted markup. Anything that
// could carry a scheme the browser would execute (javascript:, data:, vbscript:, file:) is rejected, and a relative
// path is allowed only when it stays on this origin.

/** An http(s) URL, or a root-relative path. null for every other shape, including empty and undefined. */
export function safeHref(raw: string | null | undefined): string | null {
  const s = (raw ?? "").trim();
  if (!s) return null;
  // Root-relative: same origin by construction, and no scheme to abuse.
  if (s.startsWith("/") && !s.startsWith("//")) return s;
  let u: URL;
  try {
    u = new URL(s);
  } catch {
    return null;
  }
  return u.protocol === "http:" || u.protocol === "https:" ? u.toString() : null;
}

/**
 * An image source. Stricter than safeHref on purpose: a portrait is always served by this engine, so only a
 * root-relative path or the inline placeholder is accepted. An absolute URL is dropped, which means no <img> can turn
 * into a request to another host.
 */
export function safeImg(raw: string | null | undefined): string | null {
  const s = (raw ?? "").trim();
  if (s.startsWith("data:image/svg+xml,")) return s;
  return s.startsWith("/") && !s.startsWith("//") ? s : null;
}
