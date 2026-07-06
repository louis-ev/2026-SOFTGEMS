/**
 * PDF shape abbreviations for the Description column (line 1: color + stone + shape).
 * Keys must match shape_suggestions values exactly. Edit freely.
 */
export const pdf_shape_abbreviations = Object.freeze({
  "Round Brilliant": "RB",
  Oval: "OV",
  Cushion: "CU",
  "Square Cushion": "SQ CN",
  "Pear Shape": "PS",
  Marquise: "MQ",
  Heart: "HT",
  Princess: "PR",
  Baguette: "BG",
  Trapezoid: "TR",
  "Triangle (Trilliant)": "TRIL",
  Hexagonal: "HX",
  Octagonal: "OC",
  Octogonal: "OC",
  Lozenge: "LZ",
  "Fancy Shape": "FS",
  "Mixed Cut": "MX",
  "Rose Cut": "RC",
  Briolette: "BR",
  Cabochon: "CB",
  "Sugarloaf Cabochon": "SL CB",
  "Buff Top": "BT",
  Carved: "CV",
  Pierced: "PC",
  Bead: "BD",
  Drop: "DR",
  Rough: "RF",
  "Polished Rough": "P RF",
});

/**
 * @param {string} shape
 * @returns {string}
 */
export function pdfShapeAbbreviation(shape) {
  const raw = String(shape || "").trim();
  if (!raw) return "";
  if (pdf_shape_abbreviations[raw]) return pdf_shape_abbreviations[raw];
  const words = raw.split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return words.map((word) => word.charAt(0).toUpperCase()).join("");
  }
  return raw.slice(0, 3).toUpperCase();
}
