/** Shared quick search for gems inventory (same rules as SGGemsView). Host must expose `gems` (array). */

import { formatDisplayNumber } from "@/utils/format_locale.js";
import { gemStatusLabel } from "@/utils/gem_status.js";
import {
  parseGemsQuickSearchInput,
  gemMatchesQuickSearch,
  getGemIdFromPath,
  upsertFieldFilterInSearch,
  removeFieldFilterFromSearch,
  removeLegacyFilterFromSearch,
  getGemsColumnFilterMode,
  isGemsColumnFilterableKey,
  GEMS_COLUMN_FILTER_SERIALIZE_ALIAS,
} from "@/utils/gems_quick_search.js";

const gems_quick_search_debounce_ms = 200;

export default {
  data() {
    return {
      gems_quick_search: "",
      gems_quick_search_debounced: "",
      gems_quick_search_debounce_timer_id: null,
    };
  },
  watch: {
    gems_quick_search(next_value) {
      if (this.gems_quick_search_debounce_timer_id !== null) {
        clearTimeout(this.gems_quick_search_debounce_timer_id);
        this.gems_quick_search_debounce_timer_id = null;
      }
      this.gems_quick_search_debounce_timer_id = setTimeout(() => {
        this.gems_quick_search_debounce_timer_id = null;
        this.gems_quick_search_debounced =
          typeof next_value === "string" ? next_value : "";
      }, gems_quick_search_debounce_ms);
    },
  },
  computed: {
    gems_quick_search_parsed() {
      return parseGemsQuickSearchInput(this.gems_quick_search_debounced);
    },
    filtered_gems() {
      if (!Array.isArray(this.gems)) return [];
      const parsed = this.gems_quick_search_parsed;
      return this.gems.filter((gem) => gemMatchesQuickSearch(gem, parsed));
    },
    gems_active_filter_chips() {
      const parsed = this.gems_quick_search_parsed;
      const chips = [];
      const fmt = (n) =>
        formatDisplayNumber(n, {
          minimumFractionDigits: 0,
          maximumFractionDigits: 6,
        }) ?? String(n);

      if (parsed.id_needle) {
        chips.push({
          chip_key: "legacy:id",
          kind: "legacy",
          legacy_kind: "id",
          meta_key: "",
          label: this.$t("sg_gems_filter_chip_id", {
            value: parsed.id_needle,
          }),
        });
      }

      if (parsed.stone_families.length === 1) {
        chips.push({
          chip_key: "legacy:stone_families",
          kind: "legacy",
          legacy_kind: "stone_families",
          meta_key: "",
          label:
            parsed.stone_families[0] === "sapphire"
              ? this.$t("sg_gems_filter_stone_sapphire")
              : this.$t("sg_gems_filter_stone_ruby"),
        });
      } else if (parsed.stone_families.length >= 2) {
        chips.push({
          chip_key: "legacy:stone_families",
          kind: "legacy",
          legacy_kind: "stone_families",
          meta_key: "",
          label: this.$t("sg_gems_filter_stone_sapphire_or_ruby"),
        });
      }

      if (parsed.stone_type_needle) {
        chips.push({
          chip_key: "legacy:stone_type_needle",
          kind: "legacy",
          legacy_kind: "stone_type_needle",
          meta_key: "",
          label: this.$t("sg_gems_filter_chip_stone_text", {
            value: parsed.stone_type_needle,
          }),
        });
      }

      if (parsed.weight_spec) {
        const ws = parsed.weight_spec;
        let value_label = "";
        if (ws.type === "exact") {
          value_label = this.$t("sg_gems_filter_weight_exact", {
            value: fmt(ws.value),
          });
        } else if (ws.type === "range" && ws.max_exclusive) {
          value_label = this.$t("sg_gems_filter_weight_half_open", {
            min: fmt(ws.min),
            max: fmt(ws.max),
          });
        } else if (ws.type === "range") {
          value_label = this.$t("sg_gems_filter_weight_range", {
            min: fmt(ws.min),
            max: fmt(ws.max),
          });
        }
        chips.push({
          chip_key: "legacy:weight_legacy",
          kind: "legacy",
          legacy_kind: "weight_legacy",
          meta_key: "",
          label: value_label,
        });
      }

      Object.entries(parsed.field_filters || {}).forEach(
        ([meta_key, filter]) => {
          chips.push({
            chip_key: `field:${meta_key}`,
            kind: "field",
            legacy_kind: "",
            meta_key,
            label: this.formatGemsFieldFilterChipLabel(meta_key, filter),
          });
        },
      );

      return chips;
    },
    gems_quick_search_has_active_filters() {
      return this.gems_active_filter_chips.length > 0;
    },
    gems_quick_search_filter_count_caption() {
      if (!this.gems_quick_search_has_active_filters) return "";
      return this.$t("sg_gems_filter_count", {
        shown: this.filtered_gems.length,
        total: Array.isArray(this.gems) ? this.gems.length : 0,
      });
    },
    /** @deprecated prose caption — prefer chips + count */
    gems_quick_search_filter_caption() {
      if (!this.gems_quick_search_has_active_filters) return "";
      const clauses = this.gems_active_filter_chips
        .map((chip) => chip.label)
        .join(" · ");
      return this.$t("sg_gems_filter_caption", {
        clauses,
        shown: this.filtered_gems.length,
        total: Array.isArray(this.gems) ? this.gems.length : 0,
      });
    },
    gems_column_field_filters() {
      return this.gems_quick_search_parsed.field_filters || {};
    },
  },
  beforeDestroy() {
    if (this.gems_quick_search_debounce_timer_id !== null) {
      clearTimeout(this.gems_quick_search_debounce_timer_id);
      this.gems_quick_search_debounce_timer_id = null;
    }
  },
  methods: {
    isGemsColumnFilterableKey,
    getGemsColumnFilterMode,
    getGemId(gem) {
      return getGemIdFromPath(gem);
    },
    parseGemsQuickSearchInput(raw) {
      return parseGemsQuickSearchInput(raw);
    },
    gemMatchesQuickSearch(gem, parsed) {
      return gemMatchesQuickSearch(gem, parsed);
    },
    formatGemsFieldFilterChipLabel(meta_key, filter) {
      const field_label = this.resolveGemsFilterFieldLabel(meta_key);
      const fmt = (n) =>
        formatDisplayNumber(n, {
          minimumFractionDigits: 0,
          maximumFractionDigits: 6,
        }) ?? String(n);

      if (filter?.mode === "enum") {
        const values = Array.isArray(filter.values) ? filter.values : [];
        const display =
          meta_key === "status"
            ? values.map((v) => gemStatusLabel(this.$t.bind(this), v))
            : values;
        return `${field_label}: ${display.join(", ")}`;
      }
      if (filter?.mode === "number") {
        if (Number.isFinite(filter.exact)) {
          return `${field_label}: ${fmt(filter.exact)}`;
        }
        const has_min = Number.isFinite(filter.min);
        const has_max = Number.isFinite(filter.max);
        if (has_min && has_max) {
          return `${field_label}: ${fmt(filter.min)}–${fmt(filter.max)}`;
        }
        if (has_min) return `${field_label}: ≥${fmt(filter.min)}`;
        if (has_max) return `${field_label}: ≤${fmt(filter.max)}`;
      }
      if (filter?.mode === "date") {
        if (filter.exact) return `${field_label}: ${filter.exact}`;
        const has_min = Boolean(filter.min);
        const has_max = Boolean(filter.max);
        if (has_min && has_max) {
          return `${field_label}: ${filter.min}–${filter.max}`;
        }
        if (has_min) return `${field_label}: ≥${filter.min}`;
        if (has_max) return `${field_label}: ≤${filter.max}`;
      }
      return field_label;
    },
    resolveGemsFilterFieldLabel(meta_key) {
      if (
        this.metadata_labels &&
        typeof this.metadata_labels === "object" &&
        this.metadata_labels[meta_key]
      ) {
        return this.metadata_labels[meta_key];
      }
      const alias = GEMS_COLUMN_FILTER_SERIALIZE_ALIAS[meta_key] || meta_key;
      return alias;
    },
    applyGemsColumnFilter(meta_key, filter) {
      if (!isGemsColumnFilterableKey(meta_key)) return;
      this.gems_quick_search = upsertFieldFilterInSearch(
        this.gems_quick_search,
        meta_key,
        filter,
      );
      // Apply immediately (skip debounce lag for UI apply).
      this.gems_quick_search_debounced = this.gems_quick_search;
    },
    removeGemsColumnFilter(meta_key) {
      if (!meta_key) return;
      this.gems_quick_search = removeFieldFilterFromSearch(
        this.gems_quick_search,
        meta_key,
      );
      this.gems_quick_search_debounced = this.gems_quick_search;
    },
    removeGemsFilterChip(chip) {
      if (!chip) return;
      if (chip.kind === "field" && chip.meta_key) {
        this.removeGemsColumnFilter(chip.meta_key);
        return;
      }
      if (chip.kind === "legacy" && chip.legacy_kind) {
        this.gems_quick_search = removeLegacyFilterFromSearch(
          this.gems_quick_search,
          chip.legacy_kind,
        );
        this.gems_quick_search_debounced = this.gems_quick_search;
      }
    },
    collectDistinctStoneTypesMatchingNeedle(needle) {
      if (!needle || typeof needle !== "string") return [];
      const n = needle.trim().toLowerCase();
      if (!n) return [];
      const seen = new Set();
      const labels = [];
      (Array.isArray(this.gems) ? this.gems : []).forEach((gem) => {
        const st = gem?.stone_type;
        if (st === undefined || st === null || st === "") return;
        const s = String(st);
        if (!s.toLowerCase().includes(n)) return;
        if (seen.has(s)) return;
        seen.add(s);
        labels.push(s);
      });
      labels.sort((a, b) =>
        a.localeCompare(b, undefined, { sensitivity: "base" }),
      );
      return labels;
    },
  },
};
