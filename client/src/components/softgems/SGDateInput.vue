<template>
  <input
    ref="date_input"
    type="date"
    class="u-input"
    :value="input_value"
    :disabled="disabled"
    :required="required"
    @input="onInput"
  />
</template>

<script>
import { toDateInputValue } from "@/utils/date_input.js";

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
  },
};
</script>
