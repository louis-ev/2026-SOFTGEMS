<template>
  <BaseModal2
    :title="$t('sg_split_gem_modal_title')"
    size="large"
    :is_closable="!is_splitting"
    @close="onCloseRequested"
  >
    <template v-if="show_progress_view">
      <ol class="_progress" role="status" aria-live="polite">
        <li
          class="_progressStep"
          :class="progressStepClass('copy')"
        >
          <b-icon :icon="progressStepIcon('copy')" class="_progressIcon" />
          {{ $t("sg_split_gem_progress_copy") }}
        </li>
        <li
          class="_progressStep"
          :class="progressStepClass('original')"
        >
          <b-icon :icon="progressStepIcon('original')" class="_progressIcon" />
          {{ $t("sg_split_gem_progress_original") }}
        </li>
        <li
          v-if="progress_selection_total > 0"
          class="_progressStep"
          :class="progressStepClass('selections')"
        >
          <b-icon :icon="progressStepIcon('selections')" class="_progressIcon" />
          {{
            $t("sg_split_gem_progress_selections", {
              current: progress_selection_current,
              total: progress_selection_total,
            })
          }}
        </li>
      </ol>
    </template>

    <template v-else-if="is_pieces_step">
      <p class="_intro">{{ $t("sg_split_gem_pieces_question") }}</p>
      <div class="_field">
        <TextInput
          label_str="sg_split_gem_new_pieces"
          :content="new_pieces_text"
          :instructions="pieces_hint"
          input_type="number"
          :input_step="1"
          :required="false"
          :disabled="is_splitting"
          :read_only="is_pieces_locked"
          :autofocus="!is_pieces_locked"
          @update:content="new_pieces_text = $event"
          @onEnter="confirmSplit"
        />
        <p v-if="pieces_remainder_label" class="_remainder" role="status">
          {{ pieces_remainder_label }}
        </p>
        <p v-if="weight_preview_label" class="_preview" role="status">
          {{ weight_preview_label }}
        </p>
        <p v-if="selections_preview_label" class="_preview" role="status">
          {{ selections_preview_label }}
        </p>
      </div>
    </template>

    <template v-else>
      <p class="_intro">{{ $t("sg_split_gem_weight_intro") }}</p>
      <div class="_field">
        <TextInput
          :key="`weight-${new_pieces_text}`"
          label_str="sg_split_gem_new_weight"
          :content="new_weight_text"
          :placeholder="suggested_weight_placeholder"
          :instructions="$t('sg_split_gem_weight_hint')"
          input_type="number"
          :input_step="0.001"
          :required="false"
          :disabled="is_splitting"
          :autofocus="true"
          @update:content="new_weight_text = $event"
          @onEnter="confirmSplit"
        />
      </div>

      <div v-if="plan.ok" class="_comparison" role="table">
        <div class="_comparisonHead" role="row">
          <span role="columnheader" />
          <span role="columnheader">{{
            $t("sg_split_gem_original_column")
          }}</span>
          <span role="columnheader">{{ $t("sg_split_gem_new_column") }}</span>
        </div>
        <div
          v-for="row in comparison_rows"
          :key="row.key"
          class="_comparisonRow"
          role="row"
        >
          <span class="_fieldLabel" role="rowheader">{{ row.label }}</span>
          <span class="_changeArrow" role="cell">
            <span class="_from">{{ row.original_from }}</span>
            <span class="_arrow" aria-hidden="true">&rarr;</span>
            <span class="_to">{{ row.original_to }}</span>
          </span>
          <span class="_to" role="cell">{{ row.new_to }}</span>
        </div>
      </div>

      <div class="_selections">
        <p class="_sectionTitle">{{ $t("sg_split_gem_selections_intro") }}</p>
        <p v-if="parent_selection_paths.length === 0" class="_empty">
          {{ $t("sg_split_gem_selections_empty") }}
        </p>
        <label
          v-for="path in parent_selection_paths"
          :key="path"
          class="_selectionRow"
        >
          <input
            type="checkbox"
            :checked="Boolean(selected_selection_paths[path])"
            :disabled="is_splitting"
            @change="toggleSelectionPath(path, $event)"
          />
          <span>{{ selectionCheckboxLabel(path) }}</span>
        </label>
      </div>
    </template>

    <p
      v-for="error_key in unique_errors"
      :key="error_key"
      class="u-errorMsg"
    >
      {{ $t(error_key) }}
    </p>

    <p v-if="error_message" class="u-errorMsg _error">{{ error_message }}</p>

    <template slot="footer">
      <template v-if="!show_progress_view">
        <button
          v-if="is_pieces_step"
          class="u-button"
          type="button"
          :disabled="is_splitting"
          @click="onCloseRequested"
        >
          <b-icon icon="x-circle" />
          {{ $t("cancel") }}
        </button>
        <button
          v-if="is_advanced_step"
          class="u-button"
          type="button"
          :disabled="is_splitting"
          @click="goToPiecesStep"
        >
          <b-icon icon="arrow-left-short" />
          {{ $t("sg_back") }}
        </button>
        <div v-if="is_pieces_step" class="u-sameRow _footerActions">
          <button
            class="u-button"
            type="button"
            :disabled="is_splitting || !pieces_draft.ok"
            @click="goToAdvancedStep"
          >
            <b-icon icon="sliders" />
            {{ $t("sg_split_gem_advanced") }}
          </button>
          <button
            class="u-button u-button_black"
            type="button"
            :disabled="is_splitting || !pieces_draft.ok"
            @click="confirmSplit"
          >
            <b-icon icon="scissors" />
            {{ $t("sg_split_gem_confirm") }}
          </button>
        </div>
        <button
          v-else
          class="u-button u-button_black"
          type="button"
          :disabled="is_splitting || !plan.ok"
          @click="confirmSplit"
        >
          <b-icon icon="scissors" />
          {{ $t("sg_split_gem_confirm") }}
        </button>
      </template>
      <button
        v-else-if="!is_splitting"
        class="u-button"
        type="button"
        @click="onCloseRequested"
      >
        <b-icon icon="x-circle" />
        {{ $t("cancel") }}
      </button>
      <LoaderSpinner v-if="is_splitting" />
    </template>
  </BaseModal2>
