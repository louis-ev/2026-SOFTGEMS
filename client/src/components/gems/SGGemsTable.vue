<template>
  <div class="_gemsTableRoot">
    <div
      class="_gemsTable"
      :class="[
        density_class,
        {
          _hasPickColumn: selection_pick_column,
          _hasRemoveColumn: selection_remove_column,
          _hasTotalsRow: show_gems_table_totals_row,
        },
      ]"
    >
      <table class="_table">
        <thead>
          <tr>
            <th v-if="selection_remove_column" scope="col" class="_removeColTh">
              <span class="_srOnly">{{
                $t("sg_gems_table_remove_column_header_aria")
              }}</span>
            </th>
            <th v-if="selection_pick_column" scope="col" class="_pickColTh">
              <span class="_srOnly">{{
                $t("sg_gems_table_pick_column_header_aria")
              }}</span>
            </th>
            <th
              v-for="metadata_key in metadata_keys"
              :key="metadata_key"
              :class="[
                getStickyColumnClass(metadata_key),
                {
                  _sortableHeader: isSortableColumn(metadata_key),
                  _filterableHeader: isColumnFilterable(metadata_key),
                  _filterActive: isColumnFilterActive(metadata_key),
                  _pricingCol: isGemPricingTotalColumnKey(metadata_key),
                  _treatmentCol: metadata_key === 'treatment_type',
                },
              ]"
              :aria-sort="getAriaSort(metadata_key)"
            >
              <div class="_thInner">
                <button
                  type="button"
                  class="_thLabelBtn"
                  :data-column-filter-trigger="
                    isColumnFilterable(metadata_key) ? metadata_key : null
                  "
                  :disabled="!canInteractHeaderLabel(metadata_key)"
                  :aria-haspopup="
                    isColumnFilterable(metadata_key) ? 'dialog' : null
                  "
                  :aria-expanded="
                    isColumnFilterable(metadata_key)
                      ? column_filter_menu_key === metadata_key
                      : null
                  "
                  :title="
                    isColumnFilterable(metadata_key)
                      ? $t('sg_gems_column_filter_trigger_title')
                      : null
                  "
                  @click="onHeaderLabelClick(metadata_key)"
                >
                  <span class="_thContent">
                    <b-icon
                      v-if="
                        metadata_icons[metadata_key] &&
                        !isGemPricingTotalColumnKey(metadata_key)
                      "
                      :icon="metadata_icons[metadata_key]"
                      class="_thIcon"
                    />
                    <span
                      v-if="metadata_key !== '$cover'"
                      >{{
                        metadata_labels[metadata_key] || metadata_key
                      }}</span
                    >
                    <span v-else class="_srOnly">{{
                      metadata_labels[metadata_key] || metadata_key
                    }}</span>
                  </span>
                </button>
                <button
                  v-if="isSortableColumn(metadata_key)"
                  type="button"
                  class="_sortArrows"
                  :class="{ _activeSort: sort_key === metadata_key }"
                  :aria-label="
                    $t('sg_gems_column_sort_aria', {
                      column: metadata_labels[metadata_key] || metadata_key,
                    })
                  "
                  @click.stop="onHeaderClick(metadata_key)"
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
                </button>
              </div>
              <SGGemsColumnFilterMenu
                v-if="
                  enable_column_filters &&
                  column_filter_menu_key === metadata_key
                "
                :metadata_key="metadata_key"
                :mode="getColumnFilterMode(metadata_key)"
                :column_label="metadata_labels[metadata_key] || metadata_key"
                :options="column_filter_options[metadata_key] || []"
                :current_filter="getColumnCurrentFilter(metadata_key)"
                @apply="onColumnFilterApply"
                @clear="onColumnFilterClear"
                @cancel="closeColumnFilterMenu"
              />
            </th>
            <th v-if="show_append_column" scope="col" class="_appendColTh">
              <span v-if="append_column_label" class="_appendColThText">{{
                append_column_label
              }}</span>
            </th>
          </tr>
        </thead>
        <transition-group name="row-sort" tag="tbody">
          <tr v-if="sorted_gems.length === 0" key="_empty">
            <td :colspan="gems_table_empty_colspan">
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
            :class="{
              _clickableRow: !selection_pick_column,
              _selected: is_gem_open && getGemId(gem) === selected_gem_id,
              _pickSelected: isRowSinglePicked(gem),
              _rowPickerDisabled: isRowPickerDisabled(gem),
            }"
            @click="handleTableRowClick(gem)"
          >
            <td v-if="selection_remove_column" class="_removeColTd" @click.stop>
              <button
                type="button"
                class="u-button u-button_icon _removeColBtn"
                :title="$t('sg_gems_table_remove_from_selection_aria')"
                :aria-label="$t('sg_gems_table_remove_from_selection_aria')"
                @click="onRemoveColumnClick(gem)"
              >
                <b-icon icon="dash-circle-dotted" scale="1" />
              </button>
            </td>
            <td v-if="selection_pick_column" class="_pickColTd" @click.stop>
              <button
                v-if="!isRowPickerDisabled(gem) && !isRowSinglePicked(gem)"
                type="button"
                class="u-button u-button_icon _pickColAddBtn"
                :title="single_pick_pick_button_title"
                :aria-label="single_pick_pick_button_title"
                @click="onPickColumnAddClick(gem)"
              >
                <b-icon icon="plus" scale="1.35" />
              </button>
              <span
                v-else
                class="_pickColInSelection"
                role="img"
                :title="pick_col_selected_title(gem)"
                :aria-label="pick_col_selected_title(gem)"
              >
                <b-icon icon="check-lg" />
              </span>
            </td>
            <td
              v-for="metadata_key in metadata_keys"
              :key="`${gem.$path}-${metadata_key}`"
              :class="[
                getStickyColumnClass(metadata_key),
                {
                  _editableCell: isMetadataCellEditable(metadata_key),
                  _flashCell: isCellFlashing(gem, metadata_key),
                  _pricingCol: isGemPricingTotalColumnKey(metadata_key),
                  _treatmentCol: metadata_key === 'treatment_type',
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
                  :can_edit="cover_can_edit"
                  :available_options="['import']"
                />
              </div>
              <div
                v-else-if="isGemDimensionsMergedColumnKey(metadata_key)"
                class="_dimensionsCell"
              >
                <span class="_dimensionsCellValue">{{
                  formatGemDimensionsInline(gem)
                }}</span>
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
              <span
                v-else
                class="_gemMetadataValue"
                :title="metadataCellTitle(gem, metadata_key) || undefined"
                :data-title-popper="
                  metadataCellTitle(gem, metadata_key) ? true : null
                "
                >{{
                  formatValue(formatMetadataCellDisplay(gem, metadata_key))
                }}</span
              >
            </td>
            <td v-if="show_append_column" class="_appendColTd" @click.stop>
              <slot name="appendCell" :gem="gem" />
            </td>
          </tr>
        </transition-group>
        <tfoot v-if="show_gems_table_totals_row">
          <tr class="_totalsRow">
            <td v-if="selection_remove_column" class="_removeColTd"></td>
            <td v-if="selection_pick_column" class="_pickColTd"></td>
            <td
              v-for="metadata_key in metadata_keys"
              :key="`total-${metadata_key}`"
              :class="[
                getStickyColumnClass(metadata_key),
                {
                  _pricingCol: isGemPricingTotalColumnKey(metadata_key),
                  _treatmentCol: metadata_key === 'treatment_type',
                },
              ]"
              :data-metadata-key="metadata_key"
            >
              <div
                v-if="isGemPricingTotalColumnKey(metadata_key)"
                class="_pricingCell"
              >
                <span class="_pricingLine _pricingTotal">{{
                  formatTotalsPricingTotal(metadata_key)
                }}</span>
                <span class="_pricingLine _pricingPerCt">{{
                  formatTotalsPricingPerCt(metadata_key)
                }}</span>
              </div>
              <span v-else class="_gemMetadataValue _totalsCellValue">{{
                formatTotalsCell(metadata_key)
              }}</span>
            </td>
            <td v-if="show_append_column" class="_appendColTd"></td>
          </tr>
        </tfoot>
      </table>
    </div>

    <SGTablePager
      :total_items="sorted_gems.length"
      :page_index="gems_page_index"
      :page_count="gems_page_count"
      :range_start="gems_page_range_start"
      :range_end="gems_page_range_end"
      :page_size="gems_effective_page_size"
      :nav_label="$t('sg_gems_page_nav_label')"
      @pageChange="goToGemsPage"
      @update:page_size="onGemsPageSizeChange"
    />
  </div>
