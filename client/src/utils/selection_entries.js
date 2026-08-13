const _MISSING_STONE_TYPE_SORT_KEY = "\uffff";

/**
 * @param {*} raw
 * @returns {string[]}
 */
/**
 * @param {*} path_raw
 * @returns {string}
 */
export function gemSlugFromPath(path_raw) {
  if (path_raw === null || path_raw === undefined) return "";
  const trimmed = String(path_raw).trim();
  if (!trimmed) return "";
  const parts = trimmed.split("/");
  return parts[parts.length - 1] || "";
}

/**
 * Parse gem IDs pasted from clipboard / textarea.
 * Accepts bare IDs (`42`), `#42`, or paths (`gems/42`), separated by
 * commas, semicolons, or whitespace. Deduplicates while preserving order.
 *
 * @param {*} raw
 * @returns {string[]}
 */
export function parseGemIdsFromText(raw) {
  const text = String(raw ?? "").trim();
  if (!text) return [];

  const tokens = text.split(/[\s,;]+/).filter(Boolean);
  const out = [];
  const seen = new Set();
  for (const token of tokens) {
    let id = String(token || "").trim();
    if (!id) continue;
    if (id.startsWith("#")) id = id.slice(1).trim();
    if (id.includes("/")) id = gemSlugFromPath(id);
    if (!id || id === "gems" || seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out;
}

/**
 * Split pasted gem IDs into those already on the selection vs those still to add.
 *
 * @param {string[]|undefined|null} gem_ids
 * @param {string[]|undefined|null} selection_gem_paths
 * @returns {{ already_included_ids: string[], new_ids: string[] }}
 */
export function partitionGemIdsAgainstSelection(gem_ids, selection_gem_paths) {
  const existing_ids = new Set(
    normalizeSelectionGemPaths(selection_gem_paths)
      .map(gemSlugFromPath)
      .filter(Boolean)
  );
  const already_included_ids = [];
  const new_ids = [];
  for (const raw_id of Array.isArray(gem_ids) ? gem_ids : []) {
    const gem_id = String(raw_id || "").trim();
    if (!gem_id) continue;
    if (existing_ids.has(gem_id)) already_included_ids.push(gem_id);
    else new_ids.push(gem_id);
  }
  return { already_included_ids, new_ids };
}

/**
 * @param {string[]|undefined|null} gem_paths
 * @param {string} [separator=", "]
 * @returns {string}
 */
export function formatGemIdsForClipboard(gem_paths, separator = ", ") {
  const ids = normalizeSelectionGemPaths(gem_paths)
    .map(gemSlugFromPath)
    .filter(Boolean);
  return ids.join(separator);
}

/**
 * @param {*} raw
 * @returns {string}
 */
export function formatSelectionEntriesHistoryValue(raw) {
  const paths = normalizeSelectionGemPaths(raw);
  if (paths.length === 0) return "—";

  const slugs = paths.map(gemSlugFromPath).filter(Boolean);
  if (slugs.length === 0) return "—";

  const joined = slugs.join(", ");
  if (joined.length > 140) {
    return `${slugs.length} (${slugs.slice(0, 10).join(", ")}…)`;
  }
  if (slugs.length === 1) return slugs[0];
  return `${slugs.length} gems: ${joined}`;
}

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

/**
 * @param {string[]|undefined|null} left_paths
 * @param {string[]|undefined|null} right_paths
 * @returns {boolean}
 */
export function areSelectionGemPathsEqual(left_paths, right_paths) {
  const left = normalizeSelectionGemPaths(left_paths);
  const right = normalizeSelectionGemPaths(right_paths);
  if (left.length !== right.length) return false;
  return left.every((gem_path, index) => gem_path === right[index]);
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
