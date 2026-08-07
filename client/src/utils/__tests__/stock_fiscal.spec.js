import { describe, expect, it } from "vitest";
import {
  buildStockFiscalCsvRows,
  buildStockFiscalRows,
  computeStockFiscalValue,
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

function partnerInvoice(overrides = {}) {
  return {
    $path: "partner-invoice/20",
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
        [partnerInvoice({ partnership_purchased_percentage: 25 })]
      )
    ).toEqual({
      applied_percent: 60,
      percent_source: "buying-partnership",
      counterparty_path: "address_book/sup1",
    });
  });

  it("uses a single partner-invoice percentage when buying has no partnership %", () => {
    expect(
      resolveStockFiscalPercent(buyingInvoice(), [
        partnerInvoice({ partnership_purchased_percentage: 33 }),
      ])
    ).toEqual({
      applied_percent: 33,
      percent_source: "partner-invoice",
      counterparty_path: "address_book/par1",
    });
  });

  it("falls back to full cost when multiple partner invoices have %", () => {
    expect(
      resolveStockFiscalPercent(buyingInvoice(), [
        partnerInvoice({
          $path: "partner-invoice/20",
          partnership_purchased_percentage: 30,
        }),
        partnerInvoice({
          $path: "partner-invoice/21",
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
    });
  });

  it("applies full cost when there is no partnership", () => {
    const { rows, aggregates } = buildStockFiscalRows({
      gems: [gem()],
      selections: [buyingInvoice()],
    });
    expect(rows).toHaveLength(1);
    expect(rows[0].applied_percent).toBe(100);
    expect(rows[0].percent_source).toBe("full");
    expect(rows[0].fiscal_value).toBe(1000);
    expect(rows[0].buying_invoice_label).toBe("10");
    expect(aggregates).toEqual({
      gem_count: 1,
      cost_sum: 1000,
      fiscal_sum: 1000,
    });
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

  it("applies a single partner-invoice percentage", () => {
    const { rows } = buildStockFiscalRows({
      gems: [gem()],
      selections: [
        buyingInvoice(),
        partnerInvoice({ partnership_purchased_percentage: 25 }),
      ],
    });
    expect(rows[0].applied_percent).toBe(25);
    expect(rows[0].percent_source).toBe("partner-invoice");
    expect(rows[0].fiscal_value).toBe(250);
    expect(rows[0].partner_invoice_labels).toEqual(["20"]);
    expect(rows[0].partner_invoice_percentages).toEqual([25]);
  });

  it("lists multiple partner invoices but keeps a single full-cost fiscal value", () => {
    const { rows } = buildStockFiscalRows({
      gems: [gem()],
      selections: [
        buyingInvoice(),
        partnerInvoice({
          $path: "partner-invoice/20",
          partnership_purchased_percentage: 30,
        }),
        partnerInvoice({
          $path: "partner-invoice/21",
          partnership_purchased_percentage: 40,
          counterparty_path: "address_book/par2",
        }),
      ],
    });
    expect(rows[0].partner_invoice_labels).toEqual(["20", "21"]);
    expect(rows[0].partner_invoice_percentages).toEqual([30, 40]);
    expect(rows[0].applied_percent).toBe(100);
    expect(rows[0].fiscal_value).toBe(1000);
  });

  it("treats missing cost as zero fiscal value while keeping the row", () => {
    const { rows, aggregates } = buildStockFiscalRows({
      gems: [gem({ base_price_pcb: null })],
      selections: [buyingInvoice()],
    });
    expect(rows[0].cost).toBeNull();
    expect(rows[0].fiscal_value).toBe(0);
    expect(aggregates.cost_sum).toBe(0);
    expect(aggregates.fiscal_sum).toBe(0);
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
});

describe("buildStockFiscalCsvRows", () => {
  it("builds a header and data rows", () => {
    const { rows } = buildStockFiscalRows({
      gems: [gem()],
      selections: [buyingInvoice()],
    });
    rows[0].partner_label = "Supplier One";
    expect(buildStockFiscalCsvRows(rows)).toEqual([
      [
        "id",
        "cost",
        "buying_invoice",
        "partner",
        "applied_percent",
        "partner_invoices",
        "fiscal_value",
      ],
      ["1", "1000", "10", "Supplier One", "100", "", "1000"],
    ]);
  });
});