</template>

<script>
import CoverField from "@/adc-core/fields/CoverField.vue";
import SGTablePager from "@/components/softgems/SGTablePager.vue";
import SGGemsColumnFilterMenu from "@/components/gems/SGGemsColumnFilterMenu.vue";
import { getFormatLocale, formatDisplayNumber } from "@/utils/format_locale.js";
import { gemStatusLabel } from "@/utils/gem_status.js";
import {
  gemTreatmentTypeCode,
  gemTreatmentTypeTitle,
} from "@/utils/treatment_type_display.js";
import {
  GEMS_COLUMN_FILTER_DIMENSION_AXIS_KEYS,
  GEMS_COLUMN_FILTER_DIMENSIONS_UI_KEY,
  getGemsColumnFilterMode,
  isGemsColumnFilterableKey,
} from "@/utils/gems_quick_search.js";
import GemPricing from "@/mixins/GemPricing";
import GemDimensions, {
  gem_linear_dimension_keys,
  gem_dimensions_merged_column_key,
} from "@/mixins/GemDimensions";
import {
  loadTablePageSize,
  normalizeTablePageSize,
  persistTablePageSize,
} from "@/utils/table_page_size.js";

export default {
  name: "SGGemsTable",
  mixins: [GemPricing, GemDimensions],
  components: { CoverField, SGTablePager, SGGemsColumnFilterMenu },
  props: {
    gems: { type: Array, default: () => [] },
    metadata_keys: { type: Array, default: () => [] },
    metadata_labels: { type: Object, default: () => ({}) },
    metadata_icons: { type: Object, default: () => ({}) },
    field_editable_map: { type: Object, default: () => ({}) },
    selected_gem_id: { type: String, default: "" },
    is_gem_open: { type: Boolean, default: false },
    view_density: { type: String, default: "medium" },
    cover_can_edit: { type: Boolean, default: true },
    disabled_row_paths: { type: Array, default: () => [] },
    /** When true, first column is remove-from-selection (minus icon). */
    selection_remove_column: { type: Boolean, default: false },
    /** When true, first column is add-to-selection (plus) / already added (check). */
    selection_pick_column: { type: Boolean, default: false },
    /** When set, matching row shows picked (check) in the pick column. */
    single_pick_selected_path: { type: String, default: "" },
    /** When true, adds a trailing column for slot appendCell (e.g. row actions). */
    append_column: { type: Boolean, default: false },
    append_column_label: { type: String, default: "" },
    /** When true, keeps `gems` array order and disables column sorting. */
    fixed_gem_order: { type: Boolean, default: false },
    inventory_has_gems: { type: Boolean, default: true },
    gems_page_size: { type: [Number, String], default: 100 },
    /** When true, shows a totals row for the current table rows (incl. search/filter). */
    show_totals_row: { type: Boolean, default: true },
    /** When true, icon/label opens a column filter menu. */
    enable_column_filters: { type: Boolean, default: false },
    /** Active structured field filters keyed by metadata key. */
    column_field_filters: { type: Object, default: () => ({}) },
    /** Enum options per filterable column: { [meta_key]: [{ value, label }] }. */
    column_filter_options: { type: Object, default: () => ({}) },
  },
  data() {
    return {
      gems_page_size_value: loadTablePageSize("gems"),
      gems_page_index: 0,
      gems_watch_previous_length: null,
      sort_key: "id",
      sort_direction: "desc",
      has_initialized_snapshot: false,
      previous_cell_values: {},
      flashing_cells: {},
      flash_timeouts: {},
      column_filter_menu_key: "",
    };
  },
  computed: {
    disabled_row_path_set() {
      return new Set(
        (Array.isArray(this.disabled_row_paths) ? this.disabled_row_paths : [])
          .map((p) => String(p || "").trim())
          .filter(Boolean)
      );
    },
    single_pick_pick_button_title() {
      if (String(this.single_pick_selected_path || "").trim()) {
        return this.$t("sg_gems_table_paired_pick_select_aria");
      }
      return this.$t("sg_gems_table_add_to_selection_aria");
    },
    density_class() {
      if (this.view_density === "compact") return "_densityCompact";
      if (this.view_density === "large") return "_densityLarge";
      return "_densityMedium";
    },
    sorted_gems() {
      if (!Array.isArray(this.gems)) return [];
      if (this.fixed_gem_order) return [...this.gems];
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
      return Math.max(1, Number(this.gems_page_size_value) || 100);
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
    gems_table_empty_colspan() {
      let n = Array.isArray(this.metadata_keys) ? this.metadata_keys.length : 0;
      if (this.selection_remove_column) n += 1;
      if (this.selection_pick_column) n += 1;
      if (this.show_append_column) n += 1;
      return n;
    },
    show_append_column() {
      if (!this.append_column) return false;
      return (
        typeof this.$scopedSlots.appendCell === "function" ||
        typeof this.$slots.appendCell !== "undefined"
      );
    },
    show_gems_table_totals_row() {
      return this.show_totals_row && this.sorted_gems.length > 0;
    },
    gems_table_numeric_totals() {
      const gems = this.sorted_gems;
      const pricing_totals = {};

      this.metadata_keys.forEach((metadata_key) => {
        if (!this.isGemPricingTotalColumnKey(metadata_key)) return;
        pricing_totals[metadata_key] = gems.reduce(
          (sum, gem) => sum + this.toNumberOrDefault(gem?.[metadata_key], 0),
          0
        );
      });

      return {
        count: gems.length,
        weight_total: gems.reduce(
          (sum, gem) => sum + this.toNumberOrDefault(gem?.weight_ct, 0),
          0
        ),
        pieces_total: gems.reduce(
          (sum, gem) => sum + this.toNumberOrDefault(gem?.number_of_pieces, 0),
          0
        ),
        pricing_totals,
      };
    },
  },
  watch: {
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
        }
      },
    },
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
    },
    onGemsPageSizeChange(next_size) {
      this.gems_page_size_value = normalizeTablePageSize(next_size);
      persistTablePageSize(this.gems_page_size_value, "gems");
      this.gems_page_index = 0;
      this.scrollGemsTableToTop();
    },
    scrollGemsTableToTop() {
      this.$nextTick(() => {
        const el =
          typeof this.$el?.querySelector === "function"
            ? this.$el.querySelector("._gemsTable")
            : null;
        if (el && typeof el.scrollTop === "number" && el.scrollTop !== 0) {
          el.scrollTop = 0;
        }
      });
    },
    getGemId(gem) {
      const gem_path = gem?.$path || "";
      if (!gem_path) return "";
      const path_parts = gem_path.split("/");
      return path_parts[path_parts.length - 1] || "";
    },
    formatMetadataCellDisplay(gem, metadata_key) {
      if (metadata_key === "status") {
        return gemStatusLabel(this.$t.bind(this), gem?.status);
      }
      if (metadata_key === "treatment_type") {
        return gemTreatmentTypeCode(
          this.resolveMetadataValue(gem, metadata_key)
        );
      }
      if (metadata_key === "$date_modified") {
        const raw = gem?.$date_modified;
        if (raw === null || raw === undefined || raw === "") return "";
        const time_value = new Date(raw).getTime();
        if (!Number.isFinite(time_value)) return String(raw);
        return new Date(raw).toLocaleString(
          getFormatLocale(this.$i18n?.locale),
          {
            dateStyle: "short",
            timeStyle: "short",
          }
        );
      }
      return this.resolveMetadataValue(gem, metadata_key);
    },
    metadataCellTitle(gem, metadata_key) {
      if (metadata_key !== "treatment_type") return "";
      return gemTreatmentTypeTitle(
        this.resolveMetadataValue(gem, metadata_key)
      );
    },
    resolveMetadataValue(gem, metadata_key) {
      if (metadata_key === "id") return this.getGemId(gem);
      return gem?.[metadata_key];
    },
    formatValue(value) {
      if (value === null || value === undefined || value === "") return "-";
      const formatted = formatDisplayNumber(value, {
        maximumFractionDigits: 3,
      });
      if (formatted !== null) return formatted;
      if (typeof value === "object") return JSON.stringify(value);
      return String(value);
    },
    formatPriceCellNumber(value) {
      if (value === null || value === undefined || value === "") return "-";
      return (
        formatDisplayNumber(value, {
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
        }) ?? "-"
      );
    },
    formatPricingPerCtLine(gem, total_key) {
      const w = this.toNumberOrDefault(gem?.weight_ct);
      if (!Number.isFinite(w) || w <= 0) return "- /ct";
      const per = this.computeDisplayedPerCaratForGem(gem, total_key);
      return `${this.formatPriceCellNumber(per)} /ct`;
    },
    formatTotalsCell(metadata_key) {
      const totals = this.gems_table_numeric_totals;

      if (metadata_key === "id") {
        return this.$t("sg_gems_table_total_row_count", {
          count: totals.count,
        });
      }
      if (metadata_key === "$cover" || metadata_key === "$date_modified") {
        return "";
      }
      if (metadata_key === "weight_ct") {
        if (totals.weight_total <= 0) return "—";
        return this.formatValue(totals.weight_total);
      }
      if (metadata_key === "number_of_pieces") {
        if (totals.pieces_total <= 0) return "—";
        return this.formatValue(totals.pieces_total);
      }
      return "";
    },
    formatTotalsPricingTotal(metadata_key) {
      const total = this.gems_table_numeric_totals.pricing_totals[metadata_key];
      if (!Number.isFinite(total) || total <= 0) return "—";
      return this.formatPriceCellNumber(total);
    },
    formatTotalsPricingPerCt(metadata_key) {
      const totals = this.gems_table_numeric_totals;
      const total = totals.pricing_totals[metadata_key];
      if (!Number.isFinite(total) || total <= 0) return "— /ct";
      const per = this.computePerCarat({
        total_value: total,
        weight_ct: totals.weight_total,
      });
      if (!Number.isFinite(per) || per <= 0) return "— /ct";
      return `${this.formatPriceCellNumber(per)} /ct`;
    },
    resolveSortValue(gem, metadata_key) {
      if (metadata_key === "$date_modified") {
        const raw = gem?.$date_modified;
        const time_value = raw ? new Date(raw).getTime() : 0;
        return Number.isFinite(time_value) ? time_value : 0;
      }
      if (this.isGemDimensionsMergedColumnKey(metadata_key)) {
        return this.resolveGemDimensionsSortValue(gem);
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
      if (this.fixed_gem_order) return false;
      return metadata_key !== "$cover";
    },
    isColumnFilterable(metadata_key) {
      if (!this.enable_column_filters) return false;
      return isGemsColumnFilterableKey(metadata_key);
    },
    getColumnFilterMode(metadata_key) {
      return getGemsColumnFilterMode(metadata_key);
    },
    isColumnFilterActive(metadata_key) {
      if (!this.isColumnFilterable(metadata_key)) return false;
      if (metadata_key === GEMS_COLUMN_FILTER_DIMENSIONS_UI_KEY) {
        return GEMS_COLUMN_FILTER_DIMENSION_AXIS_KEYS.some(
          (axis_key) => this.column_field_filters?.[axis_key]
        );
      }
      const filter = this.column_field_filters?.[metadata_key];
      return Boolean(filter);
    },
    getColumnCurrentFilter(metadata_key) {
      if (metadata_key === GEMS_COLUMN_FILTER_DIMENSIONS_UI_KEY) {
        const axes = {};
        GEMS_COLUMN_FILTER_DIMENSION_AXIS_KEYS.forEach((axis_key) => {
          axes[axis_key] = this.column_field_filters?.[axis_key] || null;
        });
        return { mode: "dimensions", axes };
      }
      return this.column_field_filters?.[metadata_key] || null;
    },
    canInteractHeaderLabel(metadata_key) {
      return (
        this.isColumnFilterable(metadata_key) ||
        this.isSortableColumn(metadata_key)
      );
    },
    onHeaderLabelClick(metadata_key) {
      if (this.isColumnFilterable(metadata_key)) {
        this.toggleColumnFilterMenu(metadata_key);
        return;
      }
      this.onHeaderClick(metadata_key);
    },
    toggleColumnFilterMenu(metadata_key) {
      if (this.column_filter_menu_key === metadata_key) {
        this.column_filter_menu_key = "";
        return;
      }
      this.column_filter_menu_key = metadata_key;
    },
    closeColumnFilterMenu() {
      this.column_filter_menu_key = "";
    },
    onColumnFilterApply(payload) {
      this.$emit("applyColumnFilter", payload);
      this.closeColumnFilterMenu();
    },
    onColumnFilterClear(metadata_key) {
      this.$emit("clearColumnFilter", metadata_key);
      this.closeColumnFilterMenu();
    },
    onHeaderClick(metadata_key) {
      if (this.fixed_gem_order || !this.isSortableColumn(metadata_key)) return;

      if (this.sort_key === metadata_key) {
        this.sort_direction = this.sort_direction === "asc" ? "desc" : "asc";
      } else {
        this.sort_key = metadata_key;
        this.sort_direction = metadata_key === "id" ? "desc" : "asc";
      }
      this.gems_page_index = 0;
      this.scrollGemsTableToTop();
    },
    getAriaSort(metadata_key) {
      if (!this.isSortableColumn(metadata_key)) return "none";
      if (this.sort_key !== metadata_key) return "none";
      return this.sort_direction === "asc" ? "ascending" : "descending";
    },
    isFieldEditable(metadata_key) {
      return Boolean(this.field_editable_map[metadata_key]);
    },
    isMetadataCellEditable(metadata_key) {
      if (this.isGemPricingTotalColumnKey(metadata_key)) {
        if (this.isFieldEditable(metadata_key)) return true;
        const virtual_key = this.getVirtualPerCaratKeyForTotal(metadata_key);
        return Boolean(virtual_key && this.isFieldEditable(virtual_key));
      }
      return this.isFieldEditable(metadata_key);
    },
    isRowPickerDisabled(gem) {
      const p = gem?.$path;
      if (!p) return false;
      return this.disabled_row_path_set.has(String(p));
    },
    isRowSinglePicked(gem) {
      const selected_path = String(this.single_pick_selected_path || "").trim();
      if (!selected_path) return false;
      return String(gem?.$path || "").trim() === selected_path;
    },
    pick_col_selected_title(gem) {
      if (this.isRowSinglePicked(gem)) {
        return this.$t("sg_gems_table_paired_pick_selected_aria");
      }
      return this.$t("sg_gems_table_already_in_selection_aria");
    },
    handleTableRowClick(gem) {
      if (this.selection_pick_column) return;
      this.onRowClick(gem);
    },
    onRemoveColumnClick(gem) {
      this.$emit("removeRowClick", gem);
    },
    onPickColumnAddClick(gem) {
      if (this.isRowPickerDisabled(gem)) return;
      this.$emit("rowClick", gem);
    },
    onRowClick(gem) {
      if (this.isRowPickerDisabled(gem)) return;
      this.$emit("rowClick", gem);
    },
    onCellClick(gem, metadata_key, event) {
      if (!this.isMetadataCellEditable(metadata_key)) return;
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
          if (this.isGemDimensionsMergedColumnKey(metadata_key)) {
            snapshot[cell_key] = [
              this.serializeCellValue(gem?.length_mm),
              this.serializeCellValue(gem?.width_mm),
              this.serializeCellValue(gem?.height_mm),
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

      if (!this.has_initialized_snapshot) {
        this.previous_cell_values = next_snapshot;
        this.has_initialized_snapshot = true;
        return;
      }

      Object.keys(next_snapshot).forEach((cell_key) => {
        if (!(cell_key in this.previous_cell_values)) return;
        if (this.previous_cell_values[cell_key] === next_snapshot[cell_key])
          return;
        this.flashCell(cell_key);
      });

      this.previous_cell_values = next_snapshot;
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
    /**
     * After the user saves an edit (e.g. modal), bring that row/column into view,
     * including switching pager page when the row is off-screen.
     */
    scrollGemCellIntoView({ gem_path, metadata_key }) {
      const path = gem_path != null ? String(gem_path).trim() : "";
      const column_key = this.resolveScrollTargetMetadataKey(metadata_key);
      if (!path || !column_key) return;

      const sorted = this.sorted_gems;
      const row_index = sorted.findIndex((g) => g && g.$path === path);
      if (row_index < 0) return;

      const size = this.gems_effective_page_size;
      const target_page = Math.floor(row_index / size);
      if (this.gems_page_index !== target_page) {
        this.gems_page_index = target_page;
      }

      const gem = sorted[row_index];
      const cell_key = this.getCellFlashKey(gem, column_key);
      this.$nextTick(() => {
        this.$nextTick(() => {
          this.scrollCellIntoViewForKey(cell_key, { force: true });
        });
      });
    },
    /** Map saved field key to `metadata_keys` / `data-cell-key` column (pricing /ct uses total column). */
    resolveScrollTargetMetadataKey(metadata_key) {
      const raw = metadata_key != null ? String(metadata_key).trim() : "";
      if (!raw) return "";
      if (gem_linear_dimension_keys.includes(raw)) {
        return gem_dimensions_merged_column_key;
      }
      if (this.isVirtualPerCaratField(raw)) {
        const pair = this.getPricingPairByFieldKey(raw);
        return pair ? pair.total_key : "";
      }
      return raw;
    },
    scrollCellIntoViewForKey(cell_key, { force = false } = {}) {
      if (!this.$el) return;
      const scroll_container =
        typeof this.$el.querySelector === "function"
          ? this.$el.querySelector("._gemsTable")
          : null;
      if (!scroll_container) return;

      const cell_element = Array.from(
        this.$el.querySelectorAll("td[data-cell-key]")
      ).find((element) => element?.dataset?.cellKey === cell_key);
      if (!cell_element) return;

      if (!force) {
        const cell_rect = cell_element.getBoundingClientRect();
        const container_rect = scroll_container.getBoundingClientRect();
        const is_outside_vertical =
          cell_rect.top < container_rect.top ||
          cell_rect.bottom > container_rect.bottom;
        const is_outside_horizontal =
          cell_rect.left < container_rect.left ||
          cell_rect.right > container_rect.right;
        if (!is_outside_vertical && !is_outside_horizontal) return;
      }

      if (typeof cell_element.scrollIntoView === "function") {
        cell_element.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "nearest",
        });
      }
    },
  },
};
</script>

