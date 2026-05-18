/** Merged L × W × H column + helpers (stored fields remain length_mm, width_mm, height_mm). */
export const gem_linear_dimension_keys = Object.freeze([
  "length_mm",
  "width_mm",
  "height_mm",
]);

export const gem_dimensions_merged_column_key = "dimensions_lwh";

export default {
  methods: {
    isGemDimensionsMergedColumnKey(field_key) {
      return field_key === gem_dimensions_merged_column_key;
    },
    formatGemDimensionsInline(gem) {
      const fmt = (raw) => {
        const n = this.toNumberOrNull(raw);
        if (n === null || !Number.isFinite(n)) return "—";
        return n.toLocaleString(this.$i18n.locale, {
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
        });
      };
      return `${fmt(gem?.length_mm)} × ${fmt(gem?.width_mm)} × ${fmt(
        gem?.height_mm
      )} mm`;
    },
    expandLinearDimensionFlashKeys(field_keys) {
      if (!Array.isArray(field_keys)) return [];
      const out = new Set(field_keys.filter(Boolean));
      const touches_linear_dim = gem_linear_dimension_keys.some((k) =>
        out.has(k)
      );
      if (touches_linear_dim) {
        gem_linear_dimension_keys.forEach((k) => out.delete(k));
        out.add(gem_dimensions_merged_column_key);
      }
      return Array.from(out);
    },
    resolveGemDimensionsSortValue(gem) {
      return this.toNumberOrDefault(gem?.length_mm);
    },
  },
};
