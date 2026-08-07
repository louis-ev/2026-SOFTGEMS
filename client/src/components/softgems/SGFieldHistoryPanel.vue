<template>
  <div v-if="history_enabled" class="sg-field-history-panel">
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
          >
            <div class="_historyEntryBody">
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
            </div>
            <button
              type="button"
              class="_restoreBtn"
              :title="$t('restore')"
              :aria-label="$t('restore')"
              @click.stop="onRestore(entry)"
            >
              <b-icon icon="arrow-counterclockwise" />
            </button>
          </li>
        </ul>
      </div>
    </transition>
  </div>
</template>

<script>
import { getDateFormatLocale, formatDisplayNumber } from "@/utils/format_locale.js";

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
    onRestore(entry) {
      this.$emit("pickEntry", entry);
    },
    formatRowValue(value) {
      if (typeof this.format_value === "function") {
        return this.format_value(value);
      }
      if (value === null || value === undefined || value === "") return "—";
      return formatDisplayNumber(value, { maximumFractionDigits: 3 }) ?? String(value);
    },
    formatDate(iso_string) {
      if (!iso_string) return "";
      return new Date(iso_string).toLocaleString(
        getDateFormatLocale(this.$i18n?.locale),
        {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }
      );
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
  flex-direction: row;
  align-items: center;
  gap: calc(var(--spacing) / 4);
  padding: calc(var(--spacing) / 4) calc(var(--spacing) / 3);
  background: var(--c-blanc);
  border-radius: 4px;
  border-left: 2px solid var(--c-gris);
  transition: background-color 0.15s ease;

  // &:hover {
  //   background: var(--c-gris_clair);
  // }
}

._historyEntryBody {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

._restoreBtn {
  all: unset;
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  align-self: center;
  width: 1.35rem;
  height: 1.35rem;
  border-radius: 4px;
  font-size: 0.85rem;
  color: var(--c-gris_fonce);
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.15s ease, background-color 0.15s ease, color 0.15s ease;

  &:hover {
    background: var(--c-gris_clair);
    color: var(--c-noir);
  }

  &:focus-visible {
    opacity: 1;
    outline: 2px solid var(--c-bleuvert);
    outline-offset: 1px;
  }
}

._historyEntry:hover ._restoreBtn,
._historyEntry:focus-within ._restoreBtn {
  opacity: 1;
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
