/** Instance meta key for English PDF bank / payment footer presets. */
export const SELECTION_PDF_BANK_FOOTER_EN = "selection_pdf_bank_footer_en";

/** Sentinel selected_id meaning no bank footer in the exported PDF. */
export const SELECTION_PDF_BANK_FOOTER_NONE_ID = "__none__";

/**
 * @typedef {{ id: string, internal_name: string, body: string }} SelectionPdfBankFooterPreset
 */

/**
 * @returns {string}
 */
export function createSelectionPdfBankFooterId() {
  return `bf_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * @param {unknown} item
 * @returns {SelectionPdfBankFooterPreset|null}
 */
export function normalizeSelectionPdfBankFooterPreset(item) {
  if (!item || typeof item !== "object") return null;
  const id = String(item.id || "").trim();
  if (!id || !/^[a-zA-Z0-9_-]+$/.test(id)) return null;
  return {
    id,
    internal_name: String(item.internal_name || "").trim(),
    body: String(item.body ?? ""),
  };
}

/**
 * @param {unknown} raw
 * @returns {SelectionPdfBankFooterPreset[]}
 */
export function normalizeSelectionPdfBankFootersEn(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => normalizeSelectionPdfBankFooterPreset(item))
    .filter(Boolean);
}

/**
 * @param {object|null|undefined} instance_meta
 * @returns {SelectionPdfBankFooterPreset[]}
 */
export function readSelectionPdfBankFootersEn(instance_meta) {
  return normalizeSelectionPdfBankFootersEn(
    instance_meta?.[SELECTION_PDF_BANK_FOOTER_EN]
  );
}

/**
 * @param {SelectionPdfBankFooterPreset[]} presets
 * @returns {string}
 */
export function defaultSelectionPdfBankFooterId(presets) {
  const list = Array.isArray(presets) ? presets : [];
  return list[0]?.id || "";
}

/**
 * @param {string|null|undefined} raw_id
 * @returns {boolean}
 */
export function isSelectionPdfBankFooterNoneId(raw_id) {
  const id = String(raw_id || "").trim();
  return !id || id === SELECTION_PDF_BANK_FOOTER_NONE_ID;
}

/**
 * @param {SelectionPdfBankFooterPreset[]} presets
 * @param {{ id?: string }} [options]
 * @returns {string}
 */
export function resolveSelectionPdfBankFooterBody(presets, options = {}) {
  const list = Array.isArray(presets) ? presets : [];
  if (list.length === 0) return "";

  const requested_id = String(options.id || "").trim();
  if (isSelectionPdfBankFooterNoneId(requested_id)) return "";

  const match = list.find((preset) => preset.id === requested_id);
  return match?.body || "";
}

/**
 * @param {SelectionPdfBankFooterPreset[]} presets
 * @param {string} selected_id
 * @returns {string}
 */
export function coerceSelectionPdfBankFooterSelection(presets, selected_id) {
  const list = Array.isArray(presets) ? presets : [];
  const id = String(selected_id || "").trim();
  if (id === SELECTION_PDF_BANK_FOOTER_NONE_ID) {
    return SELECTION_PDF_BANK_FOOTER_NONE_ID;
  }
  if (id && list.some((preset) => preset.id === id)) return id;
  return defaultSelectionPdfBankFooterId(list);
}

/**
 * @param {SelectionPdfBankFooterPreset[]} presets
 * @returns {SelectionPdfBankFooterPreset}
 */
export function createEmptySelectionPdfBankFooterPreset() {
  return {
    id: createSelectionPdfBankFooterId(),
    internal_name: "",
    body: "",
  };
}
