import { gem_pricing_total_column_keys } from "@/mixins/GemPricing.js";

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
 * @param {object} gem
 * @returns {object[]}
 */
export function gemCertificateFiles(gem) {
  const files = Array.isArray(gem?.$files) ? gem.$files : [];
  return files
    .filter((file) => file && file.is_gem_certificate === true)
    .slice()
    .sort(
      (a, b) =>
        +new Date(b?.$date_uploaded || 0) - +new Date(a?.$date_uploaded || 0)
    );
}

/**
 * @param {object} certificate_file
 * @returns {string}
 */
export function formatCertificateSummaryLine(certificate_file) {
  const provider = String(certificate_file?.provider_path || "").trim();
  const provider_label = provider
    ? provider.split("/").filter(Boolean).pop() || provider
    : "";
  const reference = String(
    certificate_file?.certificate_reference || ""
  ).trim();
  if (provider_label && reference) return `${provider_label} ${reference}`;
  if (reference) return reference;
  if (provider_label) return provider_label;
  return "";
}

/**
 * @param {object} gem
 * @param {Function} no_cert_label
 * @returns {string[]}
 */
export function formatGemPdfDetailLines(gem, no_cert_label) {
  const lines = [];
  const dimensions = formatGemDimensionsForPdf(gem);
  if (dimensions) lines.push(dimensions);
  const origin = String(gem?.origin_country || "").trim();
  if (origin) lines.push(origin);
  const treatment = String(gem?.treatment_type || "").trim();
  if (treatment) lines.push(treatment);
  const certs = gemCertificateFiles(gem);
  if (certs.length === 0) {
    lines.push(no_cert_label);
  } else {
    certs.forEach((certificate_file) => {
      const line = formatCertificateSummaryLine(certificate_file);
      if (line) lines.push(line);
    });
  }
  return lines;
}

/**
 * @param {object} gem
 * @returns {string}
 */
export function formatGemDimensionsForPdf(gem) {
  const fmt = (raw) => {
    const n = Number(raw);
    if (!Number.isFinite(n)) return "";
    return n.toLocaleString("fr-FR", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  };
  const length = fmt(gem?.length_mm);
  const width = fmt(gem?.width_mm);
  const height = fmt(gem?.height_mm);
  if (!length && !width && !height) return "";
  return `${length || "—"} x ${width || "—"} x ${height || "—"}`;
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
