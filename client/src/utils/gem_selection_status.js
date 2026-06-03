import { findGemSelectionMemberships } from "@/utils/gem_selection_memberships.js";
import {
  GEM_STATUS_REFERENCE,
  normalizeGemStatusSlug,
} from "@/utils/gem_status.js";
import { selectionSlugFromType } from "@/utils/selection_type_registry.js";

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
 * @returns {Record<string, string>}
 */
export function normalizeStatusTrackingMap(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const out = {};
  for (const [key, value] of Object.entries(raw)) {
    const path = String(key || "").trim();
    if (!path) continue;
    const status = normalizeGemStatusSlug(value);
    if (status) out[path] = status;
  }
  return out;
}

/**
 * @param {*} raw
 * @returns {Record<string, string>}
 */
export function normalizeAddedAtMap(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const out = {};
  for (const [key, value] of Object.entries(raw)) {
    const path = String(key || "").trim();
    if (!path) continue;
    const iso = String(value ?? "").trim();
    if (iso) out[path] = iso;
  }
  return out;
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
 * @param {Record<string, string>} added_at_map
 * @returns {string}
 */
export function resolveGemStatusFromMemberships(memberships, added_at_map) {
  const folders = Array.isArray(memberships) ? memberships : [];
  const candidates = folders
    .map((folder) => {
      const folder_path = String(folder?.$path || "").trim();
      if (!folder_path) return null;
      const status = gemStatusSlugForSelectionType(folder.selection_type);
      if (!status) return null;
      const added_at =
        added_at_map[folder_path] ||
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
 * @param {object} args
 * @param {object} args.api
 * @param {string} args.gem_path
 * @param {string} args.selection_path
 * @param {string} args.selection_type
 * @returns {Promise<{ status_changed: boolean, previous_status: string, new_status: string }>}
 */
export async function applyGemStatusWhenAddedToSelection({
  api,
  gem_path,
  selection_path,
  selection_type,
}) {
  const mapped_status = gemStatusSlugForSelectionType(selection_type);
  const cleaned_selection_path = String(selection_path || "").trim();
  if (!mapped_status || !cleaned_selection_path) {
    return {
      status_changed: false,
      previous_status: "",
      new_status: "",
    };
  }

  const gem = await api.getFolder({ path: gem_path });
  const previous_status = normalizeGemStatusSlug(gem?.status);
  const status_before_map = normalizeStatusTrackingMap(
    gem.selection_status_before
  );
  const added_at_map = normalizeAddedAtMap(gem.selection_gem_added_at);

  if (!status_before_map[cleaned_selection_path]) {
    status_before_map[cleaned_selection_path] = previous_status;
  }
  added_at_map[cleaned_selection_path] = new Date().toISOString();

  const new_meta = {
    selection_status_before: status_before_map,
    selection_gem_added_at: added_at_map,
    status: mapped_status,
  };

  await api.updateMeta({ path: gem_path, new_meta });

  return {
    status_changed: previous_status !== mapped_status,
    previous_status,
    new_status: mapped_status,
  };
}

/**
 * @param {object} args
 * @param {object} args.api
 * @param {string} args.gem_path
 * @param {string} args.selection_path
 * @param {object[]} [args.selection_folders]
 * @returns {Promise<{ status_changed: boolean, previous_status: string, new_status: string, restored_from: string }>}
 */
export async function restoreGemStatusWhenRemovedFromSelection({
  api,
  gem_path,
  selection_path,
  selection_folders,
}) {
  const cleaned_selection_path = String(selection_path || "").trim();
  const gem = await api.getFolder({ path: gem_path });
  const previous_status = normalizeGemStatusSlug(gem?.status);

  const status_before_map = normalizeStatusTrackingMap(
    gem.selection_status_before
  );
  const added_at_map = normalizeAddedAtMap(gem.selection_gem_added_at);
  const snapshot_status = status_before_map[cleaned_selection_path] || "";

  delete status_before_map[cleaned_selection_path];
  delete added_at_map[cleaned_selection_path];

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
    added_at_map
  );
  const new_status =
    normalizeGemStatusSlug(membership_status || snapshot_status) ||
    GEM_STATUS_REFERENCE;
  const restored_from = membership_status
    ? "membership"
    : snapshot_status
      ? "snapshot"
      : "default";

  await api.updateMeta({
    path: gem_path,
    new_meta: {
      status: new_status,
      selection_status_before: status_before_map,
      selection_gem_added_at: added_at_map,
    },
  });

  return {
    status_changed: previous_status !== new_status,
    previous_status,
    new_status,
    restored_from,
  };
}
