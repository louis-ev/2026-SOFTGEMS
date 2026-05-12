<template>
  <div class="_csvExport">
    <button
      type="button"
      class="u-buttonLink"
      :disabled="!has_gems"
      @click="openDownloadModal"
    >
      <b-icon icon="file-earmark-zip" />
      {{ $t("sg_download_all_gems_zip") }}
    </button>
    <button
      type="button"
      class="u-buttonLink"
      :disabled="!has_gems"
      @click="exportCsv"
    >
      <b-icon icon="download" />
      {{ $t("sg_export_gems_csv") }}
    </button>

    <BaseModal2
      v-if="show_download_modal"
      :title="$t('sg_download_all_gems_zip')"
      @close="show_download_modal = false"
    >
      <div class="_downloadModalBody">
        <p class="_downloadInstructions">
          {{ $t("sg_download_all_gems_zip_instructions") }}
        </p>
        <div v-if="is_loading_size" class="_sizeLoader">
          <LoaderSpinner />
        </div>
        <div v-else-if="size_load_error" class="u-errorMsg">
          {{ size_load_error }}
        </div>
        <SizeDisplay v-else-if="folder_size !== null" :size="folder_size" />
      </div>

      <template slot="footer">
        <button type="button" class="u-button" @click="show_download_modal = false">
          {{ $t("cancel") }}
        </button>
        <button
          type="button"
          class="u-button u-button_bleuvert"
          :disabled="is_downloading_zip || is_loading_size"
          @click="downloadAllGemsZip"
        >
          {{
            is_downloading_zip
              ? $t("sg_download_all_gems_zip_in_progress")
              : $t("download")
          }}
        </button>
      </template>
    </BaseModal2>
  </div>
</template>

<script>
export default {
  name: "GemCsvExportButton",
  props: {
    gems: { type: Array, default: () => [] },
    metadata_keys: { type: Array, default: () => [] },
    metadata_labels: { type: Object, default: () => ({}) },
    gems_path: { type: String, default: "gems" },
  },
  data() {
    return {
      show_download_modal: false,
      is_loading_size: false,
      is_downloading_zip: false,
      folder_size: null,
      size_load_error: "",
    };
  },
  computed: {
    has_gems() {
      return Array.isArray(this.gems) && this.gems.length > 0;
    },
  },
  methods: {
    async openDownloadModal() {
      if (!this.has_gems) return;
      this.show_download_modal = true;
      this.is_loading_size = true;
      this.size_load_error = "";
      this.folder_size = null;
      try {
        const response = await this.$axios.get(`${this.gems_path}?detailed=true`);
        const folders = Array.isArray(response?.data) ? response.data : [];
        this.folder_size = folders.reduce((total_size, gem) => {
          const gem_size = Number(gem?.$infos?.size);
          if (!Number.isFinite(gem_size)) return total_size;
          return total_size + gem_size;
        }, 0);
      } catch ({ code }) {
        this.size_load_error = code || this.$t("sg_could_not_estimate_gems_size");
      } finally {
        this.is_loading_size = false;
      }
    },
    async downloadAllGemsZip() {
      if (!this.has_gems || this.is_downloading_zip) return;
      this.is_downloading_zip = true;
      try {
        await this.$api.downloadFolder({ path: this.gems_path });
        this.show_download_modal = false;
      } catch ({ code }) {
        this.$alertify
          .delay(4000)
          .error(code || this.$t("sg_could_not_download_gems_zip"));
      } finally {
        this.is_downloading_zip = false;
      }
    },
    getGemId(gem) {
      const gem_path = gem?.$path || "";
      if (!gem_path) return "";
      const path_parts = gem_path.split("/");
      return path_parts[path_parts.length - 1] || "";
    },
    resolveCellValue(gem, metadata_key) {
      if (metadata_key === "id") return this.getGemId(gem);

      const raw_value = gem?.[metadata_key];
      if (raw_value === null || raw_value === undefined) return "";
      if (typeof raw_value === "object") return JSON.stringify(raw_value);
      return String(raw_value);
    },
    escapeCsvCell(value) {
      const normalized_value = String(value).replace(/\r?\n|\r/g, "\n");
      const escaped_value = normalized_value.replace(/"/g, '""');
      return `"${escaped_value}"`;
    },
    buildCsvRows() {
      const header_row = this.metadata_keys.map(
        (metadata_key) => this.metadata_labels[metadata_key] || metadata_key
      );
      const data_rows = this.gems.map((gem) =>
        this.metadata_keys.map((metadata_key) =>
          this.resolveCellValue(gem, metadata_key)
        )
      );

      return [header_row, ...data_rows];
    },
    exportCsv() {
      if (!this.has_gems) return;

      const csv_rows = this.buildCsvRows();
      const csv_content = csv_rows
        .map((row) => row.map((cell) => this.escapeCsvCell(cell)).join(","))
        .join("\n");
      const csv_with_bom = `\uFEFF${csv_content}`;
      const file_date = new Date().toISOString().slice(0, 10);
      const file_name = `gems-database-${file_date}.csv`;
      const csv_blob = new Blob([csv_with_bom], {
        type: "text/csv;charset=utf-8;",
      });
      const file_url = URL.createObjectURL(csv_blob);
      const link = document.createElement("a");
      link.href = file_url;
      link.download = file_name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(file_url);
    },
  },
};
</script>

<style lang="scss" scoped>
._csvExport {
  margin-top: 0;
  display: flex;
  justify-content: flex-end;
  gap: calc(var(--spacing) / 2);
}

._downloadModalBody {
  min-height: 44px;
}

._downloadInstructions {
  margin: 0 0 calc(var(--spacing) / 2) 0;
}

._sizeLoader {
  display: flex;
  justify-content: center;
}
</style>
