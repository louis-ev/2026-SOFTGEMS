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
      <p
        v-if="gems_quick_search_filter_caption"
        class="_gemsActiveFilters"
        role="status"
      >
        {{ gems_quick_search_filter_caption }}
      </p>
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
          @rowClick="$emit('rowClick', $event)"
          @editCell="$emit('editCell', $event)"
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
  border: 0;
  background: transparent;
  font-size: var(--sl-font-size-x-small);
  line-height: 1.4;
  color: color-mix(in srgb, var(--c-gris_fonce) 82%, transparent);
  font-weight: 400;
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