<style lang="scss" scoped>
@use "@/utils/sg_data_table.scss" as sg_data_table;

._gemsTableRoot {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  height: 100%;
  gap: calc(var(--spacing) / 4);
}

._gemsTable {
  --pick-col-width: 0px;
  --sticky-id-col-width: 70px;
  --sticky-cover-col-width: 80px;
  --sticky-cover-col-height: 80px;
  --sg-table-border-width-thin: 1px;
  --sg-table-border-width-thick: 1px;
  --sg-table-border-color: color-mix(
    in srgb,
    var(--c-gris_clair),
    var(--c-noir) 15%
  );
  --sg-cell-padding: calc(var(--spacing) / 2);
  --sg-metadata-font-size: var(--sl-font-size-x-small);
  --sg-id-font-size: var(--sl-font-size-medium);

  flex: 1;
  min-height: 0;
  overflow: auto;

  &._hasPickColumn,
  &._hasRemoveColumn {
    --pick-col-width: 2.75rem;
  }
}

._gemsTable._hasTotalsRow {
  // Room for sticky footer when the table is shorter than the scrollport.
  padding-bottom: var(--sg-table-border-width-thick);
}

._gemsTable._densityCompact {
  --cell-height: 38px;
  // to get Total (n) cell to fit the width we add 8px
  // plus left/right sticky column border
  --sticky-id-col-width: calc(
    var(--cell-height) + var(--sg-table-border-width-thick) + 8px
  );
  --sticky-cover-col-width: calc(
    var(--cell-height) + var(--sg-table-border-width-thick)
  );
  --sticky-cover-col-height: var(--cell-height);
  --sg-cell-padding: calc(var(--spacing) / 3);
  --sg-metadata-font-size: 0.68rem;
  --sg-id-font-size: 0.82rem;

  ._table th._pricingCol,
  ._table td._pricingCol {
    --pricing-col-width: 5.5rem;
    width: var(--pricing-col-width);
    min-width: var(--pricing-col-width);
    max-width: var(--pricing-col-width);
  }
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
  --sg-table-footer-bg: color-mix(
    in srgb,
    var(--c-gris_clair) 55%,
    var(--c-bodybg)
  );
  @include sg_data_table.sg-data-table;
  width: max-content;

  tfoot td {
    position: sticky;
    bottom: 0;
    z-index: 5;
    border-top: var(--sg-table-border-width-thick) solid
      var(--sg-table-border-color);
    border-right: var(--sg-table-border-width-thick) solid
      var(--sg-table-border-color);
    border-bottom: var(--sg-table-border-width-thick) solid
      var(--sg-table-border-color);
    background: var(--sg-table-footer-bg);
    vertical-align: middle;
    box-shadow: 0 calc(-1 * var(--sg-table-border-width-thick)) 0
        var(--sg-table-border-color),
      0 var(--sg-table-border-width-thick) 0 var(--sg-table-border-color);
  }

  tfoot td._stickyIdCol {
    z-index: 10;
  }

  tfoot td._stickyCoverCol {
    z-index: 11;
    box-shadow: 0 calc(-1 * var(--sg-table-border-width-thick)) 0
        var(--sg-table-border-color),
      0 var(--sg-table-border-width-thick) 0 var(--sg-table-border-color),
      var(--sg-table-border-width-thick) 0 0 var(--sg-table-border-color);
  }

  tfoot td._pickColTd,
  tfoot td._removeColTd {
    z-index: 12;
  }

  th._stickyIdCol,
  td._stickyIdCol {
    position: sticky;
    left: 0px;
    min-width: var(--sticky-id-col-width);
    max-width: var(--sticky-id-col-width);
    border-left: var(--sg-table-border-width-thick) solid
      var(--sg-table-border-color);
  }

  th._stickyCoverCol,
  td._stickyCoverCol {
    position: sticky;
    left: var(--sticky-id-col-width);
    min-width: var(--sticky-cover-col-width);
    max-width: var(--sticky-cover-col-width);
    overflow: hidden;
  }

  thead th._stickyIdCol {
    top: 0;
    z-index: 12;
    background: var(--sg-table-header-bg);
  }

  thead th._stickyCoverCol {
    top: 0;
    z-index: 13;
    background: var(--sg-table-header-bg);
    box-shadow: 0 var(--sg-table-border-width-thick) 0
        var(--sg-table-border-color),
      var(--sg-table-border-width-thick) 0 0 var(--sg-table-border-color);
  }

  tbody td._stickyIdCol {
    z-index: 4;
  }

  tbody td._stickyCoverCol {
    z-index: 3;
    box-shadow: var(--sg-table-border-width-thick) 0 0
      var(--sg-table-border-color);
  }

  th._pickColTh,
  td._pickColTd,
  th._removeColTh,
  td._removeColTd {
    position: sticky;
    left: 0;
    width: var(--pick-col-width);
    min-width: var(--pick-col-width);
    max-width: var(--pick-col-width);
    box-sizing: border-box;
    text-align: center;
    vertical-align: middle;
    padding-left: calc(var(--sg-cell-padding) * 0.45);
    padding-right: calc(var(--sg-cell-padding) * 0.45);
    border-left: var(--sg-table-border-width-thick) solid
      var(--sg-table-border-color);
  }

  thead th._pickColTh,
  thead th._removeColTh {
    top: 0;
    z-index: 14;
    background: var(--sg-table-header-bg);
  }

  td._pickColTd,
  td._removeColTd {
    z-index: 6;
  }

  td {
    font-size: var(--sg-metadata-font-size);
    font-family: var(--sl-font-mono);
  }

  th._pricingCol,
  td._pricingCol {
    width: 5rem;
    min-width: 5rem;
    max-width: 5rem;
    padding-left: calc(var(--sg-cell-padding) * 0.55);
    padding-right: calc(var(--sg-cell-padding) * 0.55);
    box-sizing: border-box;
  }

  th._pricingCol ._thContent {
    gap: calc(var(--spacing) / 6);
  }

  th._treatmentCol,
  td._treatmentCol {
    width: 18ch;
    min-width: 18ch;
    max-width: 18ch;
    box-sizing: border-box;
  }

  td._treatmentCol ._gemMetadataValue {
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

._thInner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: calc(var(--spacing) / 3);
  width: 100%;
}

._thLabelBtn {
  border: 0;
  background: transparent;
  flex: 1 1 auto;
  min-width: 0;
  padding: 0;
  margin: 0;
  text-align: left;
  display: flex;
  align-items: center;
  cursor: pointer;
  color: inherit;
}

._thLabelBtn:disabled {
  cursor: default;
}

th._filterActive ._thContent {
  color: var(--c-bleuvert);
  font-weight: 600;
}

/* Filterable: hovering the name/icon highlights the filter target. */
th._filterableHeader ._thLabelBtn:hover ._thContent {
  color: var(--c-bleuvert);
}

th._filterableHeader ._thLabelBtn:hover ._thIcon {
  opacity: 1;
  color: var(--c-bleuvert);
}

._sortArrows {
  display: inline-flex;
  flex-direction: column;
  gap: 0;
  opacity: 0.75;
  flex-shrink: 0;
  margin-top: -12px;
  margin-bottom: -12px;
  border: 0;
  background: transparent;
  padding: 0.1rem 0.15rem;
  border-radius: 3px;
  cursor: pointer;
  color: inherit;
}

._sortArrow {
  min-width: 0.9rem;
  min-height: 0.9rem;
  font-size: 0.32rem;
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

/* Sort: hovering the arrows highlights the sort target. */
._sortArrows:hover {
  opacity: 1;
  background: color-mix(in srgb, var(--c-bleuvert) 12%, transparent);
}

._sortArrows:hover ._sortArrow {
  opacity: 0.9;
  color: var(--c-bleuvert);
}

/* Sortable-only columns: label click sorts → highlight arrows on label hover. */
th._sortableHeader:not(._filterableHeader) ._thLabelBtn:hover + ._sortArrows {
  opacity: 1;
  background: color-mix(in srgb, var(--c-bleuvert) 12%, transparent);
}

th._sortableHeader:not(._filterableHeader)
  ._thLabelBtn:hover
  + ._sortArrows
  ._sortArrow {
  opacity: 0.9;
  color: var(--c-bleuvert);
}

._clickableRow {
  cursor: pointer;

  &._selected {
    background: var(--c-gris_clair);
  }

  &._pickSelected {
    background: color-mix(in srgb, var(--c-bleuvert) 10%, transparent);
  }

  &._rowPickerDisabled {
    cursor: not-allowed;
    opacity: 0.45;
  }

  &._rowPickerDisabled:hover {
    background: inherit;
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

thead th._stickyIdCol:hover,
thead th._stickyCoverCol:hover,
thead th._pickColTh:hover,
thead th._removeColTh:hover {
  background: var(--c-gris_clair);
}

._totalsRow td._stickyIdCol,
._totalsRow td._stickyCoverCol {
  background: var(--sg-table-footer-bg);
}

._totalsCellValue {
  font-weight: 600;
}

._totalsRow ._pricingTotal {
  font-weight: 600;
}

td[data-metadata-key="$cover"] {
  width: var(--sticky-cover-col-width);
}

._editableCell {
  cursor: pointer;

  &:hover {
    background: color-mix(
      in srgb,
      var(--c-bleuvert) 5%,
      var(--c-bodybg, transparent)
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

._dimensionsCell {
  line-height: 1.25;
}

._dimensionsCellValue {
  font-family: var(--sl-font-mono);
}

._pricingCell {
  display: flex;
  flex-direction: column;
  gap: 0.2em;
  line-height: 1.25;
  overflow: hidden;
}

._pricingLine {
  font-family: var(--sl-font-mono);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
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

._gemsTable._hasPickColumn ._table,
._gemsTable._hasRemoveColumn ._table {
  th._stickyIdCol,
  td._stickyIdCol {
    left: var(--pick-col-width);
    text-align: right;
  }

  th._stickyCoverCol,
  td._stickyCoverCol {
    left: calc(var(--sticky-id-col-width) + var(--pick-col-width));
  }
}

._srOnly {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

._pickColAddBtn,
._removeColBtn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  // width: 1.65rem;
  // height: 1.65rem;
  flex-shrink: 0;
  cursor: pointer;
  // line-height: 1;
  font-size: 0.9em;

  &:focus {
    outline: none;
  }

  &:focus-visible {
    outline: 2px solid var(--c-bleuvert);
    outline-offset: 2px;
  }
}

._pickColAddBtn {
  color: inherit;

  &:hover {
    background: color-mix(in srgb, currentColor 12%, transparent);
  }
}

._removeColBtn {
  color: var(--c-rouge);

  &:hover {
    background: color-mix(in srgb, var(--c-rouge) 12%, transparent);
  }

  &:focus-visible {
    outline-color: var(--c-rouge);
  }
}

._pickColInSelection {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #219653;
  line-height: 1;
  pointer-events: none;
}

._appendColTh,
._appendColTd {
  width: 1%;
  white-space: nowrap;
  text-align: right;
  vertical-align: middle;
}

._appendColThText {
  font-weight: 600;
}
</style>
