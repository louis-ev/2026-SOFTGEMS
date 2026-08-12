/** Allowed selection header currency codes (ISO 4217). */

export const SELECTION_CURRENCY_EUR = "EUR";
export const SELECTION_CURRENCY_USD = "USD";

const EUR_SYMBOL = "\u20AC";

/** Select options: exactly two choices. */
export const SELECTION_CURRENCY_OPTIONS = Object.freeze([
  { value: SELECTION_CURRENCY_USD, label: "USD ($)" },
  { value: SELECTION_CURRENCY_EUR, label: `EUR (${EUR_SYMBOL})` },
]);

const SELECTION_CURRENCY_LABEL_BY_CODE = Object.freeze(
  Object.fromEntries(
    SELECTION_CURRENCY_OPTIONS.map((option_item) => [
      option_item.value,
      option_item.label,
    ])
  )
);

/**
 * @param {*} raw
 * @returns {string} Normalized code (`EUR`|`USD`) or "" when empty/unknown.
 */
export function normalizeSelectionCurrency(raw) {
  const cleaned = String(raw ?? "").trim();
  if (!cleaned) return "";
  const upper = cleaned.toUpperCase();
  if (
    upper === SELECTION_CURRENCY_EUR ||
    upper === "EURO" ||
    upper === "EUROS" ||
    upper === `EUROS ${EUR_SYMBOL}` ||
    upper === `EUR ${EUR_SYMBOL}` ||
    upper === `EUR (${EUR_SYMBOL})` ||
    upper === EUR_SYMBOL
  ) {
    return SELECTION_CURRENCY_EUR;
  }
  if (
    upper === SELECTION_CURRENCY_USD ||
    upper === "USD $" ||
    upper === "USD ($)" ||
    upper === "$"
  ) {
    return SELECTION_CURRENCY_USD;
  }
  return "";
}

/**
 * Effective currency for UI/PDF: empty -> USD.
 * @param {*} raw
 * @returns {"EUR"|"USD"}
 */
export function resolveSelectionCurrency(raw) {
  return normalizeSelectionCurrency(raw) || SELECTION_CURRENCY_USD;
}

/**
 * Present/select label. Empty and USD both show `USD ($)`.
 * @param {*} raw
 * @returns {string}
 */
export function selectionCurrencyLabel(raw) {
  const cleaned = String(raw ?? "").trim();
  const code = normalizeSelectionCurrency(raw);
  if (code) return SELECTION_CURRENCY_LABEL_BY_CODE[code] || code;
  if (!cleaned) {
    return SELECTION_CURRENCY_LABEL_BY_CODE[SELECTION_CURRENCY_USD];
  }
  return cleaned;
}

/**
 * Wording used in PDF payment / bank lines for the selection currency.
 * @param {"en"|"fr"} lang
 * @param {*} raw_currency
 * @returns {{
 *   currency_name: string,
 *   currency_code_display: string,
 *   bank_currency: string,
 * }}
 */
export function selectionPdfCurrencyWording(lang, raw_currency) {
  const code = resolveSelectionCurrency(raw_currency);
  const is_fr = String(lang || "").trim().toLowerCase() === "fr";
  if (code === SELECTION_CURRENCY_EUR) {
    return {
      currency_name: "euros",
      currency_code_display: EUR_SYMBOL,
      bank_currency: "euros",
    };
  }
  return {
    currency_name: "dollars",
    currency_code_display: "$US",
    bank_currency: is_fr ? "dollars US" : "US dollars",
  };
}
