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

      <label class="_toggleRow">
        <input v-model="show_details_block" type="checkbox" />
        <span>{{ $t("sg_pdf_export_show_details") }}</span>
      </label>

      <div class="_columnsHeader">
        <div class="_columnsHeaderMain">
          <span>{{ $t("sg_pdf_export_columns_title") }}</span>
          <span class="_columnLimitHint">
            {{
              $t("sg_pdf_export_columns_limit_hint", {
                max: selection_pdf_max_column_units,
                photo_units: selection_pdf_photo_column_units,
              })
            }}
          </span>
        </div>
        <span
          class="_columnCounter"
          :class="{ _columnCounter_limit: is_column_limit_reached }"
        >
          {{
            $t("sg_pdf_export_columns_counter", {
              used: column_units_used,
              max: selection_pdf_max_column_units,
            })
          }}
        </span>
      </div>
      <p v-if="is_column_limit_reached" class="_columnLimitNotice">
        {{ $t("sg_pdf_export_columns_limit_reached") }}
      </p>

      <div class="_columnsList">
        <label
          v-for="metadata_key in all_metadata_keys"
          :key="metadata_key"
          class="_columnItem"
          :class="{ _columnItem_disabled: isColumnToggleDisabled(metadata_key) }"
        >
          <input
            type="checkbox"
            :checked="enabled_metadata_keys.includes(metadata_key)"
            :disabled="isColumnToggleDisabled(metadata_key)"
            @change="toggleColumn(metadata_key, $event)"
          />
          <span>{{ columnLabel(metadata_key) }}</span>
          <span
            v-if="isColumnEmpty(metadata_key)"
            class="_columnEmptyMark"
            :title="column_empty_legend_text"
          >*</span>
          <span
            v-if="metadata_key === selection_pdf_photo_column_key"
            class="_photoHint"
          >
            (×{{ selection_pdf_photo_column_units }})
          </span>
        </label>
      </div>
      <p v-if="show_column_empty_legend" class="_columnEmptyLegend">
        <span class="_columnEmptyMark">*</span>
        {{ column_empty_legend_text }}
      </p>
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
        :disabled="enabled_metadata_keys.length === 0 || gems_loading"
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
import GemPricing from "@/mixins/GemPricing";
import { buildGemFieldConfigs } from "@/components/gems/gem_field_configs";
import { gem_pricing_total_column_keys } from "@/mixins/GemPricing.js";
import {
  applySelectionPdfPricingKey,
  activeSelectionPdfPricingKey,
  buildSelectionPdfPickerMetadataKeys,
  canAddSelectionPdfColumn,
  countSelectionPdfColumnUnits,
  normalizeSelectionPdfColumnKeys,
  selection_pdf_max_column_units,
  selection_pdf_photo_column_key,
  selection_pdf_photo_column_units,
  selection_pdf_prefs_localstorage_key,
  resolveSelectionPdfExportPrefs,
} from "@/utils/selection_pdf_columns.js";
import {
  findSelectionMainDocumentFile,
  selectionTypeHasMainDocument,
} from "@/utils/selection_documents.js";
import {
  normalizeSelectionGemPaths,
  sortSelectionGems,
} from "@/utils/selection_entries.js";
import { parseSelectionFolderParam } from "@/utils/selection_urls.js";
import { countGemsWithFilledTableColumnValue } from "@/utils/gems_table_metadata.js";

