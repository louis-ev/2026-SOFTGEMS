<template>
  <div class="_selectionOpenViewRoot">
    <SGOverlaySidePanelLayout
      :panel_open="is_gem_side_panel_open"
      :panel_show_close_button="is_gem_side_panel_open"
      @close="closeGemSidePanel"
    >
      <section class="_selectionOpenView">
        <button
          type="button"
          class="u-button u-button_icon _closeButton"
          @click="goBack"
        >
          <b-icon icon="x-lg" />
        </button>

        <div class="_pageHeader">
          <div v-if="selection">
            <p class="_typeLine">
              {{ $t("sg_selection_type_label") }}:
              <strong>{{
                formatSelectionType(selection.selection_type)
              }}</strong>
            </p>
            <p class="_readonlyHint">{{ $t("sg_selection_type_readonly") }}</p>
            <div class="_headerMetaRow">
              <button
                type="button"
                class="u-buttonLink u-buttonLink_red"
                :disabled="!connected_as"
                :title="guest_action_hint"
                @click="show_remove_modal = true"
              >
                {{ $t("sg_remove_selection") }}
              </button>
            </div>
            <RemoveMenu2
              v-if="show_remove_modal"
              :path="selection_folder_path"
              :modal_title="
                $t('sg_remove_selection_confirm', { name: page_title })
              "
              :success_notification="$t('removed_successfully')"
              @removedSuccessfully="onRemovedSuccessfully"
              @close="show_remove_modal = false"
            />
          </div>
        </div>

        <div v-if="is_loading">{{ $t("sg_loading_selection") }}</div>
        <div v-else-if="fetch_error" class="u-errorMsg">{{ fetch_error }}</div>
        <div v-else-if="selection" class="_form">
          <div class="_titleBlock">
            <h1 class="_pageTitle">{{ page_title }}</h1>
          </div>

          <SGSectionPanel
            section_id="selection_identity"
            :title="$t('sg_section_contact_identity')"
          >
            <div>
              <SGEditableMetaField
                ref="internal_name_field"
                :label="$t('sg_selection_internal_name')"
                icon="pencil"
                :value="edited_internal_name"
                :modal_open="
                  !!(
                    selection_edit_modal &&
                    selection_edit_modal.kind === 'internal_name'
                  )
                "
                :modal_title="edit_modal_title"
                :modal_is_loading="is_saving_internal_name"
                :meta_text="internal_name_meta_text"
                @presentClick="openInternalNameModal"
                @close="closeEditModal"
                @save="onEditModalSave"
                @draftChange="onEditDraftChange"
              />
            </div>
          </SGSectionPanel>

          <SGSectionPanel section_id="selection_notes" :title="$t('sg_selection_notes')">
            <div>
              <SGEditableMetaField
                :label="$t('sg_selection_notes')"
                icon="journal-text"
                :value="edited_notes"
                :modal_open="
                  !!(
                    selection_edit_modal &&
                    selection_edit_modal.kind === 'notes'
                  )
                "
                :modal_title="edit_modal_title"
                :modal_is_loading="is_saving_notes"
                :meta_text="notes_meta_text"
                @presentClick="openNotesModal"
                @close="closeEditModal"
                @save="onEditModalSave"
                @draftChange="onEditDraftChange"
              />
            </div>
          </SGSectionPanel>

          <SGSectionPanel section_id="selection_entries" :title="$t('sg_selection_entries')">
            <template #actions>
              <button
                v-if="can_edit"
                type="button"
                class="u-button u-button_verysmall u-button_bleuvert"
                @click="openPickGems"
              >
                {{ $t("sg_selection_add_gems") }}
              </button>
            </template>
            <p v-if="sorted_entries.length === 0" class="_hint">
              {{ $t("sg_selection_entries_empty") }}
            </p>
            <p v-else-if="entry_gems_loading" class="_hint">
              {{ $t("sg_loading_gems") }}
            </p>
            <div v-else class="_entriesTableShell">
              <SGGemsTable
                :gems="entry_gems_list"
                :inventory_has_gems="entry_gems_list.length > 0"
                :metadata_keys="pick_metadata_keys"
                :metadata_labels="pick_metadata_labels"
                :metadata_icons="pick_metadata_icons"
                :field_editable_map="pick_field_editable_map"
                :selected_gem_id="side_panel_gem_id"
                :is_gem_open="is_gem_side_panel_open"
                view_density="compact"
                :cover_can_edit="false"
                :gems_page_size="50"
                :append_column="can_edit"
                @rowClick="onSelectionEntriesRowClick"
              >
                <template #appendCell="{ gem }">
                  <button
                    type="button"
                    class="u-buttonLink u-buttonLink_red"
                    @click.stop="confirmRemoveGemRow(gem)"
                  >
                    {{ $t("sg_selection_remove_gem") }}
                  </button>
                </template>
              </SGGemsTable>
            </div>
          </SGSectionPanel>

          <SGSelectionFilesSection
            :selection_path="selection_folder_path"
            :selection_folder="selection"
            :can_edit="can_edit"
            @changed="fetchSelection"
          />
        </div>

        <BaseModal2
          v-if="pick_gems_open"
          :title="$t('sg_selection_add_gems_title')"
          size="x-large"
          @close="onClosePickGemsModal"
        >
          <p class="_pickGemsHint">
            {{ $t("sg_selection_pick_gems_table_hint") }}
          </p>
          <div v-if="is_loading_gems" class="_hint">
            {{ $t("sg_loading_gems") }}
          </div>
          <template v-else>
            <div class="_gemsSearchBar">
              <SearchInput
                v-model="gems_quick_search"
                :search_placeholder="$t('sg_gems_search_placeholder')"
                :name="'selection_pick_gems_search'"
              />
            </div>
            <p
              v-if="gems_quick_search_filter_caption"
              class="_gemsActiveFilters"
              role="status"
            >
              {{ gems_quick_search_filter_caption }}
            </p>
            <div class="_pickerTableShell">
              <SGGemsTable
                :gems="filtered_gems"
                :inventory_has_gems="pick_gems_inventory.length > 0"
                :metadata_keys="pick_metadata_keys"
                :metadata_labels="pick_metadata_labels"
                :metadata_icons="pick_metadata_icons"
                :field_editable_map="pick_field_editable_map"
                selected_gem_id=""
                :is_gem_open="false"
                view_density="compact"
                :cover_can_edit="false"
                :disabled_row_paths="pick_disabled_row_paths"
                :gems_page_size="50"
                :selection_pick_column="true"
                @rowClick="onPickGemsTableRowClick"
              />
            </div>
          </template>
        </BaseModal2>
      </section>
      <template #panel>
        <SGGemOpenView
          v-if="side_panel_gem_id"
          :key="side_panel_gem_id"
          :gem_id="side_panel_gem_id"
          :panel_mode="true"
          @closePanel="closeGemSidePanel"
        />
      </template>
    </SGOverlaySidePanelLayout>
  </div>
