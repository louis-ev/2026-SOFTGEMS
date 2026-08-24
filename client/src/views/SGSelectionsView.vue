<template>
  <div class="_selectionsView">
    <SGOverlaySidePanelLayout
      :panel_open="is_selections_panel_open"
      @close="closePanel"
    >
      <div class="_selectionsView--content">
        <div class="_pageHeader">
          <h1 class="_pageTitle">{{ page_title }}</h1>
          <div class="_headerActions">
            <router-link
              :to="create_path"
              class="u-button u-button_small u-button_bleuvert"
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
            <table class="_table" :aria-label="page_title">
              <thead>
                <tr>
                  <th scope="col" class="_colId">
                    {{ $t("sg_id") }}
                  </th>
                  <th scope="col" class="_colName">
                    {{ $t("sg_selection_internal_name") }}
                  </th>
                  <th scope="col" class="_colCreated">
                    {{ $t("sg_created") }}
                  </th>
                  <th scope="col" class="_colCount">
                    {{ $t("sg_selection_gem_count") }}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="sorted_entries.length === 0" class="_emptyRow">
                  <td colspan="4" class="_emptyCell">
                    {{ $t("sg_selections_empty") }}
                  </td>
                </tr>
                <template v-else>
                  <tr
                    v-for="row in paginated_entries"
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
                    <td class="_colId">
                      <span class="_idText">{{
                        selectionSlugFromPath(row.$path)
                      }}</span>
                    </td>
                    <td class="_colName">
                      <span class="_nameText">{{ selectionLabel(row) }}</span>
                    </td>
                    <td class="_colCreated">
                      <time
                        v-if="row.$date_created"
                        :datetime="row.$date_created"
                        class="_createdText"
                      >
                        {{ formatCreatedDate(row.$date_created) }}
                      </time>
                      <span v-else class="_createdEmpty">—</span>
                    </td>
                    <td class="_colCount">
                      <span class="_gemCount">{{ entryCount(row) }}</span>
                    </td>
                  </tr>
                </template>
              </tbody>
            </table>
          </div>
          <SGTablePager
            :total_items="sorted_entries.length"
            :page_index="table_page_index"
            :page_count="table_page_count"
            :range_start="table_page_range_start"
            :range_end="table_page_range_end"
            :page_size="table_page_size"
            @pageChange="goToTablePage($event, sorted_entries)"
            @update:page_size="onTablePageSizeChange"
          />
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
import SGTablePager from "@/components/softgems/SGTablePager.vue";
import FormatDates from "@/mixins/FormatDates.js";
import { createTablePaginationMixin } from "@/mixins/TablePaginationMixin.js";
import { selectionTypeFromSlug } from "@/utils/selection_type_registry.js";
import {
  parseSelectionUrlSegment,
  selectionDetailPath,
  selectionListPath,
  selectionNewPath,
} from "@/utils/selection_urls.js";
import {
  selectionFolderSlugFromPath,
  selectionTypeRootPath,
} from "@/utils/selection_paths.js";
import { selectionTypeListLabel as selectionTypeListLabelFn } from "@/utils/selection_types.js";
import { normalizeSelectionGemPaths } from "@/utils/selection_entries.js";

