<template>
  <div class="_legacyRedirect">
    <LoaderSpinner v-if="!fetch_error" />
    <p v-else class="u-errorMsg">{{ fetch_error }}</p>
  </div>
</template>

<script>
import {
  parseSelectionFolderParam,
  selectionDetailPath,
  selectionHubPath,
} from "@/utils/selection_urls.js";
import { selectionSlugFromType } from "@/utils/selection_type_registry.js";

export default {
  name: "SGSelectionLegacyRedirectView",
  props: {
    selection_path: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      fetch_error: "",
    };
  },
  async created() {
    await this.redirectToTypedUrl();
  },
  methods: {
    async redirectToTypedUrl() {
      const parsed = parseSelectionFolderParam(this.selection_path);
      if (!parsed.folder_slug) {
        this.fetch_error = this.$t("sg_selection_invalid_path");
        return;
      }

      const folder_path = `selections/${parsed.folder_slug}`;
      try {
        const folder = await this.$api.getFolder({ path: folder_path });
        const type_slug = selectionSlugFromType(folder?.selection_type);
        if (!type_slug) {
          this.$router.replace(selectionHubPath());
          return;
        }
        const next_path = selectionDetailPath({
          type_slug,
          folder_slug: parsed.folder_slug,
          internal_name: folder?.internal_name,
        });
        if (this.$route.path !== next_path) {
          this.$router.replace(next_path);
        }
      } catch ({ code }) {
        this.fetch_error = code || this.$t("sg_could_not_load_selection");
      }
    },
  },
};
</script>

<style lang="scss" scoped>
._legacyRedirect {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 120px;
  padding: calc(var(--spacing) * 2);
}
</style>