</template>

<script>
import RemoveMenu2 from "@/adc-core/fields/RemoveMenu2.vue";
import BaseModal2 from "@/adc-core/modals/BaseModal2.vue";
import SGEditableMetaField from "@/components/softgems/SGEditableMetaField.vue";
import SGSectionPanel from "@/components/softgems/SGSectionPanel.vue";
import SGSelectionFilesSection from "@/components/selections/SGSelectionFilesSection.vue";
import SearchInput from "@/adc-core/inputs/SearchInput.vue";
import SGOverlaySidePanelLayout from "@/components/softgems/SGOverlaySidePanelLayout.vue";
import SGGemsTable from "@/components/gems/SGGemsTable.vue";
import SGGemOpenView from "@/views/SGGemOpenView.vue";
import GemsQuickSearchMixin from "@/mixins/GemsQuickSearchMixin.js";
import SectionAnchorScrollMixin from "@/mixins/SectionAnchorScrollMixin.js";
import {
  GEMS_PICKER_METADATA_KEYS,
  gemsPickerMetadataLabels,
  gemsPickerMetadataIcons,
} from "@/utils/gems_picker_metadata.js";
import { selectionTypeLabel as selectionTypeLabelFn } from "@/utils/selection_types.js";
import {
  parseSelectionPathParam,
  selectionDetailPath,
  selectionTitleSlugMatches,
} from "@/utils/selection_urls.js";
import { normalizeSelectionEntries } from "@/utils/selection_entries.js";
import {
  assignGemToBox,
  addGemToSelectionEntries,
  removeGemFromSelection,
} from "@/utils/assign_gem_to_box.js";

