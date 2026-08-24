<template>
  <div class="_statsView">
    <SGOverlaySidePanelLayout
      :panel_open="is_primary_panel_open"
      @close="closePrimaryPanel"
    >
      <div class="_statsPage">
        <div class="_pageHeader">
          <h1 class="_pageTitle">{{ $t("sg_stats_page_title") }}</h1>
        </div>

        <div class="_sections">
          <SGStatsChartSection
            v-for="section in chart_sections"
            :key="section.id"
            :section_id="section.id"
            :title="section.title"
            :placeholder_message="section.placeholder_message"
            :content_mode="section.id === 'stock-fiscal'"
            :show_refresh="section.id === 'stock-fiscal'"
            :is_refreshing="
              section.id === 'stock-fiscal' && stock_fiscal_loading
            "
            @refresh="onRefreshSection(section.id)"
            @exportCsv="onExportCsv(section.id)"
          >
            <SGStatsStockFiscalSection
              v-if="section.id === 'stock-fiscal'"
              :rows="stock_fiscal_rows"
              :aggregates="stock_fiscal_aggregates"
              :is_loading="
                stock_fiscal_loading && stock_fiscal_rows.length === 0
              "
              :fetch_error="stock_fiscal_error"
              :partner_labels="stock_fiscal_partner_labels"
              @openGem="onOpenGem"
              @openSelection="onOpenSelection"
            />
          </SGStatsChartSection>
        </div>
      </div>

      <template #panel>
        <SGOverlaySidePanelLayout
          v-if="panel_primary && panel_primary.kind === 'gem'"
          :panel_open="is_nested_selection_open"
          @close="closeNestedSelection"
        >
          <SGGemOpenView
            :key="`stats-gem-${panel_primary.gem_id}`"
            :gem_id="panel_primary.gem_id"
            :panel_mode="true"
            @closePanel="closePrimaryPanel"
          />
          <template #panel>
            <SGSelectionOpenView
              v-if="panel_nested_selection"
              :key="nested_selection_key"
              :type_slug="panel_nested_selection.type_slug"
              :selection_path="panel_nested_selection.folder_slug"
              :panel_mode="true"
              @closePanel="closeNestedSelection"
            />
          </template>
        </SGOverlaySidePanelLayout>

        <SGSelectionOpenView
          v-else-if="panel_primary && panel_primary.kind === 'selection'"
          :key="primary_selection_key"
          :type_slug="panel_primary.type_slug"
          :selection_path="panel_primary.folder_slug"
          :panel_mode="true"
          @closePanel="closePrimaryPanel"
        />
      </template>
    </SGOverlaySidePanelLayout>
  </div>
</template>

<script>
import SGOverlaySidePanelLayout from "@/components/softgems/SGOverlaySidePanelLayout.vue";
import SGStatsChartSection from "@/components/stats/SGStatsChartSection.vue";
import SGStatsStockFiscalSection from "@/components/stats/SGStatsStockFiscalSection.vue";
import SGGemOpenView from "@/views/SGGemOpenView.vue";
import SGSelectionOpenView from "@/views/SGSelectionOpenView.vue";
import { resolveAddressBookPathLabels } from "@/utils/address_book_paths.js";
import {
  buildStockFiscalCsvRows,
  buildStockFiscalRows,
  fetchStockFiscalSelectionFolders,
} from "@/utils/stock_fiscal.js";

