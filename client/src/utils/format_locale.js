/**
 * BCP 47 locale for number formatting (dot decimal; grouping commas, later
 * rewritten to NBSP in `formatDisplayNumber`).
 */
export const format_locale = "en-US";

/**
 * BCP 47 locale for date/time display: day/month/year (`20/07/2026`) and 24h clock.
 */
export const date_format_locale = "en-GB";

/** Non-breaking space used as thousands grouping separator in display (`1 234.56`). */
export const number_group_separator = "\u00a0";

/**
 * @param {string} [_i18n_locale] — UI language; reserved for future mapping
 * @returns {string}
 */
export function getFormatLocale(_i18n_locale) {
  return format_locale;
}

/** @param {string} [_i18n_locale] @returns {string} */
export function getDateFormatLocale(_i18n_locale) {
  return date_format_locale;
}

/** @param {string} [_i18n_locale] @returns {string} */
export function getNumberFormatLocale(_i18n_locale) {
  return format_locale;
}

/**
 * SoftGems always displays clock times in 24-hour style (never AM/PM).
 *
 * @param {Intl.DateTimeFormatOptions} [options]
 * @returns {Intl.DateTimeFormatOptions}
 */
export function withHourCycle24(options = {}) {
  const opts = { ...(options || {}) };
  const includes_time =
    opts.hour != null ||
    opts.minute != null ||
    opts.second != null ||
    opts.timeStyle != null;
  if (includes_time) {
    opts.hour12 = false;
  }
  return opts;
}

/**
 * Parse a stored or displayed value as an English-style number.
 * Dot is the decimal separator. Spaces (incl. NBSP) and commas are
 * treated as thousands separators and stripped.
 *
 * @param {unknown} value
 * @returns {number | null}
 */
export function parseEnglishNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;

  let s = String(value).trim().replace(/\s/g, "");
  if (s === "" || s === "—") return null;

  if (s.includes(",")) {
    s = s.replace(/,/g, "");
  }

  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

/**
 * Format a number (or numeric string) for display.
 * Uses a non-breaking space as thousands separator and a dot as decimal
 * (`1 234.56`) — readable in both English and French contexts.
 *
 * @param {unknown} value
 * @param {{ maximumFractionDigits?: number, minimumFractionDigits?: number }} [options]
 * @returns {string | null} formatted string, or null when value is not numeric
 */
export function formatDisplayNumber(value, options = {}) {
  const n = parseEnglishNumber(value);
  if (n === null) return null;

  const { maximumFractionDigits = 3, minimumFractionDigits } = options;
  const locale_options = { maximumFractionDigits };
  if (minimumFractionDigits !== undefined) {
    locale_options.minimumFractionDigits = minimumFractionDigits;
  }

  return n
    .toLocaleString(format_locale, locale_options)
    .replace(/,/g, number_group_separator);
}
