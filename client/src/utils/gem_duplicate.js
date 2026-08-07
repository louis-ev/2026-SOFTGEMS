import { GEM_STATUS_REFERENCE, gemStatusLabel } from "@/utils/gem_status.js";
import { getGemIdFromPath } from "@/utils/gem_pairing.js";
import { normalizeMembershipPathsMap } from "@/utils/gem_selection_membership_paths.js";

/**
 * Meta patch applied after folder copy so the duplicate is an isolated clone
 * (not paired, not in selections, inventory status back to reference).
 */
export function buildGemDuplicateNewMeta() {
  return {
    paired_gem: "",
    box_selection_path: "",
    selection_membership_paths: {},
    status: GEM_STATUS_REFERENCE,
  };
}

function clean_string(value) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

/**
 * Human-readable meta changes for the duplicate confirmation modal.
 * Always lists the full reset policy (id, status, pairing, box, memberships,
 * history) so the modal explains what will change even when a field is already
 * empty / reference.
 *
 * @param {object|null|undefined} gem
 * @param {(key: string, values?: object) => string} t
 * @returns {{ key: string, label: string, from_label: string, to_label: string }[]}
 */
export function listGemDuplicateMetaChanges(gem, t) {
  const empty_label = t("sg_duplicate_gem_empty_value");
  const cleared_label = t("sg_duplicate_gem_cleared_value");

  const current_status = clean_string(gem?.status) || GEM_STATUS_REFERENCE;
  const paired_id = clean_string(gem?.paired_gem);
  const box_path = clean_string(gem?.box_selection_path);
  const membership_paths = Object.keys(
    normalizeMembershipPathsMap(gem?.selection_membership_paths)
  );

  return [
    {
      key: "id",
      label: t("sg_id"),
      from_label: clean_string(getGemIdFromPath(gem?.$path)) || empty_label,
      to_label: t("sg_duplicate_gem_new_id_value"),
    },
    {
      key: "status",
      label: t("sg_status"),
      from_label: gemStatusLabel(t, current_status),
      to_label: gemStatusLabel(t, GEM_STATUS_REFERENCE),
    },
    {
      key: "paired_gem",
      label: t("sg_paired_gem"),
      from_label: paired_id || empty_label,
      to_label: cleared_label,
    },
    {
      key: "box_selection_path",
      label: t("sg_duplicate_gem_field_box"),
      from_label: box_path || empty_label,
      to_label: cleared_label,
    },
    {
      key: "selection_membership_paths",
      label: t("sg_duplicate_gem_field_selections"),
      from_label:
        membership_paths.length > 0
          ? membership_paths.join(", ")
          : empty_label,
      to_label: cleared_label,
    },
    {
      key: "history",
      label: t("sg_duplicate_gem_field_history"),
      from_label: t("sg_duplicate_gem_history_from"),
      to_label: t("sg_duplicate_gem_history_to"),
    },
  ];
}
