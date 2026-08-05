<template>
  <div
    class="_filterMenu"
    role="dialog"
    :style="menu_style"
    :aria-label="
      $t('sg_gems_column_filter_menu_aria', { column: column_label })
    "
    @keydown.esc.stop.prevent="onCancel"
  >
    <template v-if="mode === 'enum'">
      <div class="_optionList" role="group">
        <label
          v-for="option in options"
          :key="option.value"
          class="_optionRow"
        >
          <input
            v-model="draft_values"
            type="checkbox"
            :value="option.value"
          />
          <span>{{ option.label }}</span>
        </label>
        <p v-if="!options.length" class="_empty">
          {{ $t("sg_gems_column_filter_no_options") }}
        </p>
      </div>
    </template>

    <template v-else-if="mode === 'date'">
      <div class="_numberFields _rangeFields">
        <label class="_field">
          <span class="_fieldLabel">{{
            $t("sg_gems_column_filter_date_from")
          }}</span>
          <input
            ref="date_from_input"
            v-model="draft_date_from"
            type="date"
            class="_input"
            @keydown.enter.prevent="onApply"
          />
        </label>
        <label class="_field">
          <span class="_fieldLabel">{{
            $t("sg_gems_column_filter_date_to")
          }}</span>
          <input
            v-model="draft_date_to"
            type="date"
            class="_input"
            @keydown.enter.prevent="onApply"
          />
        </label>
      </div>
    </template>

    <template v-else-if="mode === 'dimensions'">
      <div class="_dimensionsAxes">
        <div
          v-for="axis in dimension_axis_defs"
          :key="axis.key"
          class="_dimensionAxis"
        >
          <div class="_dimensionAxisHeader">
            <span class="_dimensionAxisLetter">{{ axis.letter }}</span>
            <span class="_dimensionAxisName">{{ axis.label }}</span>
          </div>
          <div class="_numberModeTabs" role="tablist">
            <button
              type="button"
              class="_modeTab"
              :class="{ _active: draft_axes[axis.key].mode === 'exact' }"
              @click="draft_axes[axis.key].mode = 'exact'"
            >
              {{ $t("sg_gems_column_filter_exact") }}
            </button>
            <button
              type="button"
              class="_modeTab"
              :class="{ _active: draft_axes[axis.key].mode === 'range' }"
              @click="draft_axes[axis.key].mode = 'range'"
            >
              {{ $t("sg_gems_column_filter_between") }}
            </button>
          </div>
          <div
            v-if="draft_axes[axis.key].mode === 'exact'"
            class="_numberFields"
          >
            <label class="_field">
              <span class="_fieldLabel">{{
                $t("sg_gems_column_filter_exact_mm")
              }}</span>
              <input
                v-model="draft_axes[axis.key].exact"
                type="text"
                inputmode="decimal"
                class="_input"
                @keydown.enter.prevent="onApply"
              />
            </label>
          </div>
          <div v-else class="_numberFields _rangeFields">
            <label class="_field">
              <span class="_fieldLabel">{{
                $t("sg_gems_column_filter_min")
              }}</span>
              <input
                v-model="draft_axes[axis.key].min"
                type="text"
                inputmode="decimal"
                class="_input"
                @keydown.enter.prevent="onApply"
              />
            </label>
            <label class="_field">
              <span class="_fieldLabel">{{
                $t("sg_gems_column_filter_max")
              }}</span>
              <input
                v-model="draft_axes[axis.key].max"
                type="text"
                inputmode="decimal"
                class="_input"
                @keydown.enter.prevent="onApply"
              />
            </label>
          </div>
        </div>
      </div>
    </template>

    <template v-else-if="mode === 'number'">
      <div class="_numberModeTabs" role="tablist">
        <button
          type="button"
          class="_modeTab"
          :class="{ _active: number_mode === 'exact' }"
          @click="number_mode = 'exact'"
        >
          {{ $t("sg_gems_column_filter_exact") }}
        </button>
        <button
          type="button"
          class="_modeTab"
          :class="{ _active: number_mode === 'range' }"
          @click="number_mode = 'range'"
        >
          {{ $t("sg_gems_column_filter_between") }}
        </button>
      </div>
      <div v-if="number_mode === 'exact'" class="_numberFields">
        <label class="_field">
          <span class="_fieldLabel">{{
            $t("sg_gems_column_filter_exact")
          }}</span>
          <input
            ref="exact_input"
            v-model="draft_exact"
            type="text"
            inputmode="decimal"
            class="_input"
            @keydown.enter.prevent="onApply"
          />
        </label>
      </div>
      <div v-else class="_numberFields _rangeFields">
        <label class="_field">
          <span class="_fieldLabel">{{ $t("sg_gems_column_filter_min") }}</span>
          <input
            v-model="draft_min"
            type="text"
            inputmode="decimal"
            class="_input"
            @keydown.enter.prevent="onApply"
          />
        </label>
        <label class="_field">
          <span class="_fieldLabel">{{ $t("sg_gems_column_filter_max") }}</span>
          <input
            v-model="draft_max"
            type="text"
            inputmode="decimal"
            class="_input"
            @keydown.enter.prevent="onApply"
          />
        </label>
      </div>
    </template>

    <div class="_actions">
      <button type="button" class="u-buttonLink" @click="onClear">
        {{ $t("sg_gems_column_filter_clear") }}
      </button>
      <div class="_actionsRight">
        <button type="button" class="u-buttonLink" @click="onCancel">
          {{ $t("sg_cancel") }}
        </button>
        <button type="button" class="u-button" @click="onApply">
          {{ $t("sg_gems_column_filter_apply") }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import {
  GEMS_COLUMN_FILTER_DIMENSION_AXIS_KEYS,
  isIsoDateString,
  normalizeGemsSearchNumber,
} from "@/utils/gems_quick_search.js";

function emptyAxisDraft() {
  return { mode: "exact", exact: "", min: "", max: "" };
}

function emptyAxesDraft() {
  return {
    length_mm: emptyAxisDraft(),
    width_mm: emptyAxisDraft(),
    height_mm: emptyAxisDraft(),
  };
}

export default {
  name: "SGGemsColumnFilterMenu",
  props: {
    metadata_key: {
      type: String,
      required: true,
    },
    mode: {
      type: String,
      required: true,
      validator: (v) =>
        v === "enum" || v === "number" || v === "date" || v === "dimensions",
    },
    column_label: {
      type: String,
      default: "",
    },
    options: {
      type: Array,
      default: () => [],
    },
    current_filter: {
      type: Object,
      default: null,
    },
  },
  data() {
    return {
      draft_values: [],
      number_mode: "exact",
      draft_exact: "",
      draft_min: "",
      draft_max: "",
      draft_date_from: "",
      draft_date_to: "",
      draft_axes: emptyAxesDraft(),
      menu_style: {},
    };
  },
  computed: {
    dimension_axis_defs() {
      return [
        {
          key: "length_mm",
          letter: "L",
          label: this.$t("sg_gems_column_filter_axis_length"),
        },
        {
          key: "width_mm",
          letter: "W",
          label: this.$t("sg_gems_column_filter_axis_width"),
        },
        {
          key: "height_mm",
          letter: "H",
          label: this.$t("sg_gems_column_filter_axis_height"),
        },
      ];
    },
  },
  watch: {
    current_filter: {
      immediate: true,
      handler() {
        this.syncDraftFromCurrent();
      },
    },
    metadata_key() {
      this.syncDraftFromCurrent();
      this.$nextTick(() => this.updateMenuPosition());
    },
  },
  mounted() {
    document.addEventListener("mousedown", this.onDocumentMouseDown, true);
    window.addEventListener("resize", this.updateMenuPosition);
    window.addEventListener("scroll", this.updateMenuPosition, true);
    this.$nextTick(() => {
      this.updateMenuPosition();
      const el = this.$refs.date_from_input || this.$refs.exact_input;
      if (el && typeof el.focus === "function") el.focus();
    });
  },
  beforeDestroy() {
    document.removeEventListener("mousedown", this.onDocumentMouseDown, true);
    window.removeEventListener("resize", this.updateMenuPosition);
    window.removeEventListener("scroll", this.updateMenuPosition, true);
  },
  methods: {
    updateMenuPosition() {
      const anchor =
        this.$el?.parentElement?.querySelector?.(
          `[data-column-filter-trigger="${this.metadata_key}"]`,
        ) || this.$el?.parentElement;
      if (!anchor || typeof anchor.getBoundingClientRect !== "function") {
        this.menu_style = {};
        return;
      }
      const rect = anchor.getBoundingClientRect();
      const max_width = Math.min(288, window.innerWidth - 16);
      let left = rect.left;
      if (left + max_width > window.innerWidth - 8) {
        left = Math.max(8, window.innerWidth - max_width - 8);
      }
      this.menu_style = {
        position: "fixed",
        top: `${Math.round(rect.bottom + 4)}px`,
        left: `${Math.round(left)}px`,
        zIndex: 80,
      };
    },
    syncAxisDraftFromFilter(axis_key, filter) {
      const draft = emptyAxisDraft();
      if (filter?.mode === "number" && Number.isFinite(filter.exact)) {
        draft.mode = "exact";
        draft.exact = String(filter.exact);
      } else if (
        filter?.mode === "number" &&
        (Number.isFinite(filter.min) || Number.isFinite(filter.max))
      ) {
        draft.mode = "range";
        draft.min = Number.isFinite(filter.min) ? String(filter.min) : "";
        draft.max = Number.isFinite(filter.max) ? String(filter.max) : "";
      }
      this.$set(this.draft_axes, axis_key, draft);
    },
    buildNumberFilterFromAxisDraft(draft) {
      if (!draft) return null;
      if (draft.mode === "exact") {
        const exact = normalizeGemsSearchNumber(draft.exact);
        if (!Number.isFinite(exact)) return null;
        return { mode: "number", exact };
      }
      const min = normalizeGemsSearchNumber(draft.min);
      const max = normalizeGemsSearchNumber(draft.max);
      const has_min = Number.isFinite(min);
      const has_max = Number.isFinite(max);
      if (!has_min || !has_max) return null;
      return {
        mode: "number",
        min: Math.min(min, max),
        max: Math.max(min, max),
      };
    },
    syncDraftFromCurrent() {
      const filter = this.current_filter;
      if (this.mode === "enum") {
        this.draft_values = Array.isArray(filter?.values)
          ? [...filter.values]
          : [];
        return;
      }
      if (this.mode === "date") {
        if (filter?.mode === "date" && filter.exact) {
          this.draft_date_from = filter.exact;
          this.draft_date_to = filter.exact;
          return;
        }
        this.draft_date_from =
          filter?.mode === "date" && filter.min ? filter.min : "";
        this.draft_date_to =
          filter?.mode === "date" && filter.max ? filter.max : "";
        return;
      }
      if (this.mode === "dimensions") {
        const axes = filter?.mode === "dimensions" ? filter.axes || {} : {};
        GEMS_COLUMN_FILTER_DIMENSION_AXIS_KEYS.forEach((axis_key) => {
          this.syncAxisDraftFromFilter(axis_key, axes[axis_key] || null);
        });
        return;
      }
      if (filter?.mode === "number" && Number.isFinite(filter.exact)) {
        this.number_mode = "exact";
        this.draft_exact = String(filter.exact);
        this.draft_min = "";
        this.draft_max = "";
        return;
      }
      if (
        filter?.mode === "number" &&
        (Number.isFinite(filter.min) || Number.isFinite(filter.max))
      ) {
        this.number_mode = "range";
        this.draft_exact = "";
        this.draft_min = Number.isFinite(filter.min) ? String(filter.min) : "";
        this.draft_max = Number.isFinite(filter.max) ? String(filter.max) : "";
        return;
      }
      this.number_mode = "exact";
      this.draft_exact = "";
      this.draft_min = "";
      this.draft_max = "";
    },
    onDocumentMouseDown(event) {
      const root = this.$el;
      if (!root || root.contains(event.target)) return;
      // Keep open when clicking the same column filter trigger.
      const trigger = event.target?.closest?.(
        `[data-column-filter-trigger="${this.metadata_key}"]`,
      );
      if (trigger) return;
      this.onCancel();
    },
    onCancel() {
      this.$emit("cancel");
    },
    onClear() {
      this.$emit("clear", this.metadata_key);
    },
    onApply() {
      if (this.mode === "enum") {
        const offered_values = new Set(
          (this.options || []).map((option) => String(option.value)),
        );
        const values = (this.draft_values || [])
          .map((v) => String(v).trim())
          .filter((v) => v && offered_values.has(v));
        if (!values.length) {
          this.$emit("clear", this.metadata_key);
          return;
        }
        this.$emit("apply", {
          metadata_key: this.metadata_key,
          filter: { mode: "enum", values },
        });
        return;
      }

      if (this.mode === "date") {
        const from = String(this.draft_date_from || "").trim();
        const to = String(this.draft_date_to || "").trim();
        const has_from = isIsoDateString(from);
        const has_to = isIsoDateString(to);
        if (!has_from && !has_to) {
          this.$emit("clear", this.metadata_key);
          return;
        }
        if (has_from && has_to) {
          const min = from <= to ? from : to;
          const max = from <= to ? to : from;
          this.$emit("apply", {
            metadata_key: this.metadata_key,
            filter:
              min === max
                ? { mode: "date", exact: min }
                : { mode: "date", min, max },
          });
          return;
        }
        this.$emit("apply", {
          metadata_key: this.metadata_key,
          filter: {
            mode: "date",
            ...(has_from ? { min: from } : {}),
            ...(has_to ? { max: to } : {}),
          },
        });
        return;
      }

      if (this.mode === "dimensions") {
        const axes = {};
        let has_any = false;
        GEMS_COLUMN_FILTER_DIMENSION_AXIS_KEYS.forEach((axis_key) => {
          const built = this.buildNumberFilterFromAxisDraft(
            this.draft_axes[axis_key],
          );
          axes[axis_key] = built;
          if (built) has_any = true;
        });
        if (!has_any) {
          this.$emit("clear", this.metadata_key);
          return;
        }
        this.$emit("apply", {
          metadata_key: this.metadata_key,
          filter: { mode: "dimensions", axes },
        });
        return;
      }

      if (this.number_mode === "exact") {
        const exact = normalizeGemsSearchNumber(this.draft_exact);
        if (!Number.isFinite(exact)) {
          this.$emit("clear", this.metadata_key);
          return;
        }
        this.$emit("apply", {
          metadata_key: this.metadata_key,
          filter: { mode: "number", exact },
        });
        return;
      }

      const min = normalizeGemsSearchNumber(this.draft_min);
      const max = normalizeGemsSearchNumber(this.draft_max);
      const has_min = Number.isFinite(min);
      const has_max = Number.isFinite(max);
      if (!has_min || !has_max) {
        // Range mode requires both bounds ("between X and Y").
        if (!has_min && !has_max) {
          this.$emit("clear", this.metadata_key);
        }
        return;
      }
      this.$emit("apply", {
        metadata_key: this.metadata_key,
        filter: {
          mode: "number",
          min: Math.min(min, max),
          max: Math.max(min, max),
        },
      });
    },
  },
};
</script>

<style lang="scss" scoped>
._filterMenu {
  min-width: 14rem;
  max-width: min(22rem, 82vw);
  max-height: min(32rem, 75vh);
  display: flex;
  flex-direction: column;
  gap: calc(var(--spacing) / 2);
  padding: 0.55rem 0.6rem;
  border: 1px solid var(--c-gris_clair);
  border-radius: 6px;
  background: var(--c-blanc, #fff);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  color: var(--c-noir, #111);
  font-size: var(--sl-font-size-small, 0.875rem);
  font-weight: 400;
  text-align: left;
}

._optionList {
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: 1px;
  max-height: 18rem;
  margin: 0;
  padding: 0;
}

._optionRow {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  margin: 0;
  padding: 0.28rem 0.2rem;
  cursor: pointer;
  line-height: 1.35;
  font-weight: 400;
  text-align: left;
  border-radius: 4px;
}

._optionRow:hover {
  background: color-mix(in srgb, var(--c-gris_clair) 70%, transparent);
}

._optionRow input[type="checkbox"] {
  flex-shrink: 0;
  margin: 0;
  width: 1rem;
  height: 1rem;
  appearance: none;
  -webkit-appearance: none;
  box-sizing: border-box;
  border: 1.5px solid color-mix(in srgb, var(--c-gris_fonce) 55%, transparent);
  border-radius: 3px;
  background: var(--c-blanc, #fff);
  cursor: pointer;
  display: grid;
  place-content: center;
}

._optionRow input[type="checkbox"]::before {
  content: "";
  width: 0.45rem;
  height: 0.45rem;
  transform: scale(0);
  transition: transform 80ms ease-in-out;
  box-shadow: inset 1em 1em var(--c-blanc, #fff);
  clip-path: polygon(14% 44%, 0 65%, 50% 100%, 100% 16%, 80% 0, 43% 62%);
}

._optionRow input[type="checkbox"]:checked {
  border-color: var(--c-bleuvert);
  background: var(--c-bleuvert);
}

._optionRow input[type="checkbox"]:checked::before {
  transform: scale(1);
}

._optionRow input[type="checkbox"]:focus-visible {
  outline: 2px solid color-mix(in srgb, var(--c-bleuvert) 55%, transparent);
  outline-offset: 1px;
}

._optionRow span {
  font-weight: 400;
  min-width: 0;
}

._empty {
  margin: 0;
  color: var(--c-gris_fonce);
}

._dimensionsAxes {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
  max-height: 20rem;
  overflow: auto;
}

._dimensionAxis {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  padding-bottom: 0.55rem;
  border-bottom: 1px solid var(--c-gris_clair);
}

._dimensionAxis:last-child {
  padding-bottom: 0;
  border-bottom: 0;
}

._dimensionAxisHeader {
  display: flex;
  align-items: baseline;
  gap: 0.4rem;
}

._dimensionAxisLetter {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.25rem;
  height: 1.25rem;
  border-radius: 3px;
  background: color-mix(in srgb, var(--c-bleuvert) 14%, transparent);
  color: var(--c-bleuvert);
  font-weight: 700;
  font-size: 0.75rem;
}

._dimensionAxisName {
  font-weight: 500;
}

._numberModeTabs {
  display: flex;
  gap: 0.25rem;
}

._modeTab {
  flex: 1;
  border: 1px solid var(--c-gris_clair);
  background: transparent;
  border-radius: 3px;
  padding: 0.25rem 0.4rem;
  font-size: inherit;
  cursor: pointer;
  color: inherit;
}

._modeTab._active {
  border-color: var(--c-bleuvert);
  color: var(--c-bleuvert);
  font-weight: 600;
}

._numberFields {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

._rangeFields {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.4rem;
}

._field {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  margin: 0;
}

._fieldLabel {
  color: var(--c-gris_fonce);
}

._input {
  width: 100%;
  box-sizing: border-box;
  border: 1px solid var(--c-gris_clair);
  border-radius: 3px;
  padding: 0.3rem 0.4rem;
  font: inherit;
}

._actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding-top: 0.15rem;
  border-top: 1px solid var(--c-gris_clair);
}

._actionsRight {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
</style>
