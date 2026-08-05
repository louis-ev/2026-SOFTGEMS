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

    <template v-else>
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
import { normalizeGemsSearchNumber } from "@/utils/gems_quick_search.js";

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
      validator: (v) => v === "enum" || v === "number",
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
      menu_style: {},
    };
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
      const el = this.$refs.exact_input;
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
    syncDraftFromCurrent() {
      const filter = this.current_filter;
      if (this.mode === "enum") {
        this.draft_values = Array.isArray(filter?.values)
          ? [...filter.values]
          : [];
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
        const values = (this.draft_values || [])
          .map((v) => String(v).trim())
          .filter(Boolean);
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
  min-width: 12.5rem;
  max-width: min(18rem, 70vw);
  max-height: min(22rem, 60vh);
  display: flex;
  flex-direction: column;
  gap: calc(var(--spacing) / 2);
  padding: calc(var(--spacing) / 2);
  border: 1px solid var(--c-gris_clair);
  border-radius: 4px;
  background: var(--c-blanc, #fff);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  color: var(--c-noir, #111);
  font-size: var(--sl-font-size-x-small);
  font-weight: 400;
  text-align: left;
}

._optionList {
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: 2px;
  max-height: 14rem;
  margin: 0;
  padding: 0;
}

._optionRow {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  margin: 0;
  padding: 0.2rem 0.15rem;
  cursor: pointer;
  line-height: 1.35;
  font-weight: 400;
  text-align: left;
}

._optionRow input {
  flex-shrink: 0;
  margin: 0;
  width: 0.9rem;
  height: 0.9rem;
}

._optionRow span {
  font-weight: 400;
  min-width: 0;
}

._empty {
  margin: 0;
  color: var(--c-gris_fonce);
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
