import { describe, expect, it } from "vitest";
import {
  buildStockFiscalCsvRows,
  buildStockFiscalRows,
  computeStockFiscalValue,
  convertStockFiscalAmountToEur,
  formatStockFiscalBuyingInvoiceWithRate,
  formatStockFiscalSelectionLabel,
  parseStockFiscalCost,
  resolveStockFiscalPercent,
  stockFiscalGemRef,
} from "@/utils/stock_fiscal.js";

function gem(overrides = {}) {
  return {
    $path: "gems/1",
    status: "buying-invoice",
    base_price_pcb: 1000,
    selection_membership_paths: {},
    ...overrides,
  };
}

function buyingInvoice(overrides = {}) {
  return {
    $path: "buying-invoice/10",
    selection_entries: ["gems/1"],
    partnership_purchase: false,
    partnership_purchased_percentage: null,
    counterparty_path: "address_book/sup1",
    ...overrides,
  };
}

function partnershipSaleInvoice(overrides = {}) {
  return {
    $path: "sale-invoice/20",
    selection_entries: ["gems/1"],
    partnership_purchase: true,
    partnership_purchased_percentage: null,
    counterparty_path: "address_book/par1",
    ...overrides,
  };
}

describe("stockFiscalGemRef", () => {
  it("returns the folder slug from the gem path", () => {
    expect(stockFiscalGemRef({ $path: "gems/42" })).toBe("42");
  });
});

describe("parseStockFiscalCost / computeStockFiscalValue", () => {
  it("parses numeric costs and returns null for invalid values", () => {
    expect(parseStockFiscalCost(120.5)).toBe(120.5);
    expect(parseStockFiscalCost("")).toBeNull();
    expect(parseStockFiscalCost("abc")).toBeNull();
  });

  it("computes fiscal value as cost x percent / 100", () => {
    expect(computeStockFiscalValue(1000, 40)).toBe(400);
    expect(computeStockFiscalValue(null, 40)).toBe(0);
  });
});

describe("resolveStockFiscalPercent", () => {
  it("uses buying partnership percentage when set", () => {
    expect(
      resolveStockFiscalPercent(
        buyingInvoice({
          partnership_purchase: true,
          partnership_purchased_percentage: 60,
        }),
        [partnershipSaleInvoice({ partnership_purchased_percentage: 25 })]
      )
    ).toEqual({
      applied_percent: 60,
      percent_source: "buying-partnership",
      counterparty_path: "address_book/sup1",
    });
  });

  it("uses a single partnership sale-invoice percentage when buying has no partnership %", () => {
    expect(
      resolveStockFiscalPercent(buyingInvoice(), [
        partnershipSaleInvoice({ partnership_purchased_percentage: 33 }),
      ])
    ).toEqual({
      applied_percent: 33,
      percent_source: "sale-partnership",
      counterparty_path: "address_book/par1",
    });
  });

  it("falls back to full cost when multiple partnership sale invoices have %", () => {
    expect(
      resolveStockFiscalPercent(buyingInvoice(), [
        partnershipSaleInvoice({
          $path: "sale-invoice/20",
          partnership_purchased_percentage: 30,
        }),
        partnershipSaleInvoice({
          $path: "sale-invoice/21",
          partnership_purchased_percentage: 40,
          counterparty_path: "address_book/par2",
        }),
      ])
    ).toEqual({
      applied_percent: 100,
      percent_source: "full",
      counterparty_path: "address_book/sup1",
    });
  });

  it("falls back to full cost when buying has no partnership %", () => {
    expect(resolveStockFiscalPercent(buyingInvoice(), [])).toEqual({
      applied_percent: 100,
      percent_source: "full",
      counterparty_path: "address_book/sup1",
    });
  });
});

describe("convertStockFiscalAmountToEur", () => {
  it("keeps EUR amounts and converts USD with a rate", () => {
    expect(
      convertStockFiscalAmountToEur(1000, { currency: "EUR" })
    ).toBe(1000);
    expect(
      convertStockFiscalAmountToEur(1000, {
        currency: "USD",
        exchange_rate: 0.86,
      })
    ).toBe(860);
    expect(
      convertStockFiscalAmountToEur(1000, { currency: "USD" })
    ).toBeNull();
  });
});

