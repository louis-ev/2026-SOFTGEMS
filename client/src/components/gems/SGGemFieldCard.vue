<template>
  <SGFieldValuePresent
    :label="label"
    :icon="icon"
    :value="value"
    :readonly="readonly"
    :is_flashing="is_flashing"
    :pill_text="link_role"
    @click="$emit('click')"
  />
</template>

<script>
import SGFieldValuePresent from "@/components/softgems/SGFieldValuePresent.vue";

export default {
  name: "SGGemFieldCard",
  components: {
    SGFieldValuePresent,
  },
  props: {
    label: {
      type: String,
      required: true,
    },
    icon: {
      type: String,
      default: "",
    },
    value: {
      default: "",
    },
    readonly: {
      type: Boolean,
      default: false,
    },
    is_flashing: {
      type: Boolean,
      default: false,
    },
    link_role: {
      type: String,
      default: "",
    },
  },
};
</script>
