<template>
  <BaseModal2
    :title="$t('sg_split_gem_modal_title')"
    size="large"
    :is_closable="!is_splitting"
    @close="onCloseRequested"
  >
    <template v-if="is_pieces_step">
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
          @onEnter="goToWeightStep"
        />
        <p v-if="pieces_remainder_label" class="_remainder" role="status">
          {{ pieces_remainder_label }}
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
    </template>

    <p v-for="error_key in unique_errors" :key="error_key" class="u-errorMsg">
      {{ $t(error_key) }}
    </p>

    <p v-if="error_message" class="u-errorMsg _error">{{ error_message }}</p>

    <template slot="footer">
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
        v-if="is_weight_step"
        class="u-button"
        type="button"
        :disabled="is_splitting"
        @click="goToPiecesStep"
      >
        <b-icon icon="arrow-left-short" />
        {{ $t("sg_back") }}
      </button>
      <button
        v-if="is_pieces_step"
        class="u-button u-button_black"
        type="button"
        :disabled="is_splitting || !pieces_draft.ok"
        @click="goToWeightStep"
      >
        <b-icon icon="arrow-right-short" />
        {{ $t("next") }}
      </button>
      <button
        v-else
        class="u-button u-button_black"
        type="button"
        :disabled="is_splitting || !plan.ok"
        @click="confirmSplit"
      >
        <b-icon icon="scissors" />
        {{
          is_splitting
            ? $t("sg_split_gem_in_progress")
            : $t("sg_split_gem_confirm")
        }}
      </button>
      <LoaderSpinner v-if="is_splitting" />
    </template>
  </BaseModal2>
</template>

<script>
import {
  buildGemSplitNewMeta,
  buildGemSplitOriginalMeta,
  computeGemSplitPlan,
  formatGemSplitWeightInput,
  gemSplitAcceptedPiecesRange,
  listGemSplitComparisonRows,
  parseGemSplitPieces,
  suggestedGemSplitWeight,
  validateGemSplitPiecesDraft,
} from "@/utils/gem_split.js";
import { formatDisplayNumber } from "@/utils/format_locale.js";
import { getGemIdFromPath } from "@/utils/gem_pairing.js";

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
    };
  },
  computed: {
    is_pieces_step() {
      return this.step === "pieces";
    },
    is_weight_step() {
      return this.step === "weight";
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
  methods: {
    onCloseRequested() {
      if (this.is_splitting) return;
      this.$emit("close");
    },
    goToWeightStep() {
      if (this.is_splitting || !this.pieces_draft.ok) return;
      this.error_message = "";
      this.new_weight_text = "";
      this.step = "weight";
    },
    goToPiecesStep() {
      if (this.is_splitting) return;
      this.error_message = "";
      this.step = "pieces";
    },
    async confirmSplit() {
      if (!this.gem_path || this.is_splitting || !this.plan.ok) return;
      this.is_splitting = true;
      this.error_message = "";
      const plan = this.plan;
      try {
        const copy_folder_path = await this.$api.copyFolder({
          path: this.gem_path,
          path_to_destination_type: "gems",
          new_meta: buildGemSplitNewMeta({
            plan,
            parent_id: this.gem_id,
          }),
          is_copy_or_move: "copy",
        });
        const new_gem_id = getGemIdFromPath(copy_folder_path);
        try {
          await this.$api.updateMeta({
            path: this.gem_path,
            new_meta: buildGemSplitOriginalMeta(plan, {
              gem: this.gem,
              new_gem_id,
            }),
          });
        } catch (original_err) {
          this.error_message = this.$t("sg_split_gem_original_update_failed", {
            id: new_gem_id || copy_folder_path,
          });
          throw original_err;
        }
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
      } catch ({ code }) {
        if (!this.error_message) {
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
._intro {
  margin: 0 0 calc(var(--spacing) * 1.25);
  font-size: var(--sl-font-size-small);
  line-height: 1.45;
}

._field {
  min-width: 0;
  margin: 0 0 calc(var(--spacing) * 1);
}

._remainder {
  margin: calc(var(--spacing) / 3) 0 0;
  font-size: var(--sl-font-size-small);
  font-variant-numeric: tabular-nums;
  font-weight: 600;
  line-height: 1.4;
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
