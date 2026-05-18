import { normalizeSelectionEntries } from "@/utils/selection_entries.js";

const _BOX_TYPE = "boîte";

/**
 * @param {*} raw
 * @returns {boolean}
 */
function isBoxSelection(folder_meta) {
  return folder_meta && String(folder_meta.selection_type || "") === _BOX_TYPE;
}

/**
 * Move or assign a gem to at most one box (`box_selection_path` on gem + `selection_entries` on box).
 * Client-side V1 (non-atomic).
 *
 * @param {object} args
 * @param {object} args.api – Vue api plugin (`getFolder`, `updateMeta`)
 * @param {string} args.gem_path – e.g. `gems/12`
 * @param {string} args.new_box_folder_path – e.g. `selections/4` or `""` to clear
 */
export async function assignGemToBox({ api, gem_path, new_box_folder_path }) {
  const gem = await api.getFolder({ path: gem_path });
  const old_box = String(gem.box_selection_path || "").trim();
  const new_box = String(new_box_folder_path || "").trim();

  if (old_box === new_box) return;

  if (old_box) {
    const old_folder = await api.getFolder({ path: old_box });
    const entries = normalizeSelectionEntries(old_folder.selection_entries);
    const filtered = entries.filter((e) => e.gem_path !== gem_path);
    if (filtered.length !== entries.length) {
      await api.updateMeta({
        path: old_box,
        new_meta: { selection_entries: filtered },
      });
    }
  }

  if (new_box) {
    const box_folder = await api.getFolder({ path: new_box });
    if (!isBoxSelection(box_folder)) {
      const err = new Error("not_a_box_selection");
      err.code = "not_a_box_selection";
      throw err;
    }
    let entries = normalizeSelectionEntries(box_folder.selection_entries);
    if (!entries.some((e) => e.gem_path === gem_path)) {
      entries = [
        ...entries,
        { gem_path, sort_index: entries.length },
      ];
      await api.updateMeta({
        path: new_box,
        new_meta: { selection_entries: entries },
      });
    }
  }

  await api.updateMeta({
    path: gem_path,
    new_meta: { box_selection_path: new_box },
  });
}

/**
 * @param {object} args
 * @param {object} args.api
 * @param {string} args.selection_path – folder path `selections/n`
 * @param {object} args.selection_folder – cached folder meta
 * @param {string} args.gem_path
 */
export async function removeGemFromSelection({
  api,
  selection_path,
  selection_folder,
  gem_path,
}) {
  const entries = normalizeSelectionEntries(selection_folder.selection_entries);
  const filtered = entries.filter((e) => e.gem_path !== gem_path);
  if (filtered.length === entries.length) return;

  await api.updateMeta({
    path: selection_path,
    new_meta: { selection_entries: filtered },
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
  let entries = normalizeSelectionEntries(selection_folder.selection_entries);
  if (entries.some((e) => e.gem_path === gem_path)) return;
  entries = [...entries, { gem_path, sort_index: entries.length }];
  await api.updateMeta({
    path: selection_path,
    new_meta: { selection_entries: entries },
  });
}
