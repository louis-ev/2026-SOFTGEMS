<template>
  <div class="_gemsTableRoot">
    <div class="_gemsTable" :class="density_class">
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
              <span
                v-if="isSortableColumn(metadata_key)"
                class="_sortArrows"
                :class="{ _activeSort: sort_key === metadata_key }"
              >
                <b-icon
                  icon="caret-up-fill"
                  class="_sortArrow"
                  :class="{
                    _active:
                      sort_key === metadata_key && sort_direction === 'asc',
                  }"
                />
                <b-icon
                  icon="caret-down-fill"
                  class="_sortArrow"
                  :class="{
                    _active:
                      sort_key === metadata_key && sort_direction === 'desc',
                  }"
                />
              </span>
            </button>
          </th>
        </tr>
      </thead>
      <transition-group name="row-sort" tag="tbody">
        <tr v-if="sorted_gems.length === 0" key="_empty">
          <td :colspan="metadata_keys.length">
            {{
              inventory_has_gems
                ? $t("sg_no_gems_match_filters")
                : $t("sg_no_gems_yet")
            }}
          </td>
        </tr>
        <tr
          v-for="gem in paginated_gems"
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
              {
                _editableCell: isFieldEditable(metadata_key),
                _flashCell: isCellFlashing(gem, metadata_key),
              },
            ]"
            :data-cell-key="getCellFlashKey(gem, metadata_key)"
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
            <div
              v-else-if="isGemPricingTotalColumnKey(metadata_key)"
              class="_pricingCell"
            >
              <span class="_pricingLine _pricingTotal">{{
                formatPriceCellNumber(resolveMetadataValue(gem, metadata_key))
              }}</span>
              <span class="_pricingLine _pricingPerCt">{{
                formatPricingPerCtLine(gem, metadata_key)
              }}</span>
            </div>
            <span v-else class="_gemMetadataValue">{{
              formatValue(formatMetadataCellDisplay(gem, metadata_key))
            }}</span>
          </td>
        </tr>
      </transition-group>
      </table>
    </div>
  </div>
</template>

<script>
import CoverField from "@/adc-core/fields/CoverField.vue";
import GemPricing from "@/mixins/GemPricing";

