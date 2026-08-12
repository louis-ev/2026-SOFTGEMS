import {
  allSelectionTypes,
  isValidSelectionTypeSlug,
  selectionTypeFromSlug,
  selectionSlugFromType,
} from "@/utils/selection_type_registry.js";

/**
 * Storage path for a selection type root — top-level like `gems` / `box`.
 * @param {string} type_slug
 * @returns {string}
 */
export function selectionTypeRootPath(type_slug) {
  const slug = String(type_slug || "").trim();
  if (!slug || !isValidSelectionTypeSlug(slug)) return "";
  return slug;
}

/**
 * @param {string} type_slug
 * @param {string} folder_slug
 * @returns {string} e.g. `box/12`
 */
export function selectionFolderPath(type_slug, folder_slug) {
  const root = selectionTypeRootPath(type_slug);
  const id = String(folder_slug || "").trim();
  if (!root || !id) return "";
  return `${root}/${id}`;
}

/**
 * @param {string} folder_path – e.g. `box/12` (also accepts legacy `selections/box/12`)
 * @returns {{ type_slug: string, folder_slug: string, selection_type: string }}
 */
export function parseSelectionFolderPath(folder_path) {
  const cleaned = String(folder_path || "").trim().replace(/\\/g, "/");
  const parts = cleaned.split("/").filter(Boolean);
  if (parts.length < 2) {
    return { type_slug: "", folder_slug: "", selection_type: "" };
  }

  // Legacy nested under selections/: selections/{type}/{n}
  let type_slug = parts[0];
  let folder_slug = parts[1];
  if (parts[0] === "selections" && parts.length >= 3) {
    type_slug = parts[1];
    folder_slug = parts[2];
  }

  if (!isValidSelectionTypeSlug(type_slug)) {
    return { type_slug: "", folder_slug: "", selection_type: "" };
  }
  return {
    type_slug,
    folder_slug,
    selection_type: selectionTypeFromSlug(type_slug),
  };
}

/**
 * @param {object|null|undefined} folder
 * @returns {string} CDC selection type value (e.g. `boîte`, `memo in`)
 */
export function resolveSelectionType(folder) {
  const from_path = parseSelectionFolderPath(folder?.$path).selection_type;
  if (from_path) return from_path;
  const legacy = String(folder?.selection_type || "").trim();
  return legacy;
}

/**
 * @param {object|string|null|undefined} folder_or_path
 * @returns {string}
 */
export function selectionDocumentNumber(folder_or_path) {
  if (typeof folder_or_path === "string") {
    const parsed = parseSelectionFolderPath(folder_or_path);
    return parsed.folder_slug || "";
  }
  const path = String(folder_or_path?.$path || "").trim();
  if (!path) return "";
  const parts = path.split("/").filter(Boolean);
  return parts[parts.length - 1] || "";
}

/**
 * @param {object|null|undefined} folder
 * @returns {string}
 */
export function selectionMembershipTypeSlug(folder) {
  const from_path = parseSelectionFolderPath(folder?.$path).type_slug;
  if (from_path) return from_path;
  return selectionSlugFromType(folder?.selection_type);
}

/**
 * @param {string} folder_path
 * @returns {string}
 */
export function selectionFolderSlugFromPath(folder_path) {
  return parseSelectionFolderPath(folder_path).folder_slug;
}

/**
 * @param {object} api – Vue api plugin with `getFolders`
 * @returns {Promise<object[]>}
 */
export async function fetchAllSelectionFolders(api) {
  const type_defs = allSelectionTypes();
  const batches = await Promise.all(
    type_defs.map((def) =>
      api
        .getFolders({ path: selectionTypeRootPath(def.slug) })
        .catch(() => [])
    )
  );
  const merged = [];
  for (const rows of batches) {
    if (!Array.isArray(rows)) continue;
    for (const row of rows) {
      if (row) merged.push(row);
    }
  }
  return merged;
}

/**
 * Fetch specific selection folders by path (targeted; no type-root scan).
 *
 * @param {object} api – Vue api plugin with `getFolder`
 * @param {string[]} paths
 * @returns {Promise<object[]>}
 */
export async function fetchSelectionFoldersByPaths(api, paths) {
  const unique_paths = [
    ...new Set(
      (Array.isArray(paths) ? paths : [])
        .map((path) => String(path || "").trim())
        .filter(Boolean)
    ),
  ];
  if (!unique_paths.length || !api?.getFolder) return [];

  const folders = await Promise.all(
    unique_paths.map((folder_path) =>
      api.getFolder({ path: folder_path }).catch(() => null)
    )
  );
  return folders.filter(Boolean);
}

/**
 * Enrich folder rows with derived `selection_type` for display/sorting.
 * @param {object} folder
 * @returns {object}
 */
export function enrichSelectionFolder(folder) {
  if (!folder || typeof folder !== "object") return folder;
  const selection_type = resolveSelectionType(folder);
  if (!selection_type) return folder;
  return { ...folder, selection_type };
}