export default {
  name: "SGSelectionOpenView",
  mixins: [GemsQuickSearchMixin, SectionAnchorScrollMixin],
  components: {
    RemoveMenu2,
    BaseModal2,
    SGEditableMetaField,
    SGSectionPanel,
    SGSelectionFilesSection,
    SearchInput,
    SGOverlaySidePanelLayout,
    SGGemsTable,
    SGGemOpenView,
  },
  props: {
    selection_path: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      selections_root_path: "selections",
      gems_root_path: "gems",
      selection: null,
      is_loading: false,
      fetch_error: "",
      edited_internal_name: "",
      edited_notes: "",
      selection_edit_modal: null,
      is_saving_internal_name: false,
      is_saving_notes: false,
      show_remove_modal: false,
      pick_gems_open: false,
      pick_gems_inventory: [],
      is_loading_gems: false,
      picker_busy: false,
      entry_gems_list: [],
      entry_gems_loading: false,
      side_panel_gem_id: "",
    };
  },
  computed: {
    is_gem_side_panel_open() {
      return Boolean(this.cleanString(this.side_panel_gem_id));
    },
    gems() {
      return this.pick_gems_inventory;
    },
    pick_metadata_keys() {
      return [...GEMS_PICKER_METADATA_KEYS];
    },
    pick_metadata_labels() {
      return gemsPickerMetadataLabels(this.$t.bind(this));
    },
    pick_metadata_icons() {
      return gemsPickerMetadataIcons();
    },
    pick_field_editable_map() {
      return this.pick_metadata_keys.reduce((acc, key) => {
        acc[key] = false;
        return acc;
      }, {});
    },
    pick_disabled_row_paths() {
      return this.sorted_entries
        .map((e) => e.gem_path)
        .filter((p) => this.cleanString(p));
    },
    can_edit() {
      return !!this.connected_as;
    },
    guest_action_hint() {
      return this.can_edit ? "" : this.$t("sg_action_requires_account");
    },
    folder_slug() {
      const parsed = parseSelectionPathParam(this.selection_path);
      return parsed.folder_slug || "";
    },
    selection_folder_path() {
      if (!this.folder_slug) return "";
      return `${this.selections_root_path}/${this.folder_slug}`;
    },
    page_title() {
      if (!this.selection) return this.$t("sg_open_selection_title");
      const n = this.cleanString(this.selection.internal_name);
      if (n) return n;
      return this.$t("sg_open_selection_title");
    },
    stored_internal_name() {
      return this.selection && typeof this.selection.internal_name === "string"
        ? this.selection.internal_name
        : "";
    },
    stored_notes() {
      return this.selection && typeof this.selection.notes === "string"
        ? this.selection.notes
        : "";
    },
    is_box_type() {
      return String(this.selection?.selection_type || "") === "boîte";
    },
    edit_modal_title() {
      const m = this.selection_edit_modal;
      if (!m) return this.page_title;
      if (m.kind === "internal_name")
        return `${this.page_title} — ${this.$t("sg_selection_internal_name")}`;
      if (m.kind === "notes")
        return `${this.page_title} — ${this.$t("sg_selection_notes")}`;
      return this.page_title;
    },
    internal_name_meta_text() {
      return {
        meta_path: this.selection_folder_path,
        field_key: "internal_name",
        stored_value: this.stored_internal_name,
        is_saving: this.is_saving_internal_name,
        required: true,
        required_empty_hint: this.$t("sg_selection_name_required"),
        external_warning: "",
      };
    },
    notes_meta_text() {
      return {
        meta_path: this.selection_folder_path,
        field_key: "notes",
        stored_value: this.stored_notes,
        is_saving: this.is_saving_notes,
        required: false,
        required_empty_hint: "",
        external_warning: "",
      };
    },
    sorted_entries() {
      const raw = normalizeSelectionEntries(this.selection?.selection_entries);
      return raw.slice().sort((a, b) => {
        const ai = typeof a.sort_index === "number" ? a.sort_index : 0;
        const bi = typeof b.sort_index === "number" ? b.sort_index : 0;
        return ai - bi;
      });
    },
  },
  watch: {
    selection_path: {
      immediate: false,
      handler() {
        this.load();
      },
    },
    selection: {
      handler(v) {
        if (!v) return;
        this.edited_internal_name =
          typeof v.internal_name === "string" ? v.internal_name : "";
        this.edited_notes = typeof v.notes === "string" ? v.notes : "";
      },
      immediate: true,
    },
  },
  async created() {
    await this.load();
    if (this.selection_folder_path)
      this.$api.join({ room: this.selection_folder_path });
  },
  beforeDestroy() {
    if (this.selection_folder_path)
      this.$api.leave({ room: this.selection_folder_path });
  },
  methods: {
    formatSelectionType(v) {
      return selectionTypeLabelFn(this.$t.bind(this), v);
    },
    goBack() {
      this.$router.push("/selections");
    },
    onRemovedSuccessfully() {
      this.show_remove_modal = false;
      this.goBack();
    },
    cleanString(value) {
      if (value === null || value === undefined) return "";
      return String(value).trim();
    },
    async load() {
      await this.fetchSelection();
    },
    replaceDetailUrlIfStale() {
      if (!this.selection || !this.folder_slug) return;
      const name = this.cleanString(this.selection.internal_name);
      const parsed = parseSelectionPathParam(this.selection_path);
      if (selectionTitleSlugMatches(name, parsed.title_slug)) return;
      const next_path = selectionDetailPath({
        folder_slug: this.folder_slug,
        internal_name: name,
      });
      if (this.$route.path !== next_path) this.$router.replace(next_path);
    },
    async fetchSelection() {
      if (!this.folder_slug) {
        this.fetch_error = this.$t("sg_selection_invalid_path");
        this.selection = null;
        return;
      }
      this.is_loading = true;
      this.fetch_error = "";
      try {
        this.selection = await this.$api.getFolder({
          path: this.selection_folder_path,
        });
        this.replaceDetailUrlIfStale();
        await this.refreshEntryGems();
      } catch ({ code }) {
        this.fetch_error = code || this.$t("sg_could_not_load_selection");
        this.selection = null;
      } finally {
        this.is_loading = false;
        if (this.selection && !this.fetch_error) {
          this.scrollToRouteSectionAnchorAfterLoad();
        }
      }
    },
    openInternalNameModal() {
      if (!this.can_edit) return;
      this.selection_edit_modal = { kind: "internal_name" };
    },
    openNotesModal() {
      if (!this.can_edit) return;
      this.selection_edit_modal = { kind: "notes" };
    },
    closeEditModal() {
      this.selection_edit_modal = null;
    },
    onEditDraftChange() {},
    async onEditModalSave({ value }) {
      const modal = this.selection_edit_modal;
      if (!modal) return;
      const raw = typeof value === "string" ? value : "";
      if (modal.kind === "internal_name") {
        this.edited_internal_name = raw;
        await this.persistInternalName();
      } else if (modal.kind === "notes") {
        this.edited_notes = raw;
        await this.persistNotes();
      }
    },
    async persistInternalName() {
      const trimmed = this.cleanString(this.edited_internal_name);
      if (!trimmed) return;
      if (this.is_saving_internal_name) return;
      this.is_saving_internal_name = true;
      try {
        await this.$api.updateMeta({
          path: this.selection_folder_path,
          new_meta: { internal_name: trimmed },
        });
        this.selection = await this.$api.getFolder({
          path: this.selection_folder_path,
        });
        this.closeEditModal();
        this.replaceDetailUrlIfStale();
        this.$alertify.delay(3000).success(this.$t("sg_internal_name_saved"));
      } catch ({ code }) {
        this.$alertify.delay(4000).error(code || this.$t("sg_could_not_save"));
      } finally {
        this.is_saving_internal_name = false;
      }
    },
    async persistNotes() {
      if (this.is_saving_notes) return;
      this.is_saving_notes = true;
      try {
        await this.$api.updateMeta({
          path: this.selection_folder_path,
          new_meta: { notes: this.edited_notes },
        });
        this.selection = await this.$api.getFolder({
          path: this.selection_folder_path,
        });
        this.closeEditModal();
      } catch ({ code }) {
        this.$alertify.delay(4000).error(code || this.$t("sg_could_not_save"));
      } finally {
        this.is_saving_notes = false;
      }
    },
    gem_slug_from_path(path_raw) {
      const s = this.cleanString(path_raw);
      if (!s) return "";
      const parts = s.split("/");
      return parts[parts.length - 1] || "";
    },
    async refreshEntryGems() {
      if (!this.sorted_entries.length) {
        this.entry_gems_list = [];
        return;
      }
      this.entry_gems_loading = true;
      try {
        const list = [];
        for (const entry of this.sorted_entries) {
          try {
            const meta = await this.$api.getFolder({
              path: entry.gem_path,
              no_files: true,
            });
            list.push(meta);
          } catch {
            list.push({ $path: entry.gem_path });
          }
        }
        this.entry_gems_list = list;
      } finally {
        this.entry_gems_loading = false;
      }
    },
    async openPickGems() {
      if (!this.can_edit) return;
      this.gems_quick_search = "";
      this.gems_quick_search_debounced = "";
      if (this.gems_quick_search_debounce_timer_id !== null) {
        clearTimeout(this.gems_quick_search_debounce_timer_id);
        this.gems_quick_search_debounce_timer_id = null;
      }
      this.pick_gems_open = true;
      this.is_loading_gems = true;
      try {
        const rows = await this.$api.getFolders({ path: this.gems_root_path });
        this.pick_gems_inventory = Array.isArray(rows) ? rows : [];
      } catch {
        this.pick_gems_inventory = [];
      } finally {
        this.is_loading_gems = false;
      }
    },
    onClosePickGemsModal() {
      this.pick_gems_open = false;
    },
    onPickGemsTableRowClick(gem) {
      if (this.picker_busy) return;
      this.pickGem(gem);
    },
    gem_is_already_in_selection(gem) {
      const gp = gem?.$path;
      if (!gp) return true;
      return this.sorted_entries.some((e) => e.gem_path === gp);
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
        } else {
          await addGemToSelectionEntries({
            api: this.$api,
            selection_path: this.selection_folder_path,
            selection_folder: this.selection,
            gem_path: gp,
          });
        }
        await this.fetchSelection();
        this.$alertify
          .delay(2500)
          .success(this.$t("sg_selection_gems_updated"));
      } catch (err) {
        const c = err && err.code;
        if (c === "not_a_box_selection")
          this.$alertify.delay(4000).error(this.$t("sg_error_not_a_box"));
        else
          this.$alertify.delay(4000).error(c || this.$t("sg_could_not_save"));
      } finally {
        this.picker_busy = false;
      }
    },
    async confirmRemoveEntry(entry) {
      if (!this.can_edit || !entry?.gem_path) return;
      const removed_slug = this.gem_slug_from_path(entry.gem_path);
      this.picker_busy = true;
      try {
        await removeGemFromSelection({
          api: this.$api,
          selection_path: this.selection_folder_path,
          selection_folder: this.selection,
          gem_path: entry.gem_path,
        });
        await this.fetchSelection();
        if (removed_slug && this.side_panel_gem_id === removed_slug) {
          this.side_panel_gem_id = "";
        }
      } catch ({ code }) {
        this.$alertify.delay(4000).error(code || this.$t("sg_could_not_save"));
      } finally {
        this.picker_busy = false;
      }
    },
    confirmRemoveGemRow(gem) {
      const p = gem?.$path;
      if (!p) return;
      const entry = this.sorted_entries.find((e) => e.gem_path === p);
      if (entry) this.confirmRemoveEntry(entry);
    },
    onSelectionEntriesRowClick(gem) {
      const slug = this.gem_slug_from_path(gem?.$path);
      if (!slug) return;
      this.side_panel_gem_id = slug;
    },
    closeGemSidePanel() {
      this.side_panel_gem_id = "";
    },
  },
};
</script>

