/**
 * Compact inventory display codes for stored `treatment_type` values.
 * Stored meta keeps the full lab-style string; table/filters show the code.
 *
 * Codes lean on CIBJO trade letters (N, H, U, F, O, RES) plus SoftGems
 * lab shorthand already present in the values (TE, TE1–5, F1–3, Type A/B).
 */

/** @type {ReadonlyArray<{ value: string, code: string }>} */
export const TREATMENT_TYPE_DISPLAY_ENTRIES = Object.freeze([
  { value: "Natural", code: "N" },
  { value: "No indications of heating", code: "No H" },
  { value: "Indications of heating / TE", code: "TE" },
  {
    value: "Indications of heating with residues (TE1/2/3/4/5)",
    code: "TE1–5",
  },
  {
    value: "Indications of heating with diffusion (Be/Ti/Cr)",
    code: "U",
  },
  {
    value: "Indications of heating with Lead Glass filling (F1/2/3)",
    code: "F1–3",
  },
  { value: "No indications of clarity modification", code: "No CM" },
  { value: "Oil - Insignificant", code: "O Ins" },
  { value: "Oil - Minor", code: "O Min" },
  { value: "Oil - Moderate", code: "O Mod" },
  { value: "Oil - Significant", code: "O Sig" },
  { value: "Resin - Insignificant", code: "RES Ins" },
  { value: "Resin - Minor", code: "RES Min" },
  { value: "Resin - Moderate", code: "RES Mod" },
  { value: "Resin - Significant", code: "RES Sig" },
  { value: "Type A (Natural)", code: "Type A" },
  { value: "Type B (Impregnated)", code: "Type B" },
]);

const CODE_BY_NORMALIZED_VALUE = new Map(
  TREATMENT_TYPE_DISPLAY_ENTRIES.map((entry) => [
    entry.value.trim().toLowerCase(),
    entry.code,
  ]),
);

/**
 * @param {*} raw
 * @returns {string}
 */
export function normalizeTreatmentTypeValue(raw) {
  return String(raw ?? "").trim();
}

/**
 * Short code for table / filter chips. Unknown values pass through unchanged.
 * @param {*} raw
 * @returns {string}
 */
export function gemTreatmentTypeCode(raw) {
  const full = normalizeTreatmentTypeValue(raw);
  if (!full) return "";
  return CODE_BY_NORMALIZED_VALUE.get(full.toLowerCase()) || full;
}

/**
 * Full label for tooltips / editors. Unknown values pass through unchanged.
 * @param {*} raw
 * @returns {string}
 */
export function gemTreatmentTypeFullLabel(raw) {
  return normalizeTreatmentTypeValue(raw);
}

/**
 * Tooltip text when the compact code differs from the stored value,
 * or when the value may be ellipsized in a narrow cell.
 * @param {*} raw
 * @returns {string}
 */
export function gemTreatmentTypeTitle(raw) {
  const full = gemTreatmentTypeFullLabel(raw);
  if (!full) return "";
  return full;
}