</template>

<script>
import {
  computeGemSplitPlan,
  formatGemSplitWeightInput,
  gemSplitAcceptedPiecesRange,
  listGemSplitComparisonRows,
  listGemSplitParentSelectionPaths,
  parseGemSplitPieces,
  runGemSplit,
  suggestedGemSplitWeight,
  validateGemSplitPiecesDraft,
} from "@/utils/gem_split.js";
import { formatDisplayNumber } from "@/utils/format_locale.js";
import {
  parseSelectionFolderPath,
  resolveSelectionType,
} from "@/utils/selection_paths.js";
import { selectionTypeLabel as selectionTypeLabelFn } from "@/utils/selection_types.js";

const PROGRESS_STEP_ORDER = Object.freeze(["copy", "original", "selections"]);

function initial_selected_map(gem) {
  const selected = {};
  for (const path of listGemSplitParentSelectionPaths(gem)) {
    selected[path] = true;
  }
  return selected;
}

export default {
  name: "SGGemSplitModal",
  props: {
    gem: {
      type: Object,
      default: null,
    },
    gem_path: {
      type: String,
      required: true,
    },
    gem_id: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      step: "pieces",
      new_weight_text: "",
      new_pieces_text: "1",
      is_splitting: false,
      error_message: "",
      selected_selection_paths: initial_selected_map(this.gem),
      selection_folders_by_path: {},
      progress_step: "",
      progress_selection_current: 0,
      progress_selection_total: 0,
    };
  },
  computed: {
    is_pieces_step() {
      return this.step === "pieces";
    },
    is_advanced_step() {
      return this.step === "advanced";
    },
    show_progress_view() {
      if (this.is_splitting) return true;
      if (!this.error_message) return false;
      return (
        this.progress_step === "original" || this.progress_step === "selections"
      );
    },
    pieces_range() {
      return gemSplitAcceptedPiecesRange(this.gem);
    },
    is_pieces_locked() {
      const range = this.pieces_range;
      return Boolean(range && range.min === range.max);
    },
    pieces_draft() {
      return validateGemSplitPiecesDraft({
        gem: this.gem,
        new_pieces_raw: this.new_pieces_text,
      });
    },
    pieces_hint() {
      const range = this.pieces_range;
      const count = formatDisplayNumber(this.pieces_draft.original_pieces, {
        maximumFractionDigits: 0,
        minimumFractionDigits: 0,
      });
      if (!count) return "";
      if (!range || this.is_pieces_locked) {
        return this.$t("sg_split_gem_pieces_hint", { count });
      }
      return this.$t("sg_split_gem_pieces_hint_range", {
        count,
        min: range.min,
        max: range.max,
      });
    },
    pieces_remainder_label() {
      const from = formatDisplayNumber(this.pieces_draft.original_pieces, {
        maximumFractionDigits: 0,
        minimumFractionDigits: 0,
      });
      const to = formatDisplayNumber(this.pieces_draft.remaining_pieces, {
        maximumFractionDigits: 0,
        minimumFractionDigits: 0,
      });
      if (!from || to === null) return "";
      return this.$t("sg_split_gem_original_remaining", {
        from,
        to,
      });
    },
    suggested_weight() {
      return suggestedGemSplitWeight(
        this.gem,
        parseGemSplitPieces(this.new_pieces_text)
      );
    },
    suggested_weight_placeholder() {
      return formatGemSplitWeightInput(this.suggested_weight) || "\u2026";
    },
    weight_preview_label() {
      if (!this.pieces_draft.ok || this.suggested_weight === null) return "";
      const original_weight = this.pieces_draft.original_weight;
      if (original_weight === null) return "";
      const remaining_weight = Number(
        (original_weight - this.suggested_weight).toFixed(3)
      );
      const new_weight = formatDisplayNumber(this.suggested_weight, {
        maximumFractionDigits: 3,
      });
      const remaining = formatDisplayNumber(remaining_weight, {
        maximumFractionDigits: 3,
      });
      if (!new_weight || remaining === null) return "";
      return this.$t("sg_split_gem_weight_preview", {
        new_weight,
        remaining_weight: remaining,
      });
    },
    parent_selection_paths() {
      return listGemSplitParentSelectionPaths(this.gem);
    },
    parent_selection_count() {
      return this.parent_selection_paths.length;
    },
    selections_preview_label() {
      if (!this.pieces_draft.ok || this.parent_selection_count === 0) return "";
      return this.$t("sg_split_gem_selections_preview", {
        count: this.parent_selection_count,
      });
    },
    checked_selection_paths() {
      return this.parent_selection_paths.filter(
        (path) => this.selected_selection_paths[path]
      );
    },
    effective_weight_raw() {
      const typed = String(this.new_weight_text || "").trim();
      if (typed) return typed;
      return formatGemSplitWeightInput(this.suggested_weight);
    },
    plan() {
      return computeGemSplitPlan({
        gem: this.gem,
        new_weight_raw: this.effective_weight_raw,
        new_pieces_raw: this.new_pieces_text,
      });
    },
    comparison_rows() {
      return listGemSplitComparisonRows(this.gem, this.plan, this.$t.bind(this));
    },
    unique_errors() {
      if (this.show_progress_view) return [];
      if (this.is_pieces_step) {
        if (this.pieces_draft.ok) return [];
        const typed_pieces = String(this.new_pieces_text || "").trim();
        const original_blocked = this.pieces_draft.errors.some((key) =>
          [
            "sg_split_gem_error_original_weight",
            "sg_split_gem_error_original_pieces",
          ].includes(key)
        );
        if (!typed_pieces && !original_blocked) return [];
        return [...new Set(this.pieces_draft.errors)];
      }
      if (this.plan.ok) return [];
      return [...new Set(this.plan.errors)];
    },
  },
  created() {
    this.loadParentSelectionFolders();
  },
  methods: {
    onCloseRequested() {
      if (this.is_splitting) return;
      this.$emit("close");
    },
    goToAdvancedStep() {
      if (this.is_splitting || !this.pieces_draft.ok) return;
      this.error_message = "";
      this.new_weight_text = "";
      this.step = "advanced";
    },
    goToPiecesStep() {
      if (this.is_splitting) return;
      this.error_message = "";
      this.step = "pieces";
    },
    toggleSelectionPath(path, event) {
      this.$set(
        this.selected_selection_paths,
        path,
        Boolean(event?.target?.checked)
      );
    },
    selectionCheckboxLabel(path) {
      const folder = this.selection_folders_by_path[path] || { $path: path };
      const parsed = parseSelectionFolderPath(path);
      const type_value =
        resolveSelectionType(folder) || parsed.selection_type;
      const type_label = selectionTypeLabelFn(this.$t.bind(this), type_value);
      const id = String(parsed.folder_slug || "").trim();
      const name =
        typeof folder.internal_name === "string"
          ? folder.internal_name.trim()
          : "";
      const id_part = id ? `#${id}` : path;
      if (name) return `${type_label} ${id_part} — ${name}`;
      return `${type_label} ${id_part}`;
    },
    progressStepIndex(step) {
      return PROGRESS_STEP_ORDER.indexOf(step);
    },
    progressStepState(step) {
      const current = this.progressStepIndex(this.progress_step);
      const index = this.progressStepIndex(step);
      if (current < 0 || index < 0) return "pending";
      if (index < current) return "done";
      if (index > current) return "pending";
      if (this.is_splitting) return "current";
      return this.error_message ? "failed" : "done";
    },
    progressStepClass(step) {
      const state = this.progressStepState(step);
      return {
        "is--done": state === "done",
        "is--current": state === "current",
        "is--failed": state === "failed",
        "is--pending": state === "pending",
      };
    },
    progressStepIcon(step) {
      const state = this.progressStepState(step);
      if (state === "done") return "check-circle";
      if (state === "failed") return "exclamation-circle";
      if (state === "current") return "arrow-right-circle";
      return "circle";
    },
    async loadParentSelectionFolders() {
      const paths = this.parent_selection_paths;
      if (!paths.length) return;
      const results = await Promise.all(
        paths.map(async (path) => {
          try {
            const folder = await this.$api.getFolder({ path });
            return [path, folder || { $path: path }];
          } catch {
            return [path, { $path: path }];
          }
        })
      );
      const by_path = {};
      for (const [path, folder] of results) {
        by_path[path] = folder;
      }
      this.selection_folders_by_path = by_path;
    },
    confirmPlan() {
      if (this.is_pieces_step) {
        return computeGemSplitPlan({
          gem: this.gem,
          new_weight_raw: formatGemSplitWeightInput(this.suggested_weight),
          new_pieces_raw: this.new_pieces_text,
        });
      }
      return this.plan;
    },
    selectedPathsForConfirm() {
      if (this.is_pieces_step) return this.parent_selection_paths;
      return this.checked_selection_paths;
    },
    onSplitProgress(info) {
      if (!info || !info.step) return;
      this.progress_step = info.step;
      if (info.step === "selections") {
        this.progress_selection_current = info.current || 0;
        this.progress_selection_total = info.total || 0;
      }
    },
    async confirmSplit() {
      if (!this.gem_path || this.is_splitting) return;
      const plan = this.confirmPlan();
      if (!plan.ok) return;
      const selected_selection_paths = this.selectedPathsForConfirm();
      this.is_splitting = true;
      this.error_message = "";
      this.progress_step = "copy";
      this.progress_selection_current = 0;
      this.progress_selection_total = selected_selection_paths.length;
      try {
        const { copy_folder_path, new_gem_id } = await runGemSplit({
          api: this.$api,
          gem: this.gem,
          gem_path: this.gem_path,
          gem_id: this.gem_id,
          plan,
          selected_selection_paths,
          on_progress: this.onSplitProgress,
        });
        this.$alertify
          .closeLogOnClick(true)
          .delay(4000)
          .success(
            this.$t("sg_split_gem_success", {
              id: new_gem_id || copy_folder_path,
            })
          );
        this.$emit("splitCompleted", {
          copy_folder_path,
          new_gem_id,
        });
        this.$emit("close");
      } catch (err) {
        const code = err && err.code;
        const new_gem_id = err && err.new_gem_id;
        if (code === "split_original_update_failed" || new_gem_id) {
          if (code === "split_selection_failed") {
            this.error_message = this.$t("sg_split_gem_selection_failed", {
              id: new_gem_id,
              name: this.selectionCheckboxLabel(err.selection_path),
            });
          } else {
            this.error_message = this.$t("sg_split_gem_original_update_failed", {
              id: new_gem_id || (err && err.copy_folder_path),
            });
          }
        } else if (!this.error_message) {
          this.error_message =
            code === "not_allowed_to_copy_folder"
              ? this.$t("sg_split_gem_not_allowed")
              : code || this.$t("sg_split_gem_failed");
        }
      } finally {
        this.is_splitting = false;
      }
    },
  },
};
</script>

