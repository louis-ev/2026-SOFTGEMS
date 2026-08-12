import { normalizeMembershipPathsMap } from "@/utils/gem_selection_membership_paths.js";
import {
  parseSelectionFolderPath,
  selectionDocumentNumber,
} from "@/utils/selection_paths.js";
import { isSelectionPdfPricingTotalKey } from "@/utils/selection_pdf_export_registry.js";

/** Harmonized System code for precious stones (RSE). */
export const CUSTOMS_HS_CODE_RSE = "710 391";

/** Harmonized System code for semi-precious / fine stones (PF). */
export const CUSTOMS_HS_CODE_PF = "710 399";

/**
 * Ruby, sapphire, emerald (and star variants) ? RSE / pierres précieuses.
 * @param {*} stone_type
 * @returns {boolean}
 */
export function isRseStoneType(stone_type) {
  const st = String(stone_type || "").trim().toLowerCase();
  if (!st) return false;
  return /emerald|ruby|sapphire/.test(st);
}

/**
 * Importation folder path for grouping (`importation/{n}`), or `""` if none.
 * When a gem belongs to several importations, picks the most recently added.
 * Ignores `importation-return`.
 *
 * @param {object|null|undefined} gem
 * @returns {string}
 */
export function resolveGemImportationGroupPath(gem) {
  const map = normalizeMembershipPathsMap(
    gem?.selection_membership_paths,
    gem?.selection_gem_added_at
  );
  let best_path = "";
  let best_iso = "";
  for (const [path, iso] of Object.entries(map)) {
    const { type_slug } = parseSelectionFolderPath(path);
    if (type_slug !== "importation") continue;
    const cleaned_iso = String(iso || "").trim();
    if (!best_path || cleaned_iso > best_iso) {
      best_path = path;
      best_iso = cleaned_iso;
    }
  }
  return best_path;
}

/**
 * @param {object[]} gems
 * @param {string} field_key
 * @returns {number|null}
 */
function sumField(gems, field_key) {
  const key = String(field_key || "").trim();
  if (!key) return null;
  let sum = 0;
  let has_value = false;
  (gems || []).forEach((gem) => {
    const n = Number(gem?.[key]);
    if (Number.isFinite(n)) {
      sum += n;
      has_value = true;
    }
  });
  return has_value ? sum : null;
}

/**
 * @param {object[]} gems
 * @param {string|null|undefined} pricing_total_key
 * @returns {{ quantity: number|null, weight: number|null, total: number|null }}
 */
function aggregateGems(gems, pricing_total_key) {
  const pricing_key = String(pricing_total_key || "").trim();
  const can_price =
    pricing_key && isSelectionPdfPricingTotalKey(pricing_key);
  return {
    quantity: sumField(gems, "number_of_pieces"),
    weight: sumField(gems, "weight_ct"),
    total: can_price ? sumField(gems, pricing_key) : null,
  };
}

/**
 * @param {{ quantity: number|null, weight: number|null, total: number|null }} a
 * @param {{ quantity: number|null, weight: number|null, total: number|null }} b
 */
function sumAggregates(a, b) {
  const add = (x, y) => {
    if (x === null && y === null) return null;
    return (x || 0) + (y || 0);
  };
  return {
    quantity: add(a.quantity, b.quantity),
    weight: add(a.weight, b.weight),
    total: add(a.total, b.total),
  };
}

/**
 * Build customs summary groups for the PDF end section.
 *
 * @param {object[]} gems
 * @param {string|null|undefined} pricing_total_key
 * @returns {{
 *   importation_path: string,
 *   document_number: string,
 *   rse: { quantity: number|null, weight: number|null, total: number|null },
 *   pf: { quantity: number|null, weight: number|null, total: number|null },
 *   group_total: { quantity: number|null, weight: number|null, total: number|null },
 * }[]}
 */
export function buildCustomsSummaryGroups(gems, pricing_total_key) {
  /** @type {Map<string, object[]>} */
  const by_path = new Map();
  (Array.isArray(gems) ? gems : []).forEach((gem) => {
    if (!gem || typeof gem !== "object") return;
    const path = resolveGemImportationGroupPath(gem);
    if (!by_path.has(path)) by_path.set(path, []);
    by_path.get(path).push(gem);
  });

  const paths = [...by_path.keys()].sort((a, b) => {
    if (!a) return 1;
    if (!b) return -1;
    const num_a = Number(selectionDocumentNumber(a)) || 0;
    const num_b = Number(selectionDocumentNumber(b)) || 0;
    if (num_a !== num_b) return num_a - num_b;
    return a.localeCompare(b);
  });

  return paths.map((importation_path) => {
    const group_gems = by_path.get(importation_path) || [];
    const rse_gems = group_gems.filter((gem) => isRseStoneType(gem.stone_type));
    const pf_gems = group_gems.filter((gem) => !isRseStoneType(gem.stone_type));
    const rse = aggregateGems(rse_gems, pricing_total_key);
    const pf = aggregateGems(pf_gems, pricing_total_key);
    return {
      importation_path,
      document_number: importation_path
        ? selectionDocumentNumber(importation_path)
        : "",
      rse,
      pf,
      group_total: sumAggregates(rse, pf),
    };
  });
}
