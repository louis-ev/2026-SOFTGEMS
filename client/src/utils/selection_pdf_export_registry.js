import { selectionSlugFromType } from "@/utils/selection_type_registry.js";

/** Stored `selection_type` values that support PDF export. */
export const SELECTION_PDF_EXPORT_ENABLED_TYPES = Object.freeze([
  "boîte",
  "return memo in",
  "buying invoice",
  "memo out",
  "return memo out",
  "sale invoice",
  "partner invoice",
  "credit note",
  "importation return",
]);

const _enabled_type_set = new Set(SELECTION_PDF_EXPORT_ENABLED_TYPES);

/** @type {Record<string, { document_title_key: string, legal_text_key: string, default_pricing_key: string|null, default_column_keys: string[] }>} */
const _defaults_by_slug = Object.freeze({
  box: {
    document_title_key: "sg_pdf_title_box",
    legal_text_key: "sg_pdf_legal_generic",
    default_pricing_key: null,
    default_column_keys: [
      "id",
      "$cover",
      "stone_type",
      "weight_ct",
      "origin_country",
    ],
  },
  "return-memo-in": {
    document_title_key: "sg_pdf_title_return_memo_in",
    legal_text_key: "sg_pdf_legal_generic",
    default_pricing_key: "purchased_price_pa",
    default_column_keys: [
      "id",
      "$cover",
      "stone_type",
      "number_of_pieces",
      "weight_ct",
      "purchased_price_pa",
    ],
  },
  "buying-invoice": {
    document_title_key: "sg_pdf_title_buying_invoice",
    legal_text_key: "sg_pdf_legal_generic",
    default_pricing_key: "purchased_price_pa",
    default_column_keys: [
      "id",
      "$cover",
      "stone_type",
      "number_of_pieces",
      "weight_ct",
      "purchased_price_pa",
    ],
  },
  "memo-out": {
    document_title_key: "sg_pdf_title_memo_out",
    legal_text_key: "sg_pdf_legal_memo_out",
    default_pricing_key: "pc_to",
    default_column_keys: [
      "id",
      "$cover",
      "stone_type",
      "number_of_pieces",
      "weight_ct",
      "pc_to",
    ],
  },
  "return-memo-out": {
    document_title_key: "sg_pdf_title_return_memo_out",
    legal_text_key: "sg_pdf_legal_memo_out",
    default_pricing_key: "pc_to",
    default_column_keys: [
      "id",
      "$cover",
      "stone_type",
      "number_of_pieces",
      "weight_ct",
      "pc_to",
    ],
  },
  "sale-invoice": {
    document_title_key: "sg_pdf_title_sale_invoice",
    legal_text_key: "sg_pdf_legal_generic",
    default_pricing_key: "pf_invoiced_price",
    default_column_keys: [
      "id",
      "$cover",
      "stone_type",
      "number_of_pieces",
      "weight_ct",
      "pf_invoiced_price",
    ],
  },
  "partner-invoice": {
    document_title_key: "sg_pdf_title_partner_invoice",
    legal_text_key: "sg_pdf_legal_generic",
    default_pricing_key: "pc_to",
    default_column_keys: [
      "id",
      "$cover",
      "stone_type",
      "number_of_pieces",
      "weight_ct",
      "pc_to",
    ],
  },
  "credit-note": {
    document_title_key: "sg_pdf_title_credit_note",
    legal_text_key: "sg_pdf_legal_generic",
    default_pricing_key: "pf_invoiced_price",
    default_column_keys: [
      "id",
      "$cover",
      "stone_type",
      "number_of_pieces",
      "weight_ct",
      "pf_invoiced_price",
    ],
  },
  "importation-return": {
    document_title_key: "sg_pdf_title_importation_return",
    legal_text_key: "sg_pdf_legal_generic",
    default_pricing_key: "purchased_price_pa",
    default_column_keys: [
      "id",
      "$cover",
      "stone_type",
      "number_of_pieces",
      "weight_ct",
      "purchased_price_pa",
    ],
  },
});

/** ACF company footer (French, static). */
export const SELECTION_PDF_ACF_FOOTER_LINES = Object.freeze([
  "SIÈGE SOCIAL : 10, rue Place Vendôme - 75001 PARIS - TEL : 33 (6) 69241489 - info@acfinegems.com",
  "SAS AU CAPITAL DE 50000 EUROS - R.C. PARIS - SIRET 99409944800015",
]);

/** @param {string} selection_type */
export function selectionPdfExportEnabled(selection_type) {
  return _enabled_type_set.has(String(selection_type || "").trim());
}

/** @param {string} selection_type */
export function selectionPdfExportDefaults(selection_type) {
  const slug = selectionSlugFromType(selection_type);
  return (
    _defaults_by_slug[slug] || {
      document_title_key: "sg_pdf_title_generic",
      legal_text_key: "sg_pdf_legal_generic",
      default_pricing_key: null,
      default_column_keys: ["id", "$cover", "stone_type", "weight_ct"],
    }
  );
}
