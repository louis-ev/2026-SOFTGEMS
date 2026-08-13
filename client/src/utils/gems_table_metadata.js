import {
  gem_virtual_per_carat_column_keys,
  gem_pricing_total_column_keys,
} from "@/mixins/GemPricing";
import {
  gem_linear_dimension_keys,
  gem_dimensions_merged_column_key,
} from "@/mixins/GemDimensions";
import {
  formatGemSelectionNumsColumnValue,
  gems_table_selection_nums_column_keys,
  isSelectionNumsColumnKey,
} from "@/utils/gem_selection_nums_columns.js";

export {
  filterGemsTableDefaultVisibleKeys,
  gems_table_selection_nums_box_column_key,
  gems_table_selection_nums_column_keys,
  gems_table_selection_nums_opt_in_column_keys,
  isGemsTableDefaultOffColumnKey,
  isSelectionNumsColumnKey,
} from "@/utils/gem_selection_nums_columns.js";

/** Keys never offered as separate columns (merged into one table column). */
export const gems_table_column_picker_excluded_keys = Object.freeze([
  ...gem_virtual_per_carat_column_keys,
  ...gem_linear_dimension_keys,
  "price_per_carat_pa_pcb",
]);

/**
 * Standard gem table columns always offered in the picker (independent of loaded gems).
 * Order is the default inventory column order (when no saved preference exists).
 * Selection-number columns follow selection-type registry order; all are off by default / on reset.
 */
export const gems_table_catalog_column_keys = Object.freeze([
  "id",
  "status",
  "$cover",
  "number_of_pieces",
  "stone_type",
  "weight_ct",
  "color",
  "shape",
  "origin_country",
  "dimensions_lwh",
  "treatment_type",
  "base_price_pcb",
  "import_price",
  "pv_selling_price",
  "pvd_asking_price",
  "pc_to",
  "pf_invoiced_price",
  "paired_gem",
  "country_of_cut",
  "reference_supplier",
  "reference_customer",
  "numero_de_mise_a_consommation",
  "$date_modified",
  ...gems_table_selection_nums_column_keys,
]);

export const gems_table_gem_excluded_metadata_keys = Object.freeze([
  "internal_name",
  "price_per_carat_all",
  "box_selection_path",
  "selection_membership_paths",
  "purchased_price_pa",
  "price_per_carat_pa",
  "parent_id",
  "splits",
]);

export const gems_table_discovery_ignored_keys = Object.freeze([
  "name",
  "title",
  ...gems_table_gem_excluded_metadata_keys,
  ...gems_table_column_picker_excluded_keys,
]);

const gems_table_catalog_rank = Object.freeze(
  Object.fromEntries(
    gems_table_catalog_column_keys.map((metadata_key, index) => [
      metadata_key,
      index,
    ])
  )
);

export function isGemsTableMergedPricingColumnKey(metadata_key) {
  return gem_pricing_total_column_keys.includes(metadata_key);
}

export function isGemsTableMergedDimensionsColumnKey(metadata_key) {
  return metadata_key === gem_dimensions_merged_column_key;
}

export function isGemsTableMergedDisplayColumnKey(metadata_key) {
  return (
    isGemsTableMergedPricingColumnKey(metadata_key) ||
    isGemsTableMergedDimensionsColumnKey(metadata_key)
  );
}

export function stripVirtualPerCaratKeys(metadata_keys) {
  if (!Array.isArray(metadata_keys)) return [];
  return metadata_keys.filter(
    (key) => !gem_virtual_per_carat_column_keys.includes(key)
  );
}

export function stripLinearDimensionKeys(metadata_keys) {
  if (!Array.isArray(metadata_keys)) return [];
  let inserted = false;
  const out = [];
  for (const key of metadata_keys) {
    if (gem_linear_dimension_keys.includes(key)) {
      if (!inserted) {
        out.push(gem_dimensions_merged_column_key);
        inserted = true;
      }
      continue;
    }
    out.push(key);
  }
  return out;
}

/** Normalize saved / picker selection to persisted table column keys. */
export function normalizeGemsTableSelectedMetadataKeys(metadata_keys) {
  return stripLinearDimensionKeys(stripVirtualPerCaratKeys(metadata_keys));
}

