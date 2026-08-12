import {
  defaultSelectionPdfShowPaymentLine,
  defaultSelectionPdfShowVat,
  normalizeSelectionPdfVatPercent,
  selection_pdf_default_vat_percent,
  isSelectionPdfPricingTotalKey,
  selectionPdfExportPricingKey,
} from "@/utils/selection_pdf_export_registry.js";
import {
  SELECTION_PDF_BANK_FOOTER_NONE_ID,
  isSelectionPdfBankFooterNoneId,
} from "@/utils/selection_pdf_instance_settings.js";
import {
  normalizeSelectionPdfLang,
  SELECTION_PDF_DEFAULT_LANG,
} from "@/utils/selection_pdf_strings.js";
import { selectionSlugFromType } from "@/utils/selection_type_registry.js";

export const SELECTION_PDF_EXPORT_PREFS_STORAGE_KEY =
  "softgems.selection_pdf_export_prefs.v1";

/**
 * @typedef {{
 *   lang: "en"|"fr",
 *   pricing_key: string,
 *   show_vat: boolean,
 *   vat_percent: number,
 *   show_payment_line: boolean,
 *   show_customs_summary: boolean,
 *   bank_footer_id: string,
 * }} SelectionPdfExportPrefs
 */

/**
 * @param {string|null|undefined} selection_type
 * @returns {string}
 */
function prefsStorageScope(selection_type) {
  const slug = selectionSlugFromType(selection_type);
  return slug || "_default";
}

/**
 * @returns {Record<string, SelectionPdfExportPrefs>}
 */
function readAllPrefs() {
  if (typeof localStorage === "undefined") return {};
  try {
    const raw = localStorage.getItem(SELECTION_PDF_EXPORT_PREFS_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }
    return parsed;
  } catch {
    return {};
  }
}

/**
 * @param {Record<string, SelectionPdfExportPrefs>} all
 */
function writeAllPrefs(all) {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(
      SELECTION_PDF_EXPORT_PREFS_STORAGE_KEY,
      JSON.stringify(all || {})
    );
  } catch {
    // Quota / private mode ù ignore.
  }
}

/**
 * Type defaults when nothing was saved yet.
 * @param {string|null|undefined} selection_type
 * @returns {SelectionPdfExportPrefs}
 */
export function defaultSelectionPdfExportPrefs(selection_type) {
  const pricing_key = selectionPdfExportPricingKey(selection_type) || "";
  return {
    lang: SELECTION_PDF_DEFAULT_LANG,
    pricing_key: pricing_key ? String(pricing_key) : "",
    show_vat: defaultSelectionPdfShowVat(selection_type),
    vat_percent: selection_pdf_default_vat_percent,
    show_payment_line: defaultSelectionPdfShowPaymentLine(selection_type),
    show_customs_summary: false,
    bank_footer_id: SELECTION_PDF_BANK_FOOTER_NONE_ID,
  };
}

/**
 * @param {unknown} raw
 * @param {string|null|undefined} selection_type
 * @returns {SelectionPdfExportPrefs}
 */
export function normalizeSelectionPdfExportPrefs(raw, selection_type) {
  const defaults = defaultSelectionPdfExportPrefs(selection_type);
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { ...defaults };
  }

  const has_pricing_key = Object.prototype.hasOwnProperty.call(
    raw,
    "pricing_key"
  );
  let pricing_key = defaults.pricing_key;
  if (has_pricing_key) {
    const key = String(raw.pricing_key || "").trim();
    if (!key) {
      pricing_key = "";
    } else if (isSelectionPdfPricingTotalKey(key)) {
      pricing_key = key;
    }
  }

  const bank_footer_id = String(raw.bank_footer_id || "").trim();
  return {
    lang: Object.prototype.hasOwnProperty.call(raw, "lang")
      ? normalizeSelectionPdfLang(raw.lang)
      : defaults.lang,
    pricing_key,
    show_vat: Object.prototype.hasOwnProperty.call(raw, "show_vat")
      ? raw.show_vat === true
      : defaults.show_vat,
    vat_percent: Object.prototype.hasOwnProperty.call(raw, "vat_percent")
      ? normalizeSelectionPdfVatPercent(raw.vat_percent)
      : defaults.vat_percent,
    show_payment_line: Object.prototype.hasOwnProperty.call(
      raw,
      "show_payment_line"
    )
      ? raw.show_payment_line === true
      : defaults.show_payment_line,
    show_customs_summary: Object.prototype.hasOwnProperty.call(
      raw,
      "show_customs_summary"
    )
      ? raw.show_customs_summary === true
      : defaults.show_customs_summary,
    bank_footer_id: Object.prototype.hasOwnProperty.call(raw, "bank_footer_id")
      ? isSelectionPdfBankFooterNoneId(bank_footer_id)
        ? SELECTION_PDF_BANK_FOOTER_NONE_ID
        : bank_footer_id
      : defaults.bank_footer_id,
  };
}

/**
 * @param {string|null|undefined} selection_type
 * @returns {SelectionPdfExportPrefs}
 */
export function readSelectionPdfExportPrefs(selection_type) {
  const all = readAllPrefs();
  const scope = prefsStorageScope(selection_type);
  return normalizeSelectionPdfExportPrefs(all[scope], selection_type);
}

/**
 * @param {string|null|undefined} selection_type
 * @param {Partial<SelectionPdfExportPrefs>} prefs
 */
export function writeSelectionPdfExportPrefs(selection_type, prefs) {
  const scope = prefsStorageScope(selection_type);
  const normalized = normalizeSelectionPdfExportPrefs(prefs, selection_type);
  const all = readAllPrefs();
  all[scope] = normalized;
  writeAllPrefs(all);
}
