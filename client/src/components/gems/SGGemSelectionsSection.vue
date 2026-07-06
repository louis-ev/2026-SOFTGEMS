<template>
  <SGSectionPanel
    section_id="gem_selections"
    :title="$t('sg_section_gem_selections')"
  >
    <div v-if="is_loading">{{ $t("sg_loading_selections") }}</div>
    <div v-else-if="fetch_error" class="u-errorMsg">{{ fetch_error }}</div>
    <div v-else-if="membership_rows.length === 0" class="_empty">
      {{ $t("sg_gem_selections_empty") }}
    </div>
    <div v-else class="_membershipsRoot">
      <div
        v-if="type_filter_options.length > 1"
        class="_typeFilters"
        role="toolbar"
        :aria-label="$t('sg_gem_selections_filter_toolbar')"
      >
        <button
          type="button"
          class="u-button u-button_verysmall _typeFilterBtn"
          :class="{ 'is--active': !active_type_filter }"
          @click="setTypeFilter('')"
        >
          {{ $t("sg_gem_selections_filter_all") }}
          <span class="_typeFilterCount">{{ membership_rows.length }}</span>
        </button>
        <button
          v-for="type_def in type_filter_options"
          :key="type_def.value"
          type="button"
          class="u-button u-button_verysmall _typeFilterBtn"
          :class="{ 'is--active': active_type_filter === type_def.value }"
          @click="setTypeFilter(type_def.value)"
        >
          <b-icon :icon="type_def.icon" class="_typeFilterIcon" />
          {{ formatSelectionType(type_def.value) }}
          <span class="_typeFilterCount">{{
            typeFilterCount(type_def.value)
          }}</span>
        </button>
      </div>

      <p v-if="filtered_membership_rows.length === 0" class="_empty">
        {{ $t("sg_gem_selections_filter_empty") }}
      </p>

      <div v-else class="_tableWrap">
        <table class="_table" :aria-label="$t('sg_section_gem_selections')">
          <thead>
            <tr>
              <th scope="col">{{ $t("sg_gem_selection_added_at") }}</th>
              <th scope="col">{{ $t("sg_selection_type_label") }}</th>
              <th scope="col">{{ $t("sg_selection_internal_name") }}</th>
              <th scope="col">{{ $t("sg_selection_date") }}</th>
              <th scope="col">{{ $t("sg_selection_reference_number") }}</th>
              <th scope="col">{{ $t("sg_selection_main_document") }}</th>
              <th scope="col">{{ $t("sg_selection_counterparty") }}</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="row in filtered_membership_rows"
              :key="row.$path"
              class="_dataRow"
              tabindex="0"
              role="button"
              @click="openSelection(row)"
              @keydown.enter.prevent="openSelection(row)"
            >
              <td class="_addedAtCell">
                {{ formatAddedAtCell(row.added_at) }}
              </td>
              <td>
                <span class="_typeCell">
                  <b-icon :icon="typeIcon(row)" class="_typeIcon" />
                  <span>{{ formatSelectionType(row.selection_type) }}</span>
                  <span v-if="isCurrentBoxRow(row)" class="_boxBadge">
                    {{ $t("sg_gem_selections_current_box") }}
                  </span>
                </span>
              </td>
              <td>
                <span class="_nameText">{{ selectionLabel(row) }}</span>
              </td>
              <td>{{ formatDateCell(row.selection_date) }}</td>
              <td>{{ displayText(row.reference_number) }}</td>
              <td class="_mainDocumentCell">
                <a
                  v-if="mainDocumentUrl(row)"
                  class="u-buttonLink _mainDocumentLink"
                  :href="mainDocumentUrl(row)"
                  target="_blank"
                  rel="noopener noreferrer"
                  @click.stop
                >{{ mainDocumentFilename(row) }}</a>
                <span v-else>—</span>
              </td>
              <td>{{ counterpartyLabel(row.counterparty_path) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </SGSectionPanel>
</template>

<script>
import SGSectionPanel from "@/components/softgems/SGSectionPanel.vue";
import FormatDates from "@/mixins/FormatDates.js";
import Medias from "@/mixins/Medias.js";
import {
  buildGemSelectionMembershipRows,
  filterMembershipRowsByType,
  membershipTypeFilterOptions,
} from "@/utils/gem_selection_membership_rows.js";
import {
  selectionFolderSlugFromPath,
  selectionMembershipTypeSlug,
} from "@/utils/gem_selection_memberships.js";
import { findSelectionMainDocumentFile } from "@/utils/selection_documents.js";
import { selectionTypeIconFromSlug } from "@/utils/selection_type_registry.js";
import { selectionDetailPath } from "@/utils/selection_urls.js";
import { selectionTypeLabel as selectionTypeLabelFn } from "@/utils/selection_types.js";
import { resolveAddressBookPathLabels } from "@/utils/address_book_paths.js";

export default {
  name: "SGGemSelectionsSection",
  mixins: [FormatDates, Medias],
  components: {
    SGSectionPanel,
  },
  props: {
    gem_path: {
      type: String,
      required: true,
    },
    gem: {
      type: Object,
      default: null,
    },
  },
  data() {
    return {
      selections_root_path: "selections",
      selection_folders: [],
      membership_rows: [],
      counterparty_labels: {},
      active_type_filter: "",
      is_loading: false,
      fetch_error: "",
    };
  },
  computed: {
    type_filter_options() {
      return membershipTypeFilterOptions(this.membership_rows);
    },
    filtered_membership_rows() {
      return filterMembershipRowsByType(
        this.membership_rows,
        this.active_type_filter
      );
    },
  },
  watch: {
    gem_path: {
      immediate: true,
      handler() {
        this.loadMemberships();
      },
    },
    gem: {
      deep: true,
      handler() {
        this.loadMemberships();
      },
    },
  },
  methods: {
    setTypeFilter(selection_type_value) {
      this.active_type_filter = String(selection_type_value || "").trim();
    },
    typeFilterCount(selection_type_value) {
      const value = String(selection_type_value || "").trim();
      return this.membership_rows.filter(
        (row) => String(row?.selection_type || "").trim() === value
      ).length;
    },
    formatSelectionType(value) {
      return selectionTypeLabelFn(this.$t.bind(this), value);
    },
    typeIcon(row) {
      const slug = selectionMembershipTypeSlug(row);
      return selectionTypeIconFromSlug(slug);
    },
    isCurrentBoxRow(row) {
      const box_path = String(this.gem?.box_selection_path || "").trim();
      return Boolean(box_path && row?.$path === box_path);
    },
    selectionLabel(row) {
      const raw =
        typeof row?.internal_name === "string" ? row.internal_name.trim() : "";
      if (raw) return raw;
      return (
        selectionFolderSlugFromPath(row?.$path) ||
        this.$t("sg_selection_untitled")
      );
    },
    detailPath(row) {
      const folder_slug = selectionFolderSlugFromPath(row?.$path);
      const type_slug = selectionMembershipTypeSlug(row);
      return selectionDetailPath({
        type_slug,
        folder_slug,
        internal_name: row?.internal_name,
        selection_type: row?.selection_type,
      });
    },
    openSelection(row) {
      const path = this.detailPath(row);
      if (!path) return;
      this.$router.push(path);
    },
    displayText(value) {
      const raw =
        value === null || value === undefined ? "" : String(value).trim();
      return raw || "—";
    },
    formatDateCell(raw) {
      if (!raw) return "—";
      return this.formatDate(raw, {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
    },
    formatAddedAtCell(raw) {
      if (!raw) return "—";
      return this.formatRecentDateTime(raw);
    },
    counterpartyLabel(path_raw) {
      const path = String(path_raw || "").trim();
      if (!path) return "—";
      return this.counterparty_labels[path] || path;
    },
    mainDocumentFile(row) {
      return findSelectionMainDocumentFile(row);
    },
    mainDocumentFilename(row) {
      const file = this.mainDocumentFile(row);
      return file?.$media_filename || file?.$path?.split("/").pop() || "";
    },
    mainDocumentUrl(row) {
      const file = this.mainDocumentFile(row);
      if (!file?.$path || !file?.$media_filename) return "";
      return this.makeMediaFileURL({
        $path: file.$path,
        $media_filename: file.$media_filename,
      });
    },
    async enrichMembershipRowsWithFiles(rows) {
      const slugs = (Array.isArray(rows) ? rows : [])
        .map((row) => selectionFolderSlugFromPath(row?.$path))
        .filter(Boolean);
      if (!slugs.length) return rows;

      const { folders = [] } = await this.$api.getFoldersBySlugs({
        path: this.selections_root_path,
        folder_slugs: slugs,
        no_files: false,
      });
      const folder_by_path = new Map(
        folders.map((folder) => [String(folder?.$path || "").trim(), folder])
      );

      return rows.map((row) => {
        const path = String(row?.$path || "").trim();
        const enriched = folder_by_path.get(path);
        if (!enriched) return row;
        return { ...row, $files: enriched.$files || [] };
      });
    },
    async loadMemberships() {
      if (!this.gem_path) return;
      this.is_loading = true;
      this.fetch_error = "";
      try {
        const fetched = await this.$api.getFolders({
          path: this.selections_root_path,
        });
        this.selection_folders = Array.isArray(fetched) ? fetched : [];
        const rows = buildGemSelectionMembershipRows({
          gem_path: this.gem_path,
          gem: this.gem,
          selection_folders: this.selection_folders,
        });
        this.membership_rows = await this.enrichMembershipRowsWithFiles(rows);
        if (
          this.active_type_filter &&
          !this.type_filter_options.some(
            (def) => def.value === this.active_type_filter
          )
        ) {
          this.active_type_filter = "";
        }
        await this.resolveCounterpartyLabels(this.membership_rows);
      } catch ({ code }) {
        this.fetch_error = code || this.$t("sg_could_not_load_selections");
        this.selection_folders = [];
        this.membership_rows = [];
      } finally {
        this.is_loading = false;
      }
    },
    async resolveCounterpartyLabels(rows) {
      const paths = (Array.isArray(rows) ? rows : [])
        .map((row) => String(row?.counterparty_path || "").trim())
        .filter(Boolean);
      const resolved = await resolveAddressBookPathLabels(this.$api, paths);
      this.counterparty_labels = {
        ...this.counterparty_labels,
        ...resolved,
      };
    },
  },
};
</script>

<style lang="scss" scoped>
@use "@/utils/sg_data_table.scss" as sg_data_table;

._empty {
  color: var(--c-gris_fonce);
}

._membershipsRoot {
  display: flex;
  flex-direction: column;
  gap: calc(var(--spacing) * 0.85);
}

._typeFilters {
  display: flex;
  flex-wrap: wrap;
  gap: calc(var(--spacing) * 0.4);
}

._typeFilterBtn {
  display: inline-flex;
  align-items: center;
  gap: calc(var(--spacing) * 0.3);

  &.is--active {
    background: var(--c-bleuvert);
    color: var(--c-blanc);
    border-color: var(--c-bleuvert);
  }
}

._typeFilterIcon {
  flex-shrink: 0;
}

._typeFilterCount {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.15rem;
  padding: 0 4px;
  border-radius: 999px;
  font-size: 0.68rem;
  font-weight: 600;
  line-height: 1.2;
  background: color-mix(in srgb, currentColor 14%, transparent);
}

._tableWrap {
  overflow-x: auto;
}

._table {
  @include sg_data_table.sg-data-table;
  width: 100%;
}

._dataRow {
  cursor: pointer;

  &:hover td {
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

._nameText {
  font-size: var(--sl-font-size-small);
}

._addedAtCell {
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}

._typeCell {
  display: inline-flex;
  align-items: center;
  gap: calc(var(--spacing) * 0.35);
  white-space: nowrap;
}

._typeIcon {
  flex-shrink: 0;
}

._boxBadge {
  display: inline-block;
  margin-left: calc(var(--spacing) * 0.25);
  padding: 1px 6px;
  border-radius: 999px;
  font-size: 0.68rem;
  background: var(--c-gris_clair);
  color: var(--c-gris_fonce);
}

._mainDocumentCell {
  max-width: 14rem;
}

._mainDocumentLink {
  display: inline-block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  vertical-align: bottom;
}
</style>
