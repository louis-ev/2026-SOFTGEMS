import { numberToWordsEn } from "@/utils/number_to_words_en.js";
import { numberToWordsFr } from "@/utils/number_to_words_fr.js";

/**
 * Split a money amount into major units and cents (0-99).
 * @param {number|null|undefined} value
 * @returns {{ major: number, cents: number }|null}
 */
export function splitAmountMajorAndCents(value) {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return null;
  }
  const sign = value < 0 ? -1 : 1;
  const total_cents = Math.round(Math.abs(value) * 100);
  return {
    major: Math.floor(total_cents / 100) * sign,
    cents: total_cents % 100,
  };
}

/**
 * Payment-line wording parts: lowercase major amount, plus a cents clause
 * when cents are non-zero.
 * @param {"en"|"fr"|string} lang
 * @param {number|null|undefined} value
 * @returns {{ amount_words: string, cents_clause: string }}
 */
export function paymentAmountWordParts(lang, value) {
  const split = splitAmountMajorAndCents(value);
  if (!split) return { amount_words: "", cents_clause: "" };
  const is_fr = String(lang || "").trim().toLowerCase() === "fr";
  const amount_words = is_fr
    ? numberToWordsFr(split.major)
    : numberToWordsEn(split.major);
  if (split.cents === 0) {
    return { amount_words, cents_clause: "" };
  }
  const cents_words = is_fr
    ? numberToWordsFr(split.cents)
    : numberToWordsEn(split.cents);
  if (is_fr) {
    const unit = split.cents === 1 ? "centime" : "centimes";
    return { amount_words, cents_clause: ` et ${cents_words} ${unit}` };
  }
  const unit = split.cents === 1 ? "cent" : "cents";
  return { amount_words, cents_clause: ` and ${cents_words} ${unit}` };
}
