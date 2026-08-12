/**
 * Denormalized index on the gem: `selection_membership_paths[memo-in/n] → ISO`.
 * Selection `selection_entries` remain the source of truth for membership presence;
 * this map (+ `box_selection_path`) is the fetch index for the gem open view.
 */

import { parseSelectionFolderPath } from "@/utils/selection_paths.js";

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
 * @param {*} raw
 * @returns {Record<string, string>}
 */
function normalizePathsObject(raw) {
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
 * @param {*} raw – `selection_membership_paths`
 * @param {*} [legacy_raw] – deprecated `selection_gem_added_at`
 * @returns {Record<string, string>}
 */
export function normalizeMembershipPathsMap(raw, legacy_raw) {
  const out = normalizePathsObject(raw);
  const legacy = normalizePathsObject(legacy_raw);
  for (const [path, iso] of Object.entries(legacy)) {
    if (!out[path]) out[path] = iso;
  }
  return out;
}

/**
 * @param {object|null|undefined} gem
 * @param {string} selection_path
 * @returns {string}
 */
export function getGemMembershipAddedAt(gem, selection_path) {
  const cleaned_path = String(selection_path || "").trim();
  if (!cleaned_path) return "";
  const map = normalizeMembershipPathsMap(
    gem?.selection_membership_paths,
    gem?.selection_gem_added_at
  );
  return map[cleaned_path] || "";
}

/**
 * Outstanding `memo-out/{n}` path when walking indexed memberships newest → oldest
 * the first of `memo-out` / `return-memo-out` is `memo-out`. Empty otherwise.
 *
 * @param {object|null|undefined} gem
 * @returns {string}
 */
export function resolveOutstandingMemoOutPath(gem) {
  const map = normalizeMembershipPathsMap(
    gem?.selection_membership_paths,
    gem?.selection_gem_added_at
  );
  const candidates = Object.entries(map)
    .map(([path, iso]) => {
      const { type_slug } = parseSelectionFolderPath(path);
      if (type_slug !== "memo-out" && type_slug !== "return-memo-out") {
        return null;
      }
      return {
        type_slug,
        path,
        sort_key: parseSortableTimestamp(iso),
      };
    })
    .filter(Boolean);

  if (!candidates.length) return "";
  candidates.sort((a, b) => {
    if (b.sort_key !== a.sort_key) return b.sort_key - a.sort_key;
    return String(a.path).localeCompare(String(b.path));
  });
  return candidates[0].type_slug === "memo-out" ? candidates[0].path : "";
}

/**
 * True when the gem has an outstanding memo out (see `resolveOutstandingMemoOutPath`).
 *
 * @param {object|null|undefined} gem
 * @returns {boolean}
 */
export function isGemMemoOutOutstanding(gem) {
  return Boolean(resolveOutstandingMemoOutPath(gem));
}

/**
 * Candidate selection folder paths for a gem open view (index only — no full scan).
 * Includes `selection_membership_paths` keys and `box_selection_path` when set.
 *
 * @param {object|null|undefined} gem
 * @returns {string[]}
 */
export function listGemIndexedSelectionPaths(gem) {
  const map = normalizeMembershipPathsMap(
    gem?.selection_membership_paths,
    gem?.selection_gem_added_at
  );
  const paths = new Set(Object.keys(map));
  const box_path = String(gem?.box_selection_path || "").trim();
  if (box_path) paths.add(box_path);
  return [...paths];
}

/**
 * Drops paths that are no longer active memberships (optional hygiene).
 *
 * @param {Record<string, string>} map
 * @param {string[]} active_selection_paths
 * @returns {Record<string, string>}
 */
export function pruneStaleMembershipPaths(map, active_selection_paths) {
  const active = new Set(
    (Array.isArray(active_selection_paths) ? active_selection_paths : [])
      .map((path) => String(path || "").trim())
      .filter(Boolean)
  );
  const out = {};
  for (const [path, iso] of Object.entries(
    normalizeMembershipPathsMap(map)
  )) {
    if (active.has(path)) out[path] = iso;
  }
  return out;
}

/**
 * @param {object} args
 * @param {object} args.api
 * @param {string} args.gem_path
 * @param {string} args.selection_path
 * @param {object} [args.gem] – cached folder meta
 * @returns {Promise<void>}
 */
export async function recordGemSelectionMembership({
  api,
  gem_path,
  selection_path,
  gem,
}) {
  const cleaned_selection_path = String(selection_path || "").trim();
  if (!cleaned_selection_path) return;

  const folder =
    gem && typeof gem === "object"
      ? gem
      : await api.getFolder({ path: gem_path });
  const map = normalizeMembershipPathsMap(
    folder.selection_membership_paths,
    folder.selection_gem_added_at
  );
  if (map[cleaned_selection_path]) return;

  map[cleaned_selection_path] = new Date().toISOString();
  await api.updateMeta({
    path: gem_path,
    new_meta: { selection_membership_paths: map },
  });
}

/**
 * @param {object} args
 * @param {object} args.api
 * @param {string} args.gem_path
 * @param {string} args.selection_path
 * @param {object} [args.gem] – cached folder meta
 * @returns {Promise<Record<string, string>>}
 */
export async function clearGemSelectionMembership({
  api,
  gem_path,
  selection_path,
  gem,
}) {
  const cleaned_selection_path = String(selection_path || "").trim();
  if (!cleaned_selection_path) return {};

  const folder =
    gem && typeof gem === "object"
      ? gem
      : await api.getFolder({ path: gem_path });
  const map = normalizeMembershipPathsMap(
    folder.selection_membership_paths,
    folder.selection_gem_added_at
  );
  delete map[cleaned_selection_path];

  await api.updateMeta({
    path: gem_path,
    new_meta: { selection_membership_paths: map },
  });
  return map;
}
