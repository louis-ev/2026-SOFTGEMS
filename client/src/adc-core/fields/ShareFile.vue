<template>
  <div>
    <button
      type="button"
      class="u-buttonLink"
      @click="show_qr_code_modal = true"
    >
      <slot />
    </button>

    <QRModal
      v-if="show_qr_code_modal"
      :url_to_access="preview_url"
      @close="show_qr_code_modal = false"
    >
      {{ $t("share_link_to_file") }}
    </QRModal>
  </div>
</template>
<script>
import { resolveAppPublicOrigin } from "@/utils/app_public_url.js";
import { makeGemMediaViewerAbsoluteUrl } from "@/utils/selection_pdf_gem_helpers.js";

export default {
  props: {
    file: Object,
  },
  components: {},
  data() {
    return {
      show_qr_code_modal: false,
    };
  },
  created() {},
  mounted() {},
  beforeDestroy() {},
  watch: {},
  computed: {
    preview_url() {
      if (!this.file?.$path) return false;
      const viewer_url = makeGemMediaViewerAbsoluteUrl(this.file);
      if (viewer_url) return viewer_url;
      return (
        resolveAppPublicOrigin() +
        "/_previewmedia?path_to_meta=" +
        encodeURIComponent(this.file.$path)
      );
    },
  },
  methods: {},
};
</script>
<style lang="scss" scoped></style>
