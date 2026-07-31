import { normalizeSelectionGemPaths } from "@/utils/selection_entries.js";
import {
  clearGemSelectionMembership,
  normalizeMembershipPathsMap,
} from "@/utils/gem_selection_membership_paths.js";
import {
  applyGemMetaWhenAddedToSelection,
  restoreGemStatusWhenRemovedFromSelection,
} from "@/utils/gem_selection_status.js";
import { isBoxSelectionPath } from "@/utils/gem_selection_memberships.js";
import { resolveSelectionType } from "@/utils/selection_paths.js";

/**
 * @param {*} raw
 * @returns {boolean}
 */
function isBoxSelection(folder_meta) {
  if (!folder_meta) return false;
  const path = String(folder_meta.$path || "").trim();
  if (path && isBoxSelectionPath(path)) return true;
  return String(folder_meta.selection_type || "") === "boîte";
}

/**
 * @param {object} gem
 * @param {string} selection_path
 * @returns {Record<string, string>|null}
 */
function membershipPathsWithAddedAt(gem, selection_path) {
  const cleaned_path = String(selection_path || "").trim();
  if (!cleaned_path) return null;
  const map = normalizeMembershipPathsMap(
    gem.selection_membership_paths,
    gem.selection_gem_added_at
  );
  if (map[cleaned_path]) return null;
  map[cleaned_path] = new Date().toISOString();
  return map;
}

/**
 * Move or assign a gem to at most one box (`box_selection_path` on gem + `selection_entries` on box).
 * Client-side V1 (non-atomic).
 *
 * @param {object} args
 * @param {object} args.api – Vue api plugin (`getFolder`, `updateMeta`)
 * @param {string} args.gem_path – e.g. `gems/12`
 * @param {string} args.new_box_folder_path – e.g. `box/4` or `""` to clear
 */
export async function assignGemToBox({ api, gem_path, new_box_folder_path }) {
  const gem = await api.getFolder({ path: gem_path });
  const old_box = String(gem.box_selection_path || "").trim();
  const new_box = String(new_box_folder_path || "").trim();

  if (old_box === new_box) {
    if (new_box) {
      const membership_paths_map = membershipPathsWithAddedAt(gem, new_box);
      if (membership_paths_map) {
        await api.updateMeta({
          path: gem_path,
          new_meta: { selection_membership_paths: membership_paths_map },
        });
      }
      const box_folder = await api.getFolder({ path: new_box });
      if (isBoxSelection(box_folder)) {
        const paths = normalizeSelectionGemPaths(box_folder.selection_entries);
        if (!paths.includes(gem_path)) {
          await api.updateMeta({
            path: new_box,
            new_meta: { selection_entries: [...paths, gem_path] },
          });
        }
      }
    }
    return;
  }

  if (old_box) {
    const old_folder = await api.getFolder({ path: old_box });
    const paths = normalizeSelectionGemPaths(old_folder.selection_entries);
    const filtered = paths.filter((path) => path !== gem_path);
    if (filtered.length !== paths.length) {
      await api.updateMeta({
        path: old_box,
        new_meta: { selection_entries: filtered },
      });
    }
    await clearGemSelectionMembership({
      api,
      gem_path,
      selection_path: old_box,
      gem,
    });
  }

  const gem_meta_patch = { box_selection_path: new_box };
  if (new_box) {
    const membership_paths_map = membershipPathsWithAddedAt(gem, new_box);
    if (membership_paths_map) {
      gem_meta_patch.selection_membership_paths = membership_paths_map;
    }
  }
  await api.updateMeta({
    path: gem_path,
    new_meta: gem_meta_patch,
  });

  if (new_box) {
    const box_folder = await api.getFolder({ path: new_box });
    if (!isBoxSelection(box_folder)) {
      const err = new Error("not_a_box_selection");
      err.code = "not_a_box_selection";
      throw err;
    }
    const paths = normalizeSelectionGemPaths(box_folder.selection_entries);
    if (!paths.includes(gem_path)) {
      await api.updateMeta({
        path: new_box,
        new_meta: { selection_entries: [...paths, gem_path] },
      });
    }
  }
}

/**
 * @param {object} args
 * @param {object} args.api
 * @param {string} args.selection_path – folder path `box/n`
 * @param {object} args.selection_folder – cached folder meta
 * @param {string} args.gem_path
 */
export async function removeGemFromSelection({
  api,
  selection_path,
  selection_folder,
  gem_path,
}) {
  const paths = normalizeSelectionGemPaths(selection_folder.selection_entries);
  const filtered = paths.filter((path) => path !== gem_path);
  if (filtered.length === paths.length) return;

  const status_result = await restoreGemStatusWhenRemovedFromSelection({
    api,
    gem_path,
    selection_path,
    selection_type: resolveSelectionType(selection_folder),
    selection_folders: [selection_folder],
  });

  if (isBoxSelection(selection_folder)) {
    const gem = await api.getFolder({ path: gem_path });
    const cur = String(gem.box_selection_path || "").trim();
    if (cur === selection_path) {
      await api.updateMeta({
        path: gem_path,
        new_meta: { box_selection_path: "" },
      });
    }
  }

  await api.updateMeta({
    path: selection_path,
    new_meta: { selection_entries: filtered },
  });

  return status_result;
}

/**
 * Append a gem to a non-box selection only (no `box_selection_path` change).
 */
export async function addGemToSelectionEntries({
  api,
  selection_path,
  selection_folder,
  gem_path,
}) {
  const paths = normalizeSelectionGemPaths(selection_folder.selection_entries);
  if (paths.includes(gem_path)) return;

  const status_result = await applyGemMetaWhenAddedToSelection({
    api,
    gem_path,
    selection_path,
    selection_type: resolveSelectionType(selection_folder),
  });

  await api.updateMeta({
    path: selection_path,
    new_meta: { selection_entries: [...paths, gem_path] },
  });

  return status_result;
}
