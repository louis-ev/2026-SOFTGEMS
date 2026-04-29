<template>
  <div class="_sgHome">
    <h1 class="_pageTitle">Home</h1>
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
  height: 100%;
  overflow-y: auto;
  padding: calc(var(--spacing) * 2) calc(var(--spacing) * 3);
}

._pageTitle {
  margin: 0;
  margin-bottom: calc(var(--spacing) * 1);
}

._placeholderText {
  margin: 0;
  color: var(--c-gris_fonce);
}
</style>
