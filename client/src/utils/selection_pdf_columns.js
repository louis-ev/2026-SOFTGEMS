import {
  buildGemsTableAllMetadataKeys,
  gems_table_column_picker_excluded_keys,
  normalizeGemsTableSelectedMetadataKeys,
} from "@/utils/gems_table_metadata.js";
import { gem_pricing_total_column_keys } from "@/mixins/GemPricing.js";
import { selectionPdfExportDefaults } from "@/utils/selection_pdf_export_registry.js";

export const selection_pdf_prefs_localstorage_key =
  "sg_selection_pdf_export_prefs";

export const selection_pdf_max_column_units = 7;

export const selection_pdf_photo_column_key = "$cover";

export const selection_pdf_photo_column_units = 2;

export const selection_pdf_column_picker_excluded_keys = Object.freeze([
  "status",
  "internal_name",
  "box_selection_path",
  "price_per_carat_all",
  "$date_modified",
]);

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
 * @param {string[]} metadata_keys
 * @param {string} metadata_key
 * @returns {boolean}
 */
export function canAddSelectionPdfColumn(metadata_keys, metadata_key) {
  const keys = Array.isArray(metadata_keys) ? metadata_keys : [];
  if (keys.includes(metadata_key)) return true;
  const next_units =
    countSelectionPdfColumnUnits(keys) + selectionPdfColumnUnits(metadata_key);
  return next_units <= selection_pdf_max_column_units;
}

/**
 * @param {string[]} metadata_keys
 * @returns {string[]}
 */
export function normalizeSelectionPdfColumnKeys(metadata_keys) {
  const normalized = normalizeGemsTableSelectedMetadataKeys(metadata_keys);
  return normalized.filter(
    (key) => !selection_pdf_column_picker_excluded_keys.includes(key)
  );
}

/**
 * Full table column catalog for the PDF export picker (independent of loaded gem fields).
 * @param {object[]} gems
 * @returns {string[]}
 */
export function buildSelectionPdfPickerMetadataKeys(gems) {
  const excluded = new Set([
    ...selection_pdf_column_picker_excluded_keys,
    ...gems_table_column_picker_excluded_keys,
  ]);
  return buildGemsTableAllMetadataKeys(Array.isArray(gems) ? gems : []).filter(
    (key) => {
      if (excluded.has(key)) return false;
      if (key.startsWith("$") && key !== selection_pdf_photo_column_key) {
        return false;
      }
      return true;
    }
  );
}

/**
 * @param {string} selection_type
 * @param {object|null} stored_prefs
 * @returns {{ metadata_keys: string[] }}
 */
export function resolveSelectionPdfExportPrefs(selection_type, stored_prefs) {
  const defaults = selectionPdfExportDefaults(selection_type);
  const stored =
    stored_prefs && typeof stored_prefs === "object" ? stored_prefs : {};

  const stored_keys = normalizeSelectionPdfColumnKeys(stored.metadata_keys);
  const fallback_keys = normalizeSelectionPdfColumnKeys(
    defaults.default_column_keys
  );

  let metadata_keys =
    stored_keys.length > 0 ? stored_keys : fallback_keys;

  while (
    countSelectionPdfColumnUnits(metadata_keys) > selection_pdf_max_column_units
  ) {
    metadata_keys = metadata_keys.slice(0, -1);
  }

  return {
    metadata_keys,
  };
}

/**
 * @param {{ metadata_keys?: string[] }} options
 * @returns {string}
 */
export function encodeSelectionPdfExportQuery(options) {
  const params = new URLSearchParams();
  const keys = normalizeSelectionPdfColumnKeys(options.metadata_keys);
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
    ? normalizeSelectionPdfColumnKeys(
        raw_cols.split(",").map((segment) => segment.trim())
      )
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
 * @param {string[]} metadata_keys
 * @param {string} pricing_key
 * @returns {string[]}
 */
export function applySelectionPdfPricingKey(metadata_keys, pricing_key) {
  const keys = normalizeSelectionPdfColumnKeys(metadata_keys).filter(
    (key) => !gem_pricing_total_column_keys.includes(key)
  );
  const pricing = String(pricing_key || "").trim();
  if (!pricing) return keys;
  if (!canAddSelectionPdfColumn(keys, pricing)) return keys;
  return [...keys, pricing];
}
