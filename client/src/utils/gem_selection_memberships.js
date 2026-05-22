import { normalizeSelectionGemPaths } from "@/utils/selection_entries.js";
import { selectionSlugFromType } from "@/utils/selection_type_registry.js";

/**
 * @param {object} args
 * @param {string} args.gem_path
 * @param {object|null|undefined} args.gem
 * @param {object[]} args.selection_folders
 * @returns {object[]}
 */
export function findGemSelectionMemberships({
  gem_path,
  gem,
  selection_folders,
}) {
  const normalized_gem_path = String(gem_path || "").trim();
  if (!normalized_gem_path) return [];

  const by_path = new Map();
  const folders = Array.isArray(selection_folders) ? selection_folders : [];

  for (const folder of folders) {
    const folder_path = String(folder?.$path || "").trim();
    if (!folder_path) continue;
    const entries = normalizeSelectionGemPaths(folder.selection_entries);
    if (!entries.includes(normalized_gem_path)) continue;
    by_path.set(folder_path, folder);
  }

  const box_path = String(gem?.box_selection_path || "").trim();
  if (box_path && !by_path.has(box_path)) {
    const from_list = folders.find((row) => row?.$path === box_path);
    if (from_list) {
      by_path.set(box_path, from_list);
    } else {
      by_path.set(box_path, {
        $path: box_path,
        selection_type: "boîte",
      });
    }
  }

  return [...by_path.values()].sort(compareSelectionMembershipRows);
}

/**
 * @param {object} a
 * @param {object} b
 * @returns {number}
 */
export function compareSelectionMembershipRows(a, b) {
  const date_a = parseSortableDate(a?.selection_date || a?.$date_created);
  const date_b = parseSortableDate(b?.selection_date || b?.$date_created);
  if (date_a !== date_b) return date_b - date_a;

  const type_a = String(a?.selection_type || "");
  const type_b = String(b?.selection_type || "");
  const type_cmp = type_a.localeCompare(type_b, undefined, {
    sensitivity: "base",
  });
  if (type_cmp !== 0) return type_cmp;

  const name_a = String(a?.internal_name || a?.$path || "");
  const name_b = String(b?.internal_name || b?.$path || "");
  return name_a.localeCompare(name_b, undefined, { sensitivity: "base" });
}

/**
 * @param {*} raw
 * @returns {number}
 */
function parseSortableDate(raw) {
  if (!raw) return 0;
  const time = new Date(raw).getTime();
  return Number.isFinite(time) ? time : 0;
}

/**
 * @param {object} folder
 * @returns {string}
 */
export function selectionMembershipTypeSlug(folder) {
  return selectionSlugFromType(folder?.selection_type);
}

/**
 * @param {string} folder_path
 * @returns {string}
 */
export function selectionFolderSlugFromPath(folder_path) {
  const cleaned = String(folder_path || "").trim();
  if (!cleaned) return "";
  const parts = cleaned.split("/");
  return parts[parts.length - 1] || "";
}
