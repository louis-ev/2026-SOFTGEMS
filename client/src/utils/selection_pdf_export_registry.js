import { gem_pricing_total_column_keys } from "@/mixins/GemPricing.js";
import { selectionSlugFromType } from "@/utils/selection_type_registry.js";
import { SELECTION_TYPE_VALUES } from "@/utils/selection_types.js";

/** Fixed PDF export column keys (virtual + persisted). */
export const selection_pdf_virtual_column_keys = Object.freeze({
  description: "$description",
  photo: "$cover",
  per_carat: "$per_carat",
});

/** VAT rate applied to the pricing subtotal when a total column is present. */
export const selection_pdf_vat_rate = 0.2;

/** Total price fields offered in the PDF export pricing select. */
export const SELECTION_PDF_PRICING_OPTION_KEYS = Object.freeze([
  ...gem_pricing_total_column_keys,
]);

/** i18n keys for {@link SELECTION_PDF_PRICING_OPTION_KEYS} labels. */
export const selection_pdf_pricing_label_keys = Object.freeze({
  base_price_pcb: "sg_base_price_pcb",
  purchased_price_pa: "sg_purchased_price_pa",
  pv_selling_price: "sg_pv_selling_price",
  pvd_asking_price: "sg_pvd_asking_price",
  pc_to: "sg_pc_to",
  pf_invoiced_price: "sg_pf_invoiced_price",
});

/** Stored `selection_type` values that support PDF export. */
export const SELECTION_PDF_EXPORT_ENABLED_TYPES = SELECTION_TYPE_VALUES;

/**
 * @param {string|null|undefined} pricing_key
 * @returns {string[]}
 */
export function buildSelectionPdfColumnKeys(pricing_key) {
  const keys = [
    "id",
    selection_pdf_virtual_column_keys.description,
    selection_pdf_virtual_column_keys.photo,
    "number_of_pieces",
    "weight_ct",
  ];
  const pricing = String(pricing_key || "").trim();
  if (pricing) {
    keys.push(selection_pdf_virtual_column_keys.per_carat, pricing);
  }
  return keys;
}

/** @type {Record<string, { document_title_key: string, legal_text_key: string, default_pricing_key: string|null, column_keys: string[] }>} */
const _defaults_by_slug = Object.freeze({
  simple: {
    document_title_key: "sg_pdf_title_generic",
    legal_text_key: "sg_pdf_legal_generic",
    default_pricing_key: null,
    column_keys: buildSelectionPdfColumnKeys(null),
  },
  box: {
    document_title_key: "sg_pdf_title_box",
    legal_text_key: "sg_pdf_legal_generic",
    default_pricing_key: null,
    column_keys: buildSelectionPdfColumnKeys(null),
  },
  "memo-in": {
    document_title_key: "sg_pdf_title_generic",
    legal_text_key: "sg_pdf_legal_generic",
    default_pricing_key: null,
    column_keys: buildSelectionPdfColumnKeys(null),
  },
  "return-memo-in": {
    document_title_key: "sg_pdf_title_return_memo_in",
    legal_text_key: "sg_pdf_legal_generic",
    default_pricing_key: "purchased_price_pa",
    column_keys: buildSelectionPdfColumnKeys("purchased_price_pa"),
  },
  "buying-invoice": {
    document_title_key: "sg_pdf_title_buying_invoice",
    legal_text_key: "sg_pdf_legal_generic",
    default_pricing_key: "purchased_price_pa",
    column_keys: buildSelectionPdfColumnKeys("purchased_price_pa"),
  },
  "memo-out": {
    document_title_key: "sg_pdf_title_memo_out",
    legal_text_key: "sg_pdf_legal_memo_out",
    default_pricing_key: "pc_to",
    column_keys: buildSelectionPdfColumnKeys("pc_to"),
  },
  "return-memo-out": {
    document_title_key: "sg_pdf_title_return_memo_out",
    legal_text_key: "sg_pdf_legal_memo_out",
    default_pricing_key: "pc_to",
    column_keys: buildSelectionPdfColumnKeys("pc_to"),
  },
  "sale-invoice": {
    document_title_key: "sg_pdf_title_sale_invoice",
    legal_text_key: "sg_pdf_legal_generic",
    default_pricing_key: "pf_invoiced_price",
    column_keys: buildSelectionPdfColumnKeys("pf_invoiced_price"),
  },
  "partner-invoice": {
    document_title_key: "sg_pdf_title_partner_invoice",
    legal_text_key: "sg_pdf_legal_generic",
    default_pricing_key: "pc_to",
    column_keys: buildSelectionPdfColumnKeys("pc_to"),
  },
  "credit-note": {
    document_title_key: "sg_pdf_title_credit_note",
    legal_text_key: "sg_pdf_legal_generic",
    default_pricing_key: "pf_invoiced_price",
    column_keys: buildSelectionPdfColumnKeys("pf_invoiced_price"),
  },
  importation: {
    document_title_key: "sg_pdf_title_generic",
    legal_text_key: "sg_pdf_legal_generic",
    default_pricing_key: null,
    column_keys: buildSelectionPdfColumnKeys(null),
  },
  "importation-return": {
    document_title_key: "sg_pdf_title_importation_return",
    legal_text_key: "sg_pdf_legal_generic",
    default_pricing_key: "purchased_price_pa",
    column_keys: buildSelectionPdfColumnKeys("purchased_price_pa"),
  },
});

/** ACF company footer (French, static). */
export const SELECTION_PDF_ACF_FOOTER_LINES = Object.freeze([
  "SIEGE SOCIAL: 10, rue Place Vendôme - 75001 PARIS - TEL: 33(6)69 24 14 89 - info@acfinegems.com",
  "SAS AU CAPITAL DE 50 000 EUROS-SIRET 994 099 448 00015",
]);

/** @param {string} selection_type */
export function selectionPdfExportEnabled(selection_type) {
  return SELECTION_TYPE_VALUES.includes(String(selection_type || "").trim());
}

/** @param {string} selection_type */
export function selectionPdfExportDefaults(selection_type) {
  const slug = selectionSlugFromType(selection_type);
  return (
    _defaults_by_slug[slug] || {
      document_title_key: "sg_pdf_title_generic",
      legal_text_key: "sg_pdf_legal_generic",
      default_pricing_key: null,
      column_keys: buildSelectionPdfColumnKeys(null),
    }
  );
}

/**
 * @param {string} selection_type
 * @param {string|null|undefined} [pricing_key] When set, builds columns for that price line (empty/null = none).
 */
export function selectionPdfExportColumnKeys(selection_type, pricing_key) {
  if (pricing_key !== undefined) {
    return buildSelectionPdfColumnKeys(pricing_key);
  }
  return selectionPdfExportDefaults(selection_type).column_keys;
}

/** @param {string} selection_type */
export function selectionPdfExportPricingKey(selection_type) {
  return selectionPdfExportDefaults(selection_type).default_pricing_key;
}
