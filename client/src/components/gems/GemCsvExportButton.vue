<template>
  <div class="_csvExport">
    <button
      type="button"
      class="u-buttonLink"
      :disabled="!has_gems"
      @click="exportCsv"
    >
      <b-icon icon="download" />
      {{ $t("sg_export_gems_csv") }}
    </button>
  </div>
</template>

<script>
export default {
  name: "GemCsvExportButton",
  props: {
    gems: { type: Array, default: () => [] },
    metadata_keys: { type: Array, default: () => [] },
    metadata_labels: { type: Object, default: () => ({}) },
  },
  computed: {
    has_gems() {
      return Array.isArray(this.gems) && this.gems.length > 0;
    },
  },
  methods: {
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
  margin-top: calc(var(--spacing) * 0.5);
  display: flex;
  justify-content: flex-end;
}
</style>