export default {
  name: "SGGemsTable",
  mixins: [GemPricing],
  components: { CoverField },
  props: {
    gems: { type: Array, default: () => [] },
    metadata_keys: { type: Array, default: () => [] },
    metadata_labels: { type: Object, default: () => ({}) },
    metadata_icons: { type: Object, default: () => ({}) },
    field_editable_map: { type: Object, default: () => ({}) },
    selected_gem_id: { type: String, default: "" },
    is_gem_open: { type: Boolean, default: false },
    view_density: { type: String, default: "medium" },
    inventory_has_gems: { type: Boolean, default: false },
    gems_page_size: { type: Number, default: 100 },
  },
  data() {
    return {
      gems_page_index: 0,
      gems_watch_previous_length: null,
      sort_key: "id",
      sort_direction: "desc",
      has_initialized_snapshot: false,
      previous_cell_values: {},
      flashing_cells: {},
      flash_timeouts: {},
    };
  },
  computed: {
    density_class() {
      if (this.view_density === "compact") return "_densityCompact";
      if (this.view_density === "large") return "_densityLarge";
      return "_densityMedium";
    },
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
    gems_effective_page_size() {
      return Math.max(1, Number(this.gems_page_size) || 100);
    },
    gems_page_count() {
      const total = this.sorted_gems.length;
      if (total <= 0) return 1;
      const size = this.gems_effective_page_size;
      return Math.max(1, Math.ceil(total / size));
    },
    paginated_gems() {
      const gems = this.sorted_gems;
      const size = this.gems_effective_page_size;
      const start = this.gems_page_index * size;
      return gems.slice(start, start + size);
    },
    gems_page_range_start() {
      const total = this.sorted_gems.length;
      if (total <= 0) return 0;
      return this.gems_page_index * this.gems_effective_page_size + 1;
    },
    gems_page_range_end() {
      const total = this.sorted_gems.length;
      if (total <= 0) return 0;
      const end = (this.gems_page_index + 1) * this.gems_effective_page_size;
      return Math.min(end, total);
    },
  },
  watch: {
    gems_page_index() {
      this.emitGemsPagerPayload();
    },
    gems_page_count() {
      this.emitGemsPagerPayload();
    },
    gems: {
      immediate: true,
      deep: true,
      handler(new_gems) {
        const new_len = Array.isArray(new_gems) ? new_gems.length : 0;
        if (
          this.gems_watch_previous_length !== null &&
          this.gems_watch_previous_length !== new_len
        ) {
          this.gems_page_index = 0;
        }
        this.gems_watch_previous_length = new_len;
        this.clampGemsPageIndex();
        this.detectUpdatedCells(new_gems);
        this.emitGemsPagerPayload();
      },
    },
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
          this.gems_page_index = 0;
          this.scrollGemsTableToTop();
          this.$nextTick(() => this.emitGemsPagerPayload());
        }
      },
    },
  },
  mounted() {
    this.$nextTick(() => this.emitGemsPagerPayload());
  },
  beforeDestroy() {
    Object.values(this.flash_timeouts).forEach((timeout_id) => {
      clearTimeout(timeout_id);
    });
  },
  methods: {
    clampGemsPageIndex() {
      const max_index = Math.max(0, this.gems_page_count - 1);
      if (this.gems_page_index > max_index) this.gems_page_index = max_index;
    },
    goToGemsPage(delta) {
      const next = this.gems_page_index + delta;
      if (next < 0 || next >= this.gems_page_count) return;
      this.gems_page_index = next;
      this.scrollGemsTableToTop();
      this.emitGemsPagerPayload();
    },
    scrollGemsTableToTop() {
      this.$nextTick(() => {
        const el = this.$el?.querySelector("._gemsTable");
        if (el && typeof el.scrollTop !== "undefined") el.scrollTop = 0;
      });
    },
    getGemId(gem) {
      const gem_path = gem?.$path || "";
      if (!gem_path) return "";
      const path_parts = gem_path.split("/");
      return path_parts[path_parts.length - 1] || "";
    },
    formatMetadataCellDisplay(gem, metadata_key) {
      if (metadata_key === "$date_modified") {
        const raw = gem?.$date_modified;
        if (raw === null || raw === undefined || raw === "") return "";
        const time_value = new Date(raw).getTime();
        if (!Number.isFinite(time_value)) return String(raw);
        return new Date(raw).toLocaleString(this.$i18n.locale, {
          dateStyle: "short",
          timeStyle: "short",
        });
      }
      return this.resolveMetadataValue(gem, metadata_key);
    },
    resolveMetadataValue(gem, metadata_key) {
      if (metadata_key === "id") return this.getGemId(gem);
      return gem?.[metadata_key];
    },
    formatValue(value) {
      if (value === null || value === undefined || value === "") return "-";
      if (typeof value === "number")
        return Number.isFinite(value)
          ? value.toLocaleString(this.$i18n.locale, {
              maximumFractionDigits: 3,
            })
          : "-";
      if (typeof value === "object") return JSON.stringify(value);
      return String(value);
    },
    formatPriceCellNumber(value) {
      if (value === null || value === undefined || value === "") return "-";
      const n = Number(value);
      if (!Number.isFinite(n)) return "-";
      return n.toLocaleString(this.$i18n.locale, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      });
    },
    formatPricingPerCtLine(gem, total_key) {
      const w = this.toNumberOrDefault(gem?.weight_ct);
      if (!Number.isFinite(w) || w <= 0) return "- /ct";
      const per = this.computeDisplayedPerCaratForGem(gem, total_key);
      return `${this.formatPriceCellNumber(per)} /ct`;
    },
    resolveSortValue(gem, metadata_key) {
      if (metadata_key === "$date_modified") {
        const raw = gem?.$date_modified;
        const time_value = raw ? new Date(raw).getTime() : 0;
        return Number.isFinite(time_value) ? time_value : 0;
      }
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
      } else {
        this.sort_key = metadata_key;
        this.sort_direction = metadata_key === "id" ? "desc" : "asc";
      }
      this.gems_page_index = 0;
      this.scrollGemsTableToTop();
      this.emitGemsPagerPayload();
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
    getCellFlashKey(gem, metadata_key) {
      return `${gem?.$path || ""}::${metadata_key}`;
    },
    serializeCellValue(value) {
      if (value === null || value === undefined) return "";
      if (typeof value === "number" || typeof value === "boolean")
        return String(value);
      if (typeof value === "object") return JSON.stringify(value);
      return String(value);
    },
    buildCellSnapshot(gems) {
      const snapshot = {};
      if (!Array.isArray(gems)) return snapshot;

      gems.forEach((gem) => {
        this.metadata_keys.forEach((metadata_key) => {
          const cell_key = this.getCellFlashKey(gem, metadata_key);
          if (this.isGemPricingTotalColumnKey(metadata_key)) {
            const total = this.resolveMetadataValue(gem, metadata_key);
            const per = this.computeDisplayedPerCaratForGem(gem, metadata_key);
            snapshot[cell_key] = [
              this.serializeCellValue(total),
              this.serializeCellValue(per),
              this.serializeCellValue(gem?.weight_ct),
            ].join("|");
            return;
          }
          const cell_value = this.resolveMetadataValue(gem, metadata_key);
          snapshot[cell_key] = this.serializeCellValue(cell_value);
        });
      });
      return snapshot;
    },
    detectUpdatedCells(new_gems) {
      const next_snapshot = this.buildCellSnapshot(new_gems);
      let first_changed_cell_key = "";

      if (!this.has_initialized_snapshot) {
        this.previous_cell_values = next_snapshot;
        this.has_initialized_snapshot = true;
        return;
      }

      Object.keys(next_snapshot).forEach((cell_key) => {
        if (!(cell_key in this.previous_cell_values)) return;
        if (this.previous_cell_values[cell_key] === next_snapshot[cell_key])
          return;
        if (!first_changed_cell_key) first_changed_cell_key = cell_key;
        this.flashCell(cell_key);
      });

      this.previous_cell_values = next_snapshot;

      if (first_changed_cell_key) {
        this.scrollCellIntoViewIfNeeded(first_changed_cell_key);
      }
    },
    flashCell(cell_key) {
      const flash_duration_ms = 4000;
      if (this.flash_timeouts[cell_key]) {
        clearTimeout(this.flash_timeouts[cell_key]);
        this.$delete(this.flash_timeouts, cell_key);
      }

      this.$set(this.flashing_cells, cell_key, false);
      this.$nextTick(() => {
        this.$set(this.flashing_cells, cell_key, true);
        this.flash_timeouts[cell_key] = setTimeout(() => {
          this.$delete(this.flashing_cells, cell_key);
          this.$delete(this.flash_timeouts, cell_key);
        }, flash_duration_ms);
      });
    },
    isCellFlashing(gem, metadata_key) {
      const cell_key = this.getCellFlashKey(gem, metadata_key);
      return Boolean(this.flashing_cells[cell_key]);
    },
    scrollCellIntoViewIfNeeded(cell_key) {
      this.$nextTick(() => {
        const scroll_container = this.$el?.querySelector("._gemsTable");
        if (!scroll_container) return;

        const cell_elements = this.$el.querySelectorAll("td[data-cell-key]");
        const cell_element = Array.from(cell_elements).find(
          (element) => element?.dataset?.cellKey === cell_key
        );
        if (!cell_element) return;

        const cell_rect = cell_element.getBoundingClientRect();
        const container_rect = scroll_container.getBoundingClientRect();
        const is_outside_vertical =
          cell_rect.top < container_rect.top ||
          cell_rect.bottom > container_rect.bottom;
        const is_outside_horizontal =
          cell_rect.left < container_rect.left ||
          cell_rect.right > container_rect.right;
        if (!is_outside_vertical && !is_outside_horizontal) return;

        if (typeof cell_element.scrollIntoViewIfNeeded === "function") {
          cell_element.scrollIntoViewIfNeeded(false);
          return;
        }

        cell_element.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "nearest",
        });
      });
    },
  },
};
</script>

