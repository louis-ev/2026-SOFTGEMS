<template>
  <div>
    <DLabel :str="label" :icon="label_icon" />
    <div class="u-inputGroup">
      <input
        ref="percent_input"
        v-model.number="draft"
        type="number"
        class="u-input _percentInput"
        min="0"
        max="100"
        step="1"
        @keyup.enter.exact="tryShellSave"
      />
      <span class="u-suffix">%</span>
    </div>
    <p class="_hint">{{ $t("sg_selection_purchased_percentage_hint") }}</p>
  </div>
</template>

<script>
import { clampPartnershipPurchasedPercentage } from "@/utils/selection_buying_invoice.js";

export default {
  name: "SGSelectionPercentageFieldEditor",
  props: {
    initial_value: {
      type: [String, Number],
      default: "",
    },
    label: {
      type: String,
      required: true,
    },
    label_icon: {
      type: String,
      default: "percent",
    },
  },
  data() {
    return {
      draft: this.parseDraft(this.initial_value),
    };
  },
  computed: {
    is_footer_save_disabled() {
      return false;
    },
  },
  watch: {
    initial_value(next_value) {
      this.draft = this.parseDraft(next_value);
    },
    is_footer_save_disabled() {
      this.emitFooterState();
    },
  },
  mounted() {
    this.emitFooterState();
  },
  methods: {
    parseDraft(value) {
      const clamped = clampPartnershipPurchasedPercentage(value);
      return clamped === null ? "" : clamped;
    },
    emitFooterState() {
      this.$emit("footerStateChange", {
        save_disabled: this.is_footer_save_disabled,
      });
    },
    tryShellSave() {
      const clamped = clampPartnershipPurchasedPercentage(this.draft);
      this.$emit("save", { value: clamped });
    },
    focusInputSelect() {
      const input = this.$refs.percent_input;
      if (input && typeof input.focus === "function") input.focus();
    },
  },
};
</script>

<style lang="scss" scoped>
._percentInput {
  width: 100%;
  max-width: 8rem;
}

._hint {
  margin: calc(var(--spacing) * 0.35) 0 0;
  color: var(--c-gris_fonce);
  font-size: var(--sl-font-size-x-small);
}
</style>
