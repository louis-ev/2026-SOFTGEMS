<template>
  <div class="_dateInput">
    <input
      ref="date_input"
      type="date"
      class="u-input"
      :value="input_value"
      :disabled="disabled"
      :required="required"
      @input="onInput"
    />
    <button
      type="button"
      class="u-buttonLink _todayBtn"
      :disabled="disabled"
      @click="setToday"
    >
      {{ $t("sg_set_date_to_today") }}
    </button>
  </div>
</template>

<script>
import { toDateInputValue, todayDateInputValue } from "@/utils/date_input.js";

export default {
  name: "SGDateInput",
  props: {
    value: {
      type: String,
      default: "",
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    required: {
      type: Boolean,
      default: false,
    },
    autofocus: {
      type: Boolean,
      default: false,
    },
  },
  computed: {
    input_value() {
      return toDateInputValue(this.value);
    },
  },
  mounted() {
    if (this.autofocus) {
      this.$refs.date_input?.focus?.();
    }
  },
  methods: {
    onInput(event) {
      const next_value =
        event && event.target ? String(event.target.value || "") : "";
      this.$emit("input", next_value);
    },
    setToday() {
      if (this.disabled) return;
      this.$emit("input", todayDateInputValue());
    },
  },
};
</script>

<style lang="scss" scoped>
._dateInput {
}

._todayBtn {
  margin-top: 0.35rem;
}
</style>
