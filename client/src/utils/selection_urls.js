import {
  isValidSelectionTypeSlug,
  selectionSlugFromType,
} from "@/utils/selection_type_registry.js";

/** @typedef {{ folder_slug: string, title_slug: string, type_slug: string }} ParsedSelectionPath */

const _NUMERIC_PREFIX_RE = /^(\d+)(?:-(.+))?$/;

/**
 * ASCII slug from display title (Discourse-style suffix in `/selections/{type}/{id}-{slug}`).
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
 * @param {string} param – folder segment (`42` or `42-acme`)
 * @returns {{ folder_slug: string, title_slug: string }}
 */
export function parseSelectionFolderParam(param) {
  const s = String(param || "").trim();
  const m = s.match(_NUMERIC_PREFIX_RE);
  if (!m) return { folder_slug: "", title_slug: "" };
  return {
    folder_slug: m[1],
    title_slug: m[2] != null ? String(m[2]).trim() : "",
  };
}

/**
 * Legacy alias.
 * @param {string} param
 */
export function parseSelectionPathParam(param) {
  return parseSelectionFolderParam(param);
}

/**
 * @param {string} param
 * @returns {boolean}
 */
export function isLegacySelectionFolderParam(param) {
  return Boolean(parseSelectionFolderParam(param).folder_slug);
}

/**
 * @returns {string}
 */
export function selectionHubPath() {
  return "/selections";
}

/**
 * @param {string} type_slug
 * @returns {string}
 */
export function selectionListPath(type_slug) {
  const slug = String(type_slug || "").trim();
  if (!slug || !isValidSelectionTypeSlug(slug)) return selectionHubPath();
  return `/selections/${encodeURIComponent(slug)}`;
}

/**
 * @param {string} type_slug
 * @returns {string}
 */
export function selectionNewPath(type_slug) {
  return `${selectionListPath(type_slug)}/new`;
}

/**
 * @param {{ type_slug?: string, folder_slug: string, internal_name?: string, selection_type?: string }} args
 * @returns {string}
 */
export function selectionDetailPath({
  type_slug,
  folder_slug,
  internal_name,
  selection_type,
}) {
  const id = String(folder_slug || "").trim();
  if (!id) return selectionHubPath();

  let resolved_type_slug = String(type_slug || "").trim();
  if (!resolved_type_slug && selection_type) {
    resolved_type_slug = selectionSlugFromType(selection_type);
  }
  if (!resolved_type_slug) {
    resolved_type_slug = "simple";
  }

  const title = slugifySelectionTitle(internal_name);
  const base = `/selections/${encodeURIComponent(resolved_type_slug)}/${encodeURIComponent(id)}`;
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

/**
 * Parse typed selection route params.
 * @param {{ type_slug?: string, selection_path?: string }} params
 * @returns {ParsedSelectionPath}
 */
export function parseTypedSelectionRouteParams(params) {
  const type_slug = String(params?.type_slug || "").trim();
  const folder_parsed = parseSelectionFolderParam(params?.selection_path);
  return {
    type_slug,
    folder_slug: folder_parsed.folder_slug,
    title_slug: folder_parsed.title_slug,
  };
}
