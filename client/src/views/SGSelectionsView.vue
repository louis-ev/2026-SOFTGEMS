<template>
  <section class="_selectionsView">
    <h1 class="_pageTitle">Selections</h1>
    <p>Selections placeholder for now.</p>
  </section>
</template>

<script>
export default {
  name: "SGSelectionsView",
};
</script>

<style lang="scss" scoped>
._selectionsView {
  height: 100%;
  overflow-y: auto;
  padding: calc(var(--spacing) * 2) calc(var(--spacing) * 3);
}

._pageTitle {
  margin: 0;
  margin-bottom: calc(var(--spacing) * 1);
}
</style>
