<template>
  <div v-if="file" class="_selectionFileThumb">
    <MediaContent :file="file" context="preview" :resolution="resolution" />
  </div>
</template>

<script>
import MediaContent from "@/adc-core/fields/MediaContent.vue";

export default {
  name: "SGSelectionFileThumb",
  components: {
    MediaContent,
  },
  props: {
    file: {
      type: Object,
      default: null,
    },
    resolution: {
      type: Number,
      default: 640,
    },
  },
};
</script>

<style lang="scss" scoped>
._selectionFileThumb {
  width: 65px;
  flex-shrink: 0;
  border: 1px solid var(--c-gris_clair);
  border-radius: 6px;
  overflow: hidden;
  background: var(--c-gris_clair);
}

._selectionFileThumb :deep(._mediaContent) {
  display: flex;
  align-items: center;
  justify-content: center;
  aspect-ratio: 1 / 1;
  width: 100%;
}

._selectionFileThumb :deep(img._mediaContent--image) {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

._selectionFileThumb :deep(._fileName) {
  padding: calc(var(--spacing) / 2);
  font-size: 0.75rem;
}
</style>
