<template>
  <div class="sg-editable-meta-field">
    <SGFieldValuePresent
      :label="label"
      :icon="icon"
      :hide_label="hide_label"
      :value="value"
      :value_type="value_type"
      :readonly="effective_readonly"
      :is_flashing="is_flashing"
      :pill_text="pill_text"
      :hint_title="guest_value_hint_title"
      @click="onPresentClick"
    >
      <template v-if="$slots.value_trailing" #value_trailing>
        <slot name="value_trailing" />
      </template>
    </SGFieldValuePresent>
    <BaseModal2
      v-if="modal_open"
      :title="resolved_modal_title"
      :size="resolved_modal_size"
      :nopadding="resolved_modal_nopadding"
      :is_loading="combined_modal_loading"
      @close="onModalClose"
    >
      <component
        v-if="resolved_editor_component"
        :is="resolved_editor_component"
        :key="'sg-meta-editor-' + String(effective_editor_mount_key)"
        ref="shell_editor_ref"
        v-bind="resolved_editor_props"
        @save="onSimpleEditorSave"
        @saved="onGemEditorSaved"
        @draftChange="$emit('draftChange')"
        @footerStateChange="onFooterStateChange"
        @loadingChange="onGemLoadingChange"
      />
      <template slot="footer">
        <button type="button" class="u-button" @click="onModalClose">
          {{ $t("cancel") }}
        </button>
        <button
          type="button"
          class="u-button u-button_bleuvert"
          :disabled="footer_save_disabled"
          @click="onFooterSaveClick"
        >
          {{ footer_save_label }}
        </button>
      </template>
    </BaseModal2>
  </div>
</template>

<script>
import BaseModal2 from "@/adc-core/modals/BaseModal2.vue";
import SGFieldValuePresent from "@/components/softgems/SGFieldValuePresent.vue";
import SGSimpleMetaTextEditor from "@/components/softgems/SGSimpleMetaTextEditor.vue";
import SGGemFieldEditorBody from "@/components/gems/SGGemFieldEditorBody.vue";

