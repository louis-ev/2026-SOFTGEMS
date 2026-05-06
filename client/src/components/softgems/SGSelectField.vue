<template>
  <select
    class="_sgSelectField"
    :value="normalized_value"
    :required="required"
    :disabled="disabled"
    @change="onValueChange"
  >
    <option v-if="allow_empty" value="">
      {{ empty_label }}
    </option>
    <option
      v-for="option_item in normalized_options"
      :key="option_item.value"
      :value="option_item.value"
    >
      {{ option_item.label }}
    </option>
  </select>
</template>

<script>
export default {
  name: "SGSelectField",
  props: {
    value: {
      type: [String, Number],
      default: "",
    },
    options: {
      type: Array,
      default: () => [],
    },
    required: {
      type: Boolean,
      default: false,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    allow_empty: {
      type: Boolean,
      default: true,
    },
    empty_label: {
      type: String,
      default: "-",
    },
  },
  computed: {
    normalized_options() {
      const normalized_options = this.options
        .map((option_item) => {
          if (
            option_item !== null &&
            typeof option_item === "object" &&
            !Array.isArray(option_item)
          ) {
            const option_value = option_item.value;
            return {
              value: option_value !== undefined ? String(option_value) : "",
              label:
                option_item.label !== undefined
                  ? String(option_item.label)
                  : String(option_value),
            };
          }
          return {
            value: String(option_item),
            label: String(option_item),
          };
        })
        .filter((option_item) => option_item.value !== "");

      const current_value = String(this.value ?? "").trim();
      if (!current_value) return normalized_options;

      const has_current_value = normalized_options.some(
        (option_item) => option_item.value === current_value
      );
      if (has_current_value) return normalized_options;

      // Keep unknown/imported values selectable instead of forcing empty.
      return [
        { value: current_value, label: current_value },
        ...normalized_options,
      ];
    },
    allowed_values() {
      return this.normalized_options.map((option_item) => option_item.value);
    },
    normalized_value() {
      const current_value = String(this.value ?? "");
      if (this.allowed_values.includes(current_value)) return current_value;
      if (this.allow_empty) return "";
      return this.allowed_values[0] || "";
    },
  },
  watch: {
    normalized_value: {
      handler(new_value) {
        if (String(this.value ?? "") !== new_value) this.$emit("input", new_value);
      },
      immediate: true,
    },
  },
  methods: {
    onValueChange(event) {
      const next_value = event?.target?.value ?? "";
      this.$emit("input", next_value);
      this.$emit("change", next_value);
    },
  },
};
</script>

<style lang="scss" scoped>
._sgSelectField {
  width: 100%;
}
</style>
