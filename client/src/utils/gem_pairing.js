const clean_string = (value) => {
  if (value === null || value === undefined) return "";
  return String(value).trim();
};

export function getGemIdFromPath(gem_path) {
  const cleaned_path = clean_string(gem_path);
  if (!cleaned_path) return "";
  const path_parts = cleaned_path.split("/").filter(Boolean);
  return path_parts[path_parts.length - 1] || "";
}

export function normalizePairedGemId(value) {
  const cleaned = clean_string(value);
  if (!cleaned) return "";
  if (cleaned.includes("/")) {
    return getGemIdFromPath(cleaned);
  }
  return cleaned;
}

/**
 * Returns a usable paired-gem id, or "" when empty / self-referential.
 */
export function sanitizePairedGemId(value, self_gem_id) {
  const paired_id = normalizePairedGemId(value);
  const self_id = normalizePairedGemId(self_gem_id);
  if (!paired_id) return "";
  if (self_id && paired_id === self_id) return "";
  return paired_id;
}

export function buildPairedGemListLabel(gem) {
  const gem_id = getGemIdFromPath(gem?.$path);
  const secondary_parts = [];

  const weight = gem?.weight_ct;
  if (weight !== null && weight !== undefined && weight !== "") {
    secondary_parts.push(`${weight} ct`);
  }

  const color = clean_string(gem?.color);
  if (color) secondary_parts.push(color);

  const stone_type = clean_string(gem?.stone_type);
  if (stone_type) secondary_parts.push(stone_type);

  return {
    gem_id,
    secondary: secondary_parts.join(" · "),
  };
}

export function gemMatchesPairedGemSearch(gem, needle_raw) {
  const needle = clean_string(needle_raw).toLowerCase();
  if (!needle) return true;

  const { gem_id, secondary } = buildPairedGemListLabel(gem);
  const haystacks = [gem_id, secondary]
    .map((part) => clean_string(part).toLowerCase())
    .filter(Boolean);

  return haystacks.some((haystack) => haystack.includes(needle));
}

export function getPairedGemConflict({ target_gem, current_gem_id }) {
  const cleaned_current_gem_id = normalizePairedGemId(current_gem_id);
  const existing_paired_gem_id = normalizePairedGemId(target_gem?.paired_gem);
  if (!existing_paired_gem_id) return null;
  if (
    cleaned_current_gem_id &&
    existing_paired_gem_id === cleaned_current_gem_id
  ) {
    return null;
  }
  return existing_paired_gem_id;
}

export function applyPairedGemPartnerUpdates(gems, partner_updates, vue_set) {
  if (!Array.isArray(gems) || !Array.isArray(partner_updates)) return;
  partner_updates.forEach(({ gem_id, paired_gem }) => {
    const normalized_id = normalizePairedGemId(gem_id);
    if (!normalized_id) return;
    const next_paired_gem = sanitizePairedGemId(paired_gem, normalized_id);
    const target_gem = gems.find(
      (gem) => getGemIdFromPath(gem?.$path) === normalized_id
    );
    if (!target_gem) return;
    if (typeof vue_set === "function") {
      vue_set(target_gem, "paired_gem", next_paired_gem);
    } else {
      target_gem.paired_gem = next_paired_gem;
    }
  });
}

function pushUniquePartnerUpdate(partner_updates, gem_id, paired_gem) {
  const normalized_id = normalizePairedGemId(gem_id);
  if (!normalized_id) return;
  const next_paired_gem = sanitizePairedGemId(paired_gem, normalized_id);
  const existing_index = partner_updates.findIndex(
    (item) => normalizePairedGemId(item.gem_id) === normalized_id
  );
  const next_item = { gem_id: normalized_id, paired_gem: next_paired_gem };
  if (existing_index === -1) {
    partner_updates.push(next_item);
    return;
  }
  partner_updates[existing_index] = next_item;
}

function applyLocalPartnerMeta(api, gems_path, gem_id, paired_gem) {
  if (!api || typeof api.folderUpdated !== "function") return;
  const normalized_id = normalizePairedGemId(gem_id);
  if (!normalized_id) return;
  const next_paired_gem = sanitizePairedGemId(paired_gem, normalized_id);
  api.folderUpdated({
    path_to_folder: `${gems_path}/${normalized_id}`,
    changed_data: { paired_gem: next_paired_gem },
  });
}

function queuePartnerUpdate(updates_by_id, gem_id, paired_gem) {
  const normalized_id = normalizePairedGemId(gem_id);
  if (!normalized_id) return;
  // Never persist a self-pair on any gem.
  const next_paired_gem = sanitizePairedGemId(paired_gem, normalized_id);
  updates_by_id.set(normalized_id, next_paired_gem);
}

/**
 * Keep reciprocal pairing in sync after the source gem's `paired_gem` was saved.
 *
 * Example: source 30 paired with 326
 * - gems/326.paired_gem = "30"
 * - if 326 previously pointed at 99, clear gems/99.paired_gem
 * - if 30 previously pointed at 20, clear gems/20.paired_gem
 */
export async function syncPairedGemLinks({
  api,
  gems_path,
  source_gem_id,
  new_paired_gem_id,
  previous_paired_gem_id,
}) {
  const source_id = normalizePairedGemId(source_gem_id);
  const target_id = sanitizePairedGemId(new_paired_gem_id, source_id);
  const previous_id = sanitizePairedGemId(previous_paired_gem_id, source_id);

  if (!source_id || !api) {
    return { partner_updates: [], failed_paths: [] };
  }

  const updates_by_id = new Map();

  if (target_id) {
    let target_previous_id = "";
    if (typeof api.getFolder === "function") {
      try {
        const target_gem = await api.getFolder({
          path: `${gems_path}/${target_id}`,
          no_files: true,
        });
        target_previous_id = sanitizePairedGemId(
          target_gem?.paired_gem,
          target_id
        );
      } catch {
        target_previous_id = "";
      }
    }

    // Target must point back at the source — never at itself.
    queuePartnerUpdate(updates_by_id, target_id, source_id);

    if (
      target_previous_id &&
      target_previous_id !== source_id &&
      target_previous_id !== target_id
    ) {
      queuePartnerUpdate(updates_by_id, target_previous_id, "");
    }
  }

  if (previous_id && previous_id !== target_id && previous_id !== source_id) {
    queuePartnerUpdate(updates_by_id, previous_id, "");
  }

  const partner_updates = [];
  const failed_paths = [];

  for (const [gem_id, paired_gem] of updates_by_id.entries()) {
    const path = `${gems_path}/${gem_id}`;
    try {
      await api.updateMeta({
        path,
        new_meta: { paired_gem },
      });
      pushUniquePartnerUpdate(partner_updates, gem_id, paired_gem);
      applyLocalPartnerMeta(api, gems_path, gem_id, paired_gem);
    } catch {
      failed_paths.push(path);
    }
  }

  return { partner_updates, failed_paths };
}

export function getPairedGemDraftValue(editor, self_gem_id = "") {
  if (!editor) return "";
  return sanitizePairedGemId(editor.draft_paired_gem_id, self_gem_id);
}