export default {
  name: "SGSelectionPdfExportModal",
  mixins: [Medias, GemPricing],
  components: {},
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
    const stored = this.readStoredPrefs();
    const resolved = resolveSelectionPdfExportPrefs(
      this.selection?.selection_type,
      stored
    );
    return {
      gems_root_path: "gems",
      entry_gems_list: [],
      gems_loading: false,
      enabled_metadata_keys: resolved.metadata_keys,
      show_details_block: resolved.show_details_block,
      is_exporting: false,
      export_done: false,
      task_progress: 0,
      created_doc: null,
      fail_message: "",
      previous_main_document_path: "",
      is_setting_main_document: false,
      is_main_document_set: false,
      selection_pdf_max_column_units,
      selection_pdf_photo_column_key,
      selection_pdf_photo_column_units,
    };
  },
  computed: {
    folder_slug() {
      const parsed = parseSelectionFolderParam(this.selection_path);
      return parsed.folder_slug || "";
    },
    all_metadata_keys() {
      return buildSelectionPdfPickerMetadataKeys(this.entry_gems_list).filter(
        (metadata_key) => metadata_key !== "pvd_asking_price"
      );
    },
    column_units_used() {
      return countSelectionPdfColumnUnits(this.enabled_metadata_keys);
    },
    is_column_limit_reached() {
      return (
        this.column_units_used >= this.selection_pdf_max_column_units
      );
    },
    show_column_empty_legend() {
      if (this.gems_loading) return false;
      if (this.entry_gems_list.length === 0) return true;
      return this.all_metadata_keys.some((metadata_key) =>
        this.isColumnEmpty(metadata_key)
      );
    },
    column_empty_legend_text() {
      if (this.entry_gems_list.length === 0) {
        return this.$t("sg_pdf_export_column_no_stones");
      }
      return this.$t("sg_pdf_export_column_empty");
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
    await this.loadEntryGems();
  },
  methods: {
    readStoredPrefs() {
      try {
        const raw = localStorage.getItem(selection_pdf_prefs_localstorage_key);
        return raw ? JSON.parse(raw) : null;
      } catch {
        return null;
      }
    },
    persistPrefs() {
      try {
        localStorage.setItem(
          selection_pdf_prefs_localstorage_key,
          JSON.stringify({
            metadata_keys: this.enabled_metadata_keys,
            show_details_block: this.show_details_block,
          })
        );
      } catch {
        /* ignore */
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
      const configs = buildGemFieldConfigs(this.$t.bind(this));
      if (metadata_key === "id") return this.$t("sg_pdf_col_ref");
      if (metadata_key === "$cover") return this.$t("sg_pdf_col_photo");
      return configs[metadata_key]?.label || metadata_key;
    },
    isPricingColumn(metadata_key) {
      return gem_pricing_total_column_keys.includes(metadata_key);
    },
    isColumnEmpty(metadata_key) {
      if (this.gems_loading) return false;
      if (this.entry_gems_list.length === 0) return true;
      return (
        countGemsWithFilledTableColumnValue(
          this.entry_gems_list,
          metadata_key
        ) === 0
      );
    },
    isColumnToggleDisabled(metadata_key) {
      if (this.enabled_metadata_keys.includes(metadata_key)) return false;
      if (
        this.isPricingColumn(metadata_key) &&
        activeSelectionPdfPricingKey(this.enabled_metadata_keys)
      ) {
        return false;
      }
      return !canAddSelectionPdfColumn(
        this.enabled_metadata_keys,
        metadata_key
      );
    },
    toggleColumn(metadata_key, event) {
      const checked = event?.target?.checked === true;
      let keys = [...this.enabled_metadata_keys];
      if (checked) {
        if (this.isPricingColumn(metadata_key)) {
          keys = applySelectionPdfPricingKey(keys, metadata_key);
        } else if (!canAddSelectionPdfColumn(keys, metadata_key)) {
          return;
        } else {
          keys.push(metadata_key);
        }
      } else {
        keys = keys.filter((key) => key !== metadata_key);
      }
      this.enabled_metadata_keys = normalizeSelectionPdfColumnKeys(keys);
    },
    buildSuggestedFilename() {
      const slug = this.folder_slug || "selection";
      const date = new Date().toISOString().slice(0, 10);
      const type_part = this.type_slug || "export";
      return `${type_part}-${slug}-${date}`;
    },
    async startExport() {
      if (!this.folder_slug || this.is_exporting) return;
      this.persistPrefs();

      const instructions = {
        recipe: "pdf",
        page_width: 210,
        page_height: 297,
        layout_mode: "print",
        suggested_file_name: this.buildSuggestedFilename(),
        selection_pdf_export: {
          metadata_keys: this.enabled_metadata_keys,
          show_details_block: this.show_details_block,
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

._toggleRow {
  display: flex;
  align-items: flex-start;
  gap: calc(var(--spacing) / 3);
  cursor: pointer;
}

._columnsHeader {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: calc(var(--spacing) / 2);
  font-weight: 600;
  margin-top: calc(var(--spacing) / 2);
}

._columnsHeaderMain {
  display: flex;
  flex-direction: column;
  gap: calc(var(--spacing) / 4);
  min-width: 0;
}

._columnLimitHint {
  font-weight: 400;
  font-size: 0.85rem;
  color: var(--c-gris_fonce);
}

._columnCounter {
  flex-shrink: 0;
  font-weight: 600;
  color: var(--c-gris_fonce);
}

._columnCounter_limit {
  color: var(--c-rouge, #c00);
}

._columnLimitNotice {
  margin: calc(var(--spacing) / 4) 0 0;
  font-size: 0.85rem;
  color: var(--c-rouge, #c00);
  line-height: 1.3;
}

._columnsList {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: calc(var(--spacing) / 3);
  max-height: 280px;
  overflow-y: auto;
  padding: calc(var(--spacing) / 2);
  border: 1px solid var(--c-gris_clair);
  border-radius: 4px;
}

._columnItem {
  display: flex;
  align-items: center;
  gap: calc(var(--spacing) / 4);
  cursor: pointer;
}

._columnItem_disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

._columnEmptyMark {
  color: var(--c-gris_fonce);
  font-weight: 600;
  line-height: 1;
}

._columnEmptyLegend {
  margin: calc(var(--spacing) / 3) 0 0;
  font-size: 0.8rem;
  color: var(--c-gris_fonce);
  font-style: italic;
  line-height: 1.3;
}

._photoHint {
  font-size: 0.85em;
  color: var(--c-gris_fonce);
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
