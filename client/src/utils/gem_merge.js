import {
  gem_pricing_total_column_keys,
  gem_virtual_per_carat_column_keys,
} from "@/mixins/GemPricing.js";
import { buildGemFieldConfigs } from "@/components/gems/gem_field_configs";
import { removeGemFromSelection } from "@/utils/assign_gem_to_box.js";
import { formatDisplayNumber, parseEnglishNumber } from "@/utils/format_locale.js";
import {
  getGemIdFromPath,
  normalizePairedGemId,
  syncPairedGemLinks,
} from "@/utils/gem_pairing.js";
import { listGemIndexedSelectionPaths } from "@/utils/gem_selection_membership_paths.js";
import { gemStatusLabel } from "@/utils/gem_status.js";
import { normalizeGemSplits } from "@/utils/gem_split.js";
import { htmlToPlainText } from "@/utils/rich_text.js";

const PRICE_LABEL_KEYS = Object.freeze({
  base_price_pcb: "sg_base_price_pcb",
  import_price: "sg_import_price",
  pv_selling_price: "sg_pv_selling_price",
  pvd_asking_price: "sg_pvd_asking_price",
  pc_to: "sg_pc_to",
  pf_invoiced_price: "sg_pf_invoiced_price",
});

const MERGED_FIELD_KEYS = Object.freeze([
  "weight_ct",
  "number_of_pieces",
  ...gem_pricing_total_column_keys,
]);

const SKIP_LOST_META_KEYS = new Set([
  ...MERGED_FIELD_KEYS,
  ...gem_virtual_per_carat_column_keys,
  "parent_id",
  "splits",
  "dimensions_lwh",
  "box_selection_path",
  "selection_membership_paths",
]);

function round_money(value) {
  return Number(value.toFixed(2));
}

function round_weight(value) {
  return Number(value.toFixed(3));
}

function clean_string(value) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function numeric_or_zero(raw) {
  const n = parseEnglishNumber(raw);
  return n === null ? 0 : n;
}

function either_has_number(a, b) {
  return parseEnglishNumber(a) !== null || parseEnglishNumber(b) !== null;
}

function add_rounded(a, b, round_fn) {
  if (!either_has_number(a, b)) return null;
  return round_fn(numeric_or_zero(a) + numeric_or_zero(b));
}

function gems_path_from_gem_path(gem_path) {
  const cleaned = clean_string(gem_path);
  const parts = cleaned.split("/").filter(Boolean);
  if (parts.length < 2) return "gems";
  return parts.slice(0, -1).join("/");
}

function file_display_name(file) {
  const media_name = clean_string(file?.$media_filename);
  if (media_name) return media_name;
  const caption = clean_string(file?.caption);
  if (caption) return caption;
  const path_slug = clean_string(file?.$path)
    .split("/")
    .filter(Boolean)
    .pop();
  return path_slug || "";
}

function format_weight_label(value, t) {
  const formatted = formatDisplayNumber(value, { maximumFractionDigits: 3 });
  if (formatted === null) return t("sg_duplicate_gem_empty_value");
  return `${formatted} ct`;
}

function format_pieces_label(value, t) {
  if (value === null || value === undefined) {
    return t("sg_duplicate_gem_empty_value");
  }
  const formatted = formatDisplayNumber(value, {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  });
  return formatted === null ? t("sg_duplicate_gem_empty_value") : formatted;
}

function format_price_label(value, t) {
  const formatted = formatDisplayNumber(value, {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  });
  return formatted === null ? t("sg_duplicate_gem_empty_value") : formatted;
}

function format_summand_label(value, format_fn, t) {
  return format_fn(numeric_or_zero(value), t);
}

function report_gem_merge_progress(on_progress, info) {
  if (typeof on_progress === "function") on_progress(info);
}

function parent_id_of(child) {
  return clean_string(child?.parent_id);
}

function resolved_gem_id(gem) {
  return (
    clean_string(getGemIdFromPath(gem?.$path)) || clean_string(gem?.id)
  );
}

/** Merge is offered on split-off gems (`parent_id` set). */
export function canShowMergeGem(child) {
  return Boolean(parent_id_of(child));
}

/** Merge can run when the child has a parent and no nested splits. */
export function canMergeGem(child) {
  if (!parent_id_of(child)) return false;
  return normalizeGemSplits(child?.splits).length === 0;
}

