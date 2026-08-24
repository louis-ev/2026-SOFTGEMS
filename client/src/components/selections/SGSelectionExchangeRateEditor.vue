<template>
  <div>
    <DLabel :str="label" :icon="label_icon" />
    <div class="u-inputGroup">
      <input
        ref="rate_input"
        v-model="draft"
        type="text"
        inputmode="decimal"
        class="u-input _rateInput"
        autocomplete="off"
        @keyup.enter.exact="tryShellSave"
      />
    </div>
    <p class="_hint">{{ $t("sg_selection_exchange_rate_hint") }}</p>
  </div>
</template>

<script>
import {
  normalizeSelectionExchangeRate,
  parseSelectionExchangeRate,
} from "@/utils/selection_exchange_rate.js";

export default {
  name: "SGSelectionExchangeRateEditor",
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
      default: "arrow-left-right",
    },
  },
  data() {
    return {
      draft: this.draftFromStored(this.initial_value),
    };
  },
  computed: {
    parsed_draft() {
      const trimmed = String(this.draft ?? "").trim();
      if (!trimmed) return null;
      return parseSelectionExchangeRate(this.draft);
    },
    is_draft_invalid() {
      return String(this.draft ?? "").trim() !== "" && this.parsed_draft === null;
    },
    is_footer_save_disabled() {
      return this.is_draft_invalid;
    },
  },
  watch: {
    initial_value(next_value) {
      this.draft = this.draftFromStored(next_value);
    },
    is_footer_save_disabled() {
      this.emitFooterState();
    },
  },
  mounted() {
    this.emitFooterState();
  },
  methods: {
    draftFromStored(value) {
      const n = normalizeSelectionExchangeRate(value);
      return n === null ? "" : String(n);
    },
    emitFooterState() {
      this.$emit("footerStateChange", {
        save_disabled: this.is_footer_save_disabled,
      });
    },
    tryShellSave() {
      if (this.is_footer_save_disabled) return;
      this.$emit("save", {
        value: normalizeSelectionExchangeRate(this.draft),
      });
    },
    focusInputSelect() {
      const input = this.$refs.rate_input;
      if (input && typeof input.focus === "function") input.focus();
      if (input && typeof input.select === "function") input.select();
    },
  },
};
</script>

<style lang="scss" scoped>
._rateInput {
  width: 100%;
  max-width: 8rem;
}

._hint {
  margin: calc(var(--spacing) * 0.35) 0 0;
  color: var(--c-gris_fonce);
  font-size: var(--sl-font-size-x-small);
}
</style>
