/**
 * Column filter option builders for gems tables.
 * Host must expose `gems` (array) and use GemsQuickSearchMixin.
 */

import {
  color_suggestions,
  shape_suggestions,
  stone_type_suggestions,
  origin_country_suggestions,
  country_of_cut_suggestions,
  treatment_type_suggestions,
  status_suggestions,
} from "@/suggestions/softgems";
import { gemStatusLabel } from "@/utils/gem_status.js";
import {
  GEMS_COLUMN_FILTER_EMPTY_VALUE,
  GEMS_COLUMN_FILTER_ENUM_KEYS,
  GEMS_COLUMN_FILTER_NUMBER_KEYS,
  getGemsColumnFilterMode,
  collectAvailableEnumFilterValues,
  hasAvailableEmptyNumberField,
  isGemsColumnFilterEmptyValue,
} from "@/utils/gems_quick_search.js";

export default {
  computed: {
    gems_column_filter_options() {
      const options = {};
      GEMS_COLUMN_FILTER_ENUM_KEYS.forEach((meta_key) => {
        options[meta_key] = this.buildColumnFilterOptions(meta_key);
      });
      return options;
    },
    gems_column_filter_empty_available() {
      const available = {};
      GEMS_COLUMN_FILTER_NUMBER_KEYS.forEach((meta_key) => {
        available[meta_key] = hasAvailableEmptyNumberField(
          this.gems,
          this.gems_quick_search_parsed,
          meta_key
        );
      });
      return available;
    },
  },
  methods: {
    suggestionListForFilterKey(meta_key) {
      if (meta_key === "stone_type") return stone_type_suggestions;
      if (meta_key === "color") return color_suggestions;
      if (meta_key === "shape") return shape_suggestions;
      if (meta_key === "origin_country") return origin_country_suggestions;
      if (meta_key === "country_of_cut") return country_of_cut_suggestions;
      if (meta_key === "treatment_type") return treatment_type_suggestions;
      if (meta_key === "status") return status_suggestions;
      // reference_supplier / reference_customer / MAC: distinct values from gems only
      return [];
    },
    buildColumnFilterOptions(meta_key) {
      if (getGemsColumnFilterMode(meta_key) !== "enum") return [];
      const seen = new Set();
      const options = [];
      const available = collectAvailableEnumFilterValues(
        this.gems,
        this.gems_quick_search_parsed,
        meta_key
      );
      const selected = new Set(
        (this.gems_column_field_filters?.[meta_key]?.values || []).map((v) =>
          String(v).trim().toLowerCase()
        )
      );
      const push_option = (value, label, title = "") => {
        const v = String(value ?? "").trim();
        if (!v) return;
        const key = v.toLowerCase();
        if (seen.has(key)) return;
        // Only offer values that still match other filters (or are already selected).
        if (!available.has(key) && !selected.has(key)) return;
        seen.add(key);
        options.push({
          value: v,
          label: label || v,
          title: title || "",
          is_empty: isGemsColumnFilterEmptyValue(v),
        });
      };

      push_option(
        GEMS_COLUMN_FILTER_EMPTY_VALUE,
        this.$t("sg_gems_column_filter_empty")
      );

      this.suggestionListForFilterKey(meta_key).forEach((value) => {
        if (meta_key === "status") {
          push_option(value, gemStatusLabel(this.$t.bind(this), value));
          return;
        }
        push_option(value, value);
      });

      (Array.isArray(this.gems) ? this.gems : []).forEach((gem) => {
        const raw = gem?.[meta_key];
        if (raw === undefined || raw === null || raw === "") return;
        if (meta_key === "status") {
          push_option(raw, gemStatusLabel(this.$t.bind(this), raw));
          return;
        }
        push_option(raw, String(raw));
      });

      options.sort((a, b) => {
        if (a.is_empty !== b.is_empty) return a.is_empty ? -1 : 1;
        return a.label.localeCompare(b.label, undefined, {
          sensitivity: "base",
        });
      });
      return options;
    },
    onApplyColumnFilter(payload) {
      const meta_key = payload?.metadata_key;
      const filter = payload?.filter;
      if (!meta_key || !filter) return;
      this.applyGemsColumnFilter(meta_key, filter);
    },
    onClearColumnFilter(meta_key) {
      this.removeGemsColumnFilter(meta_key);
    },
  },
};
