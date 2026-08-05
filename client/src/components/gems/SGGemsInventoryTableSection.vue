<template>
  <div class="_gemsInventoryTableSection">
    <slot name="before_search" />

    <div class="_gemsSearchBar">
      <SearchInput
        ref="search_input"
        v-model="gems_quick_search"
        :search_placeholder="resolved_search_placeholder"
        :name="search_name"
        :disabled="search_disabled"
      />
    </div>

    <div v-if="is_loading" class="_loading">{{ $t("sg_loading_gems") }}</div>
    <p v-else-if="fetch_error" class="u-errorMsg">{{ fetch_error }}</p>
    <template v-else>
      <div
        v-if="gems_quick_search_has_active_filters"
        class="_gemsActiveFilters"
        role="status"
      >
        <span class="_filteredPrefix">{{ $t("sg_gems_filtered_prefix") }}</span>
        <button
          v-for="chip in gems_active_filter_chips"
          :key="chip.chip_key"
          type="button"
          class="_filterChip"
          :title="$t('sg_gems_filter_chip_remove_title')"
          :aria-label="
            $t('sg_gems_filter_chip_remove_aria', { filter: chip.label })
          "
          @click="removeGemsFilterChip(chip)"
        >
          <span class="_filterChipLabel">{{ chip.label }}</span>
          <span class="_filterChipRemove" aria-hidden="true">×</span>
        </button>
        <span class="_filteredCount">{{
          gems_quick_search_filter_count_caption
        }}</span>
      </div>
      <div class="_tableShell" :class="table_shell_class">
        <SGGemsTable
          ref="gems_table"
          :gems="table_gems"
          :inventory_has_gems="inventory_has_gems"
          :metadata_keys="metadata_keys"
          :metadata_labels="metadata_labels"
          :metadata_icons="metadata_icons"
          :field_editable_map="resolved_field_editable_map"
          :selected_gem_id="selected_gem_id"
          :is_gem_open="is_gem_open"
          :view_density="view_density"
          :cover_can_edit="cover_can_edit"
          :disabled_row_paths="disabled_row_paths"
          :selection_pick_column="selection_pick_column"
          :single_pick_selected_path="single_pick_selected_path"
          :gems_page_size="gems_page_size"
          :fixed_gem_order="fixed_gem_order"
          :append_column="append_column"
          :enable_column_filters="true"
          :column_field_filters="gems_column_field_filters"
          :column_filter_options="gems_column_filter_options"
          @rowClick="$emit('rowClick', $event)"
          @editCell="$emit('editCell', $event)"
          @applyColumnFilter="onApplyColumnFilter"
          @clearColumnFilter="onClearColumnFilter"
        />
      </div>
    </template>

    <SGGemColumnsModal
      v-if="enable_column_customizer && show_columns_modal"
      :all_metadata_keys="all_metadata_keys"
      :selected_metadata_keys="selected_metadata_keys"
      :metadata_labels="metadata_labels"
      :metadata_icons="metadata_icons"
      @save="onSaveGemsColumnsSelection"
      @close="show_columns_modal = false"
    />
  </div>
</template>

<script>
import SearchInput from "@/adc-core/inputs/SearchInput.vue";
import SGGemsTable from "@/components/gems/SGGemsTable.vue";
import SGGemColumnsModal from "@/components/gems/SGGemColumnsModal.vue";
import GemsQuickSearchMixin from "@/mixins/GemsQuickSearchMixin.js";
import GemsInventoryTableMixin, {
  gems_table_columns_storage_scopes,
} from "@/mixins/GemsInventoryTableMixin.js";
import {
  color_suggestions,
  shape_suggestions,
  stone_type_suggestions,
  origin_country_suggestions,
  status_suggestions,
} from "@/suggestions/softgems";
import { gemStatusLabel } from "@/utils/gem_status.js";
import {
  GEMS_COLUMN_FILTER_ENUM_KEYS,
  getGemsColumnFilterMode,
} from "@/utils/gems_quick_search.js";

