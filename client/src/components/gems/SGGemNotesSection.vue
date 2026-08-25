<template>
  <SGSectionPanel section_id="gem_notes" :title="$t('sg_gem_notes')">
    <SGEditableMetaField
      :label="$t('sg_gem_notes')"
      icon="card-text"
      value_type="rich_text"
      :value="notes_html"
      :readonly="!can_edit"
      :modal_open="active_field === 'notes'"
      :modal_title="field_modal_title($t('sg_gem_notes'))"
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
  name: "SGGemNotesSection",
  components: {
    SGEditableMetaField,
    SGSectionPanel,
  },
  props: {
    gem_path: {
      type: String,
      required: true,
    },
    gem: {
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
      return typeof this.gem?.notes === "string" ? this.gem.notes : "";
    },
    notes_meta_text() {
      return {
        meta_path: this.gem_path,
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
      const next_value = typeof value === "string" ? value : "";
      try {
        await this.$api.updateMeta({
          path: this.gem_path,
          new_meta: {
            notes: next_value,
          },
        });
        this.closeField();
        this.$emit("saved", { key: "notes", value: next_value });
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
