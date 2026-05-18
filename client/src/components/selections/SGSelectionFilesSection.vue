<template>
  <section class="_selectionFiles">
    <header class="_header">
      <h2 class="_title">{{ $t("sg_selection_attachments") }}</h2>
      <span class="_count">{{ attachment_files.length }}</span>
      <div v-if="can_edit" class="_uploadRow">
        <input
          :id="upload_input_id"
          type="file"
          name="file"
          class="inputfile-2"
          accept="application/pdf,image/*"
          multiple="multiple"
          @change="onPickFiles($event)"
        />
        <label
          :for="upload_input_id"
          class="u-button u-button_verysmall u-button_red"
        >
          {{ $t("sg_selection_upload_files") }}
          <b-icon icon="upload" :label="$t('sg_selection_upload_files')" />
        </label>
        <UploadFiles
          v-if="files_queue.length > 0"
          :files_to_import="files_queue"
          :path="selection_path"
          :additional_meta="upload_meta"
          @close="onUploadClosed"
        />
      </div>
    </header>

    <p v-if="attachment_files.length === 0" class="_empty">
      {{ $t("sg_selection_no_files") }}
    </p>

    <ul v-else class="_list">
      <li
        v-for="file in attachment_files"
        :key="file.$path"
        class="_row"
      >
        <div class="_rowBody">
          <div v-if="previewUrl(file)" class="_preview">
            <MediaContent
              :file="file"
              context="preview"
              :resolution="640"
            />
          </div>
          <div class="_main">
            <p class="_fileName">{{ displayFilename(file) }}</p>
            <div v-if="openUrl(file)" class="_actions">
              <a
                class="u-buttonLink"
                :href="openUrl(file)"
                target="_blank"
                rel="noopener noreferrer"
              >
                {{ $t("open") }}
              </a>
              <a
                class="u-buttonLink"
                :href="openUrl(file)"
                :download="displayFilename(file)"
              >
                {{ $t("download") }}
              </a>
            </div>
          </div>
        </div>
        <button
          v-if="can_edit"
          type="button"
          class="u-buttonLink u-buttonLink_red"
          :disabled="remove_modal_open"
          @click="openRemoveModal(file)"
        >
          {{ $t("sg_certificate_remove") }}
        </button>
      </li>
    </ul>

    <SGGemMediaRemoveModal
      v-if="remove_modal_open"
      :file_path="remove_file_path"
      :display_filename="remove_display_name"
      :can_delete="can_edit"
      @removedSuccessfully="onRemovedSuccessfully"
      @close="closeRemoveModal"
    />
  </section>
</template>

<script>
import Medias from "@/mixins/Medias.js";
import SGGemMediaRemoveModal from "@/components/gems/SGGemMediaRemoveModal.vue";
import MediaContent from "@/adc-core/fields/MediaContent.vue";
import UploadFiles from "@/adc-core/modals/UploadFiles.vue";

export default {
  name: "SGSelectionFilesSection",
  mixins: [Medias],
  components: {
    SGGemMediaRemoveModal,
    MediaContent,
    UploadFiles,
  },
  props: {
    selection_path: {
      type: String,
      required: true,
    },
    selection_folder: {
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
      files_queue: [],
      upload_meta: { is_selection_attachment: true },
      remove_modal_open: false,
      remove_file_path: "",
      remove_display_name: "",
      upload_input_id: `sg_sel_files_${(
        Math.random().toString(36) + "00000000000000000"
      ).slice(2, 7)}`,
    };
  },
  computed: {
    attachment_files() {
      const files = Array.isArray(this.selection_folder?.$files)
        ? this.selection_folder.$files
        : [];
      return files
        .filter((f) => f && this.isAttachmentFile(f))
        .slice()
        .sort(
          (a, b) =>
            +new Date(b?.$date_uploaded || 0) -
            +new Date(a?.$date_uploaded || 0),
        );
    },
  },
  methods: {
    isAttachmentFile(f) {
      if (f.is_selection_attachment === false) return false;
      if (f.is_gem_media === true || f.is_gem_certificate === true)
        return false;
      return true;
    },
    displayFilename(file) {
      return file?.$media_filename || file?.$path?.split("/").pop() || "";
    },
    openUrl(file) {
      if (!file?.$path || !file?.$media_filename) return "";
      return this.makeMediaFileURL({
        $path: file.$path,
        $media_filename: file.$media_filename,
      });
    },
    previewUrl(file) {
      if (file?.$type === "image" || file?.$type === "video")
        return this.openUrl(file);
      return "";
    },
    onPickFiles(ev) {
      const input = ev?.target;
      if (!input || !input.files || input.files.length === 0) return;
      const next = Array.from(input.files);
      this.files_queue = next;
      input.value = "";
    },
    onUploadClosed() {
      this.files_queue = [];
      this.$emit("changed");
    },
    openRemoveModal(file) {
      if (!file?.$path) return;
      this.remove_file_path = file.$path;
      this.remove_display_name = this.displayFilename(file);
      this.remove_modal_open = true;
    },
    closeRemoveModal() {
      this.remove_modal_open = false;
      this.remove_file_path = "";
      this.remove_display_name = "";
    },
    onRemovedSuccessfully() {
      this.closeRemoveModal();
      this.$emit("changed");
    },
  },
};
</script>

<style lang="scss" scoped>
._selectionFiles {
  display: flex;
  flex-direction: column;
  gap: calc(var(--spacing) * 0.75);
}

._header {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: calc(var(--spacing) / 2);
}

._title {
  margin: 0;
  font-size: 1rem;
}

._count {
  font-size: var(--sl-font-size-x-small);
  color: var(--c-gris_fonce);
}

._uploadRow {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: calc(var(--spacing) / 2);
}

._empty {
  margin: 0;
  color: var(--c-gris_fonce);
  font-size: var(--sl-font-size-small);
}

._list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: calc(var(--spacing) * 0.75);
}

._row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: calc(var(--spacing) / 2);
  padding: calc(var(--spacing) * 0.75);
  border: 1px solid var(--c-gris_clair);
  border-radius: 8px;
  background: var(--c-blanc);
}

._rowBody {
  display: flex;
  gap: calc(var(--spacing) * 0.75);
  min-width: 0;
}

._preview {
  width: 120px;
  flex-shrink: 0;
  border-radius: 6px;
  overflow: hidden;
  background: var(--c-gris_clair);
}

._main {
  min-width: 0;
}

._fileName {
  margin: 0 0 calc(var(--spacing) / 4);
  font-size: var(--sl-font-size-small);
  word-break: break-word;
}

._actions {
  display: flex;
  flex-wrap: wrap;
  gap: calc(var(--spacing) / 2);
}
</style>
