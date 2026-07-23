<template>
  <SGSectionPanel
    section_id="photos_videos"
    :title="$t('sg_section_photos_videos')"
    :count="gallery_files.length"
  >
    <template #actions>
      <div v-if="can_edit" class="_uploadRow">
        <input
          :id="upload_input_id"
          type="file"
          name="file"
          class="inputfile-2"
          accept="image/*,video/*"
          multiple="multiple"
          @change="onPickMediaFiles($event)"
        />
        <label
          :for="upload_input_id"
          class="u-button u-button_verysmall u-button_red"
        >
          {{ $t("sg_media_upload") }}
          <b-icon icon="upload" :label="$t('sg_media_upload')" />
        </label>
        <UploadFiles
          v-if="media_files_queue.length > 0"
          :files_to_import="media_files_queue"
          :path="gem_path"
          :additional_meta="media_upload_meta"
          @close="onMediaUploadClosed"
        />
      </div>
    </template>

    <p v-if="gallery_files.length === 0" class="_empty">
      {{ $t("sg_no_media_yet") }}
    </p>

    <p v-else class="_hint">{{ $t("sg_media_pdf_hint") }}</p>

    <div v-if="gallery_files.length > 0" class="_grid">
      <article
        v-for="media_file in gallery_files"
        :key="media_file.$path"
        class="_item"
      >
        <a
          v-if="getMediaOpenUrl(media_file)"
          class="_itemLink"
          :href="getMediaOpenUrl(media_file)"
          :download="
            shouldDownloadMediaFile(media_file)
              ? media_file.$media_filename || displayMediaFilename(media_file)
              : null
          "
          :target="shouldDownloadMediaFile(media_file) ? null : '_blank'"
          :title="
            shouldDownloadMediaFile(media_file) ? $t('download') : $t('open')
          "
          rel="noopener noreferrer"
        >
          <div class="_preview">
            <MediaContent :file="media_file" context="preview" :resolution="640" />
          </div>
          <div class="_meta">
            <p class="_name">{{ displayMediaFilename(media_file) }}</p>
            <p class="_type">{{ media_file.$type || "other" }}</p>
          </div>
        </a>
        <div v-else class="_itemLink _itemLink_disabled">
          <div class="_preview">
            <MediaContent :file="media_file" context="preview" :resolution="640" />
          </div>
          <div class="_meta">
            <p class="_name">{{ displayMediaFilename(media_file) }}</p>
            <p class="_type">{{ media_file.$type || "other" }}</p>
          </div>
        </div>
        <div v-if="can_edit" class="_itemActions">
          <label class="_pdfToggle">
            <input
              type="checkbox"
              :checked="isMediaIncludedInPdf(media_file)"
              :disabled="media_pdf_toggle_saving === media_file.$path"
              @change="toggleMediaPdfLink(media_file, $event.target.checked)"
            />
            <span>{{ $t("sg_media_include_in_pdf") }}</span>
          </label>
          <button
            type="button"
            class="u-buttonLink u-buttonLink_red"
            :disabled="media_remove_modal_open"
            @click="openMediaRemoveModal(media_file)"
          >
            {{ $t("sg_media_remove") }}
          </button>
        </div>
        <p
          v-else-if="media_file.dont_link_in_pdf === true"
          class="_pdfExcluded"
        >
          {{ $t("sg_media_excluded_from_pdf") }}
        </p>
      </article>
    </div>

    <SGGemMediaRemoveModal
      v-if="media_remove_modal_open"
      :file_path="media_remove_path"
      :display_filename="media_remove_filename"
      :can_delete="can_edit"
      @close="closeMediaRemoveModal"
    />
  </SGSectionPanel>
</template>

<script>
import SGSectionPanel from "@/components/softgems/SGSectionPanel.vue";
import SGGemMediaRemoveModal from "@/components/gems/SGGemMediaRemoveModal.vue";
import UploadFiles from "@/adc-core/modals/UploadFiles.vue";
import { compareGemFilesByMediaFilename } from "@/utils/selection_pdf_description.js";

