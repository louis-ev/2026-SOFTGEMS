/** Instance meta key for the English PDF bank / payment footer (multiline). */
export const SELECTION_PDF_BANK_FOOTER_EN = "selection_pdf_bank_footer_en";

/**
 * @param {string} raw_text
 * @returns {string[]}
 */
export function parseSelectionPdfBankFooterLines(raw_text) {
  return String(raw_text || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

/**
 * @param {object|null|undefined} instance_meta
 * @returns {string}
 */
export function readSelectionPdfBankFooterEn(instance_meta) {
  const raw = instance_meta?.[SELECTION_PDF_BANK_FOOTER_EN];
  if (raw === null || raw === undefined) return "";
  return String(raw);
}

/**
 * @param {object|null|undefined} instance_meta
 * @returns {string[]}
 */
export function selectionPdfBankFooterLinesFromInstance(instance_meta) {
  return parseSelectionPdfBankFooterLines(
    readSelectionPdfBankFooterEn(instance_meta)
  );
}