<style lang="scss" scoped>
._gemsTableRoot {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  gap: calc(var(--spacing) / 2);
}

._gemsPager {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: calc(var(--spacing) / 2);
  padding: calc(var(--spacing) / 3) 0;
}

._gemsPagerStatus {
  margin: 0;
  font-size: var(--sl-font-size-small);
  color: var(--c-gris_fonce);
  text-align: center;
}

._gemsPagerBtn {
  flex-shrink: 0;
}

._gemsTable {
  --sticky-id-col-width: 80px;
  --sticky-cover-col-width: 80px;
  --sticky-cover-col-height: 80px;
  --sg-cell-padding: calc(var(--spacing) / 2);
  --sg-metadata-font-size: var(--sl-font-size-x-small);
  --sg-id-font-size: var(--sl-font-size-medium);

  flex: 1;
  min-height: 0;
  overflow: auto;
}

._gemsTable._densityCompact {
  --sticky-id-col-width: 72px;
  --sticky-cover-col-width: 62px;
  --sticky-cover-col-height: 62px;
  --sg-cell-padding: calc(var(--spacing) / 3);
  --sg-metadata-font-size: 0.68rem;
  --sg-id-font-size: 0.82rem;
}

._gemsTable._densityMedium {
  --sticky-id-col-width: 80px;
  --sticky-cover-col-width: 80px;
  --sticky-cover-col-height: 80px;
  --sg-cell-padding: calc(var(--spacing) / 2);
  --sg-metadata-font-size: var(--sl-font-size-x-small);
  --sg-id-font-size: var(--sl-font-size-medium);
}

