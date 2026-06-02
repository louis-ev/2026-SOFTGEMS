import { SELECTION_TYPE_VALUES } from "@/utils/selection_types.js";

/** @typedef {{ value: string, slug: string, icon: string, sort_order: number }} SelectionTypeDef */

/** @type {SelectionTypeDef[]} */
export const SELECTION_TYPE_REGISTRY = Object.freeze([
  {
    value: "simple",
    slug: "simple",
    icon: "layout-three-columns",
    sort_order: 1,
  },
  { value: "boîte", slug: "box", icon: "archive", sort_order: 2 },
  { value: "memo in", slug: "memo-in", icon: "arrow-down-left", sort_order: 3 },
  {
    value: "return memo in",
    slug: "return-memo-in",
    icon: "arrow-return-left",
    sort_order: 4,
  },
  {
    value: "buying invoice",
    slug: "buying-invoice",
    icon: "bag",
    sort_order: 5,
  },
  {
    value: "memo out",
    slug: "memo-out",
    icon: "arrow-up-right",
    sort_order: 6,
  },
  {
    value: "return memo out",
    slug: "return-memo-out",
    icon: "arrow-return-right",
    sort_order: 7,
  },
  {
    value: "sale invoice",
    slug: "sale-invoice",
    icon: "receipt",
    sort_order: 8,
  },
  {
    value: "partner invoice",
    slug: "partner-invoice",
    icon: "person-badge",
    sort_order: 9,
  },
  {
    value: "credit note",
    slug: "credit-note",
    icon: "file-earmark-minus",
    sort_order: 10,
  },
  { value: "importation", slug: "importation", icon: "globe", sort_order: 11 },
  {
    value: "importation return",
    slug: "importation-return",
    icon: "arrow-left-right",
    sort_order: 12,
  },
]);

const _slug_to_def = new Map(
  SELECTION_TYPE_REGISTRY.map((def) => [def.slug, def])
);
const _value_to_def = new Map(
  SELECTION_TYPE_REGISTRY.map((def) => [def.value, def])
);

/** @returns {SelectionTypeDef[]} */
export function allSelectionTypes() {
  return [...SELECTION_TYPE_REGISTRY].sort(
    (a, b) => a.sort_order - b.sort_order
  );
}

/** @param {string} slug */
export function isValidSelectionTypeSlug(slug) {
  return _slug_to_def.has(String(slug || "").trim());
}

/** @param {string} slug @returns {SelectionTypeDef|null} */
export function selectionTypeDefFromSlug(slug) {
  return _slug_to_def.get(String(slug || "").trim()) || null;
}

/** @param {string} value @returns {SelectionTypeDef|null} */
export function selectionTypeDefFromValue(value) {
  return _value_to_def.get(String(value || "").trim()) || null;
}

/** @param {string} slug @returns {string} */
export function selectionTypeFromSlug(slug) {
  return selectionTypeDefFromSlug(slug)?.value || "";
}

/** @param {string} value @returns {string} */
export function selectionSlugFromType(value) {
  return selectionTypeDefFromValue(value)?.slug || "";
}

/** @param {string} slug @returns {string} */
export function selectionTypeIconFromSlug(slug) {
  return selectionTypeDefFromSlug(slug)?.icon || "card-list";
}

/** Ensure registry covers canonical CDC list. */
export function assertRegistryCoversAllTypes() {
  for (const value of SELECTION_TYPE_VALUES) {
    if (!selectionTypeDefFromValue(value)) {
      throw new Error(`selection_type_registry missing: ${value}`);
    }
  }
}

assertRegistryCoversAllTypes();
