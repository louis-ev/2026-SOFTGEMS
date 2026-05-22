/** Default columns when picking gems inside selection flows (subset of inventory table). */

export const GEMS_PICKER_METADATA_KEYS = Object.freeze([
  "id",
  "$cover",
  "status",
  "reference_supplier",
  "reference_customer",
  "stone_type",
  "weight_ct",
  "color",
]);

const _LABEL_KEY = Object.freeze({
  id: "sg_id",
  $cover: "sg_cover",
  status: "sg_status",
  reference_supplier: "sg_reference_supplier",
  reference_customer: "sg_reference_customer",
  stone_type: "sg_stone_type",
  weight_ct: "sg_weight_ct",
  color: "sg_color",
});

const _ICON = Object.freeze({
  id: "card-list",
  $cover: "images",
  status: "tag",
  reference_supplier: "archive",
  reference_customer: "person-circle",
  stone_type: "gem",
  weight_ct: "rulers",
  color: "palette-fill",
});

/** @param {(k: string) => string} t */
export function gemsPickerMetadataLabels(t) {
  return GEMS_PICKER_METADATA_KEYS.reduce((acc, key) => {
    const tk = _LABEL_KEY[key];
    acc[key] = tk ? t(tk) : key;
    return acc;
  }, {});
}

export function gemsPickerMetadataIcons() {
  return GEMS_PICKER_METADATA_KEYS.reduce((acc, key) => {
    acc[key] = _ICON[key] || null;
    return acc;
  }, {});
}
