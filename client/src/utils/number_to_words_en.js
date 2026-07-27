const units_en = [
  "zero",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
  "eleven",
  "twelve",
  "thirteen",
  "fourteen",
  "fifteen",
  "sixteen",
  "seventeen",
  "eighteen",
  "nineteen",
];

const tens_en = [
  "",
  "",
  "twenty",
  "thirty",
  "forty",
  "fifty",
  "sixty",
  "seventy",
  "eighty",
  "ninety",
];

const scales_en = [
  { value: 1_000_000_000, label: "billion" },
  { value: 1_000_000, label: "million" },
  { value: 1_000, label: "thousand" },
];

/**
 * @param {number} n integer between 0 and 999
 * @returns {string}
 */
function hundredsToWordsEn(n) {
  const parts = [];
  const hundreds = Math.floor(n / 100);
  const rest = n % 100;
  if (hundreds) parts.push(`${units_en[hundreds]} hundred`);
  if (rest) {
    if (rest < 20) {
      parts.push(units_en[rest]);
    } else {
      const ten = Math.floor(rest / 10);
      const unit = rest % 10;
      parts.push(unit ? `${tens_en[ten]}-${units_en[unit]}` : tens_en[ten]);
    }
  }
  return parts.join(" ");
}

/**
 * Spells out an integer in English following the ACF invoice style
 * (no "and": `four hundred twenty-four thousand four hundred seventy-six`).
 * @param {number|null|undefined} value
 * @returns {string} empty string when value is not a finite number
 */
export function numberToWordsEn(value) {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return "";
  }
  let n = Math.round(Math.abs(value));
  if (n === 0) return "zero";

  const parts = [];
  scales_en.forEach(({ value: scale, label }) => {
    const count = Math.floor(n / scale);
    if (count) {
      parts.push(`${hundredsToWordsEn(count)} ${label}`);
      n %= scale;
    }
  });
  if (n) parts.push(hundredsToWordsEn(n));

  const words = parts.join(" ");
  return value < 0 ? `minus ${words}` : words;
}

/**
 * Same as {@link numberToWordsEn} but with a capitalized first letter,
 * as used at the start of the payment line.
 * @param {number|null|undefined} value
 * @returns {string}
 */
export function numberToWordsEnCapitalized(value) {
  const words = numberToWordsEn(value);
  if (!words) return "";
  return words.charAt(0).toUpperCase() + words.slice(1);
}
