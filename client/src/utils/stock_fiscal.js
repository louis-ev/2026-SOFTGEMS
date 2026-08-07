import { gem_cost_total_field_key } from "@/mixins/GemPricing.js";
import { normalizeGemStatusSlug } from "@/utils/gem_status.js";
import { findGemSelectionMemberships } from "@/utils/gem_selection_memberships.js";
import { normalizeMembershipPathsMap } from "@/utils/gem_selection_membership_paths.js";
import { clampPartnershipPurchasedPercentage } from "@/utils/selection_buying_invoice.js";
import {
  resolveSelectionType,
  selectionDocumentNumber,
  selectionTypeRootPath,
} from "@/utils/selection_paths.js";

export const STOCK_FISCAL_PURCHASED_STATUS = "buying-invoice";
export const STOCK_FISCAL_BUYING_TYPE = "buying invoice";
export const STOCK_FISCAL_PARTNER_TYPE = "partner invoice";

/**
 * @param {object} api - Vue api plugin with `getFolders`
 * @returns {Promise<object[]>}
 */
export async function fetchStockFiscalSelectionFolders(api) {
  if (!api?.getFolders) return [];
  const roots = [
    selectionTypeRootPath("buying-invoice"),
    selectionTypeRootPath("partner-invoice"),
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
 * @param {object[]} memberships
 * @returns {object[]}
 */
function listPartnerMemberships(memberships) {
  return (Array.isArray(memberships) ? memberships : [])
    .filter((folder) => resolveSelectionType(folder) === STOCK_FISCAL_PARTNER_TYPE)
    .slice()
    .sort((a, b) => {
      const path_a = String(a?.$path || "");
      const path_b = String(b?.$path || "");
      return path_a.localeCompare(path_b, undefined, { sensitivity: "base" });
    });
}

/**
 * @param {object|null|undefined} buying_invoice
 * @param {object[]} partner_invoices
 * @returns {{
 *   applied_percent: number,
 *   percent_source: "buying-partnership"|"partner-invoice"|"full",
 *   counterparty_path: string,
 * }}
 */
export function resolveStockFiscalPercent(buying_invoice, partner_invoices) {
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

  const partners_with_pct = (Array.isArray(partner_invoices)
    ? partner_invoices
    : []
  )
    .map((folder) => ({
      folder,
      percent: clampPartnershipPurchasedPercentage(
        folder?.partnership_purchased_percentage
      ),
    }))
    .filter((row) => row.percent !== null);

  if (partners_with_pct.length === 1) {
    const only = partners_with_pct[0];
    return {
      applied_percent: only.percent,
      percent_source: "partner-invoice",
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
 * @param {object} args
 * @param {object[]} args.gems
 * @param {object[]} args.selections
 * @returns {{
 *   rows: object[],
 *   aggregates: { gem_count: number, cost_sum: number, fiscal_sum: number },
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
    const partner_invoices = listPartnerMemberships(memberships);
    const percent_resolution = resolveStockFiscalPercent(
      buying_invoice,
      partner_invoices
    );
    const cost = parseStockFiscalCost(gem[gem_cost_total_field_key]);
    const fiscal_value = computeStockFiscalValue(
      cost,
      percent_resolution.applied_percent
    );

    rows.push({
      gem_path,
      gem_ref: stockFiscalGemRef(gem),
      cost,
      buying_invoice_path: String(buying_invoice?.$path || "").trim(),
      buying_invoice_label: buying_invoice
        ? formatStockFiscalSelectionLabel(buying_invoice)
        : "",
      partner_invoice_paths: partner_invoices.map((folder) =>
        String(folder?.$path || "").trim()
      ),
      partner_invoice_labels: partner_invoices.map((folder) =>
        formatStockFiscalSelectionLabel(folder)
      ),
      partner_invoice_percentages: partner_invoices.map((folder) =>
        clampPartnershipPurchasedPercentage(
          folder?.partnership_purchased_percentage
        )
      ),
      applied_percent: percent_resolution.applied_percent,
      percent_source: percent_resolution.percent_source,
      counterparty_path: percent_resolution.counterparty_path,
      fiscal_value,
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
  for (const row of rows) {
    if (row.cost !== null) cost_sum += row.cost;
    fiscal_sum += row.fiscal_value;
  }

  return {
    rows,
    aggregates: {
      gem_count: rows.length,
      cost_sum: Number(cost_sum.toFixed(2)),
      fiscal_sum: Number(fiscal_sum.toFixed(2)),
    },
  };
}

/**
 * @param {object[]} rows
 * @param {(cell: *) => string} [format_cell]
 * @returns {string[][]}
 */
export function buildStockFiscalCsvRows(rows, format_cell = String) {
  const header = [
    "id",
    "cost",
    "buying_invoice",
    "partner",
    "applied_percent",
    "partner_invoices",
    "fiscal_value",
  ];
  const data_rows = (Array.isArray(rows) ? rows : []).map((row) => [
    format_cell(row.gem_ref),
    format_cell(row.cost),
    format_cell(row.buying_invoice_label),
    format_cell(row.partner_label || ""),
    format_cell(row.applied_percent),
    format_cell(
      Array.isArray(row.partner_invoice_labels)
        ? row.partner_invoice_labels.filter(Boolean).join("; ")
        : ""
    ),
    format_cell(row.fiscal_value),
  ]);
  return [header, ...data_rows];
}
