/**
 * Denormalized add dates on the gem: `selection_membership_paths[selections/n] → ISO`.
 * Which selections contain the gem is defined only by each selection’s `selection_entries`
 * (and `box_selection_path` for boxes).
 */

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