describe("formatStockFiscalSelectionLabel", () => {
  it("formats internal name with id in parentheses", () => {
    expect(
      formatStockFiscalSelectionLabel({
        $path: "buying-invoice/10",
        internal_name: "Acme Purchase",
      })
    ).toBe("Acme Purchase (10)");
  });

  it("falls back to id when internal name is missing", () => {
    expect(
      formatStockFiscalSelectionLabel({ $path: "sale-invoice/20" })
    ).toBe("20");
  });
});

describe("buildStockFiscalRows", () => {
  it("excludes non-purchased gems", () => {
    const { rows, aggregates } = buildStockFiscalRows({
      gems: [gem({ status: "reference" })],
      selections: [buyingInvoice()],
    });
    expect(rows).toEqual([]);
    expect(aggregates).toEqual({
      gem_count: 0,
      cost_sum: 0,
      fiscal_sum: 0,
      fiscal_sum_eur: 0,
    });
  });

  it("applies full cost when there is no partnership", () => {
    const { rows, aggregates } = buildStockFiscalRows({
      gems: [gem()],
      selections: [
        buyingInvoice({ internal_name: "Supplier BI" }),
        // Sale without partnership checkbox must be ignored.
        {
          $path: "sale-invoice/99",
          selection_entries: ["gems/1"],
          partnership_purchase: false,
          partnership_purchased_percentage: 40,
          counterparty_path: "address_book/cli1",
        },
      ],
    });
    expect(rows).toHaveLength(1);
    expect(rows[0].applied_percent).toBe(100);
    expect(rows[0].percent_source).toBe("full");
    expect(rows[0].fiscal_value).toBe(1000);
    expect(rows[0].buying_invoice_label).toBe("Supplier BI (10)");
    expect(rows[0].numero_de_mise_a_consommation).toBe("");
    expect(aggregates).toEqual({
      gem_count: 1,
      cost_sum: 1000,
      fiscal_sum: 1000,
      fiscal_sum_eur: 0,
    });
  });

  it("includes numero_de_mise_a_consommation from the gem", () => {
    const { rows } = buildStockFiscalRows({
      gems: [gem({ numero_de_mise_a_consommation: " MAC-42 " })],
      selections: [buyingInvoice()],
    });
    expect(rows[0].numero_de_mise_a_consommation).toBe("MAC-42");
  });

  it("applies buying partnership percentage to cost", () => {
    const { rows } = buildStockFiscalRows({
      gems: [gem({ base_price_pcb: 2000 })],
      selections: [
        buyingInvoice({
          partnership_purchase: true,
          partnership_purchased_percentage: 50,
        }),
      ],
    });
    expect(rows[0].applied_percent).toBe(50);
    expect(rows[0].percent_source).toBe("buying-partnership");
    expect(rows[0].fiscal_value).toBe(1000);
  });

  it("applies a single partnership sale-invoice percentage", () => {
    const { rows } = buildStockFiscalRows({
      gems: [gem({ base_price_pcb: 2000 })],
      selections: [
        buyingInvoice(),
        partnershipSaleInvoice({
          internal_name: "Partner Sale",
          partnership_purchased_percentage: 40,
        }),
      ],
    });
    expect(rows[0].applied_percent).toBe(40);
    expect(rows[0].percent_source).toBe("sale-partnership");
    expect(rows[0].fiscal_value).toBe(800);
  });

  it("treats missing cost as zero fiscal value while keeping the row", () => {
    const { rows, aggregates } = buildStockFiscalRows({
      gems: [gem({ base_price_pcb: null })],
      selections: [buyingInvoice()],
    });
    expect(rows[0].cost).toBeNull();
    expect(rows[0].fiscal_value).toBe(0);
    expect(rows[0].fiscal_value_eur).toBeNull();
    expect(aggregates.cost_sum).toBe(0);
    expect(aggregates.fiscal_sum).toBe(0);
    expect(aggregates.fiscal_sum_eur).toBe(0);
  });

  it("picks the latest buying invoice by membership timestamp", () => {
    const { rows } = buildStockFiscalRows({
      gems: [
        gem({
          selection_membership_paths: {
            "buying-invoice/10": "2026-01-01T00:00:00.000Z",
            "buying-invoice/11": "2026-06-01T00:00:00.000Z",
          },
        }),
      ],
      selections: [
        buyingInvoice({
          $path: "buying-invoice/10",
          partnership_purchase: true,
          partnership_purchased_percentage: 10,
        }),
        buyingInvoice({
          $path: "buying-invoice/11",
          partnership_purchase: true,
          partnership_purchased_percentage: 75,
          counterparty_path: "address_book/sup2",
        }),
      ],
    });
    expect(rows[0].buying_invoice_path).toBe("buying-invoice/11");
    expect(rows[0].applied_percent).toBe(75);
  });

  it("keeps EUR fiscal value as-is and omits a rate on the invoice label", () => {
    const { rows, aggregates } = buildStockFiscalRows({
      gems: [gem()],
      selections: [buyingInvoice({ currency: "EUR", internal_name: "Paris BI" })],
    });
    expect(rows[0].currency).toBe("EUR");
    expect(rows[0].exchange_rate).toBeNull();
    expect(rows[0].fiscal_value_eur).toBe(1000);
    expect(formatStockFiscalBuyingInvoiceWithRate(rows[0])).toBe("Paris BI (10)");
    expect(aggregates.fiscal_sum_eur).toBe(1000);
  });

  it("converts USD fiscal value with the buying-invoice exchange rate", () => {
    const { rows, aggregates } = buildStockFiscalRows({
      gems: [gem()],
      selections: [
        buyingInvoice({
          currency: "USD",
          exchange_rate: 0.86,
          internal_name: "NY BI",
        }),
      ],
    });
    expect(rows[0].exchange_rate).toBe(0.86);
    expect(rows[0].fiscal_value).toBe(1000);
    expect(rows[0].fiscal_value_eur).toBe(860);
    expect(formatStockFiscalBuyingInvoiceWithRate(rows[0])).toBe(
      "NY BI (10) (USD → EUR rate = 0.86)"
    );
    expect(aggregates.fiscal_sum_eur).toBe(860);
  });

  it("leaves EUR blank when USD has no exchange rate", () => {
    const { rows } = buildStockFiscalRows({
      gems: [gem()],
      selections: [buyingInvoice({ currency: "USD" })],
    });
    expect(rows[0].fiscal_value_eur).toBeNull();
    expect(formatStockFiscalBuyingInvoiceWithRate(rows[0])).toBe("10");
  });
});

