<template>
  <div v-if="history_enabled" class="sg-field-history-panel">
    <div class="u-spacingBottom"></div>

    <button type="button" class="_historyToggle" @click="onToggle">
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
            @click="$emit('pickEntry', entry)"
          >
            <span class="_historyValue">
              {{ formatRowValue(entry.value) }}
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
</template>

<script>
export default {
  name: "SGFieldHistoryPanel",
  props: {
    history_enabled: {
      type: Boolean,
      default: true,
    },
    show_history: {
      type: Boolean,
      default: false,
    },
    is_loading_history: {
      type: Boolean,
      default: false,
    },
    field_history: {
      type: Array,
      default() {
        return [];
      },
    },
    /** (value) => string for display cell */
    format_value: {
      type: Function,
      default: null,
    },
  },
  methods: {
    onToggle() {
      this.$emit("toggle");
    },
    formatRowValue(value) {
      if (typeof this.format_value === "function") {
        return this.format_value(value);
      }
      if (value === null || value === undefined || value === "") return "—";
      return String(value);
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
  },
};
</script>

<style lang="scss" scoped>
.sg-field-history-panel {
  margin: 0;
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
