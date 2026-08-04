const units_fr = [
  "zéro",
  "un",
  "deux",
  "trois",
  "quatre",
  "cinq",
  "six",
  "sept",
  "huit",
  "neuf",
  "dix",
  "onze",
  "douze",
  "treize",
  "quatorze",
  "quinze",
  "seize",
  "dix-sept",
  "dix-huit",
  "dix-neuf",
];

const tens_fr = [
  "",
  "",
  "vingt",
  "trente",
  "quarante",
  "cinquante",
  "soixante",
  "soixante",
  "quatre-vingt",
  "quatre-vingt",
];

/**
 * @param {number} n integer between 0 and 99
 * @returns {string}
 */
function belowHundredToWordsFr(n) {
  if (n < 20) return units_fr[n];
  if (n < 70) {
    const ten = Math.floor(n / 10);
    const unit = n % 10;
    if (!unit) return tens_fr[ten];
    if (unit === 1) return `${tens_fr[ten]}-et-un`;
    return `${tens_fr[ten]}-${units_fr[unit]}`;
  }
  if (n < 80) {
    // 70-79: soixante-dix ...
    const rest = n - 60;
    if (rest === 11) return "soixante-et-onze";
    return `soixante-${units_fr[rest]}`;
  }
  // 80-99: quatre-vingt(s) ...
  const rest = n - 80;
  if (rest === 0) return "quatre-vingts";
  return `quatre-vingt-${units_fr[rest]}`;
}

/**
 * @param {number} n integer between 0 and 999
 * @returns {string}
 */
function hundredsToWordsFr(n) {
  if (n < 100) return belowHundredToWordsFr(n);
  const hundreds = Math.floor(n / 100);
  const rest = n % 100;
  let hundred_label = "cent";
  if (hundreds > 1) {
    hundred_label = rest === 0 ? `${units_fr[hundreds]} cents` : `${units_fr[hundreds]} cent`;
  }
  if (!rest) return hundred_label;
  return `${hundred_label} ${belowHundredToWordsFr(rest)}`;
}

/**
 * Spells out an integer in French (standard orthography).
 * @param {number|null|undefined} value
 * @returns {string} empty string when value is not a finite number
 */
export function numberToWordsFr(value) {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return "";
  }
  let n = Math.round(Math.abs(value));
  if (n === 0) return "zéro";

  const parts = [];
  const billions = Math.floor(n / 1_000_000_000);
  if (billions) {
    parts.push(
      billions === 1
        ? "un milliard"
        : `${hundredsToWordsFr(billions)} milliards`
    );
    n %= 1_000_000_000;
  }
  const millions = Math.floor(n / 1_000_000);
  if (millions) {
    parts.push(
      millions === 1
        ? "un million"
        : `${hundredsToWordsFr(millions)} millions`
    );
    n %= 1_000_000;
  }
  const thousands = Math.floor(n / 1_000);
  if (thousands) {
    parts.push(
      thousands === 1 ? "mille" : `${hundredsToWordsFr(thousands)} mille`
    );
    n %= 1_000;
  }
  if (n) parts.push(hundredsToWordsFr(n));

  const words = parts.join(" ");
  return value < 0 ? `moins ${words}` : words;
}

/**
 * Same as {@link numberToWordsFr} but with a capitalized first letter.
 * @param {number|null|undefined} value
 * @returns {string}
 */
export function numberToWordsFrCapitalized(value) {
  const words = numberToWordsFr(value);
  if (!words) return "";
  return words.charAt(0).toUpperCase() + words.slice(1);
}
