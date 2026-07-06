<template>
  <BaseModal2
    :title="$t('sg_pdf_export_modal_title')"
    :size="modal_size"
    @close="onClose"
  >
    <div v-if="is_exporting" class="_exporting">
      <p>{{ $t("sg_pdf_export_in_progress") }}</p>
      <AnimatedCounter :value="task_progress" />
    </div>
    <div v-else-if="export_done" class="_done">
      <p v-if="fail_message" class="_fail">{{ fail_message }}</p>
      <template v-else-if="created_doc">
        <p class="_success">{{ success_message }}</p>
        <div v-if="export_href" class="_pdfPreview">
          <iframe
            :src="export_href"
            :title="created_doc.$media_filename"
            frameborder="0"
            type="application/pdf"
          >
            {{ $t("pdf_preview_not_supported") }}
          </iframe>
        </div>
      </template>
    </div>
    <div v-else class="_body">
      <p class="_instructions">{{ $t("sg_pdf_export_modal_instructions") }}</p>

      <div class="_columnsHeader">
        <span>{{ $t("sg_pdf_export_columns_title") }}</span>
      </div>
      <table class="_columnsList">
        <thead>
          <tr>
            <th class="_colNo">{{ $t("sg_pdf_col_no") }}</th>
            <th
              v-for="metadata_key in export_column_keys"
              :key="metadata_key"
              :class="columnClass(metadata_key)"
            >
              {{ columnLabel(metadata_key) }}
            </th>
          </tr>
        </thead>
      </table>

      <SGSelectionPdfBankFootersEditor
        :presets="bank_footer_presets_draft"
        :selected_id="selected_bank_footer_id"
        :can_edit="can_edit_bank_footer"
        @update:presets="onBankFooterPresetsUpdate"
        @update:selected_id="selected_bank_footer_id = $event"
      />
    </div>

    <template slot="footer">
      <button
        v-if="export_done && !is_exporting"
        type="button"
        class="u-button"
        @click="backToSettings"
      >
        <b-icon icon="arrow-left-short" />
        {{ $t("back") }}
      </button>
      <button
        v-else
        type="button"
        class="u-button"
        @click="onClose"
      >
        {{ is_exporting ? $t("close") : $t("cancel") }}
      </button>
      <a
        v-if="export_done && created_doc && export_href"
        :href="export_href"
        :download="created_doc.$media_filename"
        target="_blank"
        class="u-button u-button_bleuvert"
      >
        <b-icon icon="download" />
        {{ $t("download") }}
      </a>
      <button
        v-if="show_set_main_document_button"
        type="button"
        class="u-button u-button_bleuvert"
        :disabled="is_setting_main_document"
        @click="setAsMainDocument"
      >
        <b-icon icon="file-earmark-pdf" />
        {{ $t("sg_pdf_export_set_as_main_document") }}
      </button>
      <button
        v-if="!is_exporting && !export_done"
        type="button"
        class="u-button u-button_bleuvert"
        :disabled="gems_loading"
        @click="startExport"
      >
        <b-icon icon="file-earmark-pdf" />
        {{ $t("sg_pdf_export_generate") }}
      </button>
    </template>
  </BaseModal2>
</template>

<script>
import Medias from "@/mixins/Medias.js";
import Authors from "@/mixins/Authors.js";
import { gem_pricing_total_column_keys } from "@/mixins/GemPricing.js";
import {
  selection_pdf_description_column_key,
  selection_pdf_per_carat_column_key,
  selection_pdf_photo_column_key,
  selectionPdfColumnHeaderLabel,
} from "@/utils/selection_pdf_columns.js";
import { selectionPdfExportColumnKeys } from "@/utils/selection_pdf_export_registry.js";
import SGSelectionPdfBankFootersEditor from "@/components/selections/SGSelectionPdfBankFootersEditor.vue";
import {
  SELECTION_PDF_BANK_FOOTER_EN,
  coerceSelectionPdfBankFooterSelection,
  readSelectionPdfBankFootersEn,
} from "@/utils/selection_pdf_instance_settings.js";
import {
  findSelectionMainDocumentFile,
  selectionTypeHasMainDocument,
} from "@/utils/selection_documents.js";
import {
  normalizeSelectionGemPaths,
  sortSelectionGems,
} from "@/utils/selection_entries.js";
import { parseSelectionFolderParam } from "@/utils/selection_urls.js";

