import {
  isValidSelectionTypeSlug,
  selectionSlugFromType,
} from "@/utils/selection_type_registry.js";

/** @typedef {{ folder_slug: string, type_slug: string }} ParsedSelectionPath */

const _NUMERIC_SEGMENT_RE = /^(\d+)$/;

/**
 * @param {string} param – URL segment (`12`)
 * @returns {{ folder_slug: string }}
 */
export function parseSelectionUrlSegment(param) {
  const s = String(param || "").trim();
  const m = s.match(_NUMERIC_SEGMENT_RE);
  if (!m) return { folder_slug: "" };
  return { folder_slug: m[1] };
}

/** @deprecated use parseSelectionUrlSegment */
export function parseSelectionFolderParam(param) {
  return parseSelectionUrlSegment(param);
}

/** @deprecated use parseSelectionUrlSegment */
export function parseSelectionPathParam(param) {
  return parseSelectionUrlSegment(param);
}

/**
 * @returns {string}
 */
export function selectionHubPath() {
  return "/selections";
}

/**
 * Client list URL: `/selections/box` (storage `box`).
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
 * Client detail URL: `/selections/box/12` (storage `box/12`).
 * @param {{ type_slug?: string, folder_slug: string, selection_type?: string }} args
 * @returns {string}
 */
export function selectionDetailPath({
  type_slug,
  folder_slug,
  selection_type,
}) {
  const id = String(folder_slug || "").trim();
  if (!id) return selectionHubPath();

  let resolved_type_slug = String(type_slug || "").trim();
  if (!resolved_type_slug && selection_type) {
    resolved_type_slug = selectionSlugFromType(selection_type);
  }
  if (!resolved_type_slug || !isValidSelectionTypeSlug(resolved_type_slug)) {
    return selectionHubPath();
  }

  return `/selections/${encodeURIComponent(resolved_type_slug)}/${encodeURIComponent(id)}`;
}

/**
 * Client URL used by Puppeteer PDF export (same as detail path).
 * @param {string} type_slug
 * @param {string} folder_slug
 * @returns {string}
 */
export function selectionStorageExportPath(type_slug, folder_slug) {
  return selectionDetailPath({ type_slug, folder_slug });
}

/**
 * Parse typed selection route params.
 * @param {{ type_slug?: string, selection_path?: string }} params
 * @returns {ParsedSelectionPath}
 */
export function parseTypedSelectionRouteParams(params) {
  const type_slug = String(params?.type_slug || "").trim();
  const segment_parsed = parseSelectionUrlSegment(params?.selection_path);
  return {
    type_slug,
    folder_slug: segment_parsed.folder_slug,
  };
}

/**
 * @param {string} pathname
 * @returns {boolean}
 */
export function isSelectionTypeDetailPath(pathname) {
  const parts = String(pathname || "")
    .split("/")
    .filter(Boolean);
  if (parts.length !== 3) return false;
  if (parts[0] !== "selections") return false;
  return (
    isValidSelectionTypeSlug(parts[1]) && /^\d+$/.test(parts[2])
  );
}

/**
 * Hub, typed list, detail, create — any in-app selection route.
 * @param {string} pathname
 * @returns {boolean}
 */
export function isSelectionAppPath(pathname) {
  const parts = String(pathname || "")
    .split("/")
    .filter(Boolean);
  if (parts.length === 0) return false;
  if (parts[0] !== "selections") return false;
  if (parts.length === 1) return true;
  if (!isValidSelectionTypeSlug(parts[1])) return false;
  if (parts.length === 2) return true;
  if (parts.length === 3) {
    return parts[2] === "new" || /^\d+$/.test(parts[2]);
  }
  return false;
}

/** @deprecated use isSelectionTypeDetailPath */
export function isSelectionShortUrlPath(pathname) {
  return isSelectionTypeDetailPath(pathname);
}

/**
 * Puppeteer PDF print view: detail path + export query (`cols` / `superadmintoken`).
 * Handled in App.vue (static shell) so it does not steal the Open selection route.
 * @param {{ path?: string, query?: Record<string, unknown> }} route
 * @returns {{ type_slug: string, folder_slug: string } | null}
 */
export function selectionPdfExportRouteMatch(route) {
  const query = route?.query || {};
  const has_export_query =
    query.cols != null || query.superadmintoken != null;
  if (!has_export_query) return null;
  if (!isSelectionTypeDetailPath(route?.path)) return null;

  const parts = String(route.path || "")
    .split("/")
    .filter(Boolean);
  return {
    type_slug: decodeURIComponent(parts[1] || ""),
    folder_slug: decodeURIComponent(parts[2] || ""),
  };
}

/**
 * @param {import("vue-router").Route} to
 * @param {import("vue-router").Route} from
 * @param {Function} next
 */
export function validateSelectionTypeRoute(to, from, next) {
  const type_slug = String(to.params.type_slug || "").trim();
  if (!isValidSelectionTypeSlug(type_slug)) {
    next({ name: "NotFound", replace: true });
    return;
  }
  next();
}

/**
 * Redirect short storage-style URLs (`/box/12`) → `/selections/box/12`.
 * @param {import("vue-router").Route} to
 * @returns {{ name: string } | { path: string, query?: object }}
 */
export function redirectShortSelectionPath(to) {
  const type_slug = String(to.params.type_slug || "").trim();
  if (!isValidSelectionTypeSlug(type_slug)) {
    return { name: "NotFound" };
  }
  const rest = String(to.params.rest || "").trim();
  const prefixed_path = rest
    ? `/selections/${encodeURIComponent(type_slug)}/${rest
        .split("/")
        .map(encodeURIComponent)
        .join("/")}`
    : `/selections/${encodeURIComponent(type_slug)}`;
  return { path: prefixed_path, query: to.query };
}