export function computeGemMergePlan({ child, parent }) {
  const errors = [];
  const parent_id = parent_id_of(child);
  if (!parent_id) errors.push("sg_merge_gem_error_no_parent");

  const child_splits = normalizeGemSplits(child?.splits);
  if (child_splits.length > 0) {
    errors.push("sg_merge_gem_error_has_children");
  }

  const parent_exists = parent && typeof parent === "object";
  if (!parent_exists) {
    errors.push("sg_merge_gem_error_parent_missing");
  } else if (parent_id) {
    const resolved = resolved_gem_id(parent);
    if (resolved && resolved !== parent_id) {
      errors.push("sg_merge_gem_error_parent_missing");
    }
  }

  const parent_weight = parseEnglishNumber(parent?.weight_ct);
  const child_weight = parseEnglishNumber(child?.weight_ct);
  const parent_pieces = parseEnglishNumber(parent?.number_of_pieces);
  const child_pieces = parseEnglishNumber(child?.number_of_pieces);

  const merged_weight = add_rounded(
    parent?.weight_ct,
    child?.weight_ct,
    round_weight
  );
  const merged_pieces = either_has_number(
    parent?.number_of_pieces,
    child?.number_of_pieces
  )
    ? numeric_or_zero(parent?.number_of_pieces) +
      numeric_or_zero(child?.number_of_pieces)
    : null;

  const prices = {};
  if (parent_exists) {
    for (const total_key of gem_pricing_total_column_keys) {
      const merged = add_rounded(
        parent?.[total_key],
        child?.[total_key],
        round_money
      );
      if (merged === null) continue;
      prices[total_key] = merged;
    }
  }

  return {
    ok: errors.length === 0,
    errors,
    parent_id,
    parent_weight,
    child_weight,
    merged_weight,
    parent_pieces,
    child_pieces,
    merged_pieces,
    prices,
  };
}

export function buildGemMergeParentMeta(plan, { parent, child_id } = {}) {
  const meta = {};
  if (plan?.merged_weight !== null && plan?.merged_weight !== undefined) {
    meta.weight_ct = plan.merged_weight;
  }
  if (plan?.merged_pieces !== null && plan?.merged_pieces !== undefined) {
    meta.number_of_pieces = plan.merged_pieces;
  }
  if (plan?.prices) {
    Object.assign(meta, plan.prices);
  }
  const id = clean_string(child_id);
  if (id) {
    meta.splits = normalizeGemSplits(parent?.splits).filter(
      (row) => row.id !== id
    );
  }
  return meta;
}

function parent_price_from(parent, total_key) {
  return parseEnglishNumber(parent?.[total_key]);
}

export function listGemMergeParentChangeRows({ plan, parent, child, t }) {
  if (!plan) return [];
  const rows = [];
  if (plan.merged_weight !== null && plan.merged_weight !== undefined) {
    rows.push({
      key: "weight_ct",
      label: t("sg_weight_ct"),
      from_label: format_summand_label(
        plan.parent_weight,
        format_weight_label,
        t
      ),
      addend_label: format_summand_label(
        plan.child_weight,
        format_weight_label,
        t
      ),
      to_label: format_weight_label(plan.merged_weight, t),
    });
  }
  if (plan.merged_pieces !== null && plan.merged_pieces !== undefined) {
    rows.push({
      key: "number_of_pieces",
      label: t("sg_number_of_pieces"),
      from_label: format_summand_label(
        plan.parent_pieces,
        format_pieces_label,
        t
      ),
      addend_label: format_summand_label(
        plan.child_pieces,
        format_pieces_label,
        t
      ),
      to_label: format_pieces_label(plan.merged_pieces, t),
    });
  }
  for (const total_key of gem_pricing_total_column_keys) {
    if (!Object.prototype.hasOwnProperty.call(plan.prices || {}, total_key)) {
      continue;
    }
    const from_total = parent_price_from(parent, total_key);
    const to_total = plan.prices[total_key];
    const label_key = PRICE_LABEL_KEYS[total_key] || total_key;
    rows.push({
      key: total_key,
      label: t(label_key),
      from_label: format_summand_label(from_total, format_price_label, t),
      addend_label: format_summand_label(
        parseEnglishNumber(child?.[total_key]),
        format_price_label,
        t
      ),
      to_label: format_price_label(to_total, t),
    });
  }
  return rows;
}

function truncate_lost_text(plain) {
  if (!plain) return "";
  if (plain.length > 120) return `${plain.slice(0, 117)}…`;
  return plain;
}

function lost_field_compare_value(key, value) {
  if (key === "notes") return htmlToPlainText(value);
  if (key === "paired_gem") return normalizePairedGemId(value);
  if (key === "status") return clean_string(value);
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  const n = parseEnglishNumber(value);
  if (n !== null) return String(n);
  return clean_string(value);
}