export default {
  name: "SGSelectionPdfExportModal",
  mixins: [Medias, Authors],
  components: {
    SGSelectionPdfBankFootersEditor,
  },
  props: {
    selection_folder_path: {
      type: String,
      required: true,
    },
    selection: {
      type: Object,
      required: true,
    },
    can_edit: {
      type: Boolean,
      default: false,
    },
    type_slug: {
      type: String,
      default: "",
    },
    selection_path: {
      type: String,
      default: "",
    },
  },
  data() {
    return {
      gems_root_path: "gems",
      entry_gems_list: [],
      gems_loading: false,
      is_exporting: false,
      export_done: false,
      task_progress: 0,
      created_doc: null,
      fail_message: "",
      previous_main_document_path: "",
      is_setting_main_document: false,
      is_main_document_set: false,
      instance_settings: null,
      bank_footer_presets_draft: [],
      bank_footer_presets_saved: [],
      selected_bank_footer_id: "",
      is_saving_bank_footer: false,
      bank_footer_save_pending: false,
    };
  },
  computed: {
    can_edit_bank_footer() {
      return this.is_instance_admin;
    },
    bank_footer_presets_dirty() {
      return (
        JSON.stringify(this.bank_footer_presets_draft) !==
        JSON.stringify(this.bank_footer_presets_saved)
      );
    },
    folder_slug() {
      const parsed = parseSelectionFolderParam(this.selection_path);
      return parsed.folder_slug || "";
    },
    export_column_keys() {
      return selectionPdfExportColumnKeys(this.selection?.selection_type);
    },
    export_currency() {
      return String(this.selection?.currency || "USD").trim() || "USD";
    },
    show_main_document_option() {
      return (
        this.can_edit &&
        selectionTypeHasMainDocument(this.selection?.selection_type)
      );
    },
    has_main_document() {
      return Boolean(findSelectionMainDocumentFile(this.selection));
    },
    show_set_main_document_button() {
      return (
        this.export_done &&
        this.created_doc &&
        this.show_main_document_option &&
        !this.is_main_document_set
      );
    },
    success_message() {
      if (this.is_main_document_set) {
        return this.$t("sg_pdf_export_main_document_set");
      }
      return this.$t("sg_pdf_export_success");
    },
    export_href() {
      if (!this.created_doc) return "";
      return this.makeMediaFileURL({
        $path: this.created_doc.$path,
        $media_filename: this.created_doc.$media_filename,
      });
    },
    modal_size() {
      return this.export_done && this.created_doc && this.export_href
        ? "x-large"
        : "large";
    },
  },
  async created() {
    this.previous_main_document_path =
      findSelectionMainDocumentFile(this.selection)?.$path || "";
    await Promise.all([this.loadEntryGems(), this.loadInstanceSettings()]);
  },
  methods: {
    async loadInstanceSettings() {
      let presets = readSelectionPdfBankFootersEn(
        this.$root?.app_infos?.instance_meta
      );
      try {
        this.instance_settings = await this.$api.getFolder({ path: "." });
        presets = readSelectionPdfBankFootersEn(this.instance_settings);
      } catch {
        if (!this.instance_settings) {
          this.instance_settings = this.$root?.app_infos?.instance_meta || null;
          presets = readSelectionPdfBankFootersEn(this.instance_settings);
        }
      }
      this.applyBankFooterPresets(presets);
    },
    applyBankFooterPresets(presets) {
      const list = Array.isArray(presets)
        ? presets.map((preset) => ({ ...preset }))
        : [];
      this.bank_footer_presets_draft = list;
      this.bank_footer_presets_saved = list.map((preset) => ({ ...preset }));
      this.selected_bank_footer_id = coerceSelectionPdfBankFooterSelection(
        list,
        this.selected_bank_footer_id
      );
    },
    onBankFooterPresetsUpdate(presets) {
      this.bank_footer_presets_draft = Array.isArray(presets)
        ? presets.map((preset) => ({ ...preset }))
        : [];
      this.selected_bank_footer_id = coerceSelectionPdfBankFooterSelection(
        this.bank_footer_presets_draft,
        this.selected_bank_footer_id
      );
      this.saveBankFootersIfDirty();
    },
    async saveBankFootersIfDirty() {
      if (!this.can_edit_bank_footer || !this.bank_footer_presets_dirty) return;
      if (this.is_saving_bank_footer) {
        this.bank_footer_save_pending = true;
        return;
      }
      await this.saveBankFooters();
      if (this.bank_footer_save_pending) {
        this.bank_footer_save_pending = false;
        await this.saveBankFootersIfDirty();
      }
    },
    async saveBankFooters() {
      if (!this.can_edit_bank_footer || this.is_saving_bank_footer) return;
      if (!this.bank_footer_presets_dirty) return;
      this.is_saving_bank_footer = true;
      const presets_to_save = this.bank_footer_presets_draft.map((preset) => ({
        ...preset,
      }));
      try {
        await this.$api.updateMeta({
          path: ".",
          new_meta: {
            [SELECTION_PDF_BANK_FOOTER_EN]: presets_to_save,
          },
        });
        this.bank_footer_presets_saved = presets_to_save.map((preset) => ({
          ...preset,
        }));
        if (this.instance_settings) {
          this.$set(
            this.instance_settings,
            SELECTION_PDF_BANK_FOOTER_EN,
            presets_to_save
          );
        }
        if (this.$root?.app_infos?.instance_meta) {
          this.$set(
            this.$root.app_infos.instance_meta,
            SELECTION_PDF_BANK_FOOTER_EN,
            presets_to_save
          );
        }
      } catch (err) {
        console.error("saveBankFooters failed", err);
        this.$alertify
          .delay(4000)
          .error(err?.code || this.$t("sg_could_not_save"));
      } finally {
        this.is_saving_bank_footer = false;
      }
    },
    async loadEntryGems() {
      const gem_paths = normalizeSelectionGemPaths(
        this.selection?.selection_entries
      );
      if (!gem_paths.length) {
        this.entry_gems_list = [];
        return;
      }
      this.gems_loading = true;
      try {
        const folder_slugs = gem_paths.map((p) => p.split("/").pop());
        const { folders } = await this.$api.getFoldersBySlugs({
          path: this.gems_root_path,
          folder_slugs,
          no_files: true,
        });
        const by_path = Object.fromEntries(
          folders.map((meta) => [meta.$path, meta])
        );
        this.entry_gems_list = sortSelectionGems(
          gem_paths.map((p) => by_path[p] || { $path: p })
        );
      } catch {
        this.entry_gems_list = gem_paths.map((p) => ({ $path: p }));
      } finally {
        this.gems_loading = false;
      }
    },
    columnLabel(metadata_key) {
      return selectionPdfColumnHeaderLabel(metadata_key, this.export_currency);
    },
    columnClass(metadata_key) {
      if (metadata_key === selection_pdf_photo_column_key) return "_colPhoto";
      if (metadata_key === selection_pdf_description_column_key) {
        return "_colDescription";
      }
      if (
        metadata_key === selection_pdf_per_carat_column_key ||
        gem_pricing_total_column_keys.includes(metadata_key)
      ) {
        return "_colPrice";
      }
      if (metadata_key === "number_of_pieces" || metadata_key === "weight_ct") {
        return "_colNumeric";
      }
      return "_colDefault";
    },
    buildSuggestedFilename() {
      const slug = this.folder_slug || "selection";
      const date = new Date().toISOString().slice(0, 10);
      const type_part = this.type_slug || "export";
      return `${type_part}-${slug}-${date}`;
    },
    async startExport() {
      if (!this.folder_slug || this.is_exporting) return;

      await this.saveBankFootersIfDirty();

      const instructions = {
        recipe: "pdf",
        page_width: 210,
        page_height: 297,
        layout_mode: "print",
        suggested_file_name: this.buildSuggestedFilename(),
        selection_pdf_export: {
          metadata_keys: this.export_column_keys,
          bank_footer_id: this.selected_bank_footer_id,
        },
        additional_meta: {
          is_selection_generated_pdf: true,
          is_selection_attachment: false,
          is_selection_main_document: false,
        },
      };

      this.is_exporting = true;
      this.fail_message = "";

      try {
        const task_id = await this.$api.exportFolder({
          path: this.selection_folder_path,
          instructions,
        });
        this.$api.join({ room: "task_" + task_id });

        const onProgress = ({ task_id: id, progress }) => {
          if (id !== task_id) return;
          this.task_progress = progress;
        };
        this.$eventHub.$on("task.status", onProgress);

        await new Promise((resolve) => {
          const onEnded = async ({ task_id: id, event, message }) => {
            if (id !== task_id) return;
            this.$eventHub.$off("task.ended", onEnded);
            this.$eventHub.$off("task.status", onProgress);
            this.$api.leave({ room: "task_" + task_id });

            if (event === "completed") {
              this.created_doc = message.file;
            } else {
              this.fail_message =
                event === "failed"
                  ? `${this.$t("sg_pdf_export_failed")} : ${message || ""}`
                  : this.$t("sg_pdf_export_failed");
            }
            resolve();
          };
          this.$eventHub.$on("task.ended", onEnded);
        });
      } catch ({ code }) {
        this.fail_message = code || this.$t("sg_pdf_export_failed");
      } finally {
        this.is_exporting = false;
        this.export_done = true;
      }
    },
    async setAsMainDocument() {
      if (
        !this.created_doc?.$path ||
        this.is_setting_main_document ||
        this.is_main_document_set
      ) {
        return;
      }

      if (
        this.has_main_document &&
        this.previous_main_document_path &&
        this.previous_main_document_path !== this.created_doc.$path &&
        !window.confirm(this.$t("sg_pdf_export_replace_main_document_warning"))
      ) {
        return;
      }

      this.is_setting_main_document = true;
      try {
        await this.$api.updateMeta({
          path: this.created_doc.$path,
          new_meta: {
            is_selection_main_document: true,
            is_selection_attachment: false,
          },
        });

        if (
          this.previous_main_document_path &&
          this.previous_main_document_path !== this.created_doc.$path
        ) {
          try {
            await this.$api.deleteItem({
              path: this.previous_main_document_path,
            });
          } catch {
            /* previous main doc may already be gone */
          }
        }

        this.is_main_document_set = true;
        this.previous_main_document_path = this.created_doc.$path;
        this.created_doc = {
          ...this.created_doc,
          is_selection_main_document: true,
          is_selection_attachment: false,
        };
        this.$emit("exported");
      } catch ({ code }) {
        this.$alertify.delay(4000).error(code || this.$t("sg_could_not_save"));
      } finally {
        this.is_setting_main_document = false;
      }
    },
    backToSettings() {
      const had_created_doc = Boolean(this.created_doc);
      this.export_done = false;
      this.fail_message = "";
      this.task_progress = 0;
      this.created_doc = null;
      if (had_created_doc) {
        this.$emit("exported");
      }
    },
    onClose() {
      this.$emit("close");
      if (this.export_done && this.created_doc) {
        this.$emit("exported");
      }
    },
  },
};
</script>

