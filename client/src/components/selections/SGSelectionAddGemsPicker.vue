<template>
  <div class="_addGemsRoot">
    <div v-if="!panel_open" class="_addGemsActions">
      <button
        type="button"
        class="u-button u-button_small u-button_bleuvert"
        :disabled="busy"
        @click="openPanel"
      >
        <b-icon icon="plus" scale="1.35" />
        {{ $t("sg_selection_add_gems_to_selection_button") }}
      </button>
      <button
        type="button"
        class="u-button u-button_small"
        :disabled="busy"
        @click="$emit('addById')"
      >
        <b-icon icon="hash" />
        {{ $t("sg_selection_add_gems_by_id_button") }}
      </button>
    </div>

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

      <SGInfoNotice
        v-if="selection_status_target_label"
        :message="selection_status_hint_lead"
        :badge="selection_status_target_label"
      />

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
        search_name="selection_add_gems_search"
        :search_disabled="busy"
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
import SGInfoNotice from "@/components/softgems/SGInfoNotice.vue";
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
    SGInfoNotice,
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
    selection_status_target_label() {
      if (!selectionTypeAffectsGemStatus(this.selection_type)) return "";
      const mapped_status = gemStatusSlugForSelectionType(this.selection_type);
      if (!mapped_status) return "";
      return gemStatusLabel(this.$t.bind(this), mapped_status);
    },
    selection_status_hint_lead() {
      if (!this.selection_status_target_label) return "";
      if (this.selection_type === "memo in") {
        return this.$t("sg_selection_add_gems_status_memo_in_hint");
      }
      return this.$t("sg_selection_add_gems_status_hint");
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
        this.focusSearchInputIfDesktop();
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
    focusSearchInputIfDesktop() {
      if (this.$root.is_mobile_view) return;
      this.$refs.gems_inventory_table?.focusSearchInput();
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
          this.focusSearchInputIfDesktop();
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
  min-width: 0;
}

._addGemsActions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: calc(var(--spacing) / 2);
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
  min-width: 0;
  max-width: 100%;
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

._hint {
  margin: 0;
  color: var(--c-gris_fonce);
  font-size: var(--sl-font-size-small);
}
</style>
