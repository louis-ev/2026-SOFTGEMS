const _MISSING_STONE_TYPE_SORT_KEY = "\uffff";

/**
 * @param {*} raw
 * @returns {string[]}
 */
export function normalizeSelectionGemPaths(raw) {
  if (!Array.isArray(raw)) return [];
  const out = [];
  const seen = new Set();
  for (const item of raw) {
    if (typeof item !== "string") continue;
    const gem_path = item.trim();
    if (!gem_path || seen.has(gem_path)) continue;
    seen.add(gem_path);
    out.push(gem_path);
  }
  return out;
}

function stoneTypeSortKey(gem) {
  const stone_type = gem?.stone_type;
  if (stone_type === null || stone_type === undefined) {
    return _MISSING_STONE_TYPE_SORT_KEY;
  }
  const trimmed = String(stone_type).trim();
  if (!trimmed) return _MISSING_STONE_TYPE_SORT_KEY;
  return trimmed.toLowerCase();
}

function parseWeightCt(gem) {
  const weight = gem?.weight_ct;
  if (typeof weight === "number" && Number.isFinite(weight)) return weight;
  if (typeof weight === "string") {
    const parsed = parseFloat(weight.trim());
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

/**
 * Fixed selection table order: stone type (A→Z), then weight (lightest→heaviest).
 *
 * @param {object[]} gems
 * @returns {object[]}
 */
export function sortSelectionGems(gems) {
  if (!Array.isArray(gems)) return [];
  return [...gems].sort((a, b) => {
    const type_cmp = stoneTypeSortKey(a).localeCompare(
      stoneTypeSortKey(b),
      undefined,
      { sensitivity: "base" }
    );
    if (type_cmp !== 0) return type_cmp;

    const weight_a = parseWeightCt(a);
    const weight_b = parseWeightCt(b);
    if (weight_a === null && weight_b === null) {
      return String(a?.$path || "").localeCompare(String(b?.$path || ""), undefined, {
        numeric: true,
        sensitivity: "base",
      });
    }
    if (weight_a === null) return 1;
    if (weight_b === null) return -1;
    if (weight_a !== weight_b) return weight_a - weight_b;

    return String(a?.$path || "").localeCompare(String(b?.$path || ""), undefined, {
      numeric: true,
      sensitivity: "base",
    });
  });
}
