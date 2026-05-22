<template>
  <SGSectionPanel
    section_id="selection_header_fields"
    :title="$t('sg_section_selection_header')"
  >
    <div class="_fieldsGrid">
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
import FormatDates from "@/mixins/FormatDates.js";
import SGAddressBookFolderSelect from "@/components/softgems/SGAddressBookFolderSelect.vue";

const SGSelectionDateEditor = {
  name: "SGSelectionDateEditor",
  props: {
    initial_value: { type: String, default: "" },
    label: { type: String, required: true },
  },
  data() {
    return {
      draft: this.toInputDate(this.initial_value),
    };
  },
  computed: {
    is_footer_save_disabled() {
      return false;
    },
  },
  watch: {
    initial_value(next_value) {
      this.draft = this.toInputDate(next_value);
    },
  },
  methods: {
    toInputDate(raw) {
      const value = String(raw || "").trim();
      if (!value) return "";
      if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
      const parsed = new Date(value);
      if (Number.isNaN(parsed.getTime())) return "";
      return parsed.toISOString().slice(0, 10);
    },
    tryShellSave() {
      this.$emit("save", { value: this.draft || "" });
    },
  },
  template: `
    <div>
      <DLabel :str="label" icon="calendar3" />
      <input v-model="draft" type="date" class="u-input" />
    </div>
  `,
};

const SGSelectionCounterpartyEditor = {
  name: "SGSelectionCounterpartyEditor",
  components: { SGAddressBookFolderSelect },
  props: {
    initial_value: { type: String, default: "" },
    label: { type: String, required: true },
  },
  data() {
    return {
      draft: String(this.initial_value || "").trim(),
    };
  },
  computed: {
    is_footer_save_disabled() {
      return false;
    },
  },
  watch: {
    initial_value(next_value) {
      this.draft = String(next_value || "").trim();
    },
  },
  methods: {
    tryShellSave() {
      this.$emit("save", { value: this.draft || "" });
    },
  },
  template: `
    <div>
      <DLabel :str="label" icon="people" />
      <SGAddressBookFolderSelect :value="draft" @input="draft = $event" />
    </div>
  `,
};

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
      date_editor_component: SGSelectionDateEditor,
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
      return {
        initial_value:
          typeof this.selection?.selection_date === "string"
            ? this.selection.selection_date
            : "",
        label: this.$t("sg_selection_date"),
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
      await this.persistField("selection_date", value);
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
      const cached = this.$api.store?.[path];
      if (cached?.name) {
        this.counterparty_label = String(cached.name).trim();
        return;
      }
      try {
        const folder = await this.$api.getFolder({ path });
        this.counterparty_label =
          typeof folder?.name === "string" ? folder.name.trim() : path;
      } catch {
        this.counterparty_label = path;
      }
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
