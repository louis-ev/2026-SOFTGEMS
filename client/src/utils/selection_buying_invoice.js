/**
 * @param {*} raw
 * @returns {number|null}
 */
export function clampPartnershipPurchasedPercentage(raw) {
  if (raw === null || raw === undefined || raw === "") return null;
  const n = Number(raw);
  if (!Number.isFinite(n)) return null;
  return Math.min(100, Math.max(0, Math.round(n)));
}

/**
 * @param {*} raw
 * @returns {string}
 */
export function formatPartnershipPurchasedPercentageDisplay(raw) {
  const clamped = clampPartnershipPurchasedPercentage(raw);
  if (clamped === null) return "";
  return `${clamped} %`;
}
