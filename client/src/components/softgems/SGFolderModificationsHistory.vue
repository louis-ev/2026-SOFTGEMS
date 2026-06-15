<template>
  <div class="sg-folder-modifications-history">
    <button
      v-if="last_modified_date"
      type="button"
      class="_historyTrigger"
      @click="openModal"
    >
      {{ $t("sg_last_modified") }}: {{ last_modified_date }}
    </button>

    <BaseModal2
      v-if="show_modal"
      :title="$t('sg_modifications_history')"
      :size="'large'"
      @close="show_modal = false"
    >
      <div class="_historyModalBody">
        <div v-if="is_loading_history" class="_historyLoading">
          <LoaderSpinner />
        </div>
        <p v-else-if="history_entries.length === 0" class="_historyEmpty">
          {{ $t("sg_no_history") }}
        </p>
        <ul v-else class="_historyList">
          <li
            v-for="(entry, index) in history_entries"
            :key="`${entry.ts}-${entry.event}-${
              entry.field || 'created'
            }-${index}`"
            class="_historyEntry"
          >
            <p class="_historyEntryTitle">
              {{ formatHistoryEntryTitle(entry) }}
            </p>
            <p class="_historyEntryMeta">
              <time :datetime="entry.ts">{{
                formatRecentDateTime(entry.ts)
              }}</time>
              <template v-if="entry.author">
                • {{ $t("sg_history_by") }}
                <strong>{{ formatAuthor(entry.author) }}</strong>
              </template>
            </p>
          </li>
        </ul>
      </div>
    </BaseModal2>
  </div>
</template>

<script>
import BaseModal2 from "@/adc-core/modals/BaseModal2.vue";
import { formatFolderHistoryEntryTitle } from "@/utils/folder_modifications_history.js";

export default {
  name: "SGFolderModificationsHistory",
  components: {
    BaseModal2,
  },
  props: {
    folder_path: {
      type: String,
      required: true,
    },
    folder_meta: {
      type: Object,
      default: null,
    },
    history_kind: {
      type: String,
      required: true,
      validator(value) {
        return value === "gem" || value === "selection";
      },
    },
  },
  data() {
    return {
      show_modal: false,
      is_loading_history: false,
      history_entries: [],
    };
  },
  computed: {
    last_modified_date() {
      const raw_date =
        this.folder_meta?.$date_modified || this.folder_meta?.$date_created;
      if (!raw_date) return "";
      return this.formatRecentDateTime(raw_date);
    },
  },
  methods: {
    async openModal() {
      this.show_modal = true;
      if (this.history_entries.length > 0) return;

      const path = String(this.folder_path || "").trim();
      if (!path) {
        this.history_entries = [];
        return;
      }

      this.is_loading_history = true;
      try {
        const entries = await this.$api.getFieldHistory({ path });
        this.history_entries = (Array.isArray(entries) ? entries : [])
          .slice()
          .reverse();
      } catch {
        this.history_entries = [];
      } finally {
        this.is_loading_history = false;
      }
    },
    formatHistoryEntryTitle(entry) {
      return formatFolderHistoryEntryTitle(entry, {
        t: this.$t.bind(this),
        history_kind: this.history_kind,
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
.sg-folder-modifications-history {
  display: contents;
}

._historyTrigger {
  all: unset;
  cursor: pointer;
  margin: calc(var(--spacing) / 6) 0 0;
  color: var(--c-gris_fonce);
  font-size: 0.85rem;
  text-decoration: underline;
  text-decoration-style: dotted;

  &:hover {
    color: var(--c-noir);
  }
}

._historyModalBody {
  min-height: 120px;
}

._historyLoading {
  display: flex;
  justify-content: center;
  padding: calc(var(--spacing) / 2);
}

._historyEmpty {
  margin: 0;
  font-size: var(--sl-font-size-small);
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
  padding: calc(var(--spacing) / 3) calc(var(--spacing) / 2);
  border: 1px solid var(--c-gris_clair);
  border-radius: 6px;
  background: var(--c-bodybg);
}

._historyEntryTitle {
  margin: 0;
  font-size: var(--sl-font-size-small);
  color: var(--c-noir);
}

._historyEntryMeta {
  margin: 0;
  font-size: var(--sl-font-size-x-small);
  color: var(--c-gris_fonce);
}
</style>
