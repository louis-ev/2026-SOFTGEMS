<template>
  <div class="_dateFieldEditor">
    <DLabel :str="label" :icon="label_icon" />
    <SGDateInput :value="draft" @input="onDraftInput" />
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
      :format_value="formatHistoryValue"
      @toggle="toggleHistory"
      @pickEntry="copyHistoryValue"
    />
  </div>
</template>

<script>
import SGDateInput from "@/components/softgems/SGDateInput.vue";
import SGFieldHistoryPanel from "@/components/softgems/SGFieldHistoryPanel.vue";
import { extract_field_entries } from "@/utils/field_history.js";
import { toDateInputValue, toStoredCalendarDate } from "@/utils/date_input.js";

export default {
  name: "SGDateFieldEditor",
  components: {
    SGDateInput,
    SGFieldHistoryPanel,
  },
  props: {
    initial_value: {
      type: String,
      default: "",
    },
    label: {
      type: String,
      required: true,
    },
    label_icon: {
      type: String,
      default: "calendar3",
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
  },
  data() {
    return {
      draft: toDateInputValue(this.initial_value),
      baseline_trimmed: "",
      remote_update_notice: "",
      show_history: false,
      is_loading_history: false,
      field_history: [],
    };
  },
  computed: {
    has_field_history() {
      return (
        typeof this.history_path === "string" &&
        this.history_path.trim() !== "" &&
        typeof this.history_field_key === "string" &&
        this.history_field_key.trim() !== ""
      );
    },
    normalized_draft() {
      return toStoredCalendarDate(this.draft);
    },
    normalized_stored() {
      return toStoredCalendarDate(this.stored_comparison_value);
    },
    matches_stored() {
      return this.normalized_draft === this.normalized_stored;
    },
    is_footer_save_disabled() {
      return this.is_saving || this.matches_stored;
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
    this.baseline_trimmed = this.normalized_stored;
  },
  mounted() {
    this.emitFooterState();
  },
  methods: {
    onParentStoredSnapshotChanged() {
      const stored_t = this.normalized_stored;
      const draft_t = this.normalized_draft;
      const prev_base = this.baseline_trimmed;

      if (stored_t !== prev_base) {
        if (draft_t === prev_base) {
          this.draft = toDateInputValue(this.initial_value);
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
      const normalized = toDateInputValue(value);
      if (!normalized) return "—";
      return normalized;
    },
    copyHistoryValue(entry) {
      const raw =
        entry && Object.prototype.hasOwnProperty.call(entry, "value")
          ? entry.value
          : "";
      this.onDraftInput(toDateInputValue(raw));
    },
    onDraftInput(value) {
      if (arguments.length > 0) {
        this.draft =
          value === null || value === undefined ? "" : String(value);
      }
      this.remote_update_notice = "";
      this.$emit("draftChange");
      this.emitFooterState();
    },
    tryShellSave() {
      if (this.is_saving || this.is_footer_save_disabled) return false;
      this.$emit("save", { value: toStoredCalendarDate(this.draft) });
      return true;
    },
    emitFooterState() {
      this.$nextTick(() => {
        this.$emit("footerStateChange", {
          save_disabled: this.is_footer_save_disabled,
        });
      });
    },
  },
};
</script>

<style lang="scss" scoped>
._dateFieldEditor {
  display: flex;
  flex-direction: column;
  gap: calc(var(--spacing) / 2);
}

._remoteNotice {
  margin: 0;
  font-size: var(--sl-font-size-x-small);
}
</style>
