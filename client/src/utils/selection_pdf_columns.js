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

/** Printable table width inside A4 margins (210mm − 2×17.8mm padding). */
export const selection_pdf_page_content_width_mm = 174.4;

/** Sentinel key for the pricing-total column slot in width maps. */
export const selection_pdf_pricing_total_column_slot = "__pricing_total__";

/**
 * Column width percentages for the standard priced invoice layout (sum = 100).
 * Measured on the ACF INV N°20265 reference PDF.
 */
export const selection_pdf_invoice_col_percents = Object.freeze({
  __no__: 9,
  id: 8,
  [selection_pdf_virtual_column_keys.description]: 24,
  [selection_pdf_virtual_column_keys.photo]: 11,
  number_of_pieces: 9.5,
  weight_ct: 10.5,
  [selection_pdf_virtual_column_keys.per_carat]: 13,
  [selection_pdf_pricing_total_column_slot]: 15,
});

/**
 * @param {string} metadata_key
 * @returns {string}
 */
export function selectionPdfColumnPercentSlotKey(metadata_key) {
  if (gem_pricing_total_column_keys.includes(metadata_key)) {
    return selection_pdf_pricing_total_column_slot;
  }
  return metadata_key;
}

/**
 * @param {string} metadata_key
 * @returns {number|undefined}
 */
export function selectionPdfBaseColumnPercent(metadata_key) {
  const slot = selectionPdfColumnPercentSlotKey(metadata_key);
  return selection_pdf_invoice_col_percents[slot];
}

/**
 * @param {string} metadata_key
 * @returns {'left'|'center'|'right'}
 */
export function selectionPdfColumnTextAlign(metadata_key) {
  if (metadata_key === "__no__") return "center";
  if (metadata_key === selection_pdf_photo_column_key) return "center";
  if (metadata_key === "id") return "center";
  if (metadata_key === "number_of_pieces") return "center";
  if (metadata_key === "weight_ct") return "center";
  if (metadata_key === selection_pdf_per_carat_column_key) return "center";
  if (metadata_key === selection_pdf_description_column_key) return "left";
  if (gem_pricing_total_column_keys.includes(metadata_key)) return "center";
  return "left";
}

/**
 * Column width percentages for table-layout: fixed (N° + metadata columns).
 * Omitted pricing columns redistribute their share to Description and Photo.
 * @param {string[]} metadata_keys
 * @returns {{ key: string, percent: number }[]}
 */
export function selectionPdfTableColPercents(metadata_keys) {
  const keys = Array.isArray(metadata_keys) ? metadata_keys : [];
  const present_slots = new Set(["__no__"]);
  keys.forEach((metadata_key) => {
    present_slots.add(selectionPdfColumnPercentSlotKey(metadata_key));
  });

  let omitted_percent = 0;
  Object.entries(selection_pdf_invoice_col_percents).forEach(
    ([slot_key, percent]) => {
      if (!present_slots.has(slot_key)) omitted_percent += percent;
    }
  );

  const description_base =
    selection_pdf_invoice_col_percents[selection_pdf_description_column_key];
  const photo_base =
    selection_pdf_invoice_col_percents[selection_pdf_photo_column_key];
  const flex_base = description_base + photo_base;
  const description_bonus =
    flex_base > 0 ? omitted_percent * (description_base / flex_base) : 0;
  const photo_bonus =
    flex_base > 0 ? omitted_percent * (photo_base / flex_base) : 0;

  const resolvePercent = (metadata_key) => {
    const slot = selectionPdfColumnPercentSlotKey(metadata_key);
    const base = selection_pdf_invoice_col_percents[slot];
    if (base === undefined) return 0;
    if (slot === selection_pdf_description_column_key) {
      return base + description_bonus;
    }
    if (slot === selection_pdf_photo_column_key) {
      return base + photo_bonus;
    }
    return base;
  };

  const cols = [{ key: "__no__", percent: resolvePercent("__no__") }];
  keys.forEach((metadata_key) => {
    cols.push({ key: metadata_key, percent: resolvePercent(metadata_key) });
  });
  return cols;
}

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
 * @param {{ metadata_keys?: string[], bank_footer_id?: string }} options
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
  const bank_footer_id = String(options?.bank_footer_id || "").trim();
  if (bank_footer_id) params.set("bank_footer_id", bank_footer_id);
  return params.toString();
}

/**
 * @param {import('vue-router').Route} route
 * @returns {{ metadata_keys: string[], bank_footer_id: string, bank_footer_en: string }}
 */
export function decodeSelectionPdfExportQuery(route) {
  const raw_cols = String(route?.query?.cols || "").trim();
  const metadata_keys = raw_cols
    ? raw_cols
        .split(",")
        .map((segment) => segment.trim())
        .filter(Boolean)
    : [];
  const bank_footer_id = String(route?.query?.bank_footer_id || "").trim();
  const bank_footer_en = String(route?.query?.bank_footer_en || "");
  return { metadata_keys, bank_footer_id, bank_footer_en };
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
 * @param {string} [_currency]
 * @returns {string}
 */
export function selectionPdfColumnHeaderLabel(metadata_key, currency = "USD") {
  if (metadata_key === "id") return "REF";
  if (metadata_key === selection_pdf_description_column_key) return "Description";
  if (metadata_key === selection_pdf_photo_column_key) return "Photo";
  if (metadata_key === "number_of_pieces") return "Quantity";
  if (metadata_key === "weight_ct") return "Ct weight";
  if (metadata_key === selection_pdf_per_carat_column_key) return "$/ct";
  if (gem_pricing_total_column_keys.includes(metadata_key)) {
    const code = String(currency || "USD").trim() || "USD";
    return `Total ${code}`;
  }
  return metadata_key;
}