<style lang="scss" scoped>
._selectionOpenViewRoot {
  position: relative;
  height: 100%;
  min-height: 0;
}

._selectionOpenView {
  position: relative;
  height: 100%;
  min-height: 0;
  overflow-y: auto;
  box-sizing: border-box;
  padding: calc(var(--spacing) * 2) calc(var(--spacing) * 3);
}

._closeButton {
  position: absolute;
  top: 0;
  right: 0;
  z-index: 1000;
}

._pageHeader {
  margin-bottom: calc(var(--spacing) * 0.75);
}

._typeLine {
  margin: 0 0 calc(var(--spacing) / 4);
  font-size: var(--sl-font-size-small);
}

._readonlyHint {
  margin: 0 0 calc(var(--spacing) / 2);
  font-size: var(--sl-font-size-x-small);
  color: var(--c-gris_fonce);
}

._headerMetaRow {
  margin-bottom: calc(var(--spacing) * 0.75);
}

._pageTitle {
  margin: 0 0 calc(var(--spacing) * 1);
  font-size: 1.35rem;
}

._form {
  display: flex;
  flex-direction: column;
  gap: calc(var(--spacing) * 1.1);
}

._entriesTableShell {
  min-height: 0;
  max-height: min(70vh, 720px);
  overflow: auto;
}

._hint {
  margin: 0;
  color: var(--c-gris_fonce);
  font-size: var(--sl-font-size-small);
}

._pickGemsHint {
  margin: 0 0 calc(var(--spacing) * 0.75);
  color: var(--c-gris_fonce);
  font-size: var(--sl-font-size-small);
}

._gemsSearchBar {
  margin-bottom: calc(var(--spacing) * 0.75);
}

._gemsActiveFilters {
  margin: 0 0 calc(var(--spacing) * 0.75);
  font-size: var(--sl-font-size-x-small);
  color: var(--c-gris_fonce);
}

._pickerTableShell {
  max-height: min(70vh, 560px);
  overflow: auto;
  // border: 1px solid var(--c-gris_clair);
  // border-radius: 8px;
}
</style>