describe("buildStockFiscalCsvRows", () => {
  it("builds a header and data rows", () => {
    const { rows } = buildStockFiscalRows({
      gems: [gem()],
      selections: [
        buyingInvoice(),
        partnershipSaleInvoice({
          internal_name: "SI Partner",
          partnership_purchased_percentage: 25,
        }),
      ],
    });
    rows[0].partner_label = "Supplier One";
    rows[0].numero_de_mise_a_consommation = "MAC-7";
    expect(buildStockFiscalCsvRows(rows)).toEqual([
      [
        "id",
        "numero_de_mise_a_consommation",
        "cost",
        "buying_invoice",
        "partner",
        "applied_percent",
        "fiscal_value",
        "fiscal_value_eur",
      ],
      ["1", "MAC-7", "1000", "10", "Supplier One", "25", "250", ""],
    ]);
  });

  it("includes the exchange rate on the buying invoice cell and EUR value", () => {
    const { rows } = buildStockFiscalRows({
      gems: [gem()],
      selections: [
        buyingInvoice({
          currency: "USD",
          exchange_rate: 0.86,
          internal_name: "NY BI",
        }),
      ],
    });
    expect(buildStockFiscalCsvRows(rows)[1][3]).toBe(
      "NY BI (10) (USD → EUR rate = 0.86)"
    );
    expect(buildStockFiscalCsvRows(rows)[1][7]).toBe("860");
  });
});