export default {
  name: "SGGemsInventoryTableSection",
  mixins: [GemsQuickSearchMixin, GemsInventoryTableMixin],
  components: {
    SearchInput,
    SGGemsTable,
    SGGemColumnsModal,
  },
  props: {
    gems: {
      type: Array,
      default: () => [],
    },
    is_loading: {
      type: Boolean,
      default: false,
    },
    fetch_error: {
      type: String,
      default: "",
    },
    selected_gem_id: {
      type: String,
      default: "",
    },
    is_gem_open: {
      type: Boolean,
      default: false,
    },
    view_density: {
      type: String,
      default: "compact",
    },
    cover_can_edit: {
      type: Boolean,
      default: false,
    },
    selection_pick_column: {
      type: Boolean,
      default: false,
    },
    single_pick_selected_path: {
      type: String,
      default: "",
    },
    disabled_row_paths: {
      type: Array,
      default: () => [],
    },
    field_editable_map: {
      type: Object,
      default: null,
    },
    read_only_cells: {
      type: Boolean,
      default: false,
    },
    search_placeholder: {
      type: String,
      default: "",
    },
    search_name: {
      type: String,
      default: "gems_quick_search",
    },
    search_disabled: {
      type: Boolean,
      default: false,
    },
    enable_column_customizer: {
      type: Boolean,
      default: false,
    },
    metadata_keys_storage_scope: {
      type: String,
      default: gems_table_columns_storage_scopes.all_gems,
    },
    persist_metadata_keys: {
      type: Boolean,
      default: true,
    },
    use_sorted_gems: {
      type: Boolean,
      default: false,
    },
    gems_page_size: {
      type: Number,
      default: undefined,
    },
    fixed_gem_order: {
      type: Boolean,
      default: false,
    },
    append_column: {
      type: Boolean,
      default: false,
    },
    table_shell_class: {
      type: [String, Array, Object],
      default: null,
    },
  },
  data() {
    return {
      show_columns_modal: false,
    };
  },
  computed: {
    inventory_has_gems() {
      return Array.isArray(this.gems) && this.gems.length > 0;
    },
    resolved_search_placeholder() {
      if (this.search_placeholder) return this.search_placeholder;
      return this.$t("sg_gems_search_placeholder");
    },
    table_gems() {
      return this.use_sorted_gems ? this.sorted_gems : this.filtered_gems;
    },
    resolved_field_editable_map() {
      if (this.field_editable_map && typeof this.field_editable_map === "object") {
        return this.field_editable_map;
      }
      return this.metadata_keys.reduce((acc, key) => {
        acc[key] = false;
        return acc;
      }, {});
    },
    gems_column_filter_options() {
      const options = {};
      GEMS_COLUMN_FILTER_ENUM_KEYS.forEach((meta_key) => {
        options[meta_key] = this.buildColumnFilterOptions(meta_key);
      });
      return options;
    },
  },
  watch: {
    gems: {
      handler(next_gems) {
        if (!Array.isArray(next_gems)) return;
        next_gems.forEach((gem) => this.ensureGemsInventoryPricingFields(gem));
      },
      immediate: true,
    },
    metadata_keys: {
      handler(next_keys) {
        this.$emit("metadataKeysChange", next_keys);
      },
      immediate: true,
    },
    sorted_gems: {
      handler(next_gems) {
        this.$emit("sortedGemsChange", next_gems);
      },
      immediate: true,
    },
  },
  methods: {
    getGemsMetadataKeysStorageScope() {
      if (!this.persist_metadata_keys) return "";
      return (
        String(this.metadata_keys_storage_scope || "").trim() ||
        gems_table_columns_storage_scopes.all_gems
      );
    },
    openColumnsModal() {
      this.show_columns_modal = true;
    },
    focusSearchInput() {
      const root = this.$refs.search_input?.$el;
      const input = root?.querySelector("input");
      if (input && typeof input.focus === "function") input.focus();
    },
    scrollGemCellIntoView(payload) {
      const table = this.$refs.gems_table;
      if (table && typeof table.scrollGemCellIntoView === "function") {
        table.scrollGemCellIntoView(payload);
      }
    },
    suggestionListForFilterKey(meta_key) {
      if (meta_key === "stone_type") return stone_type_suggestions;
      if (meta_key === "color") return color_suggestions;
      if (meta_key === "shape") return shape_suggestions;
      if (meta_key === "origin_country") return origin_country_suggestions;
      if (meta_key === "status") return status_suggestions;
      // reference_supplier / reference_customer: distinct values from gems only
      return [];
    },
    buildColumnFilterOptions(meta_key) {
      if (getGemsColumnFilterMode(meta_key) !== "enum") return [];
      const seen = new Set();
      const options = [];
      const push_option = (value, label) => {
        const v = String(value ?? "").trim();
        if (!v) return;
        const key = v.toLowerCase();
        if (seen.has(key)) return;
        seen.add(key);
        options.push({
          value: v,
          label: label || v,
        });
      };

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

      options.sort((a, b) =>
        a.label.localeCompare(b.label, undefined, { sensitivity: "base" }),
      );
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
</script>

<style lang="scss" scoped>
._gemsInventoryTableSection {
  display: flex;
  flex-direction: column;
  gap: var(--spacing);
  min-height: 0;
}

._gemsSearchBar {
  flex: 0 0 auto;
  max-width: 52rem;
}

._gemsSearchBar ::v-deep ._searchInput {
  width: 100%;
  min-width: 12rem;
}

._loading {
  margin: 0;
  font-size: var(--sl-font-size-small);
  color: var(--c-gris_fonce);
}

._gemsActiveFilters {
  flex: 0 0 auto;
  max-width: 100%;
  margin: 0;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.35rem 0.4rem;
  font-size: var(--sl-font-size-x-small);
  line-height: 1.4;
  color: color-mix(in srgb, var(--c-gris_fonce) 82%, transparent);
  font-weight: 400;
}

._filteredPrefix {
  flex-shrink: 0;
}

._filteredCount {
  flex-shrink: 0;
  margin-left: 0.15rem;
}

._filterChip {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  max-width: 100%;
  margin: 0;
  padding: 0.1rem 0.4rem 0.1rem 0.45rem;
  border: 1px solid color-mix(in srgb, var(--c-gris_fonce) 28%, transparent);
  border-radius: 999px;
  background: color-mix(in srgb, var(--c-gris_clair) 70%, transparent);
  color: var(--c-noir, inherit);
  font: inherit;
  font-size: inherit;
  line-height: 1.3;
  cursor: pointer;
}

._filterChip:hover {
  border-color: var(--c-bleuvert);
  color: var(--c-bleuvert);
}

._filterChipLabel {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

._filterChipRemove {
  flex-shrink: 0;
  font-size: 0.95em;
  line-height: 1;
  opacity: 0.7;
}

._tableShell {
  min-height: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  > * {
    flex: 1;
    min-height: 0;
  }
}

._tableShell._tableShellBounded {
  height: min(70vh, 720px);
  max-height: min(70vh, 720px);
}
</style>
