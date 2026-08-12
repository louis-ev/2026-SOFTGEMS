<template>
  <BaseModal2
    :size="modal_size"
    @close="onClose"
  >
    <template slot="title">
      <h2>
        <template v-if="selection_display_name && export_type_slug">
          {{ selection_display_name }} ({{ export_type_slug }})
          {{ $t("sg_pdf_export_modal_title_export_suffix") }}
        </template>
        <template v-else-if="export_type_slug">
          ({{ export_type_slug }})
          {{ $t("sg_pdf_export_modal_title_export_suffix") }}
        </template>
        <template v-else>
          {{ $t("sg_pdf_export_modal_title_fallback") }}
        </template>
      </h2>
    </template>
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

      <div class="_pricingSection">
        <label class="_pricingLabel" for="pdf-export-language-select">
          {{ $t("sg_pdf_export_language") }}
        </label>
        <SGSelectField
          id="pdf-export-language-select"
          :value="selected_export_lang"
          :options="language_select_options"
          :allow_empty="false"
          @input="selected_export_lang = $event"
        />
      </div>

      <div class="_pricingSection">
        <label class="_pricingLabel" for="pdf-export-pricing-select">
          {{ $t("sg_pdf_export_pricing_line") }}
        </label>
        <SGSelectField
          id="pdf-export-pricing-select"
          :value="selected_pricing_key"
          :options="pricing_select_options"
          :allow_empty="true"
          :empty_label="$t('sg_pdf_export_no_pricing')"
          @input="selected_pricing_key = $event"
        />
      </div>

      <div v-if="has_pricing_selected" class="_vatRow">
        <ToggleInput
          :label="$t('sg_pdf_export_show_vat')"
          :content="selected_show_vat"
          @update:content="selected_show_vat = $event"
        />
        <label class="_vatPercentField" for="pdf-export-vat-percent">
          <input
            id="pdf-export-vat-percent"
            v-model.number="selected_vat_percent"
            class="u-input _vatPercentInput"
            type="number"
            min="0"
            max="100"
            step="0.1"
            :disabled="!selected_show_vat"
            @change="onVatPercentChange"
          />
          <span aria-hidden="true">%</span>
        </label>
      </div>

      <div v-if="has_pricing_selected" class="_pricingSection">
        <ToggleInput
          :label="$t('sg_pdf_export_show_payment_line')"
          :content="selected_show_payment_line"
          @update:content="selected_show_payment_line = $event"
        />
      </div>

      <SGSelectionPdfBankFootersEditor
        v-if="has_pricing_selected"
        :presets="bank_footer_presets_draft"
        :selected_id="selected_bank_footer_id"
        :can_edit="can_edit_bank_footer"
        @update:presets="onBankFooterPresetsUpdate"
        @update:selected_id="selected_bank_footer_id = $event"
      />

      <section class="_customsSection">
        <div class="_customsSectionHeader">
          <span>{{ $t("sg_pdf_export_customs_summary_title") }}</span>
        </div>
        <ToggleInput
          :label="$t('sg_pdf_export_show_customs_summary')"
          :content="selected_show_customs_summary"
          @update:content="selected_show_customs_summary = $event"
        />
      </section>
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
import {
  buildSelectionPdfColumnKeys,
  defaultSelectionPdfShowPaymentLine,
  defaultSelectionPdfShowVat,
  normalizeSelectionPdfVatPercent,
  selection_pdf_default_vat_percent,
  selection_pdf_pricing_label_keys,
  SELECTION_PDF_PRICING_OPTION_KEYS,
  selectionPdfExportPricingKey,
} from "@/utils/selection_pdf_export_registry.js";
import SGSelectionPdfBankFootersEditor from "@/components/selections/SGSelectionPdfBankFootersEditor.vue";
import SGSelectField from "@/components/softgems/SGSelectField.vue";
import ToggleInput from "@/adc-core/inputs/ToggleInput.vue";
import {
  SELECTION_PDF_BANK_FOOTER_EN,
  SELECTION_PDF_BANK_FOOTER_NONE_ID,
  coerceSelectionPdfBankFooterSelection,
  isSelectionPdfBankFooterNoneId,
  readSelectionPdfBankFootersEn,
} from "@/utils/selection_pdf_instance_settings.js";
import {
  readSelectionPdfExportPrefs,
  writeSelectionPdfExportPrefs,
} from "@/utils/selection_pdf_export_prefs.js";
import {
  findSelectionMainDocumentFile,
  selectionTypeHasMainDocument,
} from "@/utils/selection_documents.js";
import { selectionFolderSlugFromPath, resolveSelectionType, selectionMembershipTypeSlug } from "@/utils/selection_paths.js";
import {
  SELECTION_PDF_DEFAULT_LANG,
  normalizeSelectionPdfLang,
} from "@/utils/selection_pdf_strings.js";