._gemsTable._densityLarge {
  --sticky-id-col-width: 96px;
  --sticky-cover-col-width: 104px;
  --sticky-cover-col-height: 104px;
  --sg-cell-padding: calc(var(--spacing) * 0.66);
  --sg-metadata-font-size: var(--sl-font-size-small);
  --sg-id-font-size: var(--sl-font-size-large);
}

._table {
  border-collapse: separate;
  border-spacing: 0;
  border: 1px solid var(--c-gris);
  border-left: 0px;
  border-top: 0px;
  width: max-content;
  min-width: 100%;

  th,
  td {
    text-align: left;
    border: 0;
    border-right: 1px solid var(--c-gris);
    border-bottom: 1px solid var(--c-gris);
    padding: var(--sg-cell-padding);
    vertical-align: top;
    background: var(--c-bodybg);
    font-size: var(--sg-metadata-font-size);
  }

  tr > :last-child {
    border-right: 0;
  }

  tbody tr:last-child td {
    border-bottom: 0;
  }

  th {
    position: sticky;
    top: 0;
    border-top: 1px solid var(--c-gris);
    z-index: 5;

    &:hover {
      background: var(--c-gris_clair);
    }
  }

  th._stickyIdCol,
  td._stickyIdCol {
    position: sticky;
    left: 0px;
    min-width: var(--sticky-id-col-width);
    max-width: var(--sticky-id-col-width);
    z-index: 4;
    border-left: 1px solid var(--c-gris);
    // box-shadow: inset -1px 0 0 var(--c-gris);
  }

  th._stickyCoverCol,
  td._stickyCoverCol {
    position: sticky;
    left: var(--sticky-id-col-width);
    min-width: var(--sticky-cover-col-width);
    max-width: var(--sticky-cover-col-width);
    z-index: 3;
    overflow: hidden;
    // border-left: 1px solid var(--c-gris);
  }

  th._stickyIdCol,
  th._stickyCoverCol {
    z-index: 7;
  }

  th._stickyCoverCol {
    z-index: 8;
  }

  td {
    font-size: var(--sg-metadata-font-size);
    font-family: var(--sl-font-mono);
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

._sortArrows {
  display: inline-flex;
  flex-direction: column;
  gap: 0;
  opacity: 0.75;
  flex-shrink: 0;
  margin-top: -12px;
  margin-bottom: -12px;
  // display: none;
}

._sortArrow {
  font-size: 0.52rem;
  opacity: 0.28;
  color: var(--c-gris_fonce);
  transition: opacity 120ms ease, color 120ms ease;
}

._sortArrow._active {
  opacity: 1;
  color: var(--c-bleuvert);
}

._sortArrows._activeSort {
  opacity: 1;
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
      --c-vert,
      color-mix(in srgb, var(--c-bleuvert) 12%, transparent)
    );
    ._gemMetadataValue,
    ._pricingLine {
      color: var(--c-noir);
    }
  }
}

._flashCell {
  animation: _flashCellFade 4s ease-out 1;
}

@keyframes _flashCellFade {
  0% {
    background: color-mix(in srgb, var(--c-bleuvert) 42%, var(--c-bodybg));
  }
  100% {
    background: var(--c-bodybg);
  }
}

._pricingCell {
  display: flex;
  flex-direction: column;
  gap: 0.2em;
  line-height: 1.25;
}

._pricingLine {
  font-family: var(--sl-font-mono);
}

._pricingPerCt {
  // color: var(--c-gris_fonce);
}

._gemMetadataValue {
}
td[data-metadata-key="id"] {
  ._gemMetadataValue {
    font-size: var(--sg-id-font-size);
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

._coverThumb {
  width: var(--sticky-cover-col-width);
  height: var(--sticky-cover-col-height);
  flex-shrink: 0;
}

.row-sort-move {
  // transition: transform 380ms ease;
}

.row-sort-enter-active,
.row-sort-leave-active {
  // transition: opacity 520ms ease;
}

.row-sort-enter,
.row-sort-leave-to {
  // opacity: 0;
}
</style>
