<template>
  <div class="_selectionsLayout">
    <SGSelectionsTypeSidebar />
    <div class="_selectionsMain">
      <router-view />
    </div>
  </div>
</template>

<script>
import SGSelectionsTypeSidebar from "@/components/selections/SGSelectionsTypeSidebar.vue";

export default {
  name: "SGSelectionsLayout",
  components: {
    SGSelectionsTypeSidebar,
  },
};
</script>

<style lang="scss" scoped>
._selectionsLayout {
  display: flex;
  height: 100%;
  min-height: 0;
  overflow: hidden;
}

._selectionsMain {
  flex: 1;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
}
</style>
