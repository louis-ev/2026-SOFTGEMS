import {
  defaultSelectionPdfShowVat,
  isSelectionPdfPricingTotalKey,
  normalizeSelectionPdfVatPercent,
  selection_pdf_virtual_column_keys,
  selectionPdfExportColumnKeys,
  selectionPdfExportPricingKey,
} from "@/utils/selection_pdf_export_registry.js";
import {
  normalizeSelectionPdfLang,
  selectionPdfT,
} from "@/utils/selection_pdf_strings.js";

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
 * Source of truth: `ACF Assets/column size.pdf` (Invoice N°20268 layout sheet).
 */
export const selection_pdf_invoice_col_percents = Object.freeze({
  __no__: 5,
  id: 7.5,
  [selection_pdf_virtual_column_keys.description]: 30,
  [selection_pdf_virtual_column_keys.photo]: 15,
  number_of_pieces: 7.5,
  weight_ct: 10,
  [selection_pdf_virtual_column_keys.per_carat]: 11,
  [selection_pdf_pricing_total_column_slot]: 14,
});

/**
 * @param {string} metadata_key
 * @returns {string}
 */
export function selectionPdfColumnPercentSlotKey(metadata_key) {
  if (isSelectionPdfPricingTotalKey(metadata_key)) {
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
  if (isSelectionPdfPricingTotalKey(metadata_key)) return "right";
  if (metadata_key === "id") return "left";
  if (metadata_key === "number_of_pieces") return "left";
  if (metadata_key === "weight_ct") return "left";
  if (metadata_key === selection_pdf_per_carat_column_key) return "left";
  if (metadata_key === selection_pdf_description_column_key) return "left";
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
 * @param {{ metadata_keys?: string[], bank_footer_id?: string, lang?: string, show_vat?: boolean, vat_percent?: number }} options
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
  const lang = normalizeSelectionPdfLang(options?.lang);
  params.set("lang", lang);
  params.set("show_vat", options?.show_vat === true ? "1" : "0");
  params.set(
    "vat_percent",
    String(normalizeSelectionPdfVatPercent(options?.vat_percent))
  );
  return params.toString();
}

/**
 * @param {import('vue-router').Route} route
 * @returns {{ metadata_keys: string[], bank_footer_id: string, bank_footer_en: string, lang: "en"|"fr", show_vat: boolean|null, vat_percent: number }}
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
  const lang = normalizeSelectionPdfLang(route?.query?.lang);
  const show_vat_raw = String(route?.query?.show_vat ?? "").trim().toLowerCase();
  let show_vat = null;
  if (show_vat_raw === "1" || show_vat_raw === "true") show_vat = true;
  else if (show_vat_raw === "0" || show_vat_raw === "false") show_vat = false;
  const vat_percent = normalizeSelectionPdfVatPercent(route?.query?.vat_percent);
  return {
    metadata_keys,
    bank_footer_id,
    bank_footer_en,
    lang,
    show_vat,
    vat_percent,
  };
}

/**
 * Resolve whether to show VAT given an explicit query flag or selection-type default.
 * @param {boolean|null|undefined} show_vat
 * @param {string|null|undefined} selection_type
 * @returns {boolean}
 */
export function resolveSelectionPdfShowVat(show_vat, selection_type) {
  if (typeof show_vat === "boolean") return show_vat;
  return defaultSelectionPdfShowVat(selection_type);
}

/**
 * @param {string[]} metadata_keys
 * @returns {string|null}
 */
export function activeSelectionPdfPricingKey(metadata_keys) {
  const keys = Array.isArray(metadata_keys) ? metadata_keys : [];
  const match = keys.find((key) => isSelectionPdfPricingTotalKey(key));
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
 * @param {string} [lang_or_currency="en"] Export lang (`en`|`fr`), or legacy currency arg ignored when a 3rd lang is passed.
 * @param {string} [lang]
 * @returns {string}
 */
export function selectionPdfColumnHeaderLabel(
  metadata_key,
  lang_or_currency = "en",
  lang
) {
  const resolved_lang = normalizeSelectionPdfLang(
    lang !== undefined ? lang : lang_or_currency
  );
  if (metadata_key === "id") return selectionPdfT(resolved_lang, "col_ref");
  if (metadata_key === selection_pdf_description_column_key) {
    return selectionPdfT(resolved_lang, "col_description");
  }
  if (metadata_key === selection_pdf_photo_column_key) {
    return selectionPdfT(resolved_lang, "col_photo");
  }
  if (metadata_key === "number_of_pieces") {
    return selectionPdfT(resolved_lang, "col_qty");
  }
  if (metadata_key === "weight_ct") {
    return selectionPdfT(resolved_lang, "col_weight");
  }
  if (metadata_key === selection_pdf_per_carat_column_key) {
    return selectionPdfT(resolved_lang, "col_price_per_ct");
  }
  if (isSelectionPdfPricingTotalKey(metadata_key)) {
    return selectionPdfT(resolved_lang, "col_total");
  }
  return metadata_key;
}
