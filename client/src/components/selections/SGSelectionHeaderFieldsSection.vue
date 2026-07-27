<template>
  <SGSectionPanel
    section_id="selection_header_fields"
    :title="$t('sg_section_selection_header')"
  >
    <div class="_fieldsGrid">
      <SGEditableMetaField
        :label="$t('sg_selection_document_number_name')"
        icon="file-earmark-text"
        :value="selection.document_number_name"
        :readonly="!can_edit"
        :modal_open="active_field === 'document_number_name'"
        :modal_title="
          field_modal_title($t('sg_selection_document_number_name'))
        "
        :modal_is_loading="is_saving_field === 'document_number_name'"
        :meta_text="document_number_name_meta_text"
        @presentClick="openField('document_number_name')"
        @close="closeField"
        @save="onMetaTextSave"
      />

      <SGEditableMetaField
        :label="$t('sg_selection_date')"
        icon="calendar3"
        :value="display_selection_date"
        :readonly="!can_edit"
        :modal_open="active_field === 'selection_date'"
        :modal_title="field_modal_title($t('sg_selection_date'))"
        :modal_is_loading="is_saving_field === 'selection_date'"
        :editor_component="date_editor_component"
        :editor_props="date_editor_props"
        @presentClick="openField('selection_date')"
        @close="closeField"
        @save="onDateSave"
      />

      <SGEditableMetaField
        :label="$t('sg_selection_counterparty')"
        icon="people"
        :value="counterparty_display"
        :readonly="!can_edit"
        :modal_open="active_field === 'counterparty_path'"
        :modal_title="field_modal_title($t('sg_selection_counterparty'))"
        :modal_is_loading="is_saving_field === 'counterparty_path'"
        :editor_component="counterparty_editor_component"
        :editor_props="counterparty_editor_props"
        @presentClick="openField('counterparty_path')"
        @close="closeField"
        @save="onCounterpartySave"
      />

      <SGEditableMetaField
        :label="$t('sg_selection_reference_number')"
        icon="hash"
        :value="selection.reference_number"
        :readonly="!can_edit"
        :modal_open="active_field === 'reference_number'"
        :modal_title="field_modal_title($t('sg_selection_reference_number'))"
        :modal_is_loading="is_saving_field === 'reference_number'"
        :meta_text="reference_meta_text"
        @presentClick="openField('reference_number')"
        @close="closeField"
        @save="onMetaTextSave"
      />

      <SGEditableMetaField
        :label="$t('sg_selection_currency')"
        icon="tag"
        :value="selection.currency"
        :readonly="!can_edit"
        :modal_open="active_field === 'currency'"
        :modal_title="field_modal_title($t('sg_selection_currency'))"
        :modal_is_loading="is_saving_field === 'currency'"
        :meta_text="currency_meta_text"
        @presentClick="openField('currency')"
        @close="closeField"
        @save="onMetaTextSave"
      />
    </div>
  </SGSectionPanel>
</template>

<script>
import SGEditableMetaField from "@/components/softgems/SGEditableMetaField.vue";
import SGSectionPanel from "@/components/softgems/SGSectionPanel.vue";
import SGDateFieldEditor from "@/components/softgems/SGDateFieldEditor.vue";
import FormatDates from "@/mixins/FormatDates.js";
import SGSelectionCounterpartyEditor from "@/components/selections/SGSelectionCounterpartyEditor.vue";
import { resolveAddressBookPathLabel } from "@/utils/address_book_paths.js";
import { toDateInputValue, toStoredCalendarDate } from "@/utils/date_input.js";

export default {
  name: "SGSelectionHeaderFieldsSection",
  mixins: [FormatDates],
  components: {
    SGEditableMetaField,
    SGSectionPanel,
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
    page_title: {
      type: String,
      default: "",
    },
  },
  data() {
    return {
      active_field: "",
      is_saving_field: "",
      counterparty_label: "",
      date_editor_component: SGDateFieldEditor,
      counterparty_editor_component: SGSelectionCounterpartyEditor,
    };
  },
  computed: {
    display_selection_date() {
      const raw = this.selection?.selection_date;
      if (!raw) return "";
      return this.formatDate(raw, {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
    },
    counterparty_display() {
      const path = this.cleanString(this.selection?.counterparty_path);
      if (!path) return "";
      return this.counterparty_label || path;
    },
    date_editor_props() {
      const stored = toDateInputValue(this.selection?.selection_date);
      return {
        initial_value: stored,
        label: this.$t("sg_selection_date"),
        stored_comparison_value: stored,
        history_path: this.selection_folder_path,
        history_field_key: "selection_date",
        is_saving: this.is_saving_field === "selection_date",
      };
    },
    counterparty_editor_props() {
      return {
        initial_value:
          typeof this.selection?.counterparty_path === "string"
            ? this.selection.counterparty_path
            : "",
        label: this.$t("sg_selection_counterparty"),
      };
    },
    document_number_name_meta_text() {
      return this.buildMetaText("document_number_name");
    },
    reference_meta_text() {
      return this.buildMetaText("reference_number");
    },
    currency_meta_text() {
      return this.buildMetaText("currency");
    },
  },
  watch: {
    "selection.counterparty_path": {
      immediate: true,
      handler(path) {
        this.resolveCounterpartyLabel(path);
      },
    },
  },
  methods: {
    field_modal_title(label) {
      const title = this.cleanString(this.page_title);
      if (!title) return label;
      return `${title} — ${label}`;
    },
    buildMetaText(field_key) {
      const stored =
        typeof this.selection?.[field_key] === "string"
          ? this.selection[field_key]
          : "";
      return {
        meta_path: this.selection_folder_path,
        field_key,
        stored_value: stored,
        is_saving: this.is_saving_field === field_key,
        required: false,
        required_empty_hint: "",
        external_warning: "",
      };
    },
    cleanString(value) {
      if (value === null || value === undefined) return "";
      return String(value).trim();
    },
    openField(field_key) {
      if (!this.can_edit) return;
      this.active_field = field_key;
    },
    closeField() {
      this.active_field = "";
    },
    async onDateSave({ value }) {
      await this.persistField("selection_date", toStoredCalendarDate(value));
    },
    async onCounterpartySave({ value }) {
      await this.persistField("counterparty_path", value);
    },
    async onMetaTextSave({ value }) {
      const field_key = this.active_field;
      if (!field_key) return;
      await this.persistField(field_key, value);
    },
    async persistField(field_key, raw_value) {
      if (!field_key || this.is_saving_field) return;
      const value = typeof raw_value === "string" ? raw_value : "";
      this.is_saving_field = field_key;
      try {
        await this.$api.updateMeta({
          path: this.selection_folder_path,
          new_meta: { [field_key]: value },
        });
        this.closeField();
        this.$alertify.delay(2500).success(this.$t("sg_selection_field_saved"));
      } catch ({ code }) {
        this.$alertify.delay(4000).error(code || this.$t("sg_could_not_save"));
      } finally {
        this.is_saving_field = "";
      }
    },
    async resolveCounterpartyLabel(path_raw) {
      const path = this.cleanString(path_raw);
      if (!path) {
        this.counterparty_label = "";
        return;
      }
      this.counterparty_label = await resolveAddressBookPathLabel(
        this.$api,
        path
      );
    },
  },
};
</script>

<style lang="scss" scoped>
._fieldsGrid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: calc(var(--spacing) / 1.75);
}
</style>
