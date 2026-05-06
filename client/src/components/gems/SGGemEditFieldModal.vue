<template>
  <BaseModal2
    :title="modal_title"
    :is_loading="is_saving"
    @close="$emit('close')"
  >
    <div class="_body">
      <DLabel :str="field.label" :icon="field.icon" />

      <div class="_inputWrap">
        <template v-if="field.readonly">
          <input :value="edit_value" class="u-input" readonly />
          <p class="_readonlyNote">{{ $t("sg_readonly_field") }}</p>
        </template>
        <SGSelectField
          v-else-if="field.type === 'select'"
          v-model="edit_value"
          :options="field.options || []"
          :allow_empty="true"
        />
        <TextInput
          v-else
          :content.sync="edit_value"
          :input_type="field.input_type || 'text'"
          :input_step="field.input_step"
          :autofocus="true"
        />
      </div>

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
    </div>

    <template slot="footer">
      <button type="button" class="u-button" @click="$emit('close')">
        {{ $t("cancel") }}
      </button>
      <button
        type="button"
        class="u-button u-button_bleuvert"
        :disabled="field.readonly || is_saving"
        @click="save"
      >
        {{ is_saving ? "…" : $t("save") }}
      </button>
    </template>
  </BaseModal2>
</template>

<script>
import SGSelectField from "@/components/softgems/SGSelectField.vue";

export default {
  name: "SGGemEditFieldModal",
  components: {
    SGSelectField,
  },
  props: {
    field: {
      type: Object,
      required: true,
    },
    current_value: {
      default: "",
    },
    gem_path: {
      type: String,
      required: true,
    },
  },
  computed: {
    gem_id() {
      const parts = this.gem_path.split("/");
      return parts[parts.length - 1] || this.gem_path;
    },
    modal_title() {
      return `${this.$t("sg_gem_title", { id: this.gem_id })} — ${
        this.field.label
      }`;
    },
  },
  data() {
    return {
      edit_value: this.current_value,
      show_history: false,
      is_loading_history: false,
      is_saving: false,
      field_history: [],
    };
  },
  methods: {
    async toggleHistory() {
      this.show_history = !this.show_history;
      if (this.show_history && this.field_history.length === 0) {
        await this.fetchHistory();
      }
    },
    async fetchHistory() {
      this.is_loading_history = true;
      try {
        const entries = await this.$api.getFieldHistory({
          path: this.gem_path,
        });
        this.field_history = this.extractFieldEntries(entries, this.field.key);
      } catch {
        this.field_history = [];
      } finally {
        this.is_loading_history = false;
      }
    },
    // Extracts all history entries relevant to a single field from the flat
    // log. The "created" event gives us the initial state; "updated" events
    // give subsequent changes. Returned newest-first for display.
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
    async save() {
      if (this.field.readonly || this.is_saving) return;
      this.is_saving = true;
      try {
        await this.$api.updateMeta({
          path: this.gem_path,
          new_meta: { [this.field.key]: this.edit_value },
        });
        this.$emit("saved", { key: this.field.key, value: this.edit_value });
        this.$emit("close");
      } catch ({ code }) {
        this.$alertify.delay(4000).error(code || this.$t("couldntbesaved"));
      } finally {
        this.is_saving = false;
      }
    },
    formatHistoryValue(value) {
      if (value === null || value === undefined || value === "") return "—";
      return String(value);
    },
    formatDate(iso_string) {
      if (!iso_string) return "";
      return new Date(iso_string).toLocaleString();
    },
    formatAuthor(author_path) {
      if (!author_path) return "";
      const author = this.getAuthor(author_path);
      if (author) return author.name;
      const parts = String(author_path).split("/");
      return parts[parts.length - 1] || author_path;
    },
  },
};
</script>

<style lang="scss" scoped>
._body {
  display: flex;
  flex-direction: column;
  // gap: calc(var(--spacing) * 0.6);
  // padding-bottom: calc(var(--spacing) * 0.5);
}

._inputWrap {
  display: flex;
  flex-direction: column;
  gap: calc(var(--spacing) / 4);
}

._readonlyNote {
  margin: 0;
  font-size: var(--sl-font-size-x-small);
  color: var(--c-gris_fonce);
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
  // border-top: 1px solid var(--c-gris_clair);
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