function format_lost_field_value(key, value, t) {
  if (key === "notes") {
    return truncate_lost_text(htmlToPlainText(value));
  }
  if (key === "status") {
    const slug = clean_string(value);
    return slug ? gemStatusLabel(t, slug) : "";
  }
  if (key === "paired_gem") {
    const id = normalizePairedGemId(value);
    return id ? `#${id}` : "";
  }
  if (Array.isArray(value)) {
    return value.length ? String(value.length) : "";
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }
  return clean_string(value);
}

export function listGemMergeLostMeta(child, parent, t) {
  const configs = buildGemFieldConfigs(t);
  const rows = [];
  for (const [key, config] of Object.entries(configs)) {
    if (SKIP_LOST_META_KEYS.has(key)) continue;
    const child_compare = lost_field_compare_value(key, child?.[key]);
    if (!child_compare) continue;
    const parent_compare = lost_field_compare_value(key, parent?.[key]);
    if (child_compare === parent_compare) continue;
    const value_label = format_lost_field_value(key, child?.[key], t);
    if (!value_label) continue;
    rows.push({
      key,
      label: config?.label || key,
      value_label,
      parent_label: format_lost_field_value(key, parent?.[key], t),
    });
  }
  return rows;
}

export function listGemMergeLostFiles(child) {
  const files = Array.isArray(child?.$files) ? child.$files : [];
  const media = [];
  const certificates = [];
  for (const file of files) {
    if (!file) continue;
    const name = file_display_name(file) || "—";
    if (file.is_gem_certificate === true) {
      certificates.push({ name });
    } else {
      media.push({ name });
    }
  }
  return {
    has_cover: Boolean(child?.$cover),
    media,
    certificates,
  };
}

export function listGemMergeSelectionPaths(child) {
  return listGemIndexedSelectionPaths(child);
}

/**
 * Remove the child from selections, clear pairing, add totals onto the parent,
 * drop the child from `splits`, then delete the child folder.
 *
 * @param {(info: {
 *   step: "selections"|"parent"|"delete",
 *   current?: number,
 *   total?: number,
 *   selection_path?: string,
 * }) => void} [args.on_progress]
 */
export async function runGemMerge({
  api,
  child,
  child_path,
  child_id,
  parent,
  parent_path,
  parent_id,
  plan,
  on_progress,
}) {
  if (!plan?.ok) {
    throw { code: "merge_plan_invalid" };
  }

  const selection_paths = listGemIndexedSelectionPaths(child);
  const total = selection_paths.length;
  for (let index = 0; index < selection_paths.length; index += 1) {
    const selection_path = selection_paths[index];
    report_gem_merge_progress(on_progress, {
      step: "selections",
      current: index + 1,
      total,
      selection_path,
    });
    try {
      const selection_folder = await api.getFolder({ path: selection_path });
      await removeGemFromSelection({
        api,
        selection_path,
        selection_folder,
        gem_path: child_path,
      });
    } catch (selection_err) {
      const err =
        selection_err && typeof selection_err === "object" ? selection_err : {};
      throw {
        ...err,
        code: err.code || "merge_selection_failed",
        selection_path,
      };
    }
  }

  const paired_id = normalizePairedGemId(child?.paired_gem);
  if (paired_id) {
    const gems_path = gems_path_from_gem_path(child_path);
    const pairing = await syncPairedGemLinks({
      api,
      gems_path,
      source_gem_id: child_id,
      new_paired_gem_id: "",
      previous_paired_gem_id: paired_id,
    });
    if (Array.isArray(pairing?.failed_paths) && pairing.failed_paths.length) {
      throw {
        code: "merge_pairing_failed",
        failed_paths: pairing.failed_paths,
      };
    }
  }

  report_gem_merge_progress(on_progress, { step: "parent" });
  try {
    await api.updateMeta({
      path: parent_path,
      new_meta: buildGemMergeParentMeta(plan, {
        parent,
        child_id,
      }),
    });
  } catch (parent_err) {
    const err =
      parent_err && typeof parent_err === "object" ? parent_err : {};
    throw {
      ...err,
      code: err.code || "merge_parent_update_failed",
      parent_id,
    };
  }

  report_gem_merge_progress(on_progress, { step: "delete" });
  try {
    await api.deleteItem({ path: child_path });
  } catch (delete_err) {
    const err =
      delete_err && typeof delete_err === "object" ? delete_err : {};
    throw {
      ...err,
      code: "merge_delete_failed",
      parent_id,
      child_id,
    };
  }

  return { parent_id, parent_path };
}
