import { buildGemFieldConfigs } from "@/components/gems/gem_field_configs";
import { date_format_locale } from "@/utils/format_locale.js";
import { normalizeMembershipPathsMap } from "@/utils/gem_selection_membership_paths.js";
import { gemStatusLabel } from "@/utils/gem_status.js";
import { normalizeGemSplits } from "@/utils/gem_split.js";
import { htmlToPlainText } from "@/utils/rich_text.js";
import { formatSelectionEntriesHistoryValue } from "@/utils/selection_entries.js";
import {
  parseSelectionFolderPath,
  selectionDocumentNumber,
} from "@/utils/selection_paths.js";
import { defaultSelectionInternalName } from "@/utils/selection_types.js";

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
    exchange_rate: t("sg_selection_exchange_rate"),
    notes: t("sg_selection_notes"),
    partnership_purchase: t("sg_selection_partnership_purchase"),
    partnership_purchased_percentage: t("sg_selection_purchased_percentage"),
    selection_entries: t("sg_selection_entries"),
  };
}

/**
 * Extra gem history labels for fields that are not in the gem field editor.
 * @param {Function} t
 * @returns {Record<string, string>}
 */
export function buildGemHistoryFieldLabels(t) {
  return {
    box_selection_path: t("sg_duplicate_gem_field_box"),
    selection_membership_paths: t("sg_section_gem_selections"),
  };
}

/**
 * @param {*} raw
 * @returns {string}
 */
function formatHistoryCalendarDate(raw) {
  if (!raw) return "";
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toLocaleDateString(date_format_locale, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
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
 * @param {string} path
 * @param {Function} t
 * @returns {string}
 */
export function formatSelectionPathHistoryLabel(path, t) {
  const cleaned = String(path || "").trim();
  if (!cleaned) return "—";
  const parsed = parseSelectionFolderPath(cleaned);
  const document_number =
    parsed.folder_slug || selectionDocumentNumber(cleaned);
  if (parsed.selection_type && document_number) {
    return defaultSelectionInternalName(
      t,
      parsed.selection_type,
      document_number
    );
  }
  return cleaned;
}

/**
 * @param {*} raw
 * @param {Function} t
 * @returns {string}
 */
export function formatSelectionMembershipPathsHistoryValue(raw, t) {
  const map = normalizeMembershipPathsMap(raw);
  const entries = Object.entries(map);
  if (entries.length === 0) return "—";

  entries.sort(
    (a, b) => parseSortableTimestamp(b[1]) - parseSortableTimestamp(a[1])
  );

  return entries
    .map(([path, iso]) => {
      const label = formatSelectionPathHistoryLabel(path, t);
      const date_label = formatHistoryCalendarDate(iso);
      return date_label ? `${label} (${date_label})` : label;
    })
    .join("\n");
}

/**
 * @param {*} raw
 * @returns {string}
 */
function formatSplitsHistoryValue(raw) {
  const rows = normalizeGemSplits(raw);
  if (rows.length === 0) return "—";
  return rows
    .map((row) => {
      const date_label = formatHistoryCalendarDate(row.date);
      return date_label ? `#${row.id} (${date_label})` : `#${row.id}`;
    })
    .join("\n");
}

/**
 * Fallback so objects/arrays never render as `[object Object]`.
 * @param {*} value
 * @returns {string}
 */
function formatGenericHistoryValue(value) {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "✓" : "—";
  if (typeof value !== "object") return String(value);

  if (Array.isArray(value)) {
    if (value.length === 0) return "—";
    return value.map((item) => formatGenericHistoryValue(item)).join(", ");
  }

  const entries = Object.entries(value);
  if (entries.length === 0) return "—";
  return entries
    .map(([key, nested]) => `${key}: ${formatGenericHistoryValue(nested)}`)
    .join("\n");
}

/**
 * @param {object} entry
 * @param {{ t: Function, history_kind: 'gem' | 'selection' }} options
 * @returns {string}
 */
export function formatFolderHistoryFieldName(entry, { t, history_kind }) {
  const field = entry?.field;
  if (history_kind === "gem") {
    const field_configs = buildGemFieldConfigs(t);
    const extra = buildGemHistoryFieldLabels(t);
    return field_configs?.[field]?.label || extra[field] || field;
  }
  if (history_kind === "selection") {
    const labels = buildSelectionFieldLabels(t);
    return labels[field] || field;
  }
  return field;
}

/**
 * @param {object} entry
 * @param {{ t: Function, history_kind: 'gem' | 'selection' }} options
 * @returns {string}
 */
export function formatFolderHistoryEntryValue(entry, { t, history_kind }) {
  if (history_kind === "selection" && entry?.field === "selection_entries") {
    return formatSelectionEntriesHistoryValue(entry?.value);
  }

  const value = entry?.value;
  if (value === null || value === undefined || value === "") return "—";

  if (entry?.field === "notes") {
    return htmlToPlainText(value) || "—";
  }

  if (history_kind === "gem" && entry?.field === "status") {
    return gemStatusLabel(t, value);
  }

  if (history_kind === "gem" && entry?.field === "selection_membership_paths") {
    return formatSelectionMembershipPathsHistoryValue(value, t);
  }

  if (history_kind === "gem" && entry?.field === "box_selection_path") {
    return formatSelectionPathHistoryLabel(value, t);
  }

  if (history_kind === "gem" && entry?.field === "splits") {
    return formatSplitsHistoryValue(value);
  }

  if (history_kind === "selection" && typeof value === "boolean") {
    return value ? "✓" : "—";
  }

  return formatGenericHistoryValue(value);
}

/**
 * @param {object} entry
 * @param {{ t: Function }} options
 * @returns {string}
 */
export function formatFolderHistoryCreatedTitle(entry, { t }) {
  const fields_count = Object.keys(entry?.fields || {}).length;
  return t("sg_created_with_fields", { count: fields_count });
}

/**
 * @param {object} entry
 * @param {{ t: Function, history_kind: 'gem' | 'selection' }} options
 * @returns {string}
 */
export function formatFolderHistoryEntryTitle(entry, { t, history_kind }) {
  if (entry?.event === "created") {
    return formatFolderHistoryCreatedTitle(entry, { t });
  }

  if (entry?.event === "updated") {
    const field_name = formatFolderHistoryFieldName(entry, { t, history_kind });
    const value = formatFolderHistoryEntryValue(entry, { t, history_kind });
    const value_one_line = String(value || "").replace(/\n/g, ", ");
    return `${field_name}: ${value_one_line}`;
  }

  return t("sg_field_history");
}
