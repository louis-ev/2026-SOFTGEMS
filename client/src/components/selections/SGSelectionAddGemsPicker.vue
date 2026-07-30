<template>
  <div class="_addGemsRoot">
    <button
      v-if="!panel_open"
      type="button"
      class="u-button u-button_small u-button_bleuvert"
      :disabled="busy"
      @click="openPanel"
    >
      <b-icon icon="plus" scale="1.35" />
      {{ $t("sg_selection_add_gems_to_selection_button") }}
    </button>

    <div v-else ref="add_gems_panel" class="_addGemsPanel">
      <header class="_panelHeader">
        <h3 class="_panelTitle">{{ $t("sg_selection_add_gems_title") }}</h3>
        <button
          type="button"
          class="u-button u-button_icon _panelCloseBtn"
          :title="$t('close')"
          :aria-label="$t('close')"
          @click="closePanel"
        >
          <b-icon icon="x-lg" />
        </button>
      </header>

      <p v-if="selection_status_hint" class="_pickStatusHint">
        {{ selection_status_hint }}
      </p>

      <p v-if="is_loading_gems_inventory" class="_hint">
        {{ $t("sg_selection_add_gems_loading_background") }}
      </p>
      <p v-else-if="inventory_fetch_error" class="u-errorMsg">
        {{ inventory_fetch_error }}
      </p>
      <SGGemsInventoryTableSection
        v-else-if="inventory_loaded"
        ref="gems_inventory_table"
        :gems="gems_inventory"
        :search_placeholder="$t('sg_selection_search_gems')"
        search_name="selection_add_gems_search"
        :search_disabled="busy"
        show_search_how_to
        read_only_cells
        use_sorted_gems
        selection_pick_column
        :disabled_row_paths="disabled_row_paths"
        :metadata_keys_storage_scope="add_gems_metadata_keys_storage_scope"
        table_shell_class="_tableShellBounded"
        @rowClick="onPickRowClick"
      />
    </div>
  </div>
</template>

<script>
import SGGemsInventoryTableSection from "@/components/gems/SGGemsInventoryTableSection.vue";
import { scrollElementToViewportFraction } from "@/utils/section_anchor_scroll.js";
import { gemStatusLabel } from "@/utils/gem_status.js";
import { selectionSlugFromType } from "@/utils/selection_type_registry.js";
import {
  gemStatusSlugForSelectionType,
  selectionTypeAffectsGemStatus,
} from "@/utils/gem_selection_status.js";

export default {
  name: "SGSelectionAddGemsPicker",
  components: {
    SGGemsInventoryTableSection,
  },
  props: {
    selection_type: {
      type: String,
      default: "",
    },
    disabled_row_paths: {
      type: Array,
      default: () => [],
    },
    busy: {
      type: Boolean,
      default: false,
    },
  },
  computed: {
    add_gems_metadata_keys_storage_scope() {
      const type_slug = selectionSlugFromType(this.selection_type);
      if (!type_slug) return "selection:unknown";
      return `selection:${type_slug}`;
    },
    selection_status_hint() {
      if (!selectionTypeAffectsGemStatus(this.selection_type)) return "";
      const mapped_status = gemStatusSlugForSelectionType(this.selection_type);
      if (!mapped_status) return "";
      const status_label = gemStatusLabel(this.$t.bind(this), mapped_status);
      if (this.selection_type === "memo in") {
        return this.$t("sg_selection_add_gems_status_memo_in_hint", {
          status: status_label,
        });
      }
      return this.$t("sg_selection_add_gems_status_hint", {
        status: status_label,
      });
    },
  },
  data() {
    return {
      gems_root_path: "gems",
      gems_inventory: [],
      is_loading_gems_inventory: false,
      inventory_loaded: false,
      inventory_fetch_error: "",
      panel_open: false,
    };
  },
  methods: {
    openPanel() {
      this.panel_open = true;
      this.fetchGemsInventory();
      this.$nextTick(() => {
        this.scrollAddGemsPanelIntoView();
        this.$refs.gems_inventory_table?.focusSearchInput();
      });
    },
    scrollAddGemsPanelIntoView({ smooth = true } = {}) {
      const panel = this.$refs.add_gems_panel;
      if (!panel) return;
      scrollElementToViewportFraction(panel, {
        viewport_fraction_from_top: 1 / 3,
        smooth,
      });
    },
    closePanel() {
      this.panel_open = false;
    },
    async fetchGemsInventory() {
      if (this.inventory_loaded || this.is_loading_gems_inventory) return;
      this.is_loading_gems_inventory = true;
      this.inventory_fetch_error = "";
      try {
        const rows = await this.$api.getFolders({ path: this.gems_root_path });
        this.gems_inventory = Array.isArray(rows) ? rows : [];
        this.inventory_loaded = true;
      } catch ({ code }) {
        this.gems_inventory = [];
        this.inventory_fetch_error = code || this.$t("sg_could_not_load_gems");
      } finally {
        this.is_loading_gems_inventory = false;
        this.$nextTick(() => {
          this.scrollAddGemsPanelIntoView();
          this.$refs.gems_inventory_table?.focusSearchInput();
        });
      }
    },
    onPickRowClick(gem) {
      if (this.busy) return;
      this.$emit("pick", gem);
    },
  },
};
</script>

<style lang="scss" scoped>
._addGemsRoot {
  margin-top: calc(var(--spacing) / 2);
}

._openAddGemsBtnIcon {
  flex-shrink: 0;
}

._addGemsPanel {
  margin-top: calc(var(--spacing) * 0.25);
  padding: calc(var(--spacing) * 1.1);
  border: 1px solid color-mix(in srgb, var(--c-gris_fonce) 28%, transparent);
  border-radius: 6px;
  background: color-mix(in srgb, var(--c-gris_clair) 40%, transparent);
}

._panelHeader {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing);
  margin-bottom: calc(var(--spacing) * 0.75);
}

._panelTitle {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
}

._panelCloseBtn {
  flex-shrink: 0;
}

._pickHowTo {
  margin: 0 0 calc(var(--spacing) * 0.85);
  font-size: var(--sl-font-size-small);
  color: var(--c-gris_fonce);
  line-height: 1.4;
}

._pickStatusHint {
  margin: 0 0 calc(var(--spacing) * 0.85);
  padding: calc(var(--spacing) * 0.55) calc(var(--spacing) * 0.75);
  border-radius: 6px;
  font-size: var(--sl-font-size-small);
  line-height: 1.4;
  color: var(--c-gris_fonce);
  background: color-mix(in srgb, var(--c-bleuvert) 12%, transparent);
  border: 1px solid color-mix(in srgb, var(--c-bleuvert) 35%, transparent);
}

._hint {
  margin: 0;
  color: var(--c-gris_fonce);
  font-size: var(--sl-font-size-small);
}
</style>
