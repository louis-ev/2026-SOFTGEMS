<template>
  <section class="_gemFilesList">
    <div class="_header">
      <h2 class="_title">
        {{ $t("sg_files") }}
      </h2>
      <span class="_count">{{ sorted_files.length }}</span>
    </div>

    <div v-if="can_edit" class="_uploadRow">
      <input
        type="file"
        multiple="multiple"
        :id="upload_input_id"
        name="file"
        accept=".pdf,.jpg,.jpeg,.png,.heic,.mp4"
        class="inputfile-2"
        @change="updateInputFiles($event)"
      />
      <label :for="upload_input_id">{{ $t("import") }}</label>
      <UploadFiles
        v-if="selected_files.length > 0"
        :files_to_import="selected_files"
        :path="path"
        @close="onUploadClosed"
      />
    </div>

    <p v-if="sorted_files.length === 0" class="_empty">
      {{ $t("sg_no_files_for_gem") }}
    </p>

    <div v-else class="_grid">
      <article v-for="file in sorted_files" :key="file.$path" class="_item">
        <div class="_preview">
          <MediaContent :file="file" :resolution="640" />
        </div>
        <div class="_meta">
          <p class="_name">{{ file.$media_filename || file.$path }}</p>
          <p class="_type">{{ file.$type || "other" }}</p>
        </div>
      </article>
    </div>
  </section>
</template>

<script>
export default {
  name: "SGGemFilesList",
  props: {
    path: {
      type: String,
      required: true,
    },
    can_edit: {
      type: Boolean,
      default: false,
    },
    gem_files: {
      type: Array,
      default: () => [],
    },
  },
  data() {
    return {
      selected_files: [],
      upload_input_id: `sg_gem_files_upload_${(
        Math.random().toString(36) + "00000000000000000"
      ).slice(2, 7)}`,
    };
  },
  computed: {
    sorted_files() {
      const files = Array.isArray(this.gem_files) ? [...this.gem_files] : [];
      return files.sort(
        (a, b) =>
          +new Date(b?.$date_uploaded || 0) - +new Date(a?.$date_uploaded || 0)
      );
    },
  },
  methods: {
    updateInputFiles(event) {
      const file_list = event?.target?.files;
      this.selected_files = file_list ? Array.from(file_list) : [];
    },
    onUploadClosed() {
      this.selected_files = [];
      this.$emit("filesUpdated");
    },
  },
};
</script>

<style lang="scss" scoped>
._header {
  display: flex;
  align-items: center;
  gap: calc(var(--spacing) / 2);
}

._title {
  margin: 0;
}

._count {
  background: var(--c-gris_clair);
  border-radius: 999px;
  padding: 0 calc(var(--spacing) / 2);
  font-size: var(--sl-font-size-small);
}

._empty {
  margin: calc(var(--spacing) / 2) 0 0;
  color: var(--c-gris_fonce);
}

._uploadRow {
  margin-top: calc(var(--spacing) / 2);
}

._grid {
  margin-top: calc(var(--spacing) / 2);
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: calc(var(--spacing) / 2);
}

._item {
  border: 1px solid var(--c-gris_clair);
  border-radius: 8px;
  overflow: hidden;
  background: var(--c-blanc);
}

._preview {
  aspect-ratio: 1 / 1;
  position: relative;
  overflow: hidden;
  background: var(--c-gris_clair);
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
