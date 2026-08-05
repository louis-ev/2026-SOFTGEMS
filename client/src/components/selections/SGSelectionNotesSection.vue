<template>
  <SGSectionPanel
    section_id="selection_notes"
    :title="$t('sg_selection_notes')"
  >
    <p class="_notesExportHint">
      {{ $t("sg_selection_notes_export_hint") }}
    </p>
    <SGEditableMetaField
      :label="$t('sg_selection_notes')"
      icon="card-text"
      value_type="rich_text"
      :value="notes_html"
      :readonly="!can_edit"
      :modal_open="active_field === 'notes'"
      :modal_title="field_modal_title($t('sg_selection_notes'))"
      :modal_is_loading="is_saving_field === 'notes'"
      :modal_size="'large'"
      :meta_text="notes_meta_text"
      @presentClick="openField"
      @close="closeField"
      @save="onNotesSave"
    />
  </SGSectionPanel>
</template>

<script>
import SGEditableMetaField from "@/components/softgems/SGEditableMetaField.vue";
import SGSectionPanel from "@/components/softgems/SGSectionPanel.vue";

export default {
  name: "SGSelectionNotesSection",
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
    };
  },
  computed: {
    notes_html() {
      return typeof this.selection?.notes === "string"
        ? this.selection.notes
        : "";
    },
    notes_meta_text() {
      return {
        meta_path: this.selection_folder_path,
        field_key: "notes",
        stored_value: this.notes_html,
        is_saving: this.is_saving_field === "notes",
        required: false,
        required_empty_hint: "",
        external_warning: "",
        input_type: "editor",
        custom_formats: ["bold", "italic", "link"],
        multiline: true,
      };
    },
  },
  methods: {
    field_modal_title(label) {
      const title = String(this.page_title || "").trim();
      if (!title) return label;
      return `${title} — ${label}`;
    },
    openField() {
      if (!this.can_edit) return;
      this.active_field = "notes";
    },
    closeField() {
      this.active_field = "";
    },
    async onNotesSave({ value }) {
      if (this.is_saving_field) return;
      this.is_saving_field = "notes";
      try {
        await this.$api.updateMeta({
          path: this.selection_folder_path,
          new_meta: {
            notes: typeof value === "string" ? value : "",
          },
        });
        this.closeField();
        this.$alertify
          .delay(2500)
          .success(this.$t("sg_selection_field_saved"));
      } catch ({ code }) {
        this.$alertify.delay(4000).error(code || this.$t("sg_could_not_save"));
      } finally {
        this.is_saving_field = "";
      }
    },
  },
};
</script>

<style lang="scss" scoped>
._notesExportHint {
  margin: 0 0 calc(var(--spacing) * 0.75);
  color: var(--c-gris_fonce);
  font-size: var(--sl-font-size-x-small);
}
</style>
