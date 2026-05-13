<template>
  <div class="_sgHome">
    <h1 class="_pageTitle">Home</h1>
    <p>
      Use the left sidebar to navigate to Gems, Selection, and the address
      book.
    </p>
    <p class="_versionText">App version {{ app_version }}</p>
  </div>
</template>
<script>
export default {
  name: "SGHomeView",
  computed: {
    app_version() {
      return this.$root?.app_infos?.version || "unknown";
    },
  },
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

._versionText {
  margin: calc(var(--spacing) / 4) 0 0;
  color: var(--c-gris_fonce);
}
</style>
