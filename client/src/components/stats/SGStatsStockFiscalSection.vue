<template>
  <div class="_stockFiscal">
    <div v-if="is_loading" class="_stateMsg">
      {{ $t("sg_stats_stock_fiscal_loading") }}
    </div>
    <div v-else-if="fetch_error" class="_stateMsg _stateMsg_error">
      {{ fetch_error }}
    </div>
    <template v-else>
      <p class="_scopeNote">{{ $t("sg_stats_stock_fiscal_scope") }}</p>
      <div
        class="_summary"
        role="group"
        :aria-label="$t('sg_stats_stock_fiscal_summary_aria')"
      >
        <div class="_summaryItem">
          <span class="_summaryLabel">{{
            $t("sg_stats_stock_fiscal_summary_count")
          }}</span>
          <span class="_summaryValue">{{ aggregates.gem_count }}</span>
        </div>
        <div class="_summaryItem">
          <span class="_summaryLabel">{{
            $t("sg_stats_stock_fiscal_summary_cost")
          }}</span>
          <span class="_summaryValue">{{
            formatPrice(aggregates.cost_sum)
          }}</span>
        </div>
        <div class="_summaryItem">
          <span class="_summaryLabel">{{
            $t("sg_stats_stock_fiscal_summary_fiscal")
          }}</span>
          <span class="_summaryValue">{{
            formatPrice(aggregates.fiscal_sum)
          }}</span>
        </div>
        <div class="_summaryItem">
          <span class="_summaryLabel">{{
            $t("sg_stats_stock_fiscal_summary_fiscal_eur")
          }}</span>
          <span class="_summaryValue">{{
            formatPrice(aggregates.fiscal_sum_eur)
          }}</span>
        </div>
      </div>

      <div v-if="!rows.length" class="_stateMsg">
        {{ $t("sg_stats_stock_fiscal_empty") }}
      </div>
      <div v-else class="_tableWrap">
        <table class="_table">
          <thead>
            <tr>
              <th scope="col" class="_colId">{{ $t("sg_id") }}</th>
              <th scope="col">
                {{ $t("sg_numero_de_mise_a_consommation") }}
              </th>
              <th scope="col" class="_colPrice">
                {{ $t("sg_stats_stock_fiscal_col_cost") }}
              </th>
              <th scope="col" class="_colBuyingInvoice">
                {{ $t("sg_stats_stock_fiscal_col_buying_invoice") }}
              </th>
              <th scope="col">{{ $t("sg_stats_stock_fiscal_col_partner") }}</th>
              <th scope="col" class="_colPercent">
                {{ $t("sg_stats_stock_fiscal_col_percent") }}
              </th>
              <th scope="col" class="_colPrice">
                {{ $t("sg_stats_stock_fiscal_col_fiscal") }}
              </th>
              <th scope="col" class="_colPrice">
                {{ $t("sg_stats_stock_fiscal_col_fiscal_eur") }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in rows" :key="row.gem_path" class="_dataRow">
              <td class="_colId">
                <button
                  v-if="row.gem_ref"
                  type="button"
                  class="u-buttonLink _idLink"
                  :aria-label="
                    $t('sg_stats_stock_fiscal_open_gem_aria', {
                      id: row.gem_ref,
                    })
                  "
                  @click="onOpenGem(row.gem_ref)"
                >
                  <span class="_idText">{{ row.gem_ref }}</span>
                </button>
                <span v-else class="_idText">{{ emptyPlaceholder() }}</span>
              </td>
              <td>
                <span class="_cellEllipsis">{{
                  displayText(row.numero_de_mise_a_consommation)
                }}</span>
              </td>
              <td class="_colPrice">{{ formatPrice(row.cost) }}</td>
              <td class="_colBuyingInvoice">
                <button
                  v-if="row.buying_invoice_path"
                  type="button"
                  class="u-buttonLink _idLink"
                  :aria-label="
                    $t('sg_stats_stock_fiscal_open_buying_invoice_aria', {
                      id: row.buying_invoice_label || row.buying_invoice_path,
                    })
                  "
                  :title="displayText(buyingInvoiceLabel(row))"
                  @click="onOpenSelectionPath(row.buying_invoice_path)"
                >
                  <span class="_cellEllipsis">{{
                    displayText(buyingInvoiceLabel(row))
                  }}</span>
                </button>
                <span v-else>{{ emptyPlaceholder() }}</span>
              </td>
              <td>
                <span class="_cellEllipsis">{{ partnerLabel(row) }}</span>
              </td>
              <td class="_colPercent">
                {{ formatPercent(row.applied_percent) }}
              </td>
              <td class="_colPrice">{{ formatPrice(row.fiscal_value) }}</td>
              <td class="_colPrice">
                {{ formatPrice(row.fiscal_value_eur) }}
              </td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <td class="_colId">{{ $t("sg_stats_stock_fiscal_total_row") }}</td>
              <td></td>
              <td class="_colPrice">{{ formatPrice(aggregates.cost_sum) }}</td>
              <td colspan="3"></td>
              <td class="_colPrice">
                {{ formatPrice(aggregates.fiscal_sum) }}
              </td>
              <td class="_colPrice">
                {{ formatPrice(aggregates.fiscal_sum_eur) }}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <p class="_formulaHint">{{ $t("sg_stats_stock_fiscal_formula_hint") }}</p>
    </template>
  </div>
</template>

<script>
import { formatDisplayNumber } from "@/utils/format_locale.js";
import { formatPartnershipPurchasedPercentageDisplay } from "@/utils/selection_buying_invoice.js";
import { formatStockFiscalBuyingInvoiceWithRate } from "@/utils/stock_fiscal.js";
import { parseSelectionFolderPath } from "@/utils/selection_paths.js";

export default {
  name: "SGStatsStockFiscalSection",
  props: {
    rows: {
      type: Array,
      default: () => [],
    },
    aggregates: {
      type: Object,
      default: () => ({
        gem_count: 0,
        cost_sum: 0,
        fiscal_sum: 0,
        fiscal_sum_eur: 0,
      }),
    },
    is_loading: {
      type: Boolean,
      default: false,
    },
    fetch_error: {
      type: String,
      default: "",
    },
    partner_labels: {
      type: Object,
      default: () => ({}),
    },
  },
  methods: {
    emptyPlaceholder() {
      return "\u2014";
    },
    displayText(value) {
      const text = String(value ?? "").trim();
      return text || this.emptyPlaceholder();
    },
    formatPrice(value) {
      if (value === null || value === undefined || value === "") {
        return this.emptyPlaceholder();
      }
      return (
        formatDisplayNumber(value, {
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
        }) ?? this.emptyPlaceholder()
      );
    },
    formatPercent(value) {
      return (
        formatPartnershipPurchasedPercentageDisplay(value) ||
        this.emptyPlaceholder()
      );
    },
    partnerLabel(row) {
      const path = String(row?.counterparty_path || "").trim();
      if (!path) return this.emptyPlaceholder();
      const label = String(this.partner_labels[path] || "").trim();
      return label || path;
    },
    buyingInvoiceLabel(row) {
      return formatStockFiscalBuyingInvoiceWithRate(row, (rate_text) =>
        this.$t("sg_stats_stock_fiscal_usd_eur_rate", { rate: rate_text })
      );
    },
    onOpenGem(gem_id) {
      const id = String(gem_id || "").trim();
      if (!id) return;
      this.$emit("openGem", id);
    },
    onOpenSelectionPath(folder_path) {
      const parsed = parseSelectionFolderPath(folder_path);
      if (!parsed.type_slug || !parsed.folder_slug) return;
      this.$emit("openSelection", {
        type_slug: parsed.type_slug,
        folder_slug: parsed.folder_slug,
      });
    },
  },
};
</script>

<style lang="scss" scoped>
@use "@/utils/sg_data_table.scss" as sg_data_table;

._stockFiscal {
  width: 100%;
  min-height: 0;
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  gap: calc(var(--spacing) * 0.85);
}

._scopeNote,
._stateMsg {
  margin: 0;
  color: var(--c-gris_fonce);
  line-height: 1.45;
}

._scopeNote {
  font-size: var(--sl-font-size-x-small);
}

._stateMsg_error {
  color: var(--c-rouge, #b00020);
}

._summary {
  display: flex;
  flex-wrap: wrap;
  gap: calc(var(--spacing) * 0.75) calc(var(--spacing) * 1.25);
  flex: 0 0 auto;
}

._summaryItem {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 7rem;
}

._summaryLabel {
  font-size: var(--sl-font-size-x-small);
  color: var(--c-gris_fonce);
}

._summaryValue {
  font-size: clamp(1.05rem, 0.95rem + 0.3vw, 1.2rem);
  font-weight: 600;
  letter-spacing: -0.01em;
}

._tableWrap {
  @include sg_data_table.sg-data-table-wrap;
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
  padding-bottom: var(--sg-table-border-width-thick);
}

._table {
  @include sg_data_table.sg-data-table;
  width: max-content;
  min-width: 100%;

  th:not(._colId):not(._colPrice):not(._colPercent):not(._colBuyingInvoice),
  td:not(._colId):not(._colPrice):not(._colPercent):not(._colBuyingInvoice) {
    min-width: 14ch;
    max-width: 22ch;
  }

  ._colBuyingInvoice {
    min-width: 22ch;
    max-width: 36ch;
  }

  tfoot td._colId {
    z-index: 10;
    background: var(--sg-table-footer-bg);
  }

  // Sticky ID column (inventory-style).
  ._colId {
    position: sticky;
    left: 0;
    z-index: 4;
    background: var(--c-bodybg);
    border-left: var(--sg-table-border-width-thick) solid
      var(--sg-table-border-color);
  }

  thead th._colId {
    top: 0;
    z-index: 12;
    background: var(--sg-table-header-bg);
  }

  ._dataRow:hover td._colId {
    background: var(--c-gris_clair);
  }
}

._idLink {
  padding: 0;
  font: inherit;
  max-width: 100%;
  text-align: left;
}

._formulaHint {
  margin: 0;
  flex: 0 0 auto;
  font-size: var(--sl-font-size-x-small);
  color: var(--c-gris_fonce);
  line-height: 1.4;
}
</style>
