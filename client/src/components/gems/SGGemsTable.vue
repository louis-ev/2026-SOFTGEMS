<template>
  <div class="_gemsTable">
    <table class="_table">
      <thead>
        <tr>
          <th
            v-for="metadata_key in metadata_keys"
            :key="metadata_key"
            :class="[
              getStickyColumnClass(metadata_key),
              { _sortableHeader: isSortableColumn(metadata_key) },
            ]"
            :aria-sort="getAriaSort(metadata_key)"
          >
            <button
              type="button"
              class="_thButton"
              :disabled="!isSortableColumn(metadata_key)"
              @click="onHeaderClick(metadata_key)"
            >
              <span class="_thContent">
                <b-icon
                  v-if="metadata_icons[metadata_key]"
                  :icon="metadata_icons[metadata_key]"
                  class="_thIcon"
                />
                <span>{{ metadata_labels[metadata_key] || metadata_key }}</span>
              </span>
              <b-icon
                v-if="isSortableColumn(metadata_key)"
                :icon="getSortIcon(metadata_key)"
                class="_sortIcon"
              />
            </button>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="sorted_gems.length === 0">
          <td :colspan="metadata_keys.length">{{ $t("sg_no_gems_yet") }}</td>
        </tr>
        <tr
          v-for="gem in sorted_gems"
          :key="gem.$path"
          class="_clickableRow"
          :class="{
            _selected: is_gem_open && getGemId(gem) === selected_gem_id,
          }"
          @click="onRowClick(gem)"
        >
          <td
            v-for="metadata_key in metadata_keys"
            :key="`${gem.$path}-${metadata_key}`"
            :class="[
              getStickyColumnClass(metadata_key),
              { _editableCell: isFieldEditable(metadata_key) },
            ]"
            :data-metadata-key="metadata_key"
            @click="onCellClick(gem, metadata_key, $event)"
          >
            <div
              v-if="metadata_key === '$cover'"
              class="_coverThumb"
              @click.stop
            >
              <CoverField
                :context="'tiny'"
                :ratio="'1 / 1'"
                :cover="gem.$cover"
                :path="gem.$path"
                :can_edit="true"
                :available_options="['import']"
              />
            </div>
            <span v-else class="_gemMetadataValue">{{
              formatValue(resolveMetadataValue(gem, metadata_key))
            }}</span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
import CoverField from "@/adc-core/fields/CoverField.vue";

export default {
  name: "SGGemsTable",
  components: { CoverField },
  props: {
    gems: { type: Array, default: () => [] },
    metadata_keys: { type: Array, default: () => [] },
    metadata_labels: { type: Object, default: () => ({}) },
    metadata_icons: { type: Object, default: () => ({}) },
    field_editable_map: { type: Object, default: () => ({}) },
    selected_gem_id: { type: String, default: "" },
    is_gem_open: { type: Boolean, default: false },
  },
  data() {
    return {
      sort_key: "id",
      sort_direction: "desc",
    };
  },
  computed: {
    sorted_gems() {
      if (!Array.isArray(this.gems)) return [];
      const sorted_gems = [...this.gems];
      if (!this.sort_key) return sorted_gems;

      const sort_direction_factor = this.sort_direction === "asc" ? 1 : -1;
      return sorted_gems.sort((a_gem, b_gem) => {
        const comparison = this.compareSortValues(
          this.resolveSortValue(a_gem, this.sort_key),
          this.resolveSortValue(b_gem, this.sort_key)
        );
        if (comparison !== 0) return comparison * sort_direction_factor;

        const a_id = this.getGemId(a_gem);
        const b_id = this.getGemId(b_gem);
        return a_id.localeCompare(b_id, undefined, {
          numeric: true,
          sensitivity: "base",
        });
      });
    },
  },
  watch: {
    metadata_keys: {
      immediate: true,
      handler(new_keys) {
        if (!Array.isArray(new_keys) || new_keys.length === 0) {
          this.sort_key = "";
          return;
        }

        if (!new_keys.includes(this.sort_key)) {
          this.sort_key = new_keys.includes("id") ? "id" : new_keys[0];
          this.sort_direction = this.sort_key === "id" ? "desc" : "asc";
        }
      },
    },
  },
  methods: {
    getGemId(gem) {
      const gem_path = gem?.$path || "";
      if (!gem_path) return "";
      const path_parts = gem_path.split("/");
      return path_parts[path_parts.length - 1] || "";
    },
    resolveMetadataValue(gem, metadata_key) {
      if (metadata_key === "id") return this.getGemId(gem);
      return gem?.[metadata_key];
    },
    formatValue(value) {
      if (value === null || value === undefined || value === "") return "-";
      if (typeof value === "number")
        return Number.isFinite(value) ? value : "-";
      if (typeof value === "object") return JSON.stringify(value);
      return String(value);
    },
    resolveSortValue(gem, metadata_key) {
      const raw_value = this.resolveMetadataValue(gem, metadata_key);
      if (raw_value === null || raw_value === undefined) return "";
      if (typeof raw_value === "number") return raw_value;
      if (typeof raw_value === "boolean") return raw_value ? 1 : 0;
      if (typeof raw_value === "object") return JSON.stringify(raw_value);
      return String(raw_value).trim().toLowerCase();
    },
    compareSortValues(a_value, b_value) {
      const a_is_number =
        typeof a_value === "number" && Number.isFinite(a_value);
      const b_is_number =
        typeof b_value === "number" && Number.isFinite(b_value);

      if (a_is_number && b_is_number) return a_value - b_value;

      return String(a_value).localeCompare(String(b_value), undefined, {
        numeric: true,
        sensitivity: "base",
      });
    },
    isSortableColumn(metadata_key) {
      return metadata_key !== "$cover";
    },
    onHeaderClick(metadata_key) {
      if (!this.isSortableColumn(metadata_key)) return;

      if (this.sort_key === metadata_key) {
        this.sort_direction = this.sort_direction === "asc" ? "desc" : "asc";
        return;
      }

      this.sort_key = metadata_key;
      this.sort_direction = metadata_key === "id" ? "desc" : "asc";
    },
    getSortIcon(metadata_key) {
      if (this.sort_key !== metadata_key) return "arrow-down-up";
      return this.sort_direction === "asc" ? "sort-up" : "sort-down";
    },
    getAriaSort(metadata_key) {
      if (!this.isSortableColumn(metadata_key)) return "none";
      if (this.sort_key !== metadata_key) return "none";
      return this.sort_direction === "asc" ? "ascending" : "descending";
    },
    isFieldEditable(metadata_key) {
      return Boolean(this.field_editable_map[metadata_key]);
    },
    onRowClick(gem) {
      this.$emit("rowClick", gem);
    },
    onCellClick(gem, metadata_key, event) {
      if (!this.isFieldEditable(metadata_key)) return;
      event.stopPropagation();
      this.$emit("editCell", { gem, metadata_key });
    },
    getStickyColumnClass(metadata_key) {
      if (metadata_key === "id") return "_stickyIdCol";
      if (metadata_key === "$cover") return "_stickyCoverCol";
      return "";
    },
  },
};
</script>

