<template>
  <div class="_selectionOpenViewRoot">
    <SGOverlaySidePanelLayout
      :panel_open="is_gem_side_panel_open"
      @close="closeGemSidePanel"
    >
      <section class="_selectionOpenView">
        <div v-if="is_loading">{{ $t("sg_loading_selection") }}</div>
        <div v-else-if="fetch_error" class="u-errorMsg">{{ fetch_error }}</div>
        <div v-else-if="selection" class="_form">
          <header class="_pageHeading">
            <div class="_titleRow">
              <div class="_titleGroup">
                <div class="_titleLine">
                  <h1
                    class="_pageTitle"
                    :class="{ _pageTitle_editable: can_edit }"
                    :title="
                      can_edit ? $t('sg_selection_edit_name_hint') : undefined
                    "
                    :tabindex="can_edit ? 0 : undefined"
                    @click="openInternalNameModal"
                    @keydown.enter.prevent="openInternalNameModal"
                    @keydown.space.prevent="openInternalNameModal"
                  >
                    {{ page_title }}
                  </h1>
                  <span class="_selectionType">{{
                    formatSelectionType(selection.selection_type)
                  }}</span>
                </div>
                <SGFolderModificationsHistory
                  :folder_path="selection_folder_path"
                  :folder_meta="selection"
                  history_kind="selection"
                />
              </div>
              <div class="_headingActions">
                <button
                  v-if="show_pdf_export"
                  type="button"
                  class="u-button u-button_black"
                  @click="show_pdf_export_modal = true"
                >
                  <b-icon icon="file-earmark-pdf" />
                  {{ $t("sg_pdf_export_button") }}
                </button>
                <DropDown v-if="can_edit" :show_label="false" :right="true">
                  <button
                    type="button"
                    class="u-buttonLink u-buttonLink_red"
                    @click="show_remove_modal = true"
                  >
                    <b-icon icon="trash" />
                    {{ $t("sg_remove_selection") }}
                  </button>
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
                </DropDown>
              </div>
            </div>
          </header>

          <div class="_internalNameEditorHost" aria-hidden="true">
            <SGEditableMetaField
              ref="internal_name_field"
              :label="$t('sg_selection_name')"
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

          <SGSelectionMainDocumentSection
            v-if="show_main_document && selection_folder_path"
            :selection_folder_path="selection_folder_path"
            :selection="selection"
            :can_edit="can_edit"
            @changed="refreshSelectionFolder"
          />

          <SGSelectionHeaderFieldsSection
            v-if="selection_folder_path && selection"
            :selection_folder_path="selection_folder_path"
            :selection="selection"
            :can_edit="can_edit"
            :page_title="page_title"
          />

          <SGSelectionBuyingInvoiceFieldsSection
            v-if="selection_folder_path && selection"
            :selection_folder_path="selection_folder_path"
            :selection="selection"
            :can_edit="can_edit"
            :page_title="page_title"
          />

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

          <SGSelectionGeneratedPdfsSection
            v-if="selection"
            :selection_folder="selection"
            :can_edit="can_edit"
            @changed="refreshSelectionFolder"
          />

          <SGSelectionFilesSection
            :selection_path="selection_folder_path"
            :selection_folder="selection"
            :can_edit="can_edit"
            @changed="refreshSelectionFolder"
          />

          <SGFolderMetaPeek :folder_meta="selection" />
        </div>

        <SGSelectionPdfExportModal
          v-if="show_pdf_export_modal && selection_folder_path && selection"
          :selection_folder_path="selection_folder_path"
          :selection="selection"
          :can_edit="can_edit"
          :type_slug="type_slug"
          :selection_path="selection_path"
          @close="show_pdf_export_modal = false"
          @exported="onPdfExported"
        />
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
import SGFolderModificationsHistory from "@/components/softgems/SGFolderModificationsHistory.vue";
import SGSelectionFilesSection from "@/components/selections/SGSelectionFilesSection.vue";
import SGSelectionGeneratedPdfsSection from "@/components/selections/SGSelectionGeneratedPdfsSection.vue";
import SGSelectionPdfExportModal from "@/components/selections/SGSelectionPdfExportModal.vue";
import SGSelectionGemsSection from "@/components/selections/SGSelectionGemsSection.vue";
import SGSelectionHeaderFieldsSection from "@/components/selections/SGSelectionHeaderFieldsSection.vue";
import SGSelectionBuyingInvoiceFieldsSection from "@/components/selections/SGSelectionBuyingInvoiceFieldsSection.vue";
import SGSelectionMainDocumentSection from "@/components/selections/SGSelectionMainDocumentSection.vue";
import { selectionTypeHasMainDocument } from "@/utils/selection_documents.js";
import SGOverlaySidePanelLayout from "@/components/softgems/SGOverlaySidePanelLayout.vue";
import SGGemOpenView from "@/views/SGGemOpenView.vue";
import SectionAnchorScrollMixin from "@/mixins/SectionAnchorScrollMixin.js";
import { selectionSlugFromType } from "@/utils/selection_type_registry.js";
import { selectionTypeLabel as selectionTypeLabelFn } from "@/utils/selection_types.js";
import { selectionPdfExportEnabled } from "@/utils/selection_pdf_export_registry.js";
import {
  parseSelectionFolderParam,
  selectionDetailPath,
  selectionListPath,
  selectionTitleSlugMatches,
} from "@/utils/selection_urls.js";
export default {
  name: "SGSelectionOpenView",
  mixins: [SectionAnchorScrollMixin],
  components: {
    RemoveMenu2,
    SGEditableMetaField,
    SGFolderMetaPeek,
    SGFolderModificationsHistory,
    SGSelectionFilesSection,
    SGSelectionGeneratedPdfsSection,
    SGSelectionPdfExportModal,
    SGSelectionGemsSection,
    SGSelectionHeaderFieldsSection,
    SGSelectionBuyingInvoiceFieldsSection,
    SGSelectionMainDocumentSection,
    SGOverlaySidePanelLayout,
    SGGemOpenView,
  },
  props: {
    type_slug: {
      type: String,
      required: true,
    },
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
      selection_edit_modal: null,
      is_saving_internal_name: false,
      show_remove_modal: false,
      show_pdf_export_modal: false,
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
    folder_slug() {
      const parsed = parseSelectionFolderParam(this.selection_path);
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
    show_main_document() {
      return selectionTypeHasMainDocument(this.selection?.selection_type);
    },
    show_pdf_export() {
      return (
        this.connected_as &&
        selectionPdfExportEnabled(this.selection?.selection_type)
      );
    },
    edit_modal_title() {
      return `${this.page_title} — ${this.$t("sg_selection_name")}`;
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
      this.$router.push(selectionListPath(this.type_slug));
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
      const parsed = parseSelectionFolderParam(this.selection_path);
      if (selectionTitleSlugMatches(name, parsed.title_slug)) return;
      const resolved_type_slug =
        this.type_slug || selectionSlugFromType(this.selection.selection_type);
      const next_path = selectionDetailPath({
        type_slug: resolved_type_slug,
        folder_slug: this.folder_slug,
        internal_name: name,
        selection_type: this.selection.selection_type,
      });
      if (this.$route.path !== next_path) this.$router.replace(next_path);
    },
    openInternalNameModal() {
      if (!this.can_edit) return;
      this.selection_edit_modal = { kind: "internal_name" };
    },
    closeEditModal() {
      this.selection_edit_modal = null;
    },
    onEditDraftChange() {},
    async onEditModalSave({ value }) {
      const modal = this.selection_edit_modal;
      if (!modal) return;
      const raw = typeof value === "string" ? value : "";
      this.edited_internal_name = raw;
      await this.persistInternalName();
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
    async refreshSelectionFolder() {
      if (!this.selection_folder_path) return;
      try {
        await this.$api.getFolder({ path: this.selection_folder_path });
      } catch {
        /* folder refresh is best-effort */
      }
    },
    async onPdfExported() {
      await this.refreshSelectionFolder();
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

._pageHeading {
  margin-bottom: calc(var(--spacing) * 0.5);
}

._titleRow {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: calc(var(--spacing) * 0.75);
}

._headingActions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: calc(var(--spacing) / 2);
}

._titleGroup {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: calc(var(--spacing) * 0.35);
  min-width: 0;
}

._titleLine {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: calc(var(--spacing) * 0.65);
  min-width: 0;
}

._pageTitle {
  margin: 0;
}

._pageTitle_editable {
  cursor: pointer;
}

._pageTitle_editable:hover,
._pageTitle_editable:focus-visible {
  text-decoration: underline;
  text-underline-offset: 0.15em;
}

._internalNameEditorHost {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

._selectionType {
  font-size: 0.95rem;
  font-weight: 400;
  color: var(--c-gris_fonce);
  line-height: 1.2;
}

._form {
  display: flex;
  flex-direction: column;
  gap: calc(var(--spacing) * 1.1);
}
</style>
