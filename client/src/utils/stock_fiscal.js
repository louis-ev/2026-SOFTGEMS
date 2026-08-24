import { gem_cost_total_field_key } from "@/mixins/GemPricing.js";
import { normalizeGemStatusSlug } from "@/utils/gem_status.js";
import { findGemSelectionMemberships } from "@/utils/gem_selection_memberships.js";
import { normalizeMembershipPathsMap } from "@/utils/gem_selection_membership_paths.js";
import { clampPartnershipPurchasedPercentage } from "@/utils/selection_buying_invoice.js";
import {
  SELECTION_CURRENCY_USD,
  resolveSelectionCurrency,
} from "@/utils/selection_currency.js";
import {
  formatSelectionExchangeRateDisplay,
  normalizeSelectionExchangeRate,
} from "@/utils/selection_exchange_rate.js";
import {
  resolveSelectionType,
  selectionDocumentNumber,
  selectionTypeRootPath,
} from "@/utils/selection_paths.js";

export const STOCK_FISCAL_PURCHASED_STATUS = "buying-invoice";
export const STOCK_FISCAL_BUYING_TYPE = "buying invoice";
export const STOCK_FISCAL_SALE_TYPE = "sale invoice";

/**
 * @param {object} api - Vue api plugin with `getFolders`
 * @returns {Promise<object[]>}
 */
export async function fetchStockFiscalSelectionFolders(api) {
  if (!api?.getFolders) return [];
  const roots = [
    selectionTypeRootPath("buying-invoice"),
    selectionTypeRootPath("sale-invoice"),
  ].filter(Boolean);
  const batches = await Promise.all(
    roots.map((path) => api.getFolders({ path }).catch(() => []))
  );
  const merged = [];
  for (const rows of batches) {
    if (!Array.isArray(rows)) continue;
    for (const row of rows) {
      if (row) merged.push(row);
    }
  }
  return merged;
}

/**
 * @param {*} raw
 * @returns {number}
 */
function parseSortableTimestamp(raw) {
  if (!raw) return 0;
  const time = new Date(raw).getTime();
  return Number.isFinite(time) ? time : 0;
}

/**
 * @param {object|null|undefined} gem
 * @returns {string}
 */
export function stockFiscalGemRef(gem) {
  const path = String(gem?.$path || "").trim().replace(/\\/g, "/");
  if (!path) return "";
  const parts = path.split("/").filter(Boolean);
  return parts[parts.length - 1] || "";
}

/**
 * @param {*} raw
 * @returns {number|null}
 */
