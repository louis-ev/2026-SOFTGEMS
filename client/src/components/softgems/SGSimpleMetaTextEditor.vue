<template>
  <div class="_metaTextEditor">
    <DLabel :str="label" :icon="label_icon || null" />
    <SGSelectField
      v-if="has_select_options"
      ref="primary_field_ref"
      :value="draft"
      :options="options"
      :allow_empty="!required"
      :required="required"
      :disabled="is_saving"
      :autofocus="true"
      @input="onSelectInput"
      @enterSubmit="onSingleLineEnter"
    />
    <TextInput
      v-else
      :content.sync="draft"
      :required="required"
      :autofocus="true"
      :input_type="input_type"
      :custom_formats="custom_formats"
      @update:content="onDraftInput"
      @onEnter="onSingleLineEnter"
    />
    <p v-if="required_field_hint" class="_fieldError">
      {{ required_field_hint }}
    </p>
    <p v-if="external_warning" class="u-warning _externalWarning" role="alert">
      {{ external_warning }}
    </p>
    <p
      v-if="remote_update_notice"
      class="u-warning _remoteNotice"
      role="status"
    >
      {{ remote_update_notice }}
    </p>

    <SGFieldHistoryPanel
      :history_enabled="has_field_history"
      :show_history="show_history"
      :is_loading_history="is_loading_history"
      :field_history="field_history"
      @toggle="toggleHistory"
      @pickEntry="copyHistoryValue"
    />
  </div>
</template>

<script>
import SGFieldHistoryPanel from "@/components/softgems/SGFieldHistoryPanel.vue";
import SGSelectField from "@/components/softgems/SGSelectField.vue";
import { extract_field_entries } from "@/utils/field_history.js";