export default {
  name: "SGSelectionPdfExportModal",
  mixins: [Medias, Authors],
  components: {
    SGSelectionPdfBankFootersEditor,
    SGSelectField,
    ToggleInput,
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
      selected_bank_footer_id: SELECTION_PDF_BANK_FOOTER_NONE_ID,
      is_saving_bank_footer: false,
      bank_footer_save_pending: false,
      selected_pricing_key: "",
      selected_export_lang: SELECTION_PDF_DEFAULT_LANG,
      selected_show_vat: false,
      selected_vat_percent: selection_pdf_default_vat_percent,
      selected_show_payment_line: true,
      selected_show_customs_summary: false,
    };
  },
  computed: {
    selection_display_name() {
      if (!this.selection || this.selection.internal_name == null) return "";
      return String(this.selection.internal_name).trim();
    },
    /** Type path slug (e.g. `memo-in`), shown in the modal title. */
    export_type_slug() {
      const from_prop = String(this.type_slug || "").trim();
      if (from_prop) return from_prop;
      return selectionMembershipTypeSlug(this.selection) || "";
    },
    language_select_options() {
      return [
        {
          value: "en",
          label: this.$t("sg_pdf_export_language_en"),
        },
        {
          value: "fr",
          label: this.$t("sg_pdf_export_language_fr"),
        },
      ];
    },
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
      return selectionFolderSlugFromPath(this.selection_folder_path);
    },
    export_column_keys() {
      const pricing_key = String(this.selected_pricing_key || "").trim();
      return buildSelectionPdfColumnKeys(pricing_key || null);
    },
    has_pricing_selected() {
      return Boolean(String(this.selected_pricing_key || "").trim());
    },
    pricing_select_options() {
      return SELECTION_PDF_PRICING_OPTION_KEYS.map((pricing_key) => ({
        value: pricing_key,
        label: this.$t(
          selection_pdf_pricing_label_keys[pricing_key] || pricing_key
        ),
      }));
    },
    export_currency() {
      return String(this.selection?.currency || "USD").trim() || "USD";
    },
    show_main_document_option() {
      return (
        this.can_edit &&
        selectionTypeHasMainDocument(resolveSelectionType(this.selection))
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
    this.restoreExportOptions();
    this.previous_main_document_path =
      findSelectionMainDocumentFile(this.selection)?.$path || "";
    await this.loadInstanceSettings();
  },
  methods: {
    defaultPricingKeyValue() {
      const default_key = selectionPdfExportPricingKey(
        resolveSelectionType(this.selection)
      );
      return default_key ? String(default_key) : "";
    },
    defaultShowVatValue() {
      return defaultSelectionPdfShowVat(resolveSelectionType(this.selection));
    },
    defaultShowPaymentLineValue() {
      return defaultSelectionPdfShowPaymentLine(
        resolveSelectionType(this.selection)
      );
    },
    restoreExportOptions() {
      const prefs = readSelectionPdfExportPrefs(
        resolveSelectionType(this.selection)
      );
      this.selected_export_lang = prefs.lang;
      this.selected_pricing_key = prefs.pricing_key;
      this.selected_show_vat = prefs.show_vat;
      this.selected_vat_percent = prefs.vat_percent;
      this.selected_show_payment_line = prefs.show_payment_line;
      this.selected_show_customs_summary = prefs.show_customs_summary;
      this.selected_bank_footer_id = prefs.bank_footer_id;
    },
    persistExportOptions() {
      writeSelectionPdfExportPrefs(resolveSelectionType(this.selection), {
        lang: this.selected_export_lang,
        pricing_key: this.selected_pricing_key,
        show_vat: this.selected_show_vat,
        vat_percent: this.selected_vat_percent,
        show_payment_line: this.selected_show_payment_line,
        show_customs_summary: this.selected_show_customs_summary,
        bank_footer_id: this.selected_bank_footer_id,
      });
    },
    onVatPercentChange() {
      this.selected_vat_percent = normalizeSelectionPdfVatPercent(
        this.selected_vat_percent
      );
    },
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
    buildSuggestedFilename() {
      const slug = this.folder_slug || "selection";
      const date = new Date().toISOString().slice(0, 10);
      const type_part = this.type_slug || "export";
      const lang = normalizeSelectionPdfLang(this.selected_export_lang);
      return `${type_part}-${slug}-${lang}-${date}`;
    },
    async startExport() {
      if (!this.folder_slug || this.is_exporting) return;

      await this.saveBankFootersIfDirty();
      this.persistExportOptions();

      const instructions = {
        recipe: "pdf",
        page_width: 210,
        page_height: 297,
        layout_mode: "print",
        suggested_file_name: this.buildSuggestedFilename(),
        selection_pdf_export: {
          metadata_keys: this.export_column_keys,
          bank_footer_id:
            this.has_pricing_selected &&
            !isSelectionPdfBankFooterNoneId(this.selected_bank_footer_id)
              ? this.selected_bank_footer_id
              : SELECTION_PDF_BANK_FOOTER_NONE_ID,
          lang: normalizeSelectionPdfLang(this.selected_export_lang),
          show_vat:
            this.has_pricing_selected && this.selected_show_vat === true,
          vat_percent: normalizeSelectionPdfVatPercent(
            this.selected_vat_percent
          ),
          show_payment_line:
            this.has_pricing_selected &&
            this.selected_show_payment_line === true,
          show_customs_summary: this.selected_show_customs_summary === true,
        },
        additional_meta: {
          is_selection_generated_pdf: true,
          is_selection_attachment: false,
          is_selection_main_document: false,
        },
      };

      this.is_exporting = true;
      this.fail_message = "";
      this.task_progress = 0;

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
              this.is_main_document_set = false;
              this.$emit("exported");
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
      this.is_main_document_set = false;
      // Keep last option values (also restored from localStorage on reopen).
      if (had_created_doc) {
        this.$emit("exported");
      }
    },
    onClose() {
      if (!this.is_exporting && !this.export_done) {
        this.persistExportOptions();
      }
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

._pricingSection {
  display: flex;
  flex-direction: column;
  gap: calc(var(--spacing) / 4);
}

._pricingLabel {
  font-weight: 600;
}

._vatRow {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: calc(var(--spacing) * 0.5);
}

._vatPercentField {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-weight: 600;
  white-space: nowrap;
}

._vatPercentInput {
  width: 4.5rem;
  padding: 0.2rem 0.35rem;
  text-align: right;
}

._customsSection {
  display: flex;
  flex-direction: column;
  gap: calc(var(--spacing) / 2);
  margin-top: calc(var(--spacing) / 2);
}

._customsSectionHeader {
  font-weight: 600;
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
