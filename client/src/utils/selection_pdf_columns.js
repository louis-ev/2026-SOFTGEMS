import { gem_pricing_total_column_keys } from "@/mixins/GemPricing.js";
import {
  selection_pdf_virtual_column_keys,
  selectionPdfExportColumnKeys,
  selectionPdfExportPricingKey,
} from "@/utils/selection_pdf_export_registry.js";

export const selection_pdf_max_column_units = 8;

export const selection_pdf_photo_column_key =
  selection_pdf_virtual_column_keys.photo;

export const selection_pdf_photo_column_units = 2;

export const selection_pdf_description_column_key =
  selection_pdf_virtual_column_keys.description;

export const selection_pdf_per_carat_column_key =
  selection_pdf_virtual_column_keys.per_carat;

/**
 * @param {string} metadata_key
 * @returns {number}
 */
export function selectionPdfColumnUnits(metadata_key) {
  return metadata_key === selection_pdf_photo_column_key
    ? selection_pdf_photo_column_units
    : 1;
}

/**
 * @param {string[]} metadata_keys
 * @returns {number}
 */
export function countSelectionPdfColumnUnits(metadata_keys) {
  if (!Array.isArray(metadata_keys)) return 0;
  return metadata_keys.reduce(
    (sum, key) => sum + selectionPdfColumnUnits(key),
    0
  );
}

/**
 * @param {string} selection_type
 * @returns {{ metadata_keys: string[] }}
 */
export function resolveSelectionPdfExportPrefs(selection_type) {
  return {
    metadata_keys: selectionPdfExportColumnKeys(selection_type),
  };
}

/**
 * @param {string} selection_type
 * @returns {string}
 */
export function encodeSelectionPdfExportQueryForType(selection_type) {
  const params = new URLSearchParams();
  params.set("cols", selectionPdfExportColumnKeys(selection_type).join(","));
  return params.toString();
}

/**
 * @param {{ metadata_keys?: string[] }} options
 * @returns {string}
 */
export function encodeSelectionPdfExportQuery(options) {
  const params = new URLSearchParams();
  const keys = Array.isArray(options?.metadata_keys)
    ? options.metadata_keys
        .map((key) => String(key || "").trim())
        .filter(Boolean)
    : [];
  params.set("cols", keys.join(","));
  return params.toString();
}

/**
 * @param {import('vue-router').Route} route
 * @returns {{ metadata_keys: string[] }}
 */
export function decodeSelectionPdfExportQuery(route) {
  const raw_cols = String(route?.query?.cols || "").trim();
  const metadata_keys = raw_cols
    ? raw_cols
        .split(",")
        .map((segment) => segment.trim())
        .filter(Boolean)
    : [];
  return { metadata_keys };
}

/**
 * @param {string[]} metadata_keys
 * @returns {string|null}
 */
export function activeSelectionPdfPricingKey(metadata_keys) {
  const keys = Array.isArray(metadata_keys) ? metadata_keys : [];
  const match = keys.find((key) => gem_pricing_total_column_keys.includes(key));
  return match || null;
}

/**
 * @param {string} selection_type
 * @param {string[]} [metadata_keys]
 * @returns {string|null}
 */
export function resolveSelectionPdfPricingKey(selection_type, metadata_keys) {
  return (
    activeSelectionPdfPricingKey(metadata_keys) ||
    selectionPdfExportPricingKey(selection_type)
  );
}

/**
 * @param {string} metadata_key
 * @param {string} currency
 * @returns {string}
 */
export function selectionPdfColumnHeaderLabel(metadata_key, currency = "USD") {
  if (metadata_key === "id") return "REF";
  if (metadata_key === selection_pdf_description_column_key) return "Description";
  if (metadata_key === selection_pdf_photo_column_key) return "Photo";
  if (metadata_key === "number_of_pieces") return "Qty";
  if (metadata_key === "weight_ct") return "Ct weight";
  if (metadata_key === selection_pdf_per_carat_column_key) return "$/ct";
  if (gem_pricing_total_column_keys.includes(metadata_key)) {
    const code = String(currency || "USD").trim() || "USD";
    return `Total ${code}`;
  }
  return metadata_key;
}