export default {
  name: "SGSimpleMetaTextEditor",
  components: {
    SGFieldHistoryPanel,
    SGSelectField,
  },
  props: {
    label: {
      type: String,
      required: true,
    },
    label_icon: {
      type: String,
      default: "",
    },
    initial_value: {
      type: [String, Number],
      default: "",
    },
    required: {
      type: Boolean,
      default: false,
    },
    required_empty_hint: {
      type: String,
      default: "",
    },
    external_warning: {
      type: String,
      default: "",
    },
    stored_comparison_value: {
      type: String,
      default: "",
    },
    history_path: {
      type: String,
      default: "",
    },
    history_field_key: {
      type: String,
      default: "",
    },
    is_saving: {
      type: Boolean,
      default: false,
    },
    /** When true, Enter is left to the control (e.g. multi-line); otherwise Enter submits like the Save button. */
    multiline: {
      type: Boolean,
      default: false,
    },
    /** TextInput `input_type` — use `"editor"` for bold/italic/link rich text. */
    input_type: {
      type: String,
      default: "text",
    },
    custom_formats: {
      type: [Array, Boolean],
      default: () => ["bold", "italic", "link"],
    },
    options: {
      type: Array,
      default: () => [],
    },
  },
  data() {
    return {
      draft: this.initial_to_string(this.initial_value),
      baseline_trimmed: "",
      remote_update_notice: "",
      attempted_save_without_value: false,
      show_history: false,
      is_loading_history: false,
      field_history: [],
    };
  },
  computed: {
    has_select_options() {
      return Array.isArray(this.options) && this.options.length > 0;
    },
    uses_editor() {
      return this.input_type === "editor";
    },
    enter_submits() {
      return !this.multiline && !this.uses_editor;
    },
    has_field_history() {
      return (
        typeof this.history_path === "string" &&
        this.history_path.trim() !== "" &&
        typeof this.history_field_key === "string" &&
        this.history_field_key.trim() !== ""
      );
    },
    trimmed_draft() {
      return this.clean_string(this.draft);
    },
    required_field_hint() {
      if (!this.required || !this.attempted_save_without_value) return "";
      if (this.trimmed_draft !== "") return "";
      return this.required_empty_hint || "";
    },
    matches_stored() {
      return (
        this.clean_string(this.draft) ===
        this.clean_string(this.stored_comparison_value)
      );
    },
    is_footer_save_disabled() {
      return (
        this.is_saving ||
        this.matches_stored ||
        (this.required && !this.trimmed_draft)
      );
    },
  },
  watch: {
    initial_value() {
      this.onParentStoredSnapshotChanged();
    },
    stored_comparison_value() {
      this.onParentStoredSnapshotChanged();
    },
    history_path() {
      this.resetHistoryState();
    },
    history_field_key() {
      this.resetHistoryState();
    },
    is_footer_save_disabled() {
      this.emitFooterState();
    },
    is_saving() {
      this.emitFooterState();
    },
  },
  created() {
    this.baseline_trimmed = this.clean_string(this.stored_comparison_value);
  },
  mounted() {
    this.emitFooterState();
    this.focusInputSelect();
  },
  methods: {
    onParentStoredSnapshotChanged() {
      const stored_t = this.clean_string(this.stored_comparison_value);
      const draft_t = this.clean_string(this.draft);
      const prev_base = this.baseline_trimmed;

      if (stored_t !== prev_base) {
        if (draft_t === prev_base) {
          this.draft = this.initial_to_string(this.initial_value);
          this.remote_update_notice = "";
        } else if (draft_t !== stored_t) {
          const msg = this.$t("sg_contact_field_updated_remotely");
          this.remote_update_notice =
            msg && msg !== "sg_contact_field_updated_remotely" ? msg : "";
        } else {
          this.remote_update_notice = "";
        }
        this.baseline_trimmed = stored_t;
      }
      this.emitFooterState();
    },
    resetHistoryState() {
      this.show_history = false;
      this.field_history = [];
      this.is_loading_history = false;
    },
    async toggleHistory() {
      this.show_history = !this.show_history;
      if (this.show_history && this.field_history.length === 0) {
        await this.fetchHistory();
      }
    },
    async fetchHistory() {
      if (!this.has_field_history) return;
      this.is_loading_history = true;
      try {
        const entries = await this.$api.getFieldHistory({
          path: this.history_path.trim(),
        });
        this.field_history = extract_field_entries(
          entries,
          this.history_field_key.trim()
        );
      } catch {
        this.field_history = [];
      } finally {
        this.is_loading_history = false;
      }
    },
    formatHistoryValue(value) {
      if (value === null || value === undefined || value === "") return "—";
      return String(value);
    },
    copyHistoryValue(entry) {
      const raw =
        entry && Object.prototype.hasOwnProperty.call(entry, "value")
          ? entry.value
          : "";
      this.draft = raw === null || raw === undefined ? "" : String(raw);
      this.onDraftInput();
    },
    clean_string(value) {
      if (value === null || value === undefined) return "";
      return String(value).trim();
    },
    initial_to_string(v) {
      if (v === null || v === undefined) return "";
      return typeof v === "string" ? v : String(v);
    },
    onDraftInput() {
      this.attempted_save_without_value = false;
      this.remote_update_notice = "";
      this.$emit("draftChange");
    },
    onSelectInput(value) {
      this.draft = value === null || value === undefined ? "" : String(value);
      this.onDraftInput();
    },
    onSingleLineEnter() {
      if (!this.enter_submits) return;
      this.tryEmitSave();
    },
    tryEmitSave() {
      if (this.is_saving) return false;
      if (this.required && !this.trimmed_draft) {
        this.attempted_save_without_value = true;
        return false;
      }
      if (this.is_footer_save_disabled) return false;
      this.$emit("save", { value: this.draft });
      return true;
    },
    tryShellSave() {
      return this.tryEmitSave();
    },
    emitFooterState() {
      this.$nextTick(() => {
        this.$emit("footerStateChange", {
          save_disabled: this.is_footer_save_disabled,
        });
      });
    },
    focusInputSelect() {
      this.$nextTick(() => {
        const select_ref = this.$refs.primary_field_ref;
        if (select_ref && typeof select_ref.focusSelect === "function") {
          select_ref.focusSelect();
          return;
        }
        if (this.uses_editor) {
          const editor_el =
            this.$el && this.$el.querySelector(".ql-editor");
          if (editor_el && typeof editor_el.focus === "function") {
            editor_el.focus();
          }
          return;
        }
        const el =
          this.$el &&
          this.$el.querySelector(
            this.has_select_options ? "._sgSelectField" : ".u-inputGroup input"
          );
        if (el && typeof el.focus === "function") el.focus();
        if (el && !this.has_select_options && typeof el.select === "function") {
          el.select();
        }
      });
    },
  },
};
</script>

<style lang="scss" scoped>
._metaTextEditor {
  display: flex;
  flex-direction: column;
  gap: calc(var(--spacing) / 2);
}

._fieldError {
  margin: 0;
  color: var(--c-rouge);
  font-size: var(--sl-font-size-x-small);
}

._externalWarning,
._remoteNotice {
  margin: 0;
  font-size: var(--sl-font-size-x-small);
}
</style>
