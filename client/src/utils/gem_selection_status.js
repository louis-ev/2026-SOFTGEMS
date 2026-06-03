import { extract_field_entries } from "@/utils/field_history.js";
import { findGemSelectionMemberships } from "@/utils/gem_selection_memberships.js";
import { normalizeMembershipPathsMap } from "@/utils/gem_selection_membership_paths.js";
import {
  GEM_STATUS_REFERENCE,
  normalizeGemStatusSlug,
} from "@/utils/gem_status.js";
import { selectionSlugFromType } from "@/utils/selection_type_registry.js";

const STATUS_FIELD_KEY = "status";

/** Selection types that set `status` to the matching type slug when a gem is linked. */
export const SELECTION_TYPES_AFFECTING_GEM_STATUS = Object.freeze([
  "memo in",
  "return memo in",
  "return memo out",
  "buying invoice",
  "sale invoice",
]);

/**
 * @param {*} selection_type
 * @returns {string} Stored gem `status` slug (e.g. `memo-in`, `buying-invoice`).
 */
export function gemStatusSlugForSelectionType(selection_type) {
  const value = String(selection_type || "").trim();
  if (!SELECTION_TYPES_AFFECTING_GEM_STATUS.includes(value)) return "";
  return selectionSlugFromType(value) || "";
}

/** @deprecated Use `gemStatusSlugForSelectionType`. */
export function gemStatusForSelectionType(selection_type) {
  return gemStatusSlugForSelectionType(selection_type);
}

/**
 * @param {*} selection_type
 * @returns {boolean}
 */
export function selectionTypeAffectsGemStatus(selection_type) {
  return Boolean(gemStatusSlugForSelectionType(selection_type));
}

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
 * @param {object[]} memberships
 * @param {Record<string, string>} membership_paths_map – `selection_membership_paths`
 * @returns {string}
 */
export function resolveGemStatusFromMemberships(
  memberships,
  membership_paths_map
) {
  const paths_map = normalizeMembershipPathsMap(membership_paths_map);
  const folders = Array.isArray(memberships) ? memberships : [];
  const candidates = folders
    .map((folder) => {
      const folder_path = String(folder?.$path || "").trim();
      if (!folder_path) return null;
      const status = gemStatusSlugForSelectionType(folder.selection_type);
      if (!status) return null;
      const added_at =
        paths_map[folder_path] ||
        folder.selection_date ||
        folder.$date_created;
      return {
        status,
        sort_key: parseSortableTimestamp(added_at),
      };
    })
    .filter(Boolean);

  if (!candidates.length) return "";
  candidates.sort((a, b) => b.sort_key - a.sort_key);
  return candidates[0].status;
}

/**
 * Previous `status` before the latest block of values imposed by a removed selection,
 * from folder field history (newest first). Empty string if auto-restore does not apply.
 *
 * @param {Array<object>} history_entries – raw `getFieldHistory` log
 * @param {*} current_status
 * @param {*} removed_selection_type
 * @returns {string}
 */
export function resolveGemStatusFromHistoryBeforeRemoval(
  history_entries,
  current_status,
  removed_selection_type
) {
  const mapped_status = gemStatusSlugForSelectionType(removed_selection_type);
  const current = normalizeGemStatusSlug(current_status);
  if (!mapped_status || current !== mapped_status) return "";

  const rows = extract_field_entries(history_entries, STATUS_FIELD_KEY);
  for (const row of rows) {
    const value = normalizeGemStatusSlug(row.value);
    if (value === mapped_status) continue;
    return value || GEM_STATUS_REFERENCE;
  }

  return GEM_STATUS_REFERENCE;
}

/**
 * One `updateMeta` on the gem when linking to a selection: membership date + optional status.
 *
 * @param {object} args
 * @param {object} args.api
 * @param {string} args.gem_path
 * @param {string} args.selection_path
 * @param {string} args.selection_type
 * @returns {Promise<{ status_changed: boolean, previous_status: string, new_status: string }>}
 */