<style lang="scss" scoped>
._body {
  display: flex;
  flex-direction: column;
  gap: calc(var(--spacing) * 0.75);
}

._instructions {
  margin: 0;
  color: var(--c-gris_fonce);
}

._columnsHeader {
  font-weight: 600;
  margin-top: calc(var(--spacing) / 2);
}

._columnsList {
  width: 100%;
  margin: calc(var(--spacing) / 3) 0 0;
  border-collapse: collapse;
  table-layout: fixed;
}

._columnsList th {
  border: 1px solid #333;
  padding: 0.35rem 0.4rem;
  vertical-align: middle;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  background: #f4f4f4;
  word-break: break-word;
}

._colNo {
  width: 2.5rem;
  text-align: center;
}

._colPhoto {
  width: 3.5rem;
  text-align: center;
}

._colDescription {
  width: auto;
}

._colPrice,
._colNumeric {
  width: 3.5rem;
  text-align: right;
}

._colDefault {
  width: 2.75rem;
  text-align: center;
}

._exporting,
._done {
  padding: calc(var(--spacing) * 0.5) 0;
}

._fail {
  color: var(--c-rouge, #c00);
}

._success {
  margin: 0 0 calc(var(--spacing) / 2);
}

._pdfPreview {
  width: 100%;
  height: min(72vh, 820px);
  min-height: 360px;
  border: 1px solid var(--c-gris_clair);
  border-radius: 4px;
  overflow: hidden;
  background: white;

  iframe {
    display: block;
    width: 100%;
    height: 100%;
    border: none;
  }
}
</style>
