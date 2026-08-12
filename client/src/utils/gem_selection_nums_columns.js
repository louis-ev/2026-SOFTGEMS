import { listGemIndexedSelectionPaths } from "@/utils/gem_selection_membership_paths.js";
import {
  parseSelectionFolderPath,
  selectionDocumentNumber,
} from "@/utils/selection_paths.js";
import {
  allSelectionTypes,
  selectionTypeDefFromSlug,
} from "@/utils/selection_type_registry.js";

/** Virtual gems-table column prefix: `selection_nums_{type_slug with _}` */
export const SELECTION_NUMS_COLUMN_PREFIX = "selection_nums_";

/**
 * @param {string} type_slug  e.g. `memo-in`
 * @returns {string} e.g. `selection_nums_memo_in`
 */
export function selectionNumsColumnKeyFromSlug(type_slug) {
  const slug = String(type_slug || "").trim();
  if (!slug) return "";
  return `${SELECTION_NUMS_COLUMN_PREFIX}${slug.replace(/-/g, "_")}`;
}

/**
 * @param {string} metadata_key
 * @returns {string} type slug or ""
 */
export function selectionTypeSlugFromNumsColumnKey(metadata_key) {
  const key = String(metadata_key || "").trim();
  if (!key.startsWith(SELECTION_NUMS_COLUMN_PREFIX)) return "";
  const slug_part = key.slice(SELECTION_NUMS_COLUMN_PREFIX.length);
  if (!slug_part) return "";
  return slug_part.replace(/_/g, "-");
}

/** @returns {boolean} */
export function isSelectionNumsColumnKey(metadata_key) {
  return Boolean(selectionTypeSlugFromNumsColumnKey(metadata_key));
}

/**
 * One virtual column key per selection type (registry sort order).
 * @type {readonly string[]}
 */
export const gems_table_selection_nums_column_keys = Object.freeze(
  allSelectionTypes().map((def) => selectionNumsColumnKeyFromSlug(def.slug))
);

/** Box column key (`selection_nums_box`). */
export const gems_table_selection_nums_box_column_key =
  selectionNumsColumnKeyFromSlug("box");

/**
 * Selection-number columns offered in the picker but off by default / on reset
 * (all selection types, including box).
 * @type {readonly string[]}
 */
export const gems_table_selection_nums_opt_in_column_keys =
  gems_table_selection_nums_column_keys;

/**
 * @param {string} metadata_key
 * @returns {boolean}
 */
export function isGemsTableDefaultOffColumnKey(metadata_key) {
  return gems_table_selection_nums_column_keys.includes(metadata_key);
}

/**
 * Catalog keys that are visible when no saved column preference exists (and after reset).
 * @param {string[]} all_keys
 * @returns {string[]}
 */
export function filterGemsTableDefaultVisibleKeys(all_keys) {
  if (!Array.isArray(all_keys)) return [];
  return all_keys.filter((key) => !isGemsTableDefaultOffColumnKey(key));
}

/**
 * Document numbers for selections of `type_slug` that index this gem (no server).
 * Sorted numeric ascending.
 *
 * @param {object|null|undefined} gem
 * @param {string} type_slug
 * @returns {string[]}
 */
export function listGemSelectionDocumentNumbersForType(gem, type_slug) {
  const wanted_slug = String(type_slug || "").trim();
  if (!wanted_slug) return [];

  const numbers = [];
  const seen = new Set();
  for (const path of listGemIndexedSelectionPaths(gem)) {
    const parsed = parseSelectionFolderPath(path);
    if (parsed.type_slug !== wanted_slug) continue;
    const doc = selectionDocumentNumber(path);
    if (!doc || seen.has(doc)) continue;
    seen.add(doc);
    numbers.push(doc);
  }

  return numbers.sort((a, b) =>
    a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" })
  );
}

/**
 * Display string for a selection-nums column (comma-separated numbers), or "".
 *
 * @param {object|null|undefined} gem
 * @param {string} metadata_key
 * @returns {string}
 */
export function formatGemSelectionNumsColumnValue(gem, metadata_key) {
  const type_slug = selectionTypeSlugFromNumsColumnKey(metadata_key);
  if (!type_slug) return "";
  return listGemSelectionDocumentNumbersForType(gem, type_slug).join(", ");
}

/**
 * @param {string} metadata_key
 * @returns {string|null} bootstrap-icon name
 */
export function selectionNumsColumnIcon(metadata_key) {
  const type_slug = selectionTypeSlugFromNumsColumnKey(metadata_key);
  if (!type_slug) return null;
  return selectionTypeDefFromSlug(type_slug)?.icon || null;
}
