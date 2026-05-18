/** @typedef {{ folder_slug: string, title_slug: string }} ParsedSelectionPath */

const _NUMERIC_PREFIX_RE = /^(\d+)(?:-(.+))?$/;

/**
 * ASCII slug from display title (Discourse-style suffix in `/selections/{id}-{slug}`).
 * @param {string} str
 * @returns {string}
 */
export function slugifySelectionTitle(str) {
  const raw = String(str || "").trim();
  if (!raw) return "";
  const s = raw
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return s.slice(0, 80);
}

/**
 * @param {string} param – raw `selection_path` route param
 * @returns {ParsedSelectionPath}
 */
export function parseSelectionPathParam(param) {
  const s = String(param || "").trim();
  const m = s.match(_NUMERIC_PREFIX_RE);
  if (!m) return { folder_slug: "", title_slug: "" };
  return {
    folder_slug: m[1],
    title_slug: m[2] != null ? String(m[2]).trim() : "",
  };
}

/**
 * @param {{ folder_slug: string, internal_name?: string }} args
 * @returns {string} path starting with `/selections/`
 */
export function selectionDetailPath({ folder_slug, internal_name }) {
  const id = String(folder_slug || "").trim();
  if (!id) return "/selections";
  const title = slugifySelectionTitle(internal_name);
  const base = `/selections/${encodeURIComponent(id)}`;
  if (!title) return base;
  return `${base}-${encodeURIComponent(title)}`;
}

/**
 * @param {string} internal_name
 * @param {string} title_slug – suffix from URL (already slug-shaped)
 */
export function selectionTitleSlugMatches(internal_name, title_slug) {
  const expected = slugifySelectionTitle(internal_name);
  const got = String(title_slug || "").trim();
  if (!expected && !got) return true;
  return got === expected;
}
