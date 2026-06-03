import { findGemSelectionMemberships } from "@/utils/gem_selection_memberships.js";
import {
  getGemMembershipAddedAt,
  normalizeMembershipPathsMap,
} from "@/utils/gem_selection_membership_paths.js";
import { allSelectionTypes } from "@/utils/selection_type_registry.js";

/**
 * @param {*} raw
 * @returns {number}
 */
function parseSortableTimestamp(raw) {
  if (!raw) return 0;
  const time = new Date(raw).getTime();
  return Number.isFinite(time) ? time : 0;
}

/**
 * @param {object} a
 * @param {object} b
 * @returns {number}
 */
export function compareMembershipRowsByGemAddedAt(a, b) {
  const added_cmp =
    parseSortableTimestamp(b?.added_at) - parseSortableTimestamp(a?.added_at);
  if (added_cmp !== 0) return added_cmp;

  const name_a = String(a?.internal_name || a?.$path || "");
  const name_b = String(b?.internal_name || b?.$path || "");
  return name_a.localeCompare(name_b, undefined, { sensitivity: "base" });
}

/**
 * @param {object} args
 * @param {string} args.gem_path
 * @param {object|null|undefined} args.gem
 * @param {object[]} args.selection_folders
 * @returns {object[]}
 */
export function buildGemSelectionMembershipRows({
  gem_path,
  gem,
  selection_folders,
}) {
  const folders = findGemSelectionMemberships({
    gem_path,
    gem,
    selection_folders,
  });

  return folders
    .map((folder) => {
      const folder_path = String(folder?.$path || "").trim();
      return {
        ...folder,
        added_at: getGemMembershipAddedAt(gem, folder_path),
      };
    })
    .sort(compareMembershipRowsByGemAddedAt);
}

/**
 * Type filter chips for rows present on this gem (registry order).
 *
 * @param {object[]} membership_rows
 * @returns {import("@/utils/selection_type_registry.js").SelectionTypeDef[]}
 */
export function membershipTypeFilterOptions(membership_rows) {
  const rows = Array.isArray(membership_rows) ? membership_rows : [];
  const present_types = new Set(
    rows.map((row) => String(row?.selection_type || "").trim()).filter(Boolean)
  );
  return allSelectionTypes().filter((def) => present_types.has(def.value));
}

/**
 * @param {object[]} membership_rows
 * @param {string} active_type_filter – stored `selection_type` value or ""
 * @returns {object[]}
 */
export function filterMembershipRowsByType(membership_rows, active_type_filter) {
  const rows = Array.isArray(membership_rows) ? membership_rows : [];
  const filter_value = String(active_type_filter || "").trim();
  if (!filter_value) return [...rows];
  return rows.filter(
    (row) => String(row?.selection_type || "").trim() === filter_value
  );
}
