import { buildGemFieldConfigs } from "@/components/gems/gem_field_configs";
import { formatSelectionEntriesHistoryValue } from "@/utils/selection_entries.js";

/**
 * @param {Function} t
 * @returns {Record<string, string>}
 */
export function buildSelectionFieldLabels(t) {
  return {
    internal_name: t("sg_selection_name"),
    selection_type: t("sg_selection_type_label"),
    selection_date: t("sg_selection_date"),
    document_number_name: t("sg_selection_document_number_name"),
    counterparty_path: t("sg_selection_counterparty"),
    reference_number: t("sg_selection_reference_number"),
    currency: t("sg_selection_currency"),
    notes: t("sg_selection_notes"),
    partnership_purchase: t("sg_selection_partnership_purchase"),
    partnership_purchased_percentage: t("sg_selection_purchased_percentage"),
    selection_entries: t("sg_selection_entries"),
  };
}

/**
 * @param {object} entry
 * @param {{ history_kind: 'gem' | 'selection' }} options
 * @returns {string}
 */
function formatHistoryEntryValue(entry, { history_kind }) {
  if (history_kind === "selection" && entry?.field === "selection_entries") {
    return formatSelectionEntriesHistoryValue(entry?.value);
  }

  const value = entry?.value;
  if (value === null || value === undefined || value === "") return "—";
  if (history_kind === "selection" && typeof value === "boolean") {
    return value ? "✓" : "—";
  }
  return String(value);
}

/**
 * @param {object} entry
 * @param {{ t: Function, history_kind: 'gem' | 'selection' }} options
 * @returns {string}
 */
export function formatFolderHistoryEntryTitle(entry, { t, history_kind }) {
  if (entry?.event === "created") {
    const fields_count = Object.keys(entry?.fields || {}).length;
    return `${t("sg_created")} (${fields_count} fields)`;
  }

  if (entry?.event === "updated") {
    let field_name = entry.field;
    if (history_kind === "gem") {
      const field_configs = buildGemFieldConfigs(t);
      field_name = field_configs?.[entry.field]?.label || entry.field;
    } else if (history_kind === "selection") {
      const labels = buildSelectionFieldLabels(t);
      field_name = labels[entry.field] || entry.field;
    }
    return `${field_name}: ${formatHistoryEntryValue(entry, { history_kind })}`;
  }

  return t("sg_field_history");
}