export default {
  name: "SGGemMediaSection",
  components: {
    SGSectionPanel,
    SGGemMediaRemoveModal,
    UploadFiles,
  },
  props: {
    gem_path: {
      type: String,
      required: true,
    },
    gem: {
      type: Object,
      default: null,
    },
    can_edit: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      media_files_queue: [],
      media_upload_meta: { is_gem_media: true },
      media_remove_modal_open: false,
      media_remove_path: "",
      media_remove_filename: "",
      media_pdf_toggle_saving: "",
      upload_input_id: `sg_gem_media_upload_${(
        Math.random().toString(36) + "00000000000000000"
      ).slice(2, 7)}`,
    };
  },
  computed: {
    gallery_files() {
      const files = Array.isArray(this.gem?.$files) ? this.gem.$files : [];
      return files
        .filter(
          (f) =>
            f &&
            f.is_gem_media === true &&
            (f.$type === "image" || f.$type === "video"),
        )
        .slice()
        .sort(compareGemFilesByMediaFilename);
    },
  },
  methods: {
    displayMediaFilename(media_file) {
      const name =
        media_file?.$media_filename &&
        String(media_file.$media_filename).trim() !== ""
          ? String(media_file.$media_filename).trim()
          : "";
      if (name) return name;
      const path_slug = String(media_file?.$path || "")
        .split("/")
        .filter(Boolean)
        .pop();
      return path_slug || "—";
    },
    getMediaOpenUrl(media_file) {
      if (!media_file?.$path || !media_file?.$media_filename) return "";
      return this.makeMediaFileURL({
        $path: media_file.$path,
        $media_filename: media_file.$media_filename,
      });
    },
    shouldDownloadMediaFile(file) {
      const previewable_types = new Set(["image", "video", "audio", "pdf"]);
      return !previewable_types.has(file?.$type);
    },
    isAllowedMediaFile(browser_file) {
      const mime = String(browser_file?.type || "").toLowerCase();
      if (mime.startsWith("image/") || mime.startsWith("video/")) return true;
      const name = String(browser_file?.name || "").toLowerCase();
      const image_ext =
        /\.(jpe?g|png|gif|webp|heic|heif|avif|bmp|tiff?)$/i.test(name);
      const video_ext =
        /\.(mp4|webm|mov|m4v|avi|mkv)$/.test(name);
      return image_ext || video_ext;
    },
    onPickMediaFiles(event) {
      const file_list = event?.target?.files;
      const picked = file_list ? Array.from(file_list) : [];
      if (picked.length === 0) return;

      const invalid = picked.filter((f) => !this.isAllowedMediaFile(f));
      if (invalid.length > 0) {
        this.$alertify.delay(4000).error(this.$t("sg_media_invalid_type"));
        event.target.value = "";
        return;
      }

      this.media_files_queue = picked;
      event.target.value = "";
    },
    onMediaUploadClosed() {
      this.media_files_queue = [];
    },
    closeMediaRemoveModal() {
      this.media_remove_modal_open = false;
      this.media_remove_path = "";
      this.media_remove_filename = "";
    },
    openMediaRemoveModal(media_file) {
      if (!this.can_edit || !media_file?.$path) return;
      this.media_remove_path = media_file.$path;
      this.media_remove_filename = this.displayMediaFilename(media_file);
      this.media_remove_modal_open = true;
    },
    isMediaIncludedInPdf(media_file) {
      return media_file?.dont_link_in_pdf !== true;
    },
    async toggleMediaPdfLink(media_file, include_in_pdf) {
      if (!this.can_edit || !media_file?.$path) return;
      if (this.isMediaIncludedInPdf(media_file) === include_in_pdf) return;

      this.media_pdf_toggle_saving = media_file.$path;
      try {
        await this.$api.updateMeta({
          path: media_file.$path,
          new_meta: { dont_link_in_pdf: !include_in_pdf },
        });
      } catch ({ code }) {
        this.$alertify.delay(4000).error(code || this.$t("sg_could_not_save"));
      } finally {
        this.media_pdf_toggle_saving = "";
      }
    },
  },
};
</script>

<style lang="scss" scoped>
._uploadRow {
  display: flex;
  align-items: center;
  gap: calc(var(--spacing) / 2);
}

._empty {
  margin: 0;
  color: var(--c-gris_fonce);
}

._hint {
  margin: 0 0 calc(var(--spacing) / 2);
  font-size: var(--sl-font-size-x-small);
  color: var(--c-gris_fonce);
}

._grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: calc(var(--spacing) / 2);
}

._item {
  border: 1px solid var(--c-gris_clair);
  border-radius: 8px;
  overflow: hidden;
  background: var(--c-bodybg);
  display: flex;
  flex-direction: column;
}

._itemActions {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: calc(var(--spacing) / 4);
  padding: calc(var(--spacing) / 2);
  border-top: 1px solid var(--c-gris_clair);
}

._pdfToggle {
  display: flex;
  align-items: center;
  gap: calc(var(--spacing) / 4);
  font-size: var(--sl-font-size-x-small);
  cursor: pointer;
}

._pdfExcluded {
  margin: 0;
  padding: calc(var(--spacing) / 2);
  border-top: 1px solid var(--c-gris_clair);
  font-size: var(--sl-font-size-x-small);
  color: var(--c-gris_fonce);
}

._itemLink {
  display: block;
  color: inherit;
  text-decoration: none;
  cursor: pointer;
  transition: background-color 0.12s ease;
  flex: 1;

  &:hover {
    background: var(--c-bodybg);
  }
}

._itemLink_disabled {
  cursor: default;
}

._preview {
  aspect-ratio: 1 / 1;
  position: relative;
  overflow: hidden;
  background: var(--c-gris_clair);
}

._preview :deep(._mediaContent) {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

._preview :deep(img._mediaContent--image) {
  width: 100%;
  height: 100%;
  object-fit: scale-down;
}

._meta {
  padding: calc(var(--spacing) / 2);
}

._name,
._type {
  margin: 0;
  font-size: var(--sl-font-size-x-small);
}

._name {
  word-break: break-word;
}

._type {
  margin-top: 0.2rem;
  color: var(--c-gris_fonce);
  text-transform: uppercase;
}
</style>
