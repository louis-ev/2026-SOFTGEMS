<template>
  <div class="_sgHome">
    <h1 class="_title">{{ $t("sg_inventory") }}</h1>
    <p class="_placeholderText">Home placeholder for now.</p>
  </div>
</template>
<script>
export default {
  name: "SGHomeView",
};
</script>
<style lang="scss" scoped>
._sgHome {
  margin: 0 auto;
  padding: calc(var(--spacing) * 2) calc(var(--spacing) * 3);
}

._title {
  margin: 0;
  margin-bottom: calc(var(--spacing) * 1);
}

._placeholderText {
  margin: 0;
  color: var(--c-gris_fonce);
}
</style>
