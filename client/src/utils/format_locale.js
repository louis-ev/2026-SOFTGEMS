/** BCP 47 locale for Intl date/number formatting (SoftGems: French users). */
export const format_locale = "fr-FR";

/**
 * @param {string} [_i18n_locale] — UI language; reserved for future mapping
 * @returns {string}
 */
export function getFormatLocale(_i18n_locale) {
  return format_locale;
}

/** @param {string} [_i18n_locale] @returns {string} */
export function getDateFormatLocale(_i18n_locale) {
  return format_locale;
}

/** @param {string} [_i18n_locale] @returns {string} */
export function getNumberFormatLocale(_i18n_locale) {
  return format_locale;
}