export default {
  name: "SGEditableMetaField",
  components: {
    BaseModal2,
    SGFieldValuePresent,
  },
  props: {
    label: {
      type: String,
      required: true,
    },
    icon: {
      type: String,
      default: "",
    },
    hide_label: {
      type: Boolean,
      default: false,
    },
    value: {
      default: "",
    },
    value_type: {
      type: String,
      default: "",
    },
    readonly: {
      type: Boolean,
      default: false,
    },
    is_flashing: {
      type: Boolean,
      default: false,
    },
    pill_text: {
      type: String,
      default: "",
    },
    modal_open: {
      type: Boolean,
      default: false,
    },
    /** Preferred over legacy `modal_title_str`. */
    modal_title: {
      type: String,
      default: "",
    },
    modal_title_str: {
      type: String,
      default: "",
    },
    modal_is_loading: {
      type: Boolean,
      default: false,
    },
    /**
     * Simple text + history editor. When set, `editor_component` / `editor_props` are ignored.
     * Shape: { meta_path, field_key, stored_value, is_saving, required?, required_empty_hint?,
     *   external_warning?, history_field_key?, label_icon?, input_type?, custom_formats?, multiline?, options? }
     */
    meta_text: {
      type: Object,
      default: null,
    },
    /**
     * Gem field body. When set, `editor_component` / `editor_props` are ignored.
     */
    gem_edit: {
      type: Object,
      default: null,
    },
    editor_component: {
      type: [Object, String, Function],
      default: null,
    },
    editor_props: {
      type: Object,
      default: () => ({}),
    },
    editor_mount_key: {
      type: [Number, String],
      default: 0,
    },
    modal_size: {
      type: String,
      default: "",
    },
    modal_nopadding: {
      type: Boolean,
      default: false,
    },
    /**
     * When false (default), guests (no `connected_as`) see the value as read-only and cannot open the editor.
     */
    allow_guest_edit: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      footer_save_disabled: true,
      editor_loading: false,
      internal_editor_mount_generation: 0,
    };
  },
  computed: {
    effective_readonly() {
      if (this.readonly) return true;
      if (this.allow_guest_edit) return false;
      return !this.connected_as;
    },
    guest_value_hint_title() {
      if (this.readonly || this.allow_guest_edit || this.connected_as) return "";
      return this.$t("sg_editing_requires_account");
    },
    resolved_modal_title() {
      return this.modal_title || this.modal_title_str || "";
    },
    resolved_modal_size() {
      if (this.modal_size) return this.modal_size;
      if (this.gem_edit?.field?.modal_size) return this.gem_edit.field.modal_size;
      return "";
    },
    resolved_modal_nopadding() {
      if (this.modal_nopadding) return true;
      return Boolean(this.gem_edit?.field?.modal_nopadding);
    },
    resolved_editor_component() {
      if (this.gem_edit) return SGGemFieldEditorBody;
      if (this.meta_text) return SGSimpleMetaTextEditor;
      return this.editor_component;
    },
    resolved_editor_props() {
      if (this.gem_edit) {
        return { ...this.gem_edit };
      }
      if (this.meta_text) {
        const mt = this.meta_text;
        const label_icon =
          mt.label_icon != null && String(mt.label_icon).trim() !== ""
            ? mt.label_icon
            : this.icon;
        const field_key =
          mt.field_key != null ? String(mt.field_key) : "";
        const history_field_key_raw =
          mt.history_field_key != null ? String(mt.history_field_key).trim() : "";
        const input_type =
          mt.input_type != null && String(mt.input_type).trim() !== ""
            ? String(mt.input_type)
            : "text";
        return {
          label: this.label,
          label_icon,
          initial_value:
            mt.stored_value != null ? String(mt.stored_value) : this.value,
          stored_comparison_value:
            mt.stored_value != null ? String(mt.stored_value) : "",
          history_path: mt.meta_path != null ? String(mt.meta_path) : "",
          history_field_key:
            history_field_key_raw !== "" ? history_field_key_raw : field_key,
          required: !!mt.required,
          required_empty_hint: mt.required_empty_hint || "",
          is_saving: !!mt.is_saving,
          external_warning: mt.external_warning || "",
          options: Array.isArray(mt.options) ? mt.options : [],
          input_type,
          custom_formats: Array.isArray(mt.custom_formats)
            ? mt.custom_formats
            : mt.custom_formats === false
              ? false
              : ["bold", "italic", "link"],
          multiline: !!mt.multiline || input_type === "editor",
        };
      }
      return this.editor_props;
    },
    effective_editor_mount_key() {
      if (this.meta_text || this.gem_edit) {
        return this.internal_editor_mount_generation;
      }
      return this.editor_mount_key;
    },
    combined_modal_loading() {
      return this.modal_is_loading || this.editor_loading;
    },
    footer_save_label() {
      if (this.combined_modal_loading) return this.$t("saving");
      return this.$t("save");
    },
  },
  watch: {
    modal_open(open, was_open) {
      if (open && !was_open && (this.meta_text || this.gem_edit)) {
        this.internal_editor_mount_generation += 1;
      }
      if (open) {
        this.footer_save_disabled = true;
        this.editor_loading = false;
        this.$nextTick(() => {
          this.syncFooterFromEditorRef();
          this.focusSimpleInputSelect();
        });
      }
    },
    resolved_editor_component() {
      this.$nextTick(() => this.syncFooterFromEditorRef());
    },
  },
  methods: {
    onPresentClick() {
      if (this.effective_readonly) return;
      this.$emit("presentClick");
    },
    onModalClose() {
      this.$emit("close");
    },
    onFooterStateChange(payload) {
      if (payload && Object.prototype.hasOwnProperty.call(payload, "save_disabled")) {
        this.footer_save_disabled = Boolean(payload.save_disabled);
      }
    },
    onGemLoadingChange(v) {
      this.editor_loading = Boolean(v);
    },
    syncFooterFromEditorRef() {
      const ed = this.$refs.shell_editor_ref;
      if (
        ed &&
        typeof ed.is_footer_save_disabled !== "undefined"
      ) {
        this.footer_save_disabled = Boolean(ed.is_footer_save_disabled);
      }
    },
    onSimpleEditorSave(payload) {
      this.$emit("save", payload);
    },
    onGemEditorSaved(payload) {
      this.$emit("saved", payload);
      this.$emit("close");
    },
    async onFooterSaveClick() {
      const ed = this.$refs.shell_editor_ref;
      if (!ed || typeof ed.tryShellSave !== "function") return;
      await ed.tryShellSave();
    },
    focusSimpleInputSelect() {
      const ed = this.$refs.shell_editor_ref;
      if (ed && typeof ed.focusInputSelect === "function") {
        ed.focusInputSelect();
      }
    },
  },
};
</script>
