/**
 * Stored `selection_type` values (CDC §2.4, aligned with product copy).
 * @readonly
 */
export const SELECTION_TYPE_VALUES = Object.freeze([
  "simple",
  "boîte",
  "memo in",
  "return memo in",
  "buying invoice",
  "memo out",
  "return memo out",
  "sale invoice",
  "partner invoice",
  "credit note",
  "importation",
  "importation return",
]);

/** @param {(key: string) => string} t */
export function selectionTypeLabel(t, value) {
  const v = String(value || "").trim();
  const map = {
    simple: t("sg_selection_type_simple"),
    "boîte": t("sg_selection_type_box"),
    "memo in": t("sg_selection_type_memo_in"),
    "return memo in": t("sg_selection_type_return_memo_in"),
    "buying invoice": t("sg_selection_type_buying_invoice"),
    "memo out": t("sg_selection_type_memo_out"),
    "return memo out": t("sg_selection_type_return_memo_out"),
    "sale invoice": t("sg_selection_type_sale_invoice"),
    "partner invoice": t("sg_selection_type_partner_invoice"),
    "credit note": t("sg_selection_type_credit_note"),
    importation: t("sg_selection_type_importation"),
    "importation return": t("sg_selection_type_importation_return"),
  };
  return map[v] || v || "—";
}

/** @param {(key: string) => string} t */
export function selectionTypeSelectOptions(t) {
  return SELECTION_TYPE_VALUES.map((value) => ({
    value,
    label: selectionTypeLabel(t, value),
  }));
}
