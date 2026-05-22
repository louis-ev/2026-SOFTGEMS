import {
  gem_virtual_per_carat_column_keys,
  gem_pricing_total_column_keys,
} from "@/mixins/GemPricing";
import {
  gem_linear_dimension_keys,
  gem_dimensions_merged_column_key,
} from "@/mixins/GemDimensions";

/** Keys never offered as separate columns (merged into one table column). */
export const gems_table_column_picker_excluded_keys = Object.freeze([
  ...gem_virtual_per_carat_column_keys,
  ...gem_linear_dimension_keys,
  "price_per_carat_pa_pcb",
]);

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
