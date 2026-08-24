import { formatDisplayNumber } from "@/utils/format_locale.js";

const RATE_DECIMALS = 4;

/**
 * Parse a USD?EUR rate. Accepts `0.86` and French `0,86`.
 * @param {*} raw
 * @returns {number|null}
 */
export function parseSelectionExchangeRate(raw) {
  if (raw === null || raw === undefined || raw === "") return null;
  if (typeof raw === "number") {
    return Number.isFinite(raw) && raw > 0 ? raw : null;
  }

  let s = String(raw).trim().replace(/\s/g, "");
  if (!s) return null;

  if (s.includes(",") && !s.includes(".")) {
    s = s.replace(",", ".");
  } else {
    s = s.replace(/,/g, "");
  }

  const n = Number(s);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

/**
 * @param {*} raw
 * @returns {number|null}
 */
export function normalizeSelectionExchangeRate(raw) {
  const n = parseSelectionExchangeRate(raw);
  if (n === null) return null;
  const factor = 10 ** RATE_DECIMALS;
  return Math.round(n * factor) / factor;
}

/**
 * @param {*} raw
 * @returns {string}
 */
export function formatSelectionExchangeRateDisplay(raw) {
  const n = normalizeSelectionExchangeRate(raw);
  if (n === null) return "";
  return (
    formatDisplayNumber(n, {
      minimumFractionDigits: 2,
      maximumFractionDigits: RATE_DECIMALS,
    }) || ""
  );
}