export default {
  name: "SGStatsView",
  components: {
    SGOverlaySidePanelLayout,
    SGStatsChartSection,
    SGStatsStockFiscalSection,
    SGGemOpenView,
    SGSelectionOpenView,
  },
  data() {
    return {
      gems_path: "gems",
      gems: [],
      selections: [],
      stock_fiscal_rows: [],
      stock_fiscal_aggregates: {
        gem_count: 0,
        cost_sum: 0,
        fiscal_sum: 0,
        fiscal_sum_eur: 0,
      },
      stock_fiscal_partner_labels: {},
      stock_fiscal_loading: false,
      stock_fiscal_error: "",
      panel_primary: null,
      panel_nested_selection: null,
    };
  },
  computed: {
    chart_sections() {
      return [
        {
          id: "stock-fiscal",
          title: this.$t("sg_stats_section_stock_fiscal"),
          placeholder_message: "",
        },
      ];
    },
    is_primary_panel_open() {
      return Boolean(this.panel_primary);
    },
    is_nested_selection_open() {
      return Boolean(this.panel_nested_selection);
    },
    primary_selection_key() {
      if (!this.panel_primary || this.panel_primary.kind !== "selection") {
        return "stats-selection";
      }
      return `stats-selection-${this.panel_primary.type_slug}-${this.panel_primary.folder_slug}`;
    },
    nested_selection_key() {
      if (!this.panel_nested_selection) return "stats-nested-selection";
      return `stats-nested-selection-${this.panel_nested_selection.type_slug}-${this.panel_nested_selection.folder_slug}`;
    },
  },
  async mounted() {
    this.$api.join({ room: this.gems_path });
    await this.loadStockFiscal();
  },
  beforeDestroy() {
    this.$api.leave({ room: this.gems_path });
  },
  methods: {
    onOpenGem(gem_id) {
      const id = String(gem_id || "").trim();
      if (!id) return;
      this.panel_nested_selection = null;
      this.panel_primary = { kind: "gem", gem_id: id };
    },
    onOpenSelection({ type_slug, folder_slug } = {}) {
      const cleaned_type = String(type_slug || "").trim();
      const cleaned_folder = String(folder_slug || "").trim();
      if (!cleaned_type || !cleaned_folder) return;

      // Gem already open → invoice as nested sub-panel.
      if (this.panel_primary?.kind === "gem") {
        this.panel_nested_selection = {
          type_slug: cleaned_type,
          folder_slug: cleaned_folder,
        };
        return;
      }

      this.panel_nested_selection = null;
      this.panel_primary = {
        kind: "selection",
        type_slug: cleaned_type,
        folder_slug: cleaned_folder,
      };
    },
    closeNestedSelection() {
      this.panel_nested_selection = null;
    },
    closePrimaryPanel() {
      this.panel_nested_selection = null;
      this.panel_primary = null;
    },
    async loadStockFiscal({ notify = false } = {}) {
      this.stock_fiscal_loading = true;
      this.stock_fiscal_error = "";
      const started_at = Date.now();
      let load_ok = false;
      try {
        const [gems, selections] = await Promise.all([
          this.$api.getFolders({ path: this.gems_path }),
          fetchStockFiscalSelectionFolders(this.$api),
        ]);
        this.gems = Array.isArray(gems) ? gems : [];
        this.selections = Array.isArray(selections) ? selections : [];
        await this.rebuildStockFiscal();
        load_ok = true;
      } catch (error) {
        console.error(error);
        this.stock_fiscal_error = this.$t("sg_stats_stock_fiscal_load_error");
        this.stock_fiscal_rows = [];
        this.stock_fiscal_aggregates = {
          gem_count: 0,
          cost_sum: 0,
          fiscal_sum: 0,
          fiscal_sum_eur: 0,
        };
        this.stock_fiscal_partner_labels = {};
      } finally {
        const elapsed_ms = Date.now() - started_at;
        const remaining_ms = Math.max(0, 500 - elapsed_ms);
        if (remaining_ms > 0) {
          await new Promise((resolve) => setTimeout(resolve, remaining_ms));
        }
        this.stock_fiscal_loading = false;
        if (notify && load_ok) {
          this.$alertify
            .delay(3500)
            .success(this.$t("sg_stats_stock_fiscal_updated"));
        }
      }
    },
    async rebuildStockFiscal() {
      const { rows, aggregates } = buildStockFiscalRows({
        gems: this.gems,
        selections: this.selections,
      });
      this.stock_fiscal_rows = rows;
      this.stock_fiscal_aggregates = aggregates;

      const paths = [
        ...new Set(
          rows
            .map((row) => String(row?.counterparty_path || "").trim())
            .filter(Boolean)
        ),
      ];
      if (!paths.length) {
        this.stock_fiscal_partner_labels = {};
        return;
      }
      try {
        this.stock_fiscal_partner_labels = await resolveAddressBookPathLabels(
          this.$api,
          paths
        );
      } catch (error) {
        console.error(error);
        this.stock_fiscal_partner_labels = {};
      }
    },
    partnerLabelForRow(row) {
      const path = String(row?.counterparty_path || "").trim();
      if (!path) return "";
      return String(this.stock_fiscal_partner_labels[path] || path).trim();
    },
    escapeCsvCell(value) {
      const normalized_value = String(value ?? "").replace(/\r?\n|\r/g, "\n");
      const escaped_value = normalized_value.replace(/"/g, '""');
      return `"${escaped_value}"`;
    },
    exportStockFiscalCsv() {
      if (!this.stock_fiscal_rows.length) {
        this.$alertify
          .delay(3500)
          .success(this.$t("sg_stats_export_csv_coming_soon"));
        return;
      }

      const export_rows = this.stock_fiscal_rows.map((row) => ({
        ...row,
        partner_label: this.partnerLabelForRow(row),
      }));

      const csv_matrix = buildStockFiscalCsvRows(
        export_rows,
        (cell) => (cell === null || cell === undefined ? "" : String(cell)),
        {
          format_rate_note: (rate_text) =>
            this.$t("sg_stats_stock_fiscal_usd_eur_rate", { rate: rate_text }),
        }
      );
      csv_matrix[0] = [
        this.$t("sg_id"),
        this.$t("sg_numero_de_mise_a_consommation"),
        this.$t("sg_stats_stock_fiscal_col_cost"),
        this.$t("sg_stats_stock_fiscal_col_buying_invoice"),
        this.$t("sg_stats_stock_fiscal_col_partner"),
        this.$t("sg_stats_stock_fiscal_col_percent"),
        this.$t("sg_stats_stock_fiscal_col_fiscal"),
        this.$t("sg_stats_stock_fiscal_col_fiscal_eur"),
      ];

      csv_matrix.push([
        `${this.$t("sg_stats_stock_fiscal_total_row")} (${
          this.stock_fiscal_aggregates.gem_count
        })`,
        "",
        String(this.stock_fiscal_aggregates.cost_sum),
        "",
        "",
        "",
        String(this.stock_fiscal_aggregates.fiscal_sum),
        String(this.stock_fiscal_aggregates.fiscal_sum_eur),
      ]);

      const csv_content = csv_matrix
        .map((row) => row.map((cell) => this.escapeCsvCell(cell)).join(","))
        .join("\n");
      const csv_with_bom = `\uFEFF${csv_content}`;
      const file_date = new Date().toISOString().slice(0, 10);
      const file_name = `stock-fiscal-${file_date}.csv`;
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
    onRefreshSection(section_id) {
      if (section_id === "stock-fiscal") {
        this.loadStockFiscal({ notify: true });
      }
    },
    onExportCsv(section_id) {
      if (section_id === "stock-fiscal") {
        this.exportStockFiscalCsv();
        return;
      }
      this.$alertify
        .delay(3500)
        .success(this.$t("sg_stats_export_csv_coming_soon"));
    },
  },
};
</script>

<style lang="scss" scoped>
._statsView {
  position: relative;
  height: 100%;
  min-height: 0;
}

._statsPage {
  height: 100%;
  min-height: 0;
  overflow-y: auto;
  @include sg-page-padding;
  box-sizing: border-box;
}

._pageHeader {
  margin-bottom: calc(var(--spacing) * 1.5);
}

._pageTitle {
  margin: 0;
}

._sections {
  display: flex;
  flex-direction: column;
  gap: calc(var(--spacing) * 1.5);
  padding-bottom: calc(var(--spacing) * 2);
}
</style>
