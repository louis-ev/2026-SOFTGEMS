import { normalizeSelectionGemPaths } from "@/utils/selection_entries.js";
import { normalizeMembershipPathsMap } from "@/utils/gem_selection_membership_paths.js";
import { isBoxSelectionPath } from "@/utils/gem_selection_memberships.js";
import { resolveSelectionType } from "@/utils/selection_paths.js";

/**
 * Compute gem meta patch so denormalized indexes match selection membership.
 * Does not overwrite `box_selection_path` when it points at a different box.
 *
 * @param {object} args
 * @param {object|null|undefined} args.gem
 * @param {string} args.selection_path
 * @param {boolean} args.is_box
 * @param {string} [args.added_at_iso]
 * @returns {{
 *   needs_heal: boolean,
 *   new_meta: Record<string, unknown>|null,
 *   box_conflict: boolean,
 * }}
 */
export function gemIndexHealPatch({
  gem,
  selection_path,
  is_box,
  added_at_iso,
}) {
  const cleaned_selection_path = String(selection_path || "").trim();
  if (!cleaned_selection_path || !gem || typeof gem !== "object") {
    return { needs_heal: false, new_meta: null, box_conflict: false };
  }

  const new_meta = {};
  let box_conflict = false;

  const map = normalizeMembershipPathsMap(
    gem.selection_membership_paths,
    gem.selection_gem_added_at
  );
  if (!map[cleaned_selection_path]) {
    map[cleaned_selection_path] =
      String(added_at_iso || "").trim() || new Date().toISOString();
    new_meta.selection_membership_paths = map;
  }

  if (is_box) {
    const current_box = String(gem.box_selection_path || "").trim();
    if (!current_box) {
      new_meta.box_selection_path = cleaned_selection_path;
    } else if (current_box !== cleaned_selection_path) {
      box_conflict = true;
    }
  }

  const needs_heal = Object.keys(new_meta).length > 0;
  return {
    needs_heal,
    new_meta: needs_heal ? new_meta : null,
    box_conflict,
  };
}

/**
 * @param {object|null|undefined} selection_folder
 * @returns {boolean}
 */
export function selectionFolderIsBox(selection_folder) {
  const path = String(selection_folder?.$path || "").trim();
  if (path && isBoxSelectionPath(path)) return true;
  return resolveSelectionType(selection_folder) === "bo\u00eete";
}

/**
 * @param {object} args
 * @param {object[]} args.gems
 * @param {string} args.selection_path
 * @param {object|null|undefined} args.selection_folder
 * @returns {object[]} gems that need an index heal
 */
export function gemsNeedingIndexHeal({ gems, selection_path, selection_folder }) {
  const cleaned_selection_path = String(selection_path || "").trim();
  if (!cleaned_selection_path) return [];
  const is_box = selectionFolderIsBox({
    ...(selection_folder || {}),
    $path: selection_folder?.$path || cleaned_selection_path,
  });
  const list = Array.isArray(gems) ? gems : [];
  return list.filter((gem) => {
    const gem_path = String(gem?.$path || "").trim();
    if (!gem_path) return false;
    return gemIndexHealPatch({
      gem,
      selection_path: cleaned_selection_path,
      is_box,
    }).needs_heal;
  });
}

/**
 * Heal gem-side indexes for every gem listed in a selection's `selection_entries`.
 * Best-effort: continues on individual gem failures.
 *
 * @param {object} args
 * @param {object} args.api — `updateMeta`
 * @param {string} args.selection_path
 * @param {object|null|undefined} args.selection_folder
 * @param {object[]} args.gems — already-loaded gem folders (from selection entries)
 * @returns {Promise<{
 *   healed: string[],
 *   skipped: string[],
 *   box_conflicts: string[],
 *   failed: string[],
 * }>}
 */
export async function healGemIndexesForSelection({
  api,
  selection_path,
  selection_folder,
  gems,
}) {
  const cleaned_selection_path = String(selection_path || "").trim();
  const result = {
    healed: [],
    skipped: [],
    box_conflicts: [],
    failed: [],
  };
  if (!cleaned_selection_path || !api?.updateMeta) return result;

  const is_box = selectionFolderIsBox({
    ...(selection_folder || {}),
    $path: selection_folder?.$path || cleaned_selection_path,
  });

  const entry_paths = new Set(
    normalizeSelectionGemPaths(selection_folder?.selection_entries)
  );
  const list = Array.isArray(gems) ? gems : [];
  const added_at_fallback =
    String(selection_folder?.selection_date || "").trim() ||
    String(selection_folder?.$date_created || "").trim() ||
    "";

  for (const gem of list) {
    const gem_path = String(gem?.$path || "").trim();
    if (!gem_path) continue;
    if (entry_paths.size > 0 && !entry_paths.has(gem_path)) {
      result.skipped.push(gem_path);
      continue;
    }

    const patch = gemIndexHealPatch({
      gem,
      selection_path: cleaned_selection_path,
      is_box,
      added_at_iso: added_at_fallback,
    });

    if (patch.box_conflict) {
      result.box_conflicts.push(gem_path);
    }

    if (!patch.needs_heal || !patch.new_meta) {
      if (!patch.box_conflict) result.skipped.push(gem_path);
      continue;
    }

    try {
      await api.updateMeta({
        path: gem_path,
        new_meta: patch.new_meta,
      });
      Object.assign(gem, patch.new_meta);
      result.healed.push(gem_path);
    } catch {
      result.failed.push(gem_path);
    }
  }

  return result;
}
