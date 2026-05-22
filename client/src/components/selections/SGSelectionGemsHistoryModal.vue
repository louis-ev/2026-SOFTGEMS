<template>
  <BaseModal2
    :title="$t('sg_selection_gems_history_title')"
    :size="'large'"
    @close="$emit('close')"
  >
    <div class="_historyModalBody">
      <div v-if="is_loading_history" class="_historyLoading">
        <LoaderSpinner />
      </div>
      <p v-else-if="field_history.length === 0" class="_historyEmpty">
        {{ $t("sg_no_history") }}
      </p>
      <ul v-else class="_historyList">
        <li
          v-for="(entry, index) in field_history"
          :key="`${entry.ts}-${entry.event}-${index}`"
          class="_historyEntry"
        >
          <p class="_historyEntryTitle">
            {{ formatHistoryEntryValue(entry) }}
            <span v-if="entry.event === 'created'" class="_createdBadge">
              {{ $t("sg_selection_gems_history_initial") }}
            </span>
          </p>
          <p class="_historyEntryMeta">
            <time :datetime="entry.ts">{{
              formatRecentDateTime(entry.ts)
            }}</time>
            <template v-if="entry.author_path">
              • {{ $t("sg_history_by") }}
              <strong>{{ formatAuthor(entry.author_path) }}</strong>
            </template>
          </p>
        </li>
      </ul>
    </div>
  </BaseModal2>
</template>

<script>
import BaseModal2 from "@/adc-core/modals/BaseModal2.vue";
import LoaderSpinner from "@/adc-core/fields/LoaderSpinner.vue";
import FormatDates from "@/mixins/FormatDates.js";
import { extract_field_entries } from "@/utils/field_history.js";
import { formatSelectionEntriesHistoryValue } from "@/utils/selection_entries.js";

const SELECTION_ENTRIES_FIELD = "selection_entries";

export default {
  name: "SGSelectionGemsHistoryModal",
  mixins: [FormatDates],
  components: {
    BaseModal2,
    LoaderSpinner,
  },
  props: {
    selection_folder_path: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      is_loading_history: false,
      field_history: [],
    };
  },
  mounted() {
    this.loadHistory();
  },
  methods: {
    async loadHistory() {
      const path = String(this.selection_folder_path || "").trim();
      if (!path) {
        this.field_history = [];
        return;
      }

      this.is_loading_history = true;
      try {
        const entries = await this.$api.getFieldHistory({ path });
        this.field_history = extract_field_entries(
          entries,
          SELECTION_ENTRIES_FIELD
        );
      } catch {
        this.field_history = [];
      } finally {
        this.is_loading_history = false;
      }
    },
    formatHistoryEntryValue(entry) {
      return formatSelectionEntriesHistoryValue(entry?.value);
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
._historyModalBody {
  min-height: 8rem;
}

._historyLoading {
  display: flex;
  justify-content: center;
  padding: calc(var(--spacing) * 1.5);
}

._historyEmpty {
  margin: 0;
  color: var(--c-gris_fonce);
  font-size: var(--sl-font-size-small);
}

._historyList {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: calc(var(--spacing) / 2);
}

._historyEntry {
  padding: calc(var(--spacing) / 2) calc(var(--spacing) * 0.75);
  border: 1px solid var(--c-gris_clair);
  border-radius: 8px;
  background: var(--c-blanc);
}

._historyEntryTitle {
  margin: 0 0 calc(var(--spacing) / 4);
  font-family: var(--sl-font-mono);
  font-size: var(--sl-font-size-small);
  font-weight: 600;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: calc(var(--spacing) / 3);
}

._createdBadge {
  font-family: var(--sl-font-sans);
  font-size: 0.75em;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--c-gris_fonce);
  border: 1px solid var(--c-gris);
  border-radius: 3px;
  padding: 0 4px;
}

._historyEntryMeta {
  margin: 0;
  font-size: var(--sl-font-size-x-small);
  color: var(--c-gris_fonce);
}
</style>
