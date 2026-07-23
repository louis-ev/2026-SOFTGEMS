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

/** Printable table width inside A4 margins (210mm − 2×10mm padding). */
export const selection_pdf_page_content_width_mm = 190;

/** Fixed column widths in the PDF table (mm). Keep aligned with SGSelectionPdfDocument styles. */
export const selection_pdf_column_width_mm = Object.freeze({
  no: 7,
  ref: 12,
  photo: 16,
  numeric: 16,
  price: 16,
});

/**
 * @param {string} metadata_key
 * @returns {number|null} mm, or null for the flexible description column
 */
export function selectionPdfColumnWidthMm(metadata_key) {
  if (metadata_key === selection_pdf_description_column_key) return null;
  if (metadata_key === selection_pdf_photo_column_key) {
    return selection_pdf_column_width_mm.photo;
  }
  if (
    metadata_key === selection_pdf_per_carat_column_key ||
    gem_pricing_total_column_keys.includes(metadata_key)
  ) {
    return selection_pdf_column_width_mm.price;
  }
  if (metadata_key === "number_of_pieces" || metadata_key === "weight_ct") {
    return selection_pdf_column_width_mm.numeric;
  }
  if (metadata_key === "id") return selection_pdf_column_width_mm.ref;
  return selection_pdf_column_width_mm.ref;
}

/**
 * Column width percentages for table-layout: fixed (N° + metadata columns).
 * @param {string[]} metadata_keys
 * @returns {{ key: string, percent: number }[]}
 */
export function selectionPdfTableColPercents(metadata_keys) {
  const keys = Array.isArray(metadata_keys) ? metadata_keys : [];
  const content_width_mm = selection_pdf_page_content_width_mm;
  let fixed_mm = selection_pdf_column_width_mm.no;
  keys.forEach((metadata_key) => {
    const width_mm = selectionPdfColumnWidthMm(metadata_key);
    if (width_mm !== null) fixed_mm += width_mm;
  });
  const description_percent =
    ((content_width_mm - fixed_mm) / content_width_mm) * 100;

  const cols = [
    {
      key: "__no__",
      percent: (selection_pdf_column_width_mm.no / content_width_mm) * 100,
    },
  ];
  keys.forEach((metadata_key) => {
    const width_mm = selectionPdfColumnWidthMm(metadata_key);
    cols.push({
      key: metadata_key,
      percent:
        width_mm === null
          ? description_percent
          : (width_mm / content_width_mm) * 100,
    });
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
