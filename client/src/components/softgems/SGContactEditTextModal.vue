<template>
  <BaseModal2
    :title="modal_title_str"
    :is_loading="is_saving"
    @close="$emit('close')"
  >
    <div class="_modalBody">
      <DLabel :str="label" :icon="label_icon || null" />
      <TextInput
        :content.sync="draft"
        :required="required"
        :autofocus="true"
        @update:content="onDraftInput"
      />
      <p v-if="required_field_hint" class="_fieldError">
        {{ required_field_hint }}
      </p>
      <p v-if="external_warning" class="u-warning _externalWarning" role="alert">
        {{ external_warning }}
      </p>

      <template v-if="has_field_history">
        <div class="u-spacingBottom"></div>

        <button type="button" class="_historyToggle" @click="toggleHistory">
          <b-icon icon="clock-history" />
          <span>{{ $t("sg_field_history") }}</span>
          <b-icon
            :icon="show_history ? 'chevron-up' : 'chevron-down'"
            class="_chevron"
          />
        </button>

        <transition name="fade_fast">
          <div v-if="show_history" class="_historyPanel">
            <div v-if="is_loading_history" class="_historyLoading">
              <LoaderSpinner />
            </div>
            <p v-else-if="field_history.length === 0" class="_historyEmpty">
              {{ $t("sg_no_history") }}
            </p>
            <ul v-else class="_historyList">
              <li
                v-for="(entry, index) in field_history"
                :key="index"
                class="_historyEntry"
                @click="copyHistoryValue(entry)"
              >
                <span class="_historyValue">
                  {{ formatHistoryValue(entry.value) }}
                  <span v-if="entry.event === 'created'" class="_createdBadge">
                    initial
                  </span>
                </span>
                <span class="_historyMeta">
                  {{ $t("sg_history_changed_on") }}
                  <time :datetime="entry.ts">{{ formatDate(entry.ts) }}</time>
                  <template v-if="entry.author_path">
                    {{ $t("sg_history_by") }}
                    <strong>{{ formatAuthor(entry.author_path) }}</strong>
                  </template>
                </span>
              </li>
            </ul>
          </div>
        </transition>
      </template>
    </div>

    <template slot="footer">
      <button type="button" class="u-button" @click="$emit('close')">
        {{ $t("cancel") }}
      </button>
      <button
        type="button"
        class="u-button u-button_bleuvert"
        :disabled="is_footer_save_disabled"
        @click="emitSave"
      >
        {{ is_saving ? $t("saving") : $t("save") }}
      </button>
    </template>
  </BaseModal2>
</template>

<script>
import BaseModal2 from "@/adc-core/modals/BaseModal2.vue";

