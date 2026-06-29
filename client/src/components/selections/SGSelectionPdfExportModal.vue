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

      <div class="_pricingRow">
        <label class="_pricingLabel" for="pdf_pricing_select">
          {{ $t("sg_pdf_export_pricing_line") }}
        </label>
        <select
          id="pdf_pricing_select"
          v-model="selected_pricing_key"
          class="_pricingSelect"
          @change="onPricingChange"
        >
          <option value="">{{ $t("sg_pdf_export_no_pricing") }}</option>
          <option
            v-for="pricing_key in pricing_options"
            :key="pricing_key"
            :value="pricing_key"
          >
            {{ pricingLabel(pricing_key) }}
          </option>
        </select>
      </div>

      <label class="_toggleRow">
        <input v-model="show_details_block" type="checkbox" />
        <span>{{ $t("sg_pdf_export_show_details") }}</span>
      </label>

      <div class="_columnsHeader">
        <span>{{ $t("sg_pdf_export_columns_title") }}</span>
        <span class="_columnCounter">
          {{ column_units_used }} / {{ selection_pdf_max_column_units }}
        </span>
      </div>

      <div class="_columnsList">
        <label
          v-for="metadata_key in all_metadata_keys"
          :key="metadata_key"
          class="_columnItem"
        >
          <input
            type="checkbox"
            :checked="enabled_metadata_keys.includes(metadata_key)"
            :disabled="isColumnToggleDisabled(metadata_key)"
            @change="toggleColumn(metadata_key, $event)"
          />
          <span>{{ columnLabel(metadata_key) }}</span>
          <span
            v-if="metadata_key === selection_pdf_photo_column_key"
            class="_photoHint"
          >
            (×{{ selection_pdf_photo_column_units }})
          </span>
        </label>
      </div>
    </div>

    <template slot="footer">
      <button type="button" class="u-button" @click="onClose">
        {{ export_done || is_exporting ? $t("close") : $t("cancel") }}
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
  canAddSelectionPdfColumn,
  countSelectionPdfColumnUnits,
  normalizeSelectionPdfColumnKeys,
  selection_pdf_column_picker_excluded_keys,
  selection_pdf_max_column_units,
  selection_pdf_photo_column_key,
  selection_pdf_photo_column_units,
  selection_pdf_prefs_localstorage_key,
  resolveSelectionPdfExportPrefs,
} from "@/utils/selection_pdf_columns.js";
import {
  selectionPdfExportDefaults,
} from "@/utils/selection_pdf_export_registry.js";
import {
  findSelectionMainDocumentFile,
  selectionTypeHasMainDocument,
} from "@/utils/selection_documents.js";
import {
  normalizeSelectionGemPaths,
  sortSelectionGems,
} from "@/utils/selection_entries.js";
import { parseSelectionFolderParam } from "@/utils/selection_urls.js";
import { gems_table_column_picker_excluded_keys } from "@/utils/gems_table_metadata.js";
import {
  gem_dimensions_merged_column_key,
  gem_linear_dimension_keys,
} from "@/mixins/GemDimensions";

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
      selected_pricing_key:
        activeSelectionPdfPricingKey(resolved.metadata_keys) ||
        selectionPdfExportDefaults(this.selection?.selection_type)
          .default_pricing_key ||
        "",
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
      pricing_options: gem_pricing_total_column_keys.filter(
        (key) => key !== "pvd_asking_price"
      ),
    };
  },
  computed: {
    folder_slug() {
      const parsed = parseSelectionFolderParam(this.selection_path);
      return parsed.folder_slug || "";
    },
    all_metadata_keys() {
      const ignored = new Set([
        ...gems_table_column_picker_excluded_keys,
        ...selection_pdf_column_picker_excluded_keys,
        "status",
      ]);
      const known_order = [
        "id",
        "$cover",
        "reference_supplier",
        "reference_customer",
        "number_of_pieces",
        "stone_type",
        "weight_ct",
        "color",
        "shape",
        "origin_country",
        "treatment_type",
        "dimensions_lwh",
        "base_price_pcb",
        "purchased_price_pa",
        "pv_selling_price",
        "pc_to",
        "pf_invoiced_price",
      ];
      const key_set = new Set(["id", "$cover"]);
      this.entry_gems_list.forEach((gem) => {
        Object.keys(gem || {}).forEach((key) => {
          if (ignored.has(key)) return;
          if (key.startsWith("$") && key !== "$cover") return;
          key_set.add(key);
        });
      });
      const has_dims = this.entry_gems_list.some((gem) =>
        gem_linear_dimension_keys.some((dk) =>
          Object.prototype.hasOwnProperty.call(gem || {}, dk)
        )
      );
      if (has_dims) key_set.add(gem_dimensions_merged_column_key);
      return Array.from(key_set).sort((a, b) => {
        const ai = known_order.indexOf(a);
        const bi = known_order.indexOf(b);
        const ar = ai === -1 ? Number.MAX_SAFE_INTEGER : ai;
        const br = bi === -1 ? Number.MAX_SAFE_INTEGER : bi;
        if (ar !== br) return ar - br;
        return a.localeCompare(b);
      });
    },
    column_units_used() {
      return countSelectionPdfColumnUnits(this.enabled_metadata_keys);
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
    pricingLabel(pricing_key) {
      return this.columnLabel(pricing_key);
    },
    isColumnToggleDisabled(metadata_key) {
      if (this.enabled_metadata_keys.includes(metadata_key)) return false;
      return !canAddSelectionPdfColumn(
        this.enabled_metadata_keys,
        metadata_key
      );
    },
    toggleColumn(metadata_key, event) {
      const checked = event?.target?.checked === true;
      let keys = [...this.enabled_metadata_keys];
      if (checked) {
        if (!canAddSelectionPdfColumn(keys, metadata_key)) return;
        keys.push(metadata_key);
      } else {
        keys = keys.filter((key) => key !== metadata_key);
      }
      this.enabled_metadata_keys = normalizeSelectionPdfColumnKeys(keys);
      this.selected_pricing_key =
        activeSelectionPdfPricingKey(this.enabled_metadata_keys) || "";
    },
    onPricingChange() {
      const pricing_key = String(this.selected_pricing_key || "").trim();
      if (!pricing_key) {
        this.enabled_metadata_keys = this.enabled_metadata_keys.filter(
          (key) => !gem_pricing_total_column_keys.includes(key)
        );
        return;
      }
      this.enabled_metadata_keys = applySelectionPdfPricingKey(
        this.enabled_metadata_keys,
        pricing_key
      );
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

._pricingRow {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: calc(var(--spacing) / 2);
}

._pricingLabel {
  font-weight: 600;
}

._pricingSelect {
  min-width: 220px;
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
  align-items: center;
  font-weight: 600;
  margin-top: calc(var(--spacing) / 2);
}

._columnCounter {
  font-weight: 400;
  color: var(--c-gris_fonce);
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
