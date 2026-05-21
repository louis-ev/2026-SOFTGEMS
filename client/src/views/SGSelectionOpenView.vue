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

          <SGSectionPanel
            section_id="selection_notes"
            :title="$t('sg_selection_notes')"
          >
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

          <SGSelectionGemsSection
            v-if="selection_folder_path"
            :key="selection_folder_path"
            :selection_folder_path="selection_folder_path"
            :selection_folder="selection"
            :can_edit="can_edit"
            :selected_gem_id="side_panel_gem_id"
            :is_gem_open="is_gem_side_panel_open"
            @entryRowClick="onSelectionEntryRowClick"
            @gemRemovedFromSelection="onGemRemovedFromSelection"
          />

          <SGSelectionFilesSection
            :selection_path="selection_folder_path"
            :selection_folder="selection"
            :can_edit="can_edit"
          />

          <SGFolderMetaPeek :folder_meta="selection" />
        </div>
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
import SGEditableMetaField from "@/components/softgems/SGEditableMetaField.vue";
import SGFolderMetaPeek from "@/components/softgems/SGFolderMetaPeek.vue";
import SGSectionPanel from "@/components/softgems/SGSectionPanel.vue";
import SGSelectionFilesSection from "@/components/selections/SGSelectionFilesSection.vue";
import SGSelectionGemsSection from "@/components/selections/SGSelectionGemsSection.vue";
import SGOverlaySidePanelLayout from "@/components/softgems/SGOverlaySidePanelLayout.vue";
import SGGemOpenView from "@/views/SGGemOpenView.vue";
import SectionAnchorScrollMixin from "@/mixins/SectionAnchorScrollMixin.js";
import { selectionTypeLabel as selectionTypeLabelFn } from "@/utils/selection_types.js";
import {
  parseSelectionPathParam,
  selectionDetailPath,
  selectionTitleSlugMatches,
} from "@/utils/selection_urls.js";
export default {
  name: "SGSelectionOpenView",
  mixins: [SectionAnchorScrollMixin],
  components: {
    RemoveMenu2,
    SGEditableMetaField,
    SGFolderMetaPeek,
    SGSectionPanel,
    SGSelectionFilesSection,
    SGSelectionGemsSection,
    SGOverlaySidePanelLayout,
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
      is_loading: false,
      fetch_error: "",
      joined_selection_folder_path: "",
      edited_internal_name: "",
      edited_notes: "",
      selection_edit_modal: null,
      is_saving_internal_name: false,
      is_saving_notes: false,
      show_remove_modal: false,
      side_panel_gem_id: "",
    };
  },
  computed: {
    selection() {
      const path = this.selection_folder_path;
      if (!path) return null;
      return this.$api.store[path] || null;
    },
    is_gem_side_panel_open() {
      return Boolean(this.cleanString(this.side_panel_gem_id));
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
  },
  watch: {
    folder_slug: {
      immediate: false,
      handler(new_slug, old_slug) {
        if (new_slug === old_slug) return;
        this.onSelectionFolderChanged(new_slug, old_slug);
      },
    },
    selection: {
      handler(v) {
        if (!v) return;
        this.edited_internal_name =
          typeof v.internal_name === "string" ? v.internal_name : "";
        this.edited_notes = typeof v.notes === "string" ? v.notes : "";
        this.replaceDetailUrlIfStale();
      },
      immediate: true,
    },
  },
  async created() {
    this.joinSelectionRoom(this.selection_folder_path);
    await this.ensureSelectionLoaded();
  },
  beforeDestroy() {
    this.leaveSelectionRoom();
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
    joinSelectionRoom(path_raw) {
      const path = this.cleanString(path_raw);
      if (!path || this.joined_selection_folder_path === path) return;
      this.leaveSelectionRoom();
      this.$api.join({ room: path });
      this.joined_selection_folder_path = path;
    },
    leaveSelectionRoom() {
      if (!this.joined_selection_folder_path) return;
      this.$api.leave({ room: this.joined_selection_folder_path });
      this.joined_selection_folder_path = "";
    },
    async onSelectionFolderChanged() {
      this.closeEditModal();
      this.side_panel_gem_id = "";
      this.fetch_error = "";
      this.joinSelectionRoom(this.selection_folder_path);
      await this.ensureSelectionLoaded();
    },
    async ensureSelectionLoaded() {
      if (!this.folder_slug) {
        this.fetch_error = this.$t("sg_selection_invalid_path");
        return;
      }

      if (this.selection) {
        this.fetch_error = "";
        if (this.selection && !this.fetch_error) {
          this.scrollToRouteSectionAnchorAfterLoad();
        }
        return;
      }

      this.is_loading = true;
      this.fetch_error = "";
      try {
        await this.$api.getFolder({ path: this.selection_folder_path });
      } catch ({ code }) {
        this.fetch_error = code || this.$t("sg_could_not_load_selection");
      } finally {
        this.is_loading = false;
        if (this.selection && !this.fetch_error) {
          this.scrollToRouteSectionAnchorAfterLoad();
        }
      }
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
        this.closeEditModal();
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
        this.closeEditModal();
      } catch ({ code }) {
        this.$alertify.delay(4000).error(code || this.$t("sg_could_not_save"));
      } finally {
        this.is_saving_notes = false;
      }
    },
    onSelectionEntryRowClick(gem_id) {
      this.side_panel_gem_id = gem_id;
    },
    onGemRemovedFromSelection(gem_id) {
      if (gem_id && this.side_panel_gem_id === gem_id) {
        this.side_panel_gem_id = "";
      }
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

</style>
