const clean_string = (value) => {
  if (value === null || value === undefined) return "";
  return String(value).trim();
};

export function getGemIdFromPath(gem_path) {
  const cleaned_path = clean_string(gem_path);
  if (!cleaned_path) return "";
  const path_parts = cleaned_path.split("/");
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
    const target_gem = gems.find(
      (gem) => getGemIdFromPath(gem?.$path) === normalized_id
    );
    if (!target_gem) return;
    if (typeof vue_set === "function") {
      vue_set(target_gem, "paired_gem", paired_gem);
    } else {
      target_gem.paired_gem = paired_gem;
    }
  });
}

function pushUniquePartnerUpdate(partner_updates, gem_id, paired_gem) {
  const normalized_id = normalizePairedGemId(gem_id);
  if (!normalized_id) return;
  const existing_index = partner_updates.findIndex(
    (item) => normalizePairedGemId(item.gem_id) === normalized_id
  );
  const next_item = { gem_id: normalized_id, paired_gem: paired_gem ?? "" };
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
  api.folderUpdated({
    path_to_folder: `${gems_path}/${normalized_id}`,
    changed_data: { paired_gem: paired_gem ?? "" },
  });
}

export async function syncPairedGemLinks({
  api,
  gems_path,
  source_gem_id,
  new_paired_gem_id,
  previous_paired_gem_id,
}) {
  const cleaned_source_gem_id = normalizePairedGemId(source_gem_id);
  const cleaned_new_paired_gem_id = normalizePairedGemId(new_paired_gem_id);
  const cleaned_previous_paired_gem_id = normalizePairedGemId(
    previous_paired_gem_id
  );

  if (!cleaned_source_gem_id || !api) {
    return { partner_updates: [], failed_paths: [] };
  }

  const updates = [];
  const partner_updates = [];
  const failed_paths = [];

  if (
    cleaned_new_paired_gem_id &&
    cleaned_new_paired_gem_id !== cleaned_source_gem_id
  ) {
    updates.push({
      path: `${gems_path}/${cleaned_new_paired_gem_id}`,
      new_meta: { paired_gem: cleaned_source_gem_id },
      gem_id: cleaned_new_paired_gem_id,
      paired_gem: cleaned_source_gem_id,
    });
  }

  const previous_partner_to_clear =
    cleaned_previous_paired_gem_id &&
    cleaned_previous_paired_gem_id !== cleaned_source_gem_id &&
    cleaned_previous_paired_gem_id !== cleaned_new_paired_gem_id
      ? cleaned_previous_paired_gem_id
      : "";

  if (previous_partner_to_clear) {
    updates.push({
      path: `${gems_path}/${previous_partner_to_clear}`,
      new_meta: { paired_gem: "" },
      gem_id: previous_partner_to_clear,
      paired_gem: "",
    });
  }

  if (!cleaned_new_paired_gem_id && cleaned_previous_paired_gem_id) {
    const unlink_id =
      cleaned_previous_paired_gem_id !== cleaned_source_gem_id
        ? cleaned_previous_paired_gem_id
        : "";
    if (
      unlink_id &&
      !updates.some(
        (update_item) =>
          normalizePairedGemId(update_item.gem_id) === unlink_id &&
          Object.prototype.hasOwnProperty.call(update_item.new_meta, "paired_gem")
      )
    ) {
      updates.push({
        path: `${gems_path}/${unlink_id}`,
        new_meta: { paired_gem: "" },
        gem_id: unlink_id,
        paired_gem: "",
      });
    }
  }

  for (const update_item of updates) {
    try {
      await api.updateMeta({
        path: update_item.path,
        new_meta: update_item.new_meta,
      });
      pushUniquePartnerUpdate(
        partner_updates,
        update_item.gem_id,
        update_item.paired_gem
      );
      applyLocalPartnerMeta(
        api,
        gems_path,
        update_item.gem_id,
        update_item.paired_gem
      );
    } catch {
      failed_paths.push(update_item.path);
    }
  }

  return { partner_updates, failed_paths };
}

export function getPairedGemDraftValue(editor) {
  if (!editor) return "";
  return normalizePairedGemId(editor.draft_paired_gem_id);
}
