<template>
  <div class="_selectionsView">
    <SGOverlaySidePanelLayout
      :panel_open="is_selections_panel_open"
      @close="closePanel"
    >
      <div class="_selectionsView--content">
        <div class="_pageHeader">
          <h1 class="_pageTitle">{{ $t("sg_selections") }}</h1>
          <div class="_headerActions">
            <router-link
              to="/selections/new"
              class="u-button u-button_bleuvert"
            >
              <b-icon icon="plus-lg" />
              {{ $t("sg_create_selection") }}
            </router-link>
          </div>
        </div>

        <div v-if="is_loading">{{ $t("sg_loading_selections") }}</div>
        <div v-else-if="fetch_error" class="u-errorMsg">{{ fetch_error }}</div>
        <div v-else class="_listSection">
          <div class="_tableWrap">
            <table class="_table" :aria-label="$t('sg_selections')">
              <thead>
                <tr>
                  <th scope="col" class="_colName">
                    {{ $t("sg_selection_internal_name") }}
                  </th>
                  <th scope="col" class="_colType">
                    {{ $t("sg_selection_type_label") }}
                  </th>
                  <th scope="col" class="_colCount">
                    {{ $t("sg_selection_gem_count") }}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="sorted_entries.length === 0" class="_emptyRow">
                  <td colspan="3" class="_emptyCell">
                    {{ $t("sg_selections_empty") }}
                  </td>
                </tr>
                <template v-else>
                  <tr
                    v-for="row in sorted_entries"
                    :key="row.$path || selectionSlugFromPath(row.$path)"
                    class="_dataRow"
                    :class="{
                      _selected:
                        selected_folder_slug ===
                        selectionSlugFromPath(row.$path),
                    }"
                    tabindex="0"
                    role="button"
                    @click="openSelection(row)"
                    @keydown.enter.prevent="openSelection(row)"
                  >
                    <td class="_colName">
                      <span class="_nameText">{{ selectionLabel(row) }}</span>
                    </td>
                    <td class="_colType">
                      <span v-if="row.selection_type" class="_typeBadge">
                        {{ formatSelectionType(row.selection_type) }}
                      </span>
                    </td>
                    <td class="_colCount">
                      <span class="_gemCount">{{ entryCount(row) }}</span>
                    </td>
                  </tr>
                </template>
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <template #panel>
        <router-view />
      </template>
    </SGOverlaySidePanelLayout>
  </div>
</template>

<script>
import SGOverlaySidePanelLayout from "@/components/softgems/SGOverlaySidePanelLayout.vue";
import { selectionDetailPath } from "@/utils/selection_urls.js";
import { selectionTypeLabel as selectionTypeLabelFn } from "@/utils/selection_types.js";
import { normalizeSelectionEntries } from "@/utils/selection_entries.js";
import { parseSelectionPathParam } from "@/utils/selection_urls.js";