<style lang="scss" scoped>
._gemsTable {
  flex: 1;
  min-height: 0;
  overflow: auto;
}

._table {
  --sticky-id-col-width: 50px;
  --sticky-cover-col-width: 80px;

  border-collapse: collapse;
  border-spacing: 0;
  border: 1px solid var(--c-gris);
  width: max-content;
  min-width: 100%;

  th,
  td {
    text-align: left;
    border: 1px solid red;
    // border: 1px solid var(--c-gris);
    padding: calc(var(--spacing) / 2);
    vertical-align: top;
    background: var(--c-bodybg);
  }

  th {
    position: sticky;
    top: 0;
    z-index: 5;
  }

  th._stickyIdCol,
  td._stickyIdCol {
    position: sticky;
    left: 0;
    min-width: var(--sticky-id-col-width);
    max-width: var(--sticky-id-col-width);
    z-index: 4;
  }

  th._stickyCoverCol,
  td._stickyCoverCol {
    position: sticky;
    left: var(--sticky-id-col-width);
    min-width: var(--sticky-cover-col-width);
    max-width: var(--sticky-cover-col-width);
    z-index: 3;
    overflow: hidden;
    border-right: 1px solid var(--c-gris_clair);
  }

  th._stickyIdCol,
  th._stickyCoverCol {
    z-index: 7;
  }

  th._stickyCoverCol {
    z-index: 8;
  }
}

._thButton {
  border: 0;
  background: transparent;
  width: 100%;
  padding: 0;
  margin: 0;
  text-align: left;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: calc(var(--spacing) / 3);
  cursor: pointer;
  color: inherit;
}

._thButton:disabled {
  cursor: default;
}

._sortIcon {
  opacity: 0.7;
  flex-shrink: 0;
}

._clickableRow {
  cursor: pointer;

  &._selected {
    background: var(--c-gris_clair);
  }
}

._clickableRow:hover {
  background: var(--c-gris_clair);
}

._clickableRow:hover td._stickyIdCol,
._clickableRow:hover td._stickyCoverCol,
._clickableRow._selected td._stickyIdCol,
._clickableRow._selected td._stickyCoverCol {
  background: var(--c-gris_clair);
}

td[data-metadata-key="$cover"] {
  width: var(--sticky-cover-col-width);
}

._editableCell {
  cursor: pointer;

  &:hover {
    background: var(
      --c-bleuvert_clair,
      color-mix(in srgb, var(--c-bleuvert) 12%, transparent)
    );
    ._gemMetadataValue {
      color: var(--c-noir);
    }
  }
}

._gemMetadataValue {
  font-family: var(--sl-font-mono);
  font-size: var(--sl-font-size-x-small);
}
td[data-metadata-key="id"] {
  ._gemMetadataValue {
    font-size: var(--sl-font-size-medium);
  }
}
td[data-metadata-key="$cover"] {
  margin: 0;
  padding: 0;
}

._thContent {
  display: flex;
  align-items: center;
  gap: calc(var(--spacing) / 4);
  white-space: nowrap;
}

._thIcon {
  flex-shrink: 0;
  opacity: 0.7;
}

._coverFilesCell {
}

._coverThumb {
  width: var(--sticky-cover-col-width);
  height: var(--sticky-cover-col-height);
  flex-shrink: 0;
}

._filesCount {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  font-size: var(--sl-font-size-x-small);
  font-family: var(--sl-font-mono);
  color: var(--c-gris_fonce);
  padding-top: 2px;
}
</style>
