import { gem_pricing_total_column_keys } from "@/mixins/GemPricing.js";
import { resolveAppPublicOrigin } from "@/utils/app_public_url.js";

/**
 * @param {object} gem
 * @param {number[]} [resolutions]
 * @returns {string}
 */
export function resolveGemCoverThumbRelative(
  gem,
  resolutions = [320, 640, 1600, 50]
) {
  const cover = gem?.$cover;
  const path = gem?.$path;
  if (!cover || !path) return "";
  for (const resolution of resolutions) {
    const thumb_path = cover[resolution];
    if (thumb_path) return `./thumbs/${path}/${thumb_path}`;
  }
  return "";
}

/**
 * App-relative path to the gem folder cover image (`meta_cover.jpeg`).
 * @param {object} gem
 * @returns {string}
 */
export function resolveGemCoverMediaRelative(gem) {
  const folder_path = String(gem?.$path || "").trim();
  const cover = gem?.$cover;
  if (!folder_path || !cover) return "";
  const original = String(cover.original || "").trim();
  const filename = original || "meta_cover.jpeg";
  return `/${folder_path}/${filename}`;
}

/**
 * @param {object} gem
 * @param {string} [origin]
 * @returns {string}
 */
export function resolveGemCoverAbsoluteUrl(gem, origin = "") {
  const relative = resolveGemCoverMediaRelative(gem);
  if (!relative) return "";
  const resolved_origin = origin || resolveAppPublicOrigin() || "";
  return toAbsoluteAppUrl(relative, resolved_origin);
}

/**
 * @param {string} relative_path
 * @param {string} [origin]
 * @returns {string}
 */
export function toAbsoluteAppUrl(relative_path, origin = "") {
  const path = String(relative_path || "").replace(/^\.\//, "");
  if (!path) return "";
  if (!origin) return path;
  return `${origin}${path.startsWith("/") ? path : `/${path}`}`;
}

/**
 * @param {object} gem
 * @returns {string}
 */
export function gemIdFromPath(gem) {
  const gem_path = gem?.$path || "";
  if (!gem_path) return "";
  const parts = gem_path.split("/");
  return parts[parts.length - 1] || "";
}

/**
 * @param {{ $path?: string, $media_filename?: string }} file
 * @returns {string}
 */
export function makeGemMediaFilePath(file) {
  const path = String(file?.$path || "").trim();
  const filename = String(file?.$media_filename || "").trim();
  if (!path || !filename) return "";
  const parent = path.substring(0, path.lastIndexOf("/"));
  return `/${parent}/${filename}`;
}

/**
 * @param {{ $path?: string, $media_filename?: string }} file
 * @param {string} [origin]
 * @returns {string}
 */
export function makeGemMediaFileAbsoluteUrl(file, origin = "") {
  const full_path = makeGemMediaFilePath(file);
  if (!full_path) return "";
  const resolved_origin = origin || resolveAppPublicOrigin() || "";
  if (!resolved_origin) return full_path;
  return `${resolved_origin}${full_path}`;
}

/**
 * Absolute URL to the SoftGems HTML media viewer (image/video only).
 * Uses the static media file path (no API auth) so PDF recipients can open it.
 * @param {{ $path?: string, $media_filename?: string, $type?: string }} file
 * @param {string} [origin]
 * @returns {string}
 */
export function makeGemMediaViewerAbsoluteUrl(file, origin = "") {
  const media_path = makeGemMediaFilePath(file);
  const type = file?.$type === "video" || file?.$type === "image" ? file.$type : "";
  if (!media_path || !type) return "";
  const resolved_origin = origin || resolveAppPublicOrigin() || "";
  const params = new URLSearchParams();
  params.set("path_to_media", media_path);
  params.set("type", type);
  const query = params.toString();
  if (!resolved_origin) return `/_previewmedia?${query}`;
  return `${resolved_origin}/_previewmedia?${query}`;
}

/**
 * Absolute URL to the HTML viewer for a gem folder cover image.
 * Cover is `meta_cover.jpeg` (not a file meta), so the viewer uses `path_to_media`.
 * @param {object} gem
 * @param {string} [origin]
 * @returns {string}
 */
export function makeGemCoverViewerAbsoluteUrl(gem, origin = "") {
  const media_path = resolveGemCoverMediaRelative(gem);
  if (!media_path) return "";
  const resolved_origin = origin || resolveAppPublicOrigin() || "";
  const params = new URLSearchParams();
  params.set("path_to_media", media_path);
  params.set("type", "image");
  const query = params.toString();
  if (!resolved_origin) return `/_previewmedia?${query}`;
  return `${resolved_origin}/_previewmedia?${query}`;
}

/**
 * @param {object[]} gems
 * @param {string} field_key
 * @returns {number|null}
 */
export function sumGemNumericField(gems, field_key) {
  const key = String(field_key || "").trim();
  if (!key) return null;
  let sum = 0;
  let has_value = false;
  (gems || []).forEach((gem) => {
    const raw = gem?.[key];
    const n = Number(raw);
    if (Number.isFinite(n)) {
      sum += n;
      has_value = true;
    }
  });
  return has_value ? sum : null;
}

/**
 * @param {object[]} gems
 * @param {string|null} pricing_key
 * @returns {number|null}
 */
export function sumGemPricingTotals(gems, pricing_key) {
  const key = String(pricing_key || "").trim();
  if (!key || !gem_pricing_total_column_keys.includes(key)) return null;
  return sumGemNumericField(gems, key);
}

/**
 * Number formatting used across the PDF: decimal dot, optional
 * non-breaking-space thousands separator (`424 476.00`) — no commas
 * (same convention as UI `formatDisplayNumber`).
 * @param {number} value
 * @param {{ minimumFractionDigits?: number, maximumFractionDigits?: number, useGrouping?: boolean }} [options]
 * @returns {string}
 */
function formatPdfBaseNumber(value, options = {}) {
  const {
    minimumFractionDigits = 0,
    maximumFractionDigits = 2,
    useGrouping = true,
  } = options;
  return value
    .toLocaleString("en-US", {
      minimumFractionDigits,
      maximumFractionDigits,
      useGrouping,
    })
    .replace(/,/g, "\u00a0");
}

/**
 * @param {number|null|undefined} value
 * @param {{ minimumFractionDigits?: number, maximumFractionDigits?: number }} [options]
 * @returns {string}
 */
export function formatPdfNumber(value, options = {}) {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return "—";
  }
  return formatPdfBaseNumber(value, options);
}

/**
 * Per-carat prices are shown without thousands grouping (`7500.00`).
 * @param {number|null|undefined} value
 * @returns {string}
 */
export function formatPdfPerCarat(value) {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return "—";
  }
  return formatPdfBaseNumber(value, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    useGrouping: false,
  });
}

/**
 * Currency totals follow the reference layout: `$16 125.00` for USD.
 * @param {number|null|undefined} value
 * @param {string} currency
 * @returns {string}
 */
export function formatPdfCurrencyTotal(value, currency) {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return "—";
  }
  const code = String(currency || "USD").trim() || "USD";
  const formatted = formatPdfBaseNumber(value, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  if (code === "USD") return `$${formatted}`;
  return `${formatted} ${code}`;
}

/**
 * @param {number|null|undefined} value
 * @param {string} currency
 * @returns {string}
 */
export function formatPdfCurrencyAmount(value, currency) {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return "—";
  }
  const code = String(currency || "USD").trim() || "USD";
  const formatted = formatPdfBaseNumber(value, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${formatted} ${code}`;
}