export default {
  name: "SGSelectionsView",
  components: {
    SGOverlaySidePanelLayout,
  },
  data() {
    return {
      selections_root_path: "selections",
      selection_entries: [],
      is_loading: false,
      fetch_error: "",
    };
  },
  computed: {
    is_selections_panel_open() {
      return ["Create selection", "Open selection"].includes(this.$route.name);
    },
    sorted_entries() {
      if (!Array.isArray(this.selection_entries)) return [];
      return [...this.selection_entries].sort((a, b) =>
        this.selectionLabel(a).localeCompare(
          this.selectionLabel(b),
          undefined,
          { sensitivity: "base" }
        )
      );
    },
    selected_folder_slug() {
      if (this.$route.name !== "Open selection") return "";
      const raw = this.cleanString(this.$route.params.selection_path);
      const parsed = parseSelectionPathParam(raw);
      return parsed.folder_slug || "";
    },
  },
  watch: {
    "$route.name": {
      immediate: true,
      handler(route_name) {
        if (route_name === "Selections") this.fetchSelections();
      },
    },
  },
  mounted() {
    this.fetchSelections();
    this.$api.join({ room: this.selections_root_path });
  },
  beforeDestroy() {
    this.$api.leave({ room: this.selections_root_path });
  },
  methods: {
    formatSelectionType(v) {
      return selectionTypeLabelFn(this.$t.bind(this), v);
    },
    selectionSlugFromPath(folder_path) {
      const cleaned = this.cleanString(folder_path);
      if (!cleaned) return "";
      const segments = cleaned.split("/");
      return segments[segments.length - 1] || "";
    },
    selectionLabel(row) {
      const raw =
        typeof row?.internal_name === "string" ? row.internal_name.trim() : "";
      if (raw) return raw;
      return (
        this.selectionSlugFromPath(row?.$path) ||
        this.$t("sg_selection_untitled")
      );
    },
    entryCount(row) {
      return normalizeSelectionEntries(row?.selection_entries).length;
    },
    cleanString(value) {
      if (value === null || value === undefined) return "";
      return String(value).trim();
    },
    closePanel() {
      this.$router.push("/selections");
    },
    openSelection(row) {
      const slug = this.selectionSlugFromPath(row?.$path);
      if (!slug) return;
      const label =
        typeof row?.internal_name === "string" ? row.internal_name : "";
      const path = selectionDetailPath({
        folder_slug: slug,
        internal_name: label,
      });
      this.$router.push(path);
    },
    async fetchSelections() {
      this.is_loading = true;
      this.fetch_error = "";
      try {
        const fetched = await this.$api.getFolders({
          path: this.selections_root_path,
        });
        this.selection_entries = Array.isArray(fetched) ? fetched : [];
      } catch ({ code }) {
        this.fetch_error = code || this.$t("sg_could_not_load_selections");
        this.selection_entries = [];
      } finally {
        this.is_loading = false;
      }
    },
  },
};
</script>

<style lang="scss" scoped>
._selectionsView {
  position: relative;
  height: 100%;
  min-height: 0;
}

._selectionsView--content {
  position: relative;
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: calc(var(--spacing) * 2) calc(var(--spacing) * 3)
    calc(var(--spacing) * 1);
  box-sizing: border-box;
}

._pageTitle {
  margin: 0;
}

._pageHeader {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--spacing);
  margin-bottom: calc(var(--spacing) * 1);
}

._headerActions {
  display: flex;
  align-items: center;
  gap: calc(var(--spacing) / 2);
}

._listSection {
  min-height: 0;
  flex: 1;
  overflow-y: auto;
}

._tableWrap {
  background: transparent;
}

._table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--sl-font-size-small);

  th,
  td {
    text-align: left;
    padding: calc(var(--spacing) * 0.75) calc(var(--spacing) * 1);
    border-bottom: 1px solid var(--c-gris_clair);
    vertical-align: middle;
  }

  thead th {
    position: sticky;
    top: 0;
    z-index: 1;
    background: var(--c-bodybg);
    font-weight: 600;
    font-size: var(--sl-font-size-x-small);
    color: var(--c-gris_fonce);
    border-bottom: 1px solid var(--c-gris);

    &._colCount {
      text-align: right;
    }
  }

  tr._dataRow:last-child td {
    border-bottom-color: var(--c-gris);
  }
}

._colName {
  width: 48%;
}

._colType {
  width: 40%;
  white-space: nowrap;
}

._colCount {
  width: 12%;
  white-space: nowrap;
  text-align: right;
}

._gemCount {
  display: inline-block;
  min-width: 1.5em;
  font-variant-numeric: tabular-nums;
  font-weight: 600;
}

._nameText {
  font-size: var(--sl-font-size-small);
}

._dataRow {
  cursor: pointer;
  background: var(--c-blanc);

  &._selected {
    background: var(--c-gris_clair);
  }

  &:hover {
    background: var(--c-gris_clair);
  }

  &:focus {
    outline: 2px solid var(--c-orange);
    outline-offset: -2px;
  }

  &:focus:not(:focus-visible) {
    outline: none;
  }
}

._emptyRow ._emptyCell {
  text-align: center;
  color: var(--c-gris_fonce);
  padding: calc(var(--spacing) * 2);
}

._typeBadge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 0.75rem;
  background: var(--c-gris_clair);
  white-space: nowrap;
}
</style>