export function parseStockFiscalCost(raw) {
  if (raw === null || raw === undefined || raw === "") return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

/**
 * @param {number|null} cost
 * @param {number} applied_percent
 * @returns {number}
 */
export function computeStockFiscalValue(cost, applied_percent) {
  if (cost === null || !Number.isFinite(cost)) return 0;
  const pct = Number(applied_percent);
  if (!Number.isFinite(pct)) return 0;
  return Number(((cost * pct) / 100).toFixed(2));
}

/**
 * @param {object[]} memberships
 * @param {Record<string, string>} membership_paths_map
 * @param {string} selection_type
 * @returns {object|null}
 */
function pickLatestMembershipOfType(
  memberships,
  membership_paths_map,
  selection_type
) {
  const wanted = String(selection_type || "").trim();
  const candidates = (Array.isArray(memberships) ? memberships : [])
    .filter((folder) => resolveSelectionType(folder) === wanted)
    .map((folder) => {
      const folder_path = String(folder?.$path || "").trim();
      const added_at =
        membership_paths_map[folder_path] ||
        folder.selection_date ||
        folder.$date_created;
      return {
        folder,
        sort_key: parseSortableTimestamp(added_at),
      };
    });
  if (!candidates.length) return null;
  candidates.sort((a, b) => b.sort_key - a.sort_key);
  return candidates[0].folder;
}

/**
 * Sale invoices on the gem with Partnership Invoice checked.
 * @param {object[]} memberships
 * @returns {object[]}
 */
function listPartnershipSaleMemberships(memberships) {
  return (Array.isArray(memberships) ? memberships : [])
    .filter(
      (folder) =>
        resolveSelectionType(folder) === STOCK_FISCAL_SALE_TYPE &&
        Boolean(folder?.partnership_purchase)
    )
    .slice()
    .sort((a, b) => {
      const path_a = String(a?.$path || "");
      const path_b = String(b?.$path || "");
      return path_a.localeCompare(path_b, undefined, { sensitivity: "base" });
    });
}

/**
 * @param {object|null|undefined} buying_invoice
 * @param {object[]} partnership_sale_invoices
 * @returns {{
 *   applied_percent: number,
 *   percent_source: "buying-partnership"|"sale-partnership"|"full",
 *   counterparty_path: string,
 * }}
 */
export function resolveStockFiscalPercent(
  buying_invoice,
  partnership_sale_invoices
) {
  const buying_pct = buying_invoice?.partnership_purchase
    ? clampPartnershipPurchasedPercentage(
        buying_invoice.partnership_purchased_percentage
      )
    : null;
  if (buying_pct !== null) {
    return {
      applied_percent: buying_pct,
      percent_source: "buying-partnership",
      counterparty_path: String(buying_invoice?.counterparty_path || "").trim(),
    };
  }

  const sales_with_pct = (
    Array.isArray(partnership_sale_invoices) ? partnership_sale_invoices : []
  )
    .map((folder) => ({
      folder,
      percent: clampPartnershipPurchasedPercentage(
        folder?.partnership_purchased_percentage
      ),
    }))
    .filter((row) => row.percent !== null);

  if (sales_with_pct.length === 1) {
    const only = sales_with_pct[0];
    return {
      applied_percent: only.percent,
      percent_source: "sale-partnership",
      counterparty_path: String(only.folder?.counterparty_path || "").trim(),
    };
  }

  return {
    applied_percent: 100,
    percent_source: "full",
    counterparty_path: String(buying_invoice?.counterparty_path || "").trim(),
  };
}

/**
 * Display label: internal name with document ID in parentheses when both exist.
 * @param {object|null|undefined} folder
 * @returns {string}
 */
export function formatStockFiscalSelectionLabel(folder) {
  if (!folder || typeof folder !== "object") return "";
  const id = String(selectionDocumentNumber(folder) || "").trim();
  const name = String(folder.internal_name || "").trim();
  if (name && id) return `${name} (${id})`;
  return name || id;
}

/**
 * USD→EUR rate from the buying invoice, or null when currency is EUR / rate missing.
 * @param {object|null|undefined} folder
 * @returns {number|null}
 */
export function resolveStockFiscalExchangeRate(folder) {
  if (!folder || typeof folder !== "object") return null;
  if (resolveSelectionCurrency(folder.currency) !== SELECTION_CURRENCY_USD) {
    return null;
  }
  return normalizeSelectionExchangeRate(folder.exchange_rate);
}

/**
 * Convert an amount to EUR using the buying-invoice currency and rate.
 * EUR stays as-is. USD requires a stored exchange rate; otherwise null.
 * @param {number|null} amount
 * @param {{ currency?: *, exchange_rate?: * }} [options]
 * @returns {number|null}
 */
export function convertStockFiscalAmountToEur(
  amount,
  { currency, exchange_rate } = {}
) {
  if (amount === null || amount === undefined || amount === "") return null;
  const n = Number(amount);
  if (!Number.isFinite(n)) return null;
  if (resolveSelectionCurrency(currency) !== SELECTION_CURRENCY_USD) {
    return Number(n.toFixed(2));
  }
  const rate = normalizeSelectionExchangeRate(exchange_rate);
  if (rate === null) return null;
  return Number((n * rate).toFixed(2));
}

/**
 * Buying invoice label with the USD→EUR rate in parentheses when used.
 * @param {object|null|undefined} row
 * @param {(rate_text: string) => string} [format_rate_note]
 * @returns {string}
 */
export function formatStockFiscalBuyingInvoiceWithRate(
  row,
  format_rate_note
) {
  const label = String(row?.buying_invoice_label || "").trim();
  const rate_text = formatSelectionExchangeRateDisplay(row?.exchange_rate);
  if (!rate_text) return label;
  const note =
    typeof format_rate_note === "function"
      ? format_rate_note(rate_text)
      : `USD → EUR rate = ${rate_text}`;
  if (!label) return `(${note})`;
  return `${label} (${note})`;
}

/**
 * @param {object} args
 * @param {object[]} args.gems
 * @param {object[]} args.selections
 * @returns {{
 *   rows: object[],
 *   aggregates: {
 *     gem_count: number,
 *     cost_sum: number,
 *     fiscal_sum: number,
 *     fiscal_sum_eur: number,
 *   },
 * }}
 */
export function buildStockFiscalRows({ gems, selections }) {
  const folders = Array.isArray(selections) ? selections : [];
  const rows = [];

  for (const gem of Array.isArray(gems) ? gems : []) {
    if (!gem || typeof gem !== "object") continue;
    if (normalizeGemStatusSlug(gem.status) !== STOCK_FISCAL_PURCHASED_STATUS) {
      continue;
    }

    const gem_path = String(gem.$path || "").trim();
    if (!gem_path) continue;

    const memberships = findGemSelectionMemberships({
      gem_path,
      gem,
      selection_folders: folders,
    });
    const membership_paths_map = normalizeMembershipPathsMap(
      gem.selection_membership_paths,
      gem.selection_gem_added_at
    );

    const buying_invoice = pickLatestMembershipOfType(
      memberships,
      membership_paths_map,
      STOCK_FISCAL_BUYING_TYPE
    );
    const partnership_sale_invoices =
      listPartnershipSaleMemberships(memberships);
    const percent_resolution = resolveStockFiscalPercent(
      buying_invoice,
      partnership_sale_invoices
    );
    const cost = parseStockFiscalCost(gem[gem_cost_total_field_key]);
    const fiscal_value = computeStockFiscalValue(
      cost,
      percent_resolution.applied_percent
    );
    const currency = buying_invoice
      ? resolveSelectionCurrency(buying_invoice.currency)
      : SELECTION_CURRENCY_USD;
    const exchange_rate = resolveStockFiscalExchangeRate(buying_invoice);
    const fiscal_value_eur = convertStockFiscalAmountToEur(fiscal_value, {
      currency,
      exchange_rate,
    });

    rows.push({
      gem_path,
      gem_ref: stockFiscalGemRef(gem),
      numero_de_mise_a_consommation: String(
        gem.numero_de_mise_a_consommation ?? ""
      ).trim(),
      cost,
      buying_invoice_path: String(buying_invoice?.$path || "").trim(),
      buying_invoice_label: buying_invoice
        ? formatStockFiscalSelectionLabel(buying_invoice)
        : "",
      applied_percent: percent_resolution.applied_percent,
      percent_source: percent_resolution.percent_source,
      counterparty_path: percent_resolution.counterparty_path,
      currency,
      exchange_rate,
      fiscal_value,
      fiscal_value_eur,
    });
  }

  rows.sort((a, b) =>
    String(a.gem_ref || a.gem_path).localeCompare(
      String(b.gem_ref || b.gem_path),
      undefined,
      { numeric: true, sensitivity: "base" }
    )
  );

  let cost_sum = 0;
  let fiscal_sum = 0;
  let fiscal_sum_eur = 0;
  for (const row of rows) {
    if (row.cost !== null) cost_sum += row.cost;
    fiscal_sum += row.fiscal_value;
    if (row.fiscal_value_eur !== null) fiscal_sum_eur += row.fiscal_value_eur;
  }

  return {
    rows,
    aggregates: {
      gem_count: rows.length,
      cost_sum: Number(cost_sum.toFixed(2)),
      fiscal_sum: Number(fiscal_sum.toFixed(2)),
      fiscal_sum_eur: Number(fiscal_sum_eur.toFixed(2)),
    },
  };
}

/**
 * @param {object[]} rows
 * @param {(cell: *) => string} [format_cell]
 * @param {{ format_rate_note?: (rate_text: string) => string }} [options]
 * @returns {string[][]}
 */
export function buildStockFiscalCsvRows(
  rows,
  format_cell = String,
  { format_rate_note } = {}
) {
  const header = [
    "id",
    "numero_de_mise_a_consommation",
    "cost",
    "buying_invoice",
    "partner",
    "applied_percent",
    "fiscal_value",
    "fiscal_value_eur",
  ];
  const data_rows = (Array.isArray(rows) ? rows : []).map((row) => [
    format_cell(row.gem_ref),
    format_cell(row.numero_de_mise_a_consommation || ""),
    format_cell(row.cost == null ? "" : row.cost),
    format_cell(
      formatStockFiscalBuyingInvoiceWithRate(row, format_rate_note)
    ),
    format_cell(row.partner_label || ""),
    format_cell(row.applied_percent),
    format_cell(row.fiscal_value),
    format_cell(row.fiscal_value_eur == null ? "" : row.fiscal_value_eur),
  ]);
  return [header, ...data_rows];
}