export async function applyGemMetaWhenAddedToSelection({
  api,
  gem_path,
  selection_path,
  selection_type,
}) {
  const cleaned_selection_path = String(selection_path || "").trim();
  const gem = await api.getFolder({ path: gem_path });
  const previous_status = normalizeGemStatusSlug(gem?.status);
  const mapped_status = gemStatusSlugForSelectionType(selection_type);

  const membership_paths_map = normalizeMembershipPathsMap(
    gem.selection_membership_paths,
    gem.selection_gem_added_at
  );
  if (cleaned_selection_path && !membership_paths_map[cleaned_selection_path]) {
    membership_paths_map[cleaned_selection_path] = new Date().toISOString();
  }

  const new_meta = { selection_membership_paths: membership_paths_map };
  if (mapped_status) {
    new_meta.status = mapped_status;
  }

  await api.updateMeta({ path: gem_path, new_meta });

  const new_status = mapped_status || previous_status;
  return {
    status_changed: Boolean(
      mapped_status && previous_status !== mapped_status
    ),
    previous_status,
    new_status,
  };
}

/** @deprecated Use `applyGemMetaWhenAddedToSelection`. */
export async function applyGemStatusWhenAddedToSelection(args) {
  return applyGemMetaWhenAddedToSelection(args);
}

/**
 * @param {object} args
 * @param {object} args.api
 * @param {string} args.gem_path
 * @param {string} args.selection_path
 * @param {string} [args.selection_type]
 * @param {object[]} [args.selection_folders]
 * @returns {Promise<{ status_changed: boolean, previous_status: string, new_status: string, restored_from: string }>}
 */
export async function restoreGemStatusWhenRemovedFromSelection({
  api,
  gem_path,
  selection_path,
  selection_type,
  selection_folders,
}) {
  const cleaned_selection_path = String(selection_path || "").trim();
  const gem = await api.getFolder({ path: gem_path });
  const previous_status = normalizeGemStatusSlug(gem?.status);
  const mapped_removed = gemStatusSlugForSelectionType(selection_type);

  const membership_paths_map = normalizeMembershipPathsMap(
    gem.selection_membership_paths,
    gem.selection_gem_added_at
  );
  delete membership_paths_map[cleaned_selection_path];

  let folders = Array.isArray(selection_folders) ? selection_folders : [];
  if (!folders.length) {
    try {
      const rows = await api.getFolders({ path: "selections" });
      folders = Array.isArray(rows) ? rows : [];
    } catch {
      folders = [];
    }
  }

  const memberships = findGemSelectionMemberships({
    gem_path,
    gem,
    selection_folders: folders,
  }).filter(
    (folder) => String(folder?.$path || "").trim() !== cleaned_selection_path
  );

  const membership_status = resolveGemStatusFromMemberships(
    memberships,
    membership_paths_map
  );

  let new_status = previous_status;
  let restored_from = "unchanged";

  if (membership_status) {
    new_status = normalizeGemStatusSlug(membership_status);
    restored_from = "membership";
  } else if (
    mapped_removed &&
    previous_status === mapped_removed
  ) {
    let history_status = "";
    try {
      const history_entries = await api.getFieldHistory({ path: gem_path });
      history_status = resolveGemStatusFromHistoryBeforeRemoval(
        history_entries,
        previous_status,
        selection_type
      );
    } catch {
      history_status = "";
    }

    new_status =
      normalizeGemStatusSlug(history_status) || GEM_STATUS_REFERENCE;
    restored_from = history_status ? "history" : "default";
  }

  const gem_meta_patch = { selection_membership_paths: membership_paths_map };
  if (new_status !== previous_status) {
    gem_meta_patch.status = new_status;
  }
  await api.updateMeta({
    path: gem_path,
    new_meta: gem_meta_patch,
  });

  return {
    status_changed: previous_status !== new_status,
    previous_status,
    new_status,
    restored_from,
  };
}
