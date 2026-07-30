<template>
  <SGSectionPanel
    section_id="selection_entries"
    :title="$t('sg_selection_entries')"
    :count="selection_gem_paths.length"
  >
    <template #actions>
      <button
        v-if="show_entries_table_shell || entry_gems_loading"
        type="button"
        class="u-button u-button_small"
        @click="openColumnsModal"
      >
        <b-icon icon="layout-three-columns" />
        <span>{{ $t("sg_customize_columns") }}</span>
      </button>
      <button
        type="button"
        class="u-button u-button_small"
        @click="show_history_modal = true"
      >
        <b-icon icon="clock-history" />
        <span>{{ $t("sg_selection_gems_history") }}</span>
      </button>
    </template>
    <p v-if="selection_gem_paths.length > 0" class="_entriesSortHint">
      {{ $t("sg_selection_entries_sort_hint") }}
    </p>
    <p
      v-if="selection_gem_paths.length === 0 && !entry_gems_loading"
      class="_hint"
    >
      {{ $t("sg_selection_entries_empty") }}
    </p>
    <p v-else-if="show_entries_initial_loading" class="_hint">
      {{ $t("sg_loading_gems") }}
    </p>
    <div v-else-if="show_entries_table_shell" class="_entriesTableShell">
      <SGGemsTable
        ref="entries_gems_table"
        :gems="entry_gems_list"
        :inventory_has_gems="entry_gems_list.length > 0"
        :metadata_keys="metadata_keys"
        :metadata_labels="metadata_labels"
        :metadata_icons="metadata_icons"
        :field_editable_map="entries_field_editable_map"
        :selected_gem_id="selected_gem_id"
        :is_gem_open="is_gem_open"
        view_density="compact"
        :cover_can_edit="false"
        :selection_remove_column="can_edit"
        :fixed_gem_order="true"
        @rowClick="onEntryRowClick"
        @editCell="onTableEditCell"
        @removeRowClick="confirmRemoveGemRow"
      />
      <div
        v-if="show_entries_reload_overlay"
        class="_entriesReloadOverlay"
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        <p class="_entriesReloadMessage">
          {{ $t("sg_selection_entries_reloading") }}
        </p>
      </div>
    </div>

    <SGSelectionAddGemsPicker
      v-if="can_edit"
      :selection_type="selection_folder?.selection_type"
      :disabled_row_paths="selection_gem_paths"
      :busy="picker_busy"
      @pick="pickGem"
    />

    <SGSelectionGemsHistoryModal
      v-if="show_history_modal"
      :selection_folder_path="selection_folder_path"
      @close="show_history_modal = false"
    />

    <SGGemEditFieldModal
      v-if="editing_field && editing_gem"
      :field="editing_field"
      :current_value="editing_current_value"
      :gem_path="editing_gem.$path"
      :gem="editing_gem"
      @saved="onFieldSaved"
      @close="
        editing_field = null;
        editing_gem = null;
      "
    />

    <SGGemColumnsModal
      v-if="show_columns_modal"
      :all_metadata_keys="all_metadata_keys"
      :selected_metadata_keys="selected_metadata_keys"
      :metadata_labels="metadata_labels"
      :metadata_icons="metadata_icons"
      @save="onSaveGemsColumnsSelection"
      @close="show_columns_modal = false"
    />
  </SGSectionPanel>
</template>

<script>
import SGSectionPanel from "@/components/softgems/SGSectionPanel.vue";
import SGGemsTable from "@/components/gems/SGGemsTable.vue";
import SGSelectionAddGemsPicker from "@/components/selections/SGSelectionAddGemsPicker.vue";
import SGSelectionGemsHistoryModal from "@/components/selections/SGSelectionGemsHistoryModal.vue";
import SGGemEditFieldModal from "@/components/gems/SGGemEditFieldModal.vue";
import SGGemColumnsModal from "@/components/gems/SGGemColumnsModal.vue";
import { buildGemFieldConfigs } from "@/components/gems/gem_field_configs";
import { applyPairedGemPartnerUpdates } from "@/utils/gem_pairing.js";
import {
  gem_linear_dimension_keys,
  gem_dimensions_merged_column_key,
} from "@/mixins/GemDimensions";
import GemsInventoryTableMixin, {
  selections_gems_metadata_keys_localstorage_key,
} from "@/mixins/GemsInventoryTableMixin.js";
import {
  areSelectionGemPathsEqual,
  normalizeSelectionGemPaths,
  sortSelectionGems,
} from "@/utils/selection_entries.js";
import {
  assignGemToBox,
  addGemToSelectionEntries,
  removeGemFromSelection,
} from "@/utils/assign_gem_to_box.js";
import { gemStatusLabel } from "@/utils/gem_status.js";

