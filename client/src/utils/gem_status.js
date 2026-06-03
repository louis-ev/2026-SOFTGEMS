import { selectionTypeFromSlug } from "@/utils/selection_type_registry.js";
import { selectionTypeLabel } from "@/utils/selection_types.js";

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
  if (slug === GEM_STATUS_REFERENCE) return t("sg_status_value_reference");

  const selection_value = selectionTypeFromSlug(slug);
  if (selection_value) return selectionTypeLabel(t, selection_value);

  return slug;
}
