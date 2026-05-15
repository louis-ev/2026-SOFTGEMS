<template>
  <p v-if="notice_message" class="_impactNotice">{{ notice_message }}</p>
</template>

<script>
export default {
  name: "SGGemFieldPricingExtras",
  props: {
    notice_message: {
      type: String,
      default: "",
    },
  },
};
</script>

<style lang="scss" scoped>
._impactNotice {
  margin: calc(var(--spacing) / 6) 0 0;
  color: var(--c-gris_fonce);
  font-size: var(--sl-font-size-x-small);
}
</style>