export default {
  name: "SGSelectionGemsSection",
  mixins: [GemsInventoryTableMixin],
  components: {
    SGSectionPanel,
    SGGemsTable,
    SGSelectionAddGemsPicker,
    SGSelectionGemsHistoryModal,
    SGGemEditFieldModal,
    SGGemColumnsModal,
  },
  props: {
    selection_folder_path: {
      type: String,
      required: true,
    },
    selection_folder: {
      type: Object,
      default: null,
    },
    can_edit: {
      type: Boolean,
      default: false,
    },
    selected_gem_id: {
      type: String,
      default: "",
    },
    is_gem_open: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      gems_root_path: "gems",
      picker_busy: false,
      entry_gems_list: [],
      entry_gems_loading: false,
      refresh_entry_gems_seq: 0,
      pending_entry_gems_refresh: false,
      show_history_modal: false,
      show_columns_modal: false,
      editing_gem: null,
      editing_field: null,
      editing_current_value: "",
    };
  },
  computed: {
    gems() {
      return this.entry_gems_list;
    },
    entries_field_editable_map() {
      const accumulator = this.metadata_keys.reduce((acc, metadata_key) => {
        acc[metadata_key] = this.isFieldEditable(metadata_key);
        return acc;
      }, {});
      this.getPriceFieldPairs().forEach(({ virtual_per_carat_key }) => {
        accumulator[virtual_per_carat_key] = this.isFieldEditable(
          virtual_per_carat_key
        );
      });
      return accumulator;
    },
    is_box_type() {
      return String(this.selection_folder?.selection_type || "") === "boîte";
    },
    selection_gem_paths() {
      return normalizeSelectionGemPaths(
        this.selection_folder?.selection_entries
      );
    },
    show_entries_initial_loading() {
      return this.entry_gems_loading && this.entry_gems_list.length === 0;
    },
    show_entries_table_shell() {
      return this.entry_gems_list.length > 0;
    },
    show_entries_reload_overlay() {
      return this.entry_gems_loading && this.entry_gems_list.length > 0;
    },
  },
  watch: {
    selection_gem_paths: {
      immediate: true,
      handler(new_paths, old_paths) {
        if (areSelectionGemPathsEqual(new_paths, old_paths)) return;
        if (this.picker_busy) {
          this.pending_entry_gems_refresh = true;
          return;
        }
        this.refreshEntryGems();
      },
    },
  },
  methods: {
    getGemsMetadataKeysStorageKey() {
      return selections_gems_metadata_keys_localstorage_key;
    },
    openColumnsModal() {
      this.show_columns_modal = true;
    },
    formatGemStatusLabel(status_value) {
      return gemStatusLabel(this.$t.bind(this), status_value);
    },
    notifyGemAdded(status_result) {
      if (status_result?.status_changed) {
        this.$alertify.delay(5000).success(
          this.$t("sg_selection_gem_status_set_on_add", {
            status: this.formatGemStatusLabel(status_result.new_status),
          })
        );
        return;
      }
      this.$alertify.delay(2500).success(this.$t("sg_selection_gems_updated"));
    },
    notifyGemStatusOnRemove(status_result) {
      if (!status_result?.status_changed) return;
      this.$alertify.delay(5000).alert(
        this.$t("sg_selection_gem_status_restored_on_remove", {
          status: this.formatGemStatusLabel(status_result.new_status),
        })
      );
    },
    cleanString(value) {
      if (value === null || value === undefined) return "";
      return String(value).trim();
    },
    gem_slug_from_path(path_raw) {
      const s = this.cleanString(path_raw);
      if (!s) return "";
      const parts = s.split("/");
      return parts[parts.length - 1] || "";
    },
    async flushPendingEntryGemsRefresh() {
      if (!this.pending_entry_gems_refresh) return;
      this.pending_entry_gems_refresh = false;
      await this.refreshEntryGems({ force_fresh: true });
    },
    async refreshEntryGems({ force_fresh = false } = {}) {
      const gem_paths = this.selection_gem_paths;
      if (!gem_paths.length) {
        this.entry_gems_list = [];
        this.entry_gems_loading = false;
        return;
      }

      const request_seq = ++this.refresh_entry_gems_seq;
      this.entry_gems_loading = true;
      try {
        const folder_slugs = gem_paths.map((gem_path) =>
          this.gem_slug_from_path(gem_path)
        );
        const { folders } = await this.$api.getFoldersBySlugs({
          path: this.gems_root_path,
          folder_slugs,
          no_files: true,
          detailed_infos: force_fresh,
        });
        if (request_seq !== this.refresh_entry_gems_seq) return;
        const folders_by_path = Object.fromEntries(
          folders.map((meta) => [meta.$path, meta])
        );
        const list = gem_paths.map(
          (gem_path) => folders_by_path[gem_path] || { $path: gem_path }
        );
        this.entry_gems_list = this.prepareEntryGemsList(list);
      } catch {
        if (request_seq !== this.refresh_entry_gems_seq) return;
        const list = gem_paths.map((gem_path) => ({
          $path: gem_path,
        }));
        this.entry_gems_list = this.prepareEntryGemsList(list);
      } finally {
        if (request_seq === this.refresh_entry_gems_seq) {
          this.entry_gems_loading = false;
        }
      }
    },
    prepareEntryGemsList(list) {
      const sorted = sortSelectionGems(list);
      sorted.forEach((gem) => this.ensureGemsInventoryPricingFields(gem));
      return sorted;
    },
    gem_is_already_in_selection(gem) {
      const gp = gem?.$path;
      if (!gp) return true;
      return this.selection_gem_paths.includes(gp);
    },
    async pickGem(gem) {
      const gp = gem?.$path;
      if (!gp || this.gem_is_already_in_selection(gem) || this.picker_busy)
        return;
      this.picker_busy = true;
      try {
        if (this.is_box_type) {
          await assignGemToBox({
            api: this.$api,
            gem_path: gp,
            new_box_folder_path: this.selection_folder_path,
          });
          this.notifyGemAdded();
        } else {
          const status_result = await addGemToSelectionEntries({
            api: this.$api,
            selection_path: this.selection_folder_path,
            selection_folder: this.selection_folder,
            gem_path: gp,
          });
          this.notifyGemAdded(status_result);
        }
      } catch (err) {
        const c = err && err.code;
        if (c === "not_a_box_selection")
          this.$alertify.delay(4000).error(this.$t("sg_error_not_a_box"));
        else
          this.$alertify.delay(4000).error(c || this.$t("sg_could_not_save"));
        this.pending_entry_gems_refresh = false;
      } finally {
        this.picker_busy = false;
        await this.flushPendingEntryGemsRefresh();
      }
    },
    async confirmRemoveEntry(gem_path) {
      const cleaned_path = this.cleanString(gem_path);
      if (!this.can_edit || !cleaned_path) return;
      const removed_slug = this.gem_slug_from_path(cleaned_path);
      this.picker_busy = true;
      try {
        const status_result = await removeGemFromSelection({
          api: this.$api,
          selection_path: this.selection_folder_path,
          selection_folder: this.selection_folder,
          gem_path: cleaned_path,
        });
        this.notifyGemStatusOnRemove(status_result);
        if (removed_slug) {
          this.$emit("gemRemovedFromSelection", removed_slug);
        }
      } catch (err) {
        const code = err && err.code;
        console.error("confirmRemoveEntry", err);
        this.$alertify.delay(4000).error(code || this.$t("sg_could_not_save"));
        this.pending_entry_gems_refresh = false;
      } finally {
        this.picker_busy = false;
        await this.flushPendingEntryGemsRefresh();
      }
    },
    confirmRemoveGemRow(gem) {
      const p = gem?.$path;
      if (!p) return;
      if (this.selection_gem_paths.includes(p)) this.confirmRemoveEntry(p);
    },
    onEntryRowClick(gem) {
      const slug = this.gem_slug_from_path(gem?.$path);
      if (!slug) return;
      this.$emit("entryRowClick", slug);
    },
    getFieldConfig(metadata_key, gem) {
      const configs = buildGemFieldConfigs(this.$t.bind(this));
      return configs[metadata_key] || null;
    },
    isFieldEditable(metadata_key) {
      if (!this.can_edit) return false;
      if (metadata_key === "id" || metadata_key === "$cover") return false;
      const config = this.getFieldConfig(metadata_key, {});
      return config !== null && !config.readonly;
    },
    onTableEditCell({ gem, metadata_key }) {
      this.openCellEditModal(gem, metadata_key);
    },
    openCellEditModal(gem, metadata_key) {
      if (!this.can_edit) return;
      const field_config = this.getFieldConfig(metadata_key, gem);
      if (!field_config || field_config.readonly) return;
      const raw_value = this.gemFieldDisplayValue(gem, field_config);
      this.editing_current_value =
        raw_value !== undefined && raw_value !== null && raw_value !== ""
          ? raw_value
          : raw_value === 0
          ? 0
          : "";
      this.editing_gem = gem;
      this.editing_field = field_config;
    },
    onFieldSaved({ key, value, changes, paired_gem_partner_updates }) {
      if (!this.editing_gem) return;
      const gem_path = this.editing_gem.$path;
      let scroll_metadata_key =
        key != null && String(key).trim() !== "" ? String(key) : "";
      if (gem_linear_dimension_keys.includes(scroll_metadata_key)) {
        scroll_metadata_key = gem_dimensions_merged_column_key;
      }
      const index = this.entry_gems_list.findIndex((g) => g.$path === gem_path);
      if (index !== -1) {
        const target_gem = this.entry_gems_list[index];
        const next_changes =
          changes && typeof changes === "object" ? changes : { [key]: value };
        Object.keys(next_changes).forEach((change_key) => {
          this.$set(target_gem, change_key, next_changes[change_key]);
        });
        this.ensureGemPricingFields(target_gem);
      }
      applyPairedGemPartnerUpdates(
        this.entry_gems_list,
        paired_gem_partner_updates,
        this.$set.bind(this)
      );
      this.editing_gem = null;
      this.editing_field = null;
      if (gem_path && scroll_metadata_key) {
        this.$nextTick(() => {
          this.$refs.entries_gems_table?.scrollGemCellIntoView({
            gem_path,
            metadata_key: scroll_metadata_key,
          });
        });
      }
    },
  },
};
</script>