/**
 * Build the column picker list order.
 * Prefer a saved full order, then fall back to selected (visible) order, then catalog leftovers.
 *
 * @param {string[]} all_keys
 * @param {string[]} [preferred_order]
 * @param {string[]} [selected_keys]
 * @returns {string[]}
 */
export function buildGemsTableOrderedPickerKeys(
  all_keys,
  preferred_order = [],
  selected_keys = []
) {
  const available_keys = Array.isArray(all_keys) ? all_keys : [];
  const available_set = new Set(available_keys);
  const seen = new Set();
  const ordered = [];

  const pushIfAvailable = (metadata_key) => {
    if (!available_set.has(metadata_key) || seen.has(metadata_key)) return;
    seen.add(metadata_key);
    ordered.push(metadata_key);
  };

  (Array.isArray(preferred_order) ? preferred_order : []).forEach(pushIfAvailable);
  (Array.isArray(selected_keys) ? selected_keys : []).forEach(pushIfAvailable);
  available_keys.forEach(pushIfAvailable);

  return ordered;
}

export function sortGemsTableMetadataKeys(metadata_keys) {
  if (!Array.isArray(metadata_keys)) return [];
  return [...new Set(metadata_keys)].sort((first_key, second_key) => {
    const first_rank =
      gems_table_catalog_rank[first_key] ?? Number.MAX_SAFE_INTEGER;
    const second_rank =
      gems_table_catalog_rank[second_key] ?? Number.MAX_SAFE_INTEGER;
    if (first_rank !== second_rank) return first_rank - second_rank;
    return first_key.localeCompare(second_key);
  });
}

export function collectGemsTableMetadataKeysFromGems(
  gems,
  ignored_keys = gems_table_discovery_ignored_keys
) {
  const ignored_key_set =
    ignored_keys instanceof Set ? ignored_keys : new Set(ignored_keys);
  const metadata_key_set = new Set();

  if (!Array.isArray(gems)) return metadata_key_set;

  gems.forEach((gem) => {
    Object.keys(gem || {}).forEach((key) => {
      if (ignored_key_set.has(key)) return;
      if (
        key.startsWith("$") &&
        key !== "$date_modified" &&
        key !== "$cover"
      ) {
        return;
      }
      metadata_key_set.add(key);
    });
  });

  return metadata_key_set;
}

/** Catalog + any extra keys present on loaded gems (for picker and display). */
export function buildGemsTableAllMetadataKeys(gems) {
  const metadata_key_set = new Set(gems_table_catalog_column_keys);
  collectGemsTableMetadataKeysFromGems(gems).forEach((metadata_key) => {
    metadata_key_set.add(metadata_key);
  });
  return sortGemsTableMetadataKeys(Array.from(metadata_key_set));
}

function is_filled_meta_value(value) {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim() !== "";
  if (typeof value === "number") return Number.isFinite(value);
  if (typeof value === "boolean") return true;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "object") return Object.keys(value).length > 0;
  return Boolean(value);
}

/**
 * @param {object|null|undefined} gem
 * @param {string} metadata_key
 * @returns {boolean}
 */
export function gemHasFilledTableColumnValue(gem, metadata_key) {
  if (!gem) return false;
  if (metadata_key === "id") {
    return Boolean(String(gem.$path || "").trim());
  }
  if (metadata_key === "$cover") {
    return Boolean(gem.$cover);
  }
  if (metadata_key === gem_dimensions_merged_column_key) {
    return gem_linear_dimension_keys.some((key) =>
      is_filled_meta_value(gem[key])
    );
  }
  if (isSelectionNumsColumnKey(metadata_key)) {
    return Boolean(formatGemSelectionNumsColumnValue(gem, metadata_key));
  }
  return is_filled_meta_value(gem[metadata_key]);
}

/**
 * @param {object[]} gems
 * @param {string} metadata_key
 * @returns {number}
 */
export function countGemsWithFilledTableColumnValue(gems, metadata_key) {
  if (!Array.isArray(gems) || gems.length === 0) return 0;
  return gems.filter((gem) =>
    gemHasFilledTableColumnValue(gem, metadata_key)
  ).length;
}