export default {
  name: "SGContactEditTextModal",
  components: {
    BaseModal2,
  },
  props: {
    modal_title_str: {
      type: String,
      required: true,
    },
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
    is_saving: {
      type: Boolean,
      default: false,
    },
    external_warning: {
      type: String,
      default: "",
    },
    /** Plain-text snapshot for “no edits” detection (trimmed equivalence) */
    stored_comparison_value: {
      type: String,
      default: "",
    },
    /** Folder path for GET {path}/_history (e.g. contact or person folder) */
    history_path: {
      type: String,
      default: "",
    },
    /** Meta key to filter from the history log (e.g. name, address, last_name) */
    history_field_key: {
      type: String,
      default: "",
    },
  },
  data() {
    return {
      draft: this.initial_to_string(this.initial_value),
      attempted_save_without_value: false,
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
    trimmed_draft() {
      return this.clean_string(this.draft);
    },
    /** Shown after user clicked Save while required draft is blank */
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
    initial_value: {
      handler(v) {
        this.draft = this.initial_to_string(v);
      },
    },
    history_path() {
      this.resetHistoryState();
    },
    history_field_key() {
      this.resetHistoryState();
    },
  },
  methods: {
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
        this.field_history = this.extractFieldEntries(
          entries,
          this.history_field_key.trim()
        );
      } catch {
        this.field_history = [];
      } finally {
        this.is_loading_history = false;
      }
    },
    extractFieldEntries(entries, field_key) {
      const result = [];
      for (const entry of entries) {
        if (
          entry.event === "created" &&
          entry.fields &&
          Object.prototype.hasOwnProperty.call(entry.fields, field_key)
        ) {
          result.push({
            ts: entry.ts,
            value: entry.fields[field_key],
            author_path: entry.author || "",
            event: "created",
          });
        } else if (entry.event === "updated" && entry.field === field_key) {
          result.push({
            ts: entry.ts,
            value: entry.value,
            author_path: entry.author || "",
            event: "updated",
          });
        }
      }
      return result.reverse();
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
      this.draft =
        raw === null || raw === undefined ? "" : String(raw);
      this.onDraftInput();
    },
    formatDate(iso_string) {
      if (!iso_string) return "";
      return new Date(iso_string).toLocaleString(this.$i18n.locale, {
        dateStyle: "short",
        timeStyle: "short",
      });
    },
    formatAuthor(author_path) {
      if (!author_path) return "";
      const author = this.getAuthor(author_path);
      if (author) return author.name;
      const parts = String(author_path).split("/");
      return parts[parts.length - 1] || author_path;
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
      this.$emit("draftChange");
    },
    emitSave() {
      if (this.required && !this.trimmed_draft) {
        this.attempted_save_without_value = true;
        return;
      }
      if (this.is_footer_save_disabled) return;
      this.$emit("save", { value: this.draft });
    },
    focusInputSelect() {
      this.$nextTick(() => {
        const el =
          this.$el && this.$el.querySelector(".u-inputGroup input");
        if (el && typeof el.select === "function") el.select();
      });
    },
  },
};
</script>

<style lang="scss" scoped>
._modalBody {
  display: flex;
  flex-direction: column;
  gap: calc(var(--spacing) / 2);
}

._fieldError {
  margin: 0;
  color: var(--c-rouge);
  font-size: var(--sl-font-size-x-small);
}

._externalWarning {
  margin: 0;
  font-size: var(--sl-font-size-x-small);
}

._historyToggle {
  all: unset;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: calc(var(--spacing) / 4);
  font-size: var(--sl-font-size-x-small);
  color: var(--c-gris_fonce);
  padding: calc(var(--spacing) / 4) 0;
  width: 100%;

  &:hover {
    color: var(--c-noir);
  }

  ._chevron {
    margin-left: auto;
  }
}

._historyPanel {
  background: var(--c-gris_clair);
  border-radius: 6px;
  padding: calc(var(--spacing) * 0.6);
}

._historyLoading {
  display: flex;
  justify-content: center;
  padding: calc(var(--spacing) / 2);
}

._historyEmpty {
  margin: 0;
  font-size: var(--sl-font-size-x-small);
  color: var(--c-gris_fonce);
}

._historyList {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: calc(var(--spacing) / 3);
}

._historyEntry {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: calc(var(--spacing) / 4) calc(var(--spacing) / 3);
  background: var(--c-blanc);
  border-radius: 4px;
  border-left: 2px solid var(--c-gris);
  cursor: pointer;
  transition: background-color 0.15s ease;

  &:hover {
    background: var(--c-gris_clair);
  }
}

._historyValue {
  font-family: var(--sl-font-mono);
  font-size: var(--sl-font-size-x-small);
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: calc(var(--spacing) / 4);
}

._createdBadge {
  font-family: var(--sl-font-sans);
  font-size: 0.7em;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--c-gris_fonce);
  border: 1px solid var(--c-gris);
  border-radius: 3px;
  padding: 0 3px;
}

._historyMeta {
  font-size: var(--sl-font-size-x-small);
  color: var(--c-gris_fonce);
}
</style>