export default {
  name: "SGSelectionsView",
  mixins: [FormatDates, createTablePaginationMixin("selections")],
  components: {
    SGOverlaySidePanelLayout,
    SGTablePager,
  },
  props: {
    type_slug: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      selection_entries: [],
      is_loading: false,
      fetch_error: "",
      table_rows_previous_length: null,
    };
  },
  computed: {
    type_root_path() {
      return selectionTypeRootPath(this.type_slug);
    },
    active_selection_type() {
      return selectionTypeFromSlug(this.type_slug);
    },
    page_title() {
      if (!this.active_selection_type) return this.$t("sg_selections");
      return selectionTypeListLabelFn(
        this.$t.bind(this),
        this.active_selection_type
      );
    },
    create_path() {
      return selectionNewPath(this.type_slug);
    },
    is_selections_panel_open() {
      return ["Create selection", "Open selection"].includes(this.$route.name);
    },
    filtered_entries() {
      return Array.isArray(this.selection_entries) ? this.selection_entries : [];
    },
    sorted_entries() {
      return [...this.filtered_entries].sort((a, b) => {
        const time_a = a?.$date_created
          ? new Date(a.$date_created).getTime()
          : NaN;
        const time_b = b?.$date_created
          ? new Date(b.$date_created).getTime()
          : NaN;
        if (Number.isFinite(time_a) && Number.isFinite(time_b)) {
          if (time_b !== time_a) return time_b - time_a;
        } else if (Number.isFinite(time_b) && !Number.isFinite(time_a)) {
          return 1;
        } else if (Number.isFinite(time_a) && !Number.isFinite(time_b)) {
          return -1;
        }
        const slug_a = this.selectionSlugFromPath(a?.$path);
        const slug_b = this.selectionSlugFromPath(b?.$path);
        return slug_b.localeCompare(slug_a, undefined, { numeric: true });
      });
    },
    paginated_entries() {
      return this.paginateTableRows(this.sorted_entries);
    },
    table_page_count() {
      return this.tablePageCountForRows(this.sorted_entries);
    },
    table_page_range_start() {
      return this.tablePageRangeStartForRows(this.sorted_entries);
    },
    table_page_range_end() {
      return this.tablePageRangeEndForRows(this.sorted_entries);
    },
    selected_folder_slug() {
      if (this.$route.name !== "Open selection") return "";
      const raw = this.cleanString(this.$route.params.selection_path);
      const parsed = parseSelectionUrlSegment(raw);
      return parsed.folder_slug || "";
    },
  },
  watch: {
    type_slug: {
      immediate: true,
      handler(new_type_slug, old_type_slug) {
        if (!this.active_selection_type) {
          this.$router.replace("/selections");
          return;
        }
        if (old_type_slug === undefined) return;
        if (new_type_slug === old_type_slug) return;

        const previous_room = selectionTypeRootPath(old_type_slug);
        if (previous_room) this.$api.leave({ room: previous_room });
        if (this.type_root_path) this.$api.join({ room: this.type_root_path });
        this.fetchSelections();
      },
    },
    sorted_entries: {
      handler(new_entries) {
        const new_len = Array.isArray(new_entries) ? new_entries.length : 0;
        this.resetTablePageIndexOnRowCountChange(
          new_len,
          this.table_rows_previous_length
        );
        this.table_rows_previous_length = new_len;
        this.clampTablePageIndexForRows(new_entries);
      },
    },
  },
  mounted() {
    this.fetchSelections();
    this.$api.join({ room: this.type_root_path });
  },
  beforeDestroy() {
    this.$api.leave({ room: this.type_root_path });
  },
  methods: {
    formatCreatedDate(raw) {
      if (!raw) return "—";
      return this.formatDate(raw, {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
    },
    selectionSlugFromPath(folder_path) {
      return selectionFolderSlugFromPath(folder_path);
    },
    selectionLabel(row) {
      const raw =
        typeof row?.internal_name === "string" ? row.internal_name.trim() : "";
      if (raw) return raw;
      return "—";
    },
    entryCount(row) {
      return normalizeSelectionGemPaths(row?.selection_entries).length;
    },
    cleanString(value) {
      if (value === null || value === undefined) return "";
      return String(value).trim();
    },
    closePanel() {
      this.$router.push(selectionListPath(this.type_slug));
    },
    openSelection(row) {
      const slug = this.selectionSlugFromPath(row?.$path);
      if (!slug) return;
      const path = selectionDetailPath({
        type_slug: this.type_slug,
        folder_slug: slug,
      });
      this.$router.push(path);
    },
    async fetchSelections() {
      this.is_loading = true;
      this.fetch_error = "";
      try {
        const fetched = await this.$api.getFolders({
          path: this.type_root_path,
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
@use "@/utils/sg_data_table.scss" as sg_data_table;

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
  @include sg-page-padding(
    calc(var(--spacing) * 2) calc(var(--spacing) * 3)
      calc(var(--spacing) * 1)
  );
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
  @include sg_data_table.sg-data-table-wrap;
}

._table {
  @include sg_data_table.sg-data-table;
  width: 100%;

  thead th._colCount {
    text-align: right;
  }
}

._colName {
  width: 42%;
}

._colCreated {
  width: 34%;
  white-space: nowrap;
}

._colCount {
  width: 20%;
  white-space: nowrap;
  text-align: right;
}

._createdText {
  font-variant-numeric: tabular-nums;
  color: var(--c-gris_fonce);
}

._createdEmpty {
  color: var(--c-gris_fonce);
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

._emptyRow ._emptyCell {
  text-align: center;
  color: var(--c-gris_fonce);
  padding: calc(var(--spacing) * 2);
}
</style>
