import { gem_pricing_total_column_keys } from "@/mixins/GemPricing.js";

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
 * @param {object[]} gems
 * @param {string|null} pricing_key
 * @returns {number|null}
 */
export function sumGemPricingTotals(gems, pricing_key) {
  const key = String(pricing_key || "").trim();
  if (!key || !gem_pricing_total_column_keys.includes(key)) return null;
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
 * @param {number|null} value
 * @param {string} currency
 * @returns {string}
 */
export function formatPdfCurrencyTotal(value, currency) {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return "—";
  }
  const code = String(currency || "USD").trim() || "USD";
  try {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: code,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${value.toLocaleString("fr-FR")} ${code}`;
  }
}