<style lang="scss" scoped>
._footerActions {
  flex-shrink: 0;
}

._intro {
  margin: 0 0 calc(var(--spacing) * 1.25);
  font-size: var(--sl-font-size-small);
  line-height: 1.45;
}

._field {
  min-width: 0;
  margin: 0 0 calc(var(--spacing) * 1);
}

._remainder,
._preview {
  margin: calc(var(--spacing) / 3) 0 0;
  font-size: var(--sl-font-size-small);
  font-variant-numeric: tabular-nums;
  line-height: 1.4;
}

._remainder {
  font-weight: 600;
}

._preview {
  color: var(--color-gray, #666);
}

._comparison {
  display: grid;
  gap: calc(var(--spacing) * 0.65);
  margin: 0 0 calc(var(--spacing) * 1.25);
}

._comparisonHead,
._comparisonRow {
  display: grid;
  grid-template-columns: minmax(6.5rem, 0.9fr) minmax(0, 1.2fr) minmax(0, 1fr);
  gap: calc(var(--spacing) * 0.75);
  align-items: baseline;
}

._comparisonHead {
  font-size: var(--sl-font-size-small);
  font-weight: 600;
}

._comparisonRow {
  font-size: var(--sl-font-size-small);
  line-height: 1.45;
}

._fieldLabel {
  font-weight: 600;
}

._changeArrow {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.35em;
  color: var(--color-gray, #666);
}

._from {
  text-decoration: line-through;
  opacity: 0.85;
}

._arrow {
  opacity: 0.7;
}

._to {
  color: inherit;
  font-weight: 500;
  text-decoration: none;
  opacity: 1;
}

._sectionTitle {
  margin: 0 0 calc(var(--spacing) * 0.5);
  font-size: var(--sl-font-size-small);
  font-weight: 600;
}

._selections {
  margin: 0 0 calc(var(--spacing) * 1);
}

._empty {
  margin: 0;
  font-size: var(--sl-font-size-small);
  color: var(--color-gray, #666);
}

._selectionRow {
  display: flex;
  align-items: flex-start;
  gap: calc(var(--spacing) * 0.5);
  margin: 0 0 calc(var(--spacing) * 0.35);
  font-size: var(--sl-font-size-small);
  line-height: 1.4;
  cursor: pointer;
}

._selectionRow input[type="checkbox"] {
  flex-shrink: 0;
  margin: 0.15em 0 0;
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

._selectionRow input[type="checkbox"]::before {
  content: "";
  width: 0.45rem;
  height: 0.45rem;
  transform: scale(0);
  transition: transform 80ms ease-in-out;
  box-shadow: inset 1em 1em var(--c-blanc, #fff);
  clip-path: polygon(14% 44%, 0 65%, 50% 100%, 100% 16%, 80% 0, 43% 62%);
}

._selectionRow input[type="checkbox"]:checked {
  border-color: var(--c-bleuvert);
  background: var(--c-bleuvert);
}

._selectionRow input[type="checkbox"]:checked::before {
  transform: scale(1);
}

._selectionRow input[type="checkbox"]:focus-visible {
  outline: 2px solid color-mix(in srgb, var(--c-bleuvert) 55%, transparent);
  outline-offset: 1px;
}

._selectionRow input[type="checkbox"]:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

._progress {
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: calc(var(--spacing) * 0.65);
}

._progressStep {
  display: flex;
  align-items: center;
  gap: calc(var(--spacing) * 0.45);
  font-size: var(--sl-font-size-small);
  line-height: 1.4;
  color: var(--color-gray, #666);
}

._progressStep.is--current {
  color: inherit;
  font-weight: 600;
}

._progressStep.is--done {
  color: inherit;
}

._progressStep.is--failed {
  color: var(--c-rouge, #b00020);
  font-weight: 600;
}

._progressIcon {
  flex-shrink: 0;
}

._error {
  margin: 0 0 calc(var(--spacing) * 0.5);
}

@media (max-width: 640px) {
  ._comparisonHead,
  ._comparisonRow {
    grid-template-columns: 1fr;
    gap: 0.15em;
  }

  ._comparisonHead span:empty {
    display: none;
  }
}
</style>
