<template>
  <div class="_csvExport" :class="{ _csvExport_menu: menu_mode }">
    <button
      v-if="show_zip_download"
      type="button"
      class="u-buttonLink"
      :disabled="!has_gems || is_downloading_zip"
      @click="downloadAllGemsZip"
    >
      <b-icon icon="file-earmark-zip" />
      {{
        is_downloading_zip
          ? $t("sg_download_all_gems_zip_in_progress")
          : $t("sg_download_all_gems_zip")
      }}
    </button>
    <button
      type="button"
      class="u-buttonLink"
      :disabled="!has_gems || is_downloading_zip"
      @click="exportCsv"
    >
      <b-icon icon="download" />
      {{ $t("sg_export_gems_csv_table") }}
    </button>
  </div>
</template>

<script>
import GemPricing from "@/mixins/GemPricing";
import GemDimensions from "@/mixins/GemDimensions";
import { getDateFormatLocale } from "@/utils/format_locale.js";
import { htmlToPlainText } from "@/utils/rich_text.js";

export default {
  name: "GemCsvExportButton",
  mixins: [GemPricing, GemDimensions],
  props: {
    gems: { type: Array, default: () => [] },
    metadata_keys: { type: Array, default: () => [] },
    metadata_labels: { type: Object, default: () => ({}) },
    gems_path: { type: String, default: "gems" },
    menu_mode: { type: Boolean, default: false },
    show_zip_download: { type: Boolean, default: true },
    file_name_prefix: { type: String, default: "gems-table" },
  },
  data() {
    return {
      is_downloading_zip: false,
    };
  },
  computed: {
    has_gems() {
      return Array.isArray(this.gems) && this.gems.length > 0;
    },
  },
  methods: {
    async downloadAllGemsZip() {
      if (!this.has_gems || this.is_downloading_zip) return;
      this.is_downloading_zip = true;
      try {
        await this.$api.downloadFolderType({ path_to_type: this.gems_path });
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

      if (metadata_key === "$date_modified") {
        const raw = gem?.$date_modified;
        if (raw === null || raw === undefined || raw === "") return "";
        const time_value = new Date(raw).getTime();
        if (!Number.isFinite(time_value)) return String(raw);
        return new Date(raw).toLocaleString(
          getDateFormatLocale(this.$i18n?.locale),
          {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          }
        );
      }

      if (this.isGemPricingTotalColumnKey(metadata_key)) {
        const raw_total = gem?.[metadata_key];
        const total_str =
          raw_total === null || raw_total === undefined || raw_total === ""
            ? "-"
            : String(raw_total);
        const w = this.toNumberOrDefault(gem?.weight_ct);
        if (!Number.isFinite(w) || w <= 0) {
          return `${total_str} | - /ct`;
        }
        const per = this.computeDisplayedPerCaratForGem(gem, metadata_key);
        return `${total_str} | ${per} /ct`;
      }

      if (this.isGemDimensionsMergedColumnKey(metadata_key)) {
        return this.formatGemDimensionsInline(gem);
      }

      if (metadata_key === "notes") {
        return htmlToPlainText(gem?.notes);
      }

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
      const prefix = String(this.file_name_prefix || "gems-table")
        .trim()
        .replace(/[^\w-]+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");
      const file_name = `${prefix || "gems-table"}-${file_date}.csv`;
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

._csvExport_menu {
  flex-direction: column;
  align-items: stretch;
  gap: 0;
  justify-content: flex-start;
}
</style>
