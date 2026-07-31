<template>
  <div class="_mediaViewer">
    <div v-if="is_loading" class="_status">
      <LoaderSpinner />
    </div>
    <p v-else-if="error_message" class="_status">{{ error_message }}</p>
    <img
      v-else-if="is_image"
      class="_media"
      :src="media_src"
      :alt="media_filename"
    />
    <vue-plyr v-else-if="is_video" class="_plyr" :key="media_src">
      <video :src="media_src" playsinline preload="metadata" />
    </vue-plyr>
    <p v-else class="_status">{{ $t("sg_media_viewer_unsupported") }}</p>
  </div>
</template>

<script>
import Medias from "@/mixins/Medias.js";

const video_extensions = new Set([
  "mp4",
  "webm",
  "mov",
  "m4v",
  "ogg",
  "ogv",
]);

export default {
  name: "SGMediaViewerView",
  mixins: [Medias],
  data() {
    return {
      is_loading: true,
      media: null,
      direct_media_src: "",
      direct_media_type: "",
      error_message: "",
    };
  },
  computed: {
    path_to_meta() {
      return this.decodeQueryValue(this.$route.query.path_to_meta);
    },
    path_to_media() {
      return this.decodeQueryValue(this.$route.query.path_to_media);
    },
    query_type() {
      return String(this.$route.query.type || "")
        .trim()
        .toLowerCase();
    },
    is_image() {
      if (this.direct_media_type) return this.direct_media_type === "image";
      return this.media?.$type === "image";
    },
    is_video() {
      if (this.direct_media_type) return this.direct_media_type === "video";
      return this.media?.$type === "video";
    },
    media_filename() {
      if (this.direct_media_src) {
        const path_only = this.direct_media_src.split("?")[0];
        return path_only.split("/").filter(Boolean).pop() || "";
      }
      return String(this.media?.$media_filename || "").trim();
    },
    media_src() {
      if (this.direct_media_src) return this.direct_media_src;
      if (!this.media?.$path || !this.media_filename) return "";
      return this.makeMediaFilePath({
        $path: this.media.$path,
        $media_filename: this.media.$media_filename,
      });
    },
  },
  async mounted() {
    await this.loadMedia();
  },
  watch: {
    "$route.fullPath"() {
      this.loadMedia();
    },
  },
  methods: {
    decodeQueryValue(raw) {
      if (raw == null || raw === "") return "";
      try {
        return decodeURIComponent(String(raw));
      } catch {
        return String(raw);
      }
    },
    resolveDirectMediaType(media_path) {
      if (this.query_type === "image" || this.query_type === "video") {
        return this.query_type;
      }
      const path_only = String(media_path || "").split("?")[0];
      const ext = path_only.split(".").pop()?.toLowerCase() || "";
      if (video_extensions.has(ext)) return "video";
      if (ext) return "image";
      return "";
    },
    normalizeMediaSrc(media_path) {
      const path = String(media_path || "").trim();
      if (!path) return "";
      if (/^https?:\/\//i.test(path)) return path;
      return path.startsWith("/") ? path : `/${path}`;
    },
    async loadMedia() {
      this.is_loading = true;
      this.media = null;
      this.direct_media_src = "";
      this.direct_media_type = "";
      this.error_message = "";

      if (this.path_to_media) {
        const media_type = this.resolveDirectMediaType(this.path_to_media);
        const src = this.normalizeMediaSrc(this.path_to_media);
        if (!src || !["image", "video"].includes(media_type)) {
          this.error_message = this.$t("sg_media_viewer_unsupported");
        } else {
          this.direct_media_src = src;
          this.direct_media_type = media_type;
        }
        this.is_loading = false;
        return;
      }

      const path = this.path_to_meta;
      if (!path) {
        this.error_message = this.$t("sg_media_viewer_missing_path");
        this.is_loading = false;
        return;
      }
      try {
        this.media = await this.$api.getFile({ path });
        if (!this.media || !["image", "video"].includes(this.media.$type)) {
          this.media = null;
          this.error_message = this.$t("sg_media_viewer_unsupported");
        }
      } catch (err) {
        console.error(err);
        this.error_message = this.$t("sg_media_viewer_load_error");
      }
      this.is_loading = false;
    },
  },
};
</script>

<style lang="scss" scoped>
._mediaViewer {
  box-sizing: border-box;
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100%;
  margin: 0;
  background: #000;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
}

._status {
  margin: 0;
  padding: 1.5rem;
  text-align: center;
  font-family: "Inter", Arial, Helvetica, sans-serif;
  font-size: 14px;
}

._media {
  max-width: 100%;
  max-height: 100%;
  width: auto;
  height: auto;
  object-fit: contain;
}

._plyr {
  width: 100%;
  height: 100%;

  ::v-deep {
    .plyr,
    .plyr--video {
      width: 100%;
      height: 100%;
    }

    .plyr__video-wrapper,
    video {
      width: 100%;
      height: 100%;
    }

    video {
      object-fit: contain;
      background: #000;
    }
  }
}
</style>