<style lang="scss" scoped>
._entriesTableShell {
  position: relative;
  // display: flex;
  // flex-direction: column;
  // min-height: 0;
  // height: min(70vh, 720px);
  // max-height: min(70vh, 720px);
  overflow: hidden;

  > *:not(._entriesReloadOverlay) {
    flex: 1;
    min-height: 0;
  }
}

._entriesReloadOverlay {
  position: absolute;
  inset: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: center;
  background: color-mix(in srgb, var(--c-bodybg) 70%, transparent);
  pointer-events: all;
}

._entriesReloadMessage {
  margin: 0;
  padding: calc(var(--spacing) * 0.55) calc(var(--spacing) * 0.9);
  border-radius: 8px;
  background: var(--c-bodybg);
  box-shadow: 0 2px 14px color-mix(in srgb, var(--c-noir) 10%, transparent);
  font-size: var(--sl-font-size-small);
  font-weight: 600;
  color: var(--c-gris_fonce);
}

._hint {
  margin: 0;
  color: var(--c-gris_fonce);
  font-size: var(--sl-font-size-small);
}

._entriesSortHint {
  margin: 0 0 calc(var(--spacing) * 0.75);
  color: var(--c-gris_fonce);
  font-size: var(--sl-font-size-x-small);
}
</style>
