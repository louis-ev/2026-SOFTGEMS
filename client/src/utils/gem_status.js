/** Stored slug when a gem has no selection-driven status. */
export const GEM_STATUS_REFERENCE = "reference";

/** Manual status values on create / edit (selection-type slugs + reference). */
export const GEM_STATUS_MANUAL_SLUGS = Object.freeze([
  GEM_STATUS_REFERENCE,
  "memo-in",
  "buying-invoice",
  "sale-invoice",
  "return-memo-in",
  "return-memo-out",
]);

/** Inventory-oriented display labels (stored slugs stay selection-type based). */
const GEM_STATUS_LABEL_KEYS = Object.freeze({
  [GEM_STATUS_REFERENCE]: "sg_status_value_reference",
  "memo-in": "sg_status_value_memo_in",
  "buying-invoice": "sg_status_value_purchased",
  "sale-invoice": "sg_status_value_sold",
  "return-memo-in": "sg_status_value_returned",
  "return-memo-out": "sg_status_value_returned",
});

const VALID_GEM_STATUS_SLUGS = new Set(GEM_STATUS_MANUAL_SLUGS);

/**
 * @param {*} raw
 * @returns {string}
 */
export function normalizeGemStatusSlug(raw) {
  const trimmed = String(raw ?? "").trim();
  if (!trimmed || trimmed === GEM_STATUS_REFERENCE) return GEM_STATUS_REFERENCE;
  if (VALID_GEM_STATUS_SLUGS.has(trimmed)) return trimmed;
  return trimmed;
}

/**
 * @param {(key: string) => string} t
 * @param {*} raw_status
 * @returns {string}
 */
export function gemStatusLabel(t, raw_status) {
  const slug = normalizeGemStatusSlug(raw_status);
  const label_key = GEM_STATUS_LABEL_KEYS[slug];
  if (label_key) return t(label_key);
  return slug;
}
