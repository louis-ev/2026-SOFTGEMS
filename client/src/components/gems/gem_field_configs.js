import {
  color_suggestions,
  origin_country_suggestions,
  shape_suggestions,
  stone_type_suggestions,
  treatment_type_suggestions,
} from "@/suggestions/softgems";

const sortSuggestions = (suggestions) =>
  [...suggestions].sort((a, b) => a.localeCompare(b));

const sorted_color_suggestions = sortSuggestions(color_suggestions);
const sorted_origin_country_suggestions = sortSuggestions(
  origin_country_suggestions
);
const sorted_shape_suggestions = sortSuggestions(shape_suggestions);
const sorted_stone_type_suggestions = sortSuggestions(stone_type_suggestions);
const sorted_treatment_type_suggestions = sortSuggestions(
  treatment_type_suggestions
);

const STATUS_OPTIONS = [
  { value: "reference", label: "reference" },
  { value: "available", label: "available" },
  { value: "reserved", label: "reserved" },
  { value: "sold", label: "sold" },
];

/**
 * Returns the full field config map for all gem fields.
 * @param {Function} t - Vue $t translation function
 * @param {Array} paired_gem_options - select options for the paired_gem field
 */
export function buildGemFieldConfigs(t, paired_gem_options = []) {
  return {
    internal_name: {
      key: "internal_name",
      label: t("sg_internal_name"),
      icon: "pencil",
      type: "text",
    },
    status: {
      key: "status",
      label: t("sg_status"),
      icon: null,
      type: "select",
      options: STATUS_OPTIONS,
    },
    reference_supplier: {
      key: "reference_supplier",
      label: t("sg_reference_supplier"),
      icon: "archive",
      type: "text",
    },
    reference_customer: {
      key: "reference_customer",
      label: t("sg_reference_customer"),
      icon: "person-circle",
      type: "text",
    },
    paired_gem: {
      key: "paired_gem",
      label: t("sg_paired_gem"),
      icon: "link",
      type: "select",
      options: paired_gem_options,
    },
    number_of_pieces: {
      key: "number_of_pieces",
      label: t("sg_number_of_pieces"),
      icon: "list-ol",
      type: "number",
      input_type: "number",
      input_step: 1,
      instructions: t("sg_format_integer"),
    },
    stone_type: {
      key: "stone_type",
      label: t("sg_stone_type"),
      icon: "gem",
      type: "select",
      options: sorted_stone_type_suggestions,
    },
    weight_ct: {
      key: "weight_ct",
      label: t("sg_weight_ct"),
      icon: "rulers",
      type: "number",
      input_type: "number",
      input_step: 0.001,
      instructions: t("sg_format_decimal_3"),
    },
    color: {
      key: "color",
      label: t("sg_color"),
      icon: "palette-fill",
      type: "select",
      options: sorted_color_suggestions,
    },
    shape: {
      key: "shape",
      label: t("sg_shape"),
      icon: "pentagon",
      type: "select",
      options: sorted_shape_suggestions,
    },
    origin_country: {
      key: "origin_country",
      label: t("sg_origin_country"),
      icon: "pin-map",
      type: "select",
      options: sorted_origin_country_suggestions,
    },
    treatment_type: {
      key: "treatment_type",
      label: t("sg_treatment_type"),
      icon: "tools",
      type: "select",
      options: sorted_treatment_type_suggestions,
    },
    length_mm: {
      key: "length_mm",
      label: t("sg_length_mm"),
      icon: "aspect-ratio",
      type: "number",
      input_type: "number",
      input_step: 0.01,
      instructions: t("sg_format_decimal_2"),
    },
    width_mm: {
      key: "width_mm",
      label: t("sg_width_mm"),
      icon: "aspect-ratio",
      type: "number",
      input_type: "number",
      input_step: 0.01,
      instructions: t("sg_format_decimal_2"),
    },
    height_mm: {
      key: "height_mm",
      label: t("sg_height_mm"),
      icon: "aspect-ratio",
      type: "number",
      input_type: "number",
      input_step: 0.01,
      instructions: t("sg_format_decimal_2"),
    },
    base_price_pcb: {
      key: "base_price_pcb",
      label: t("sg_base_price_pcb"),
      icon: "tag",
      type: "number",
      input_type: "number",
      input_step: 0.01,
      instructions: t("sg_format_decimal_2"),
    },
    purchased_price_pa: {
      key: "purchased_price_pa",
      label: t("sg_purchased_price_pa"),
      icon: "tag",
      type: "number",
      input_type: "number",
      input_step: 0.01,
      instructions: t("sg_format_decimal_2"),
    },
    price_per_carat_pcb: {
      key: "price_per_carat_pcb",
      label: t("sg_price_per_carat_pcb"),
      icon: "diagram2",
      type: "number",
      input_type: "number",
      input_step: 0.01,
      instructions: t("sg_format_decimal_2"),
      pricing_total_key: "base_price_pcb",
    },
    price_per_carat_pa: {
      key: "price_per_carat_pa",
      label: t("sg_price_per_carat_pa"),
      icon: "diagram2",
      type: "number",
      input_type: "number",
      input_step: 0.01,
      instructions: t("sg_format_decimal_2"),
      pricing_total_key: "purchased_price_pa",
    },
    pv_selling_price: {
      key: "pv_selling_price",
      label: t("sg_pv_selling_price"),
      icon: "tag",
      type: "number",
      input_type: "number",
      input_step: 0.01,
      instructions: t("sg_format_decimal_2"),
    },
    price_per_carat_pv: {
      key: "price_per_carat_pv",
      label: t("sg_price_per_carat_pv"),
      icon: "diagram2",
      type: "number",
      input_type: "number",
      input_step: 0.01,
      instructions: t("sg_format_decimal_2"),
      pricing_total_key: "pv_selling_price",
    },
    pvd_asking_price: {
      key: "pvd_asking_price",
      label: t("sg_pvd_asking_price"),
      icon: "diagram2",
      type: "number",
      readonly: true,
    },
    pc_to: {
      key: "pc_to",
      label: t("sg_pc_to"),
      icon: "file-earmark-text",
      type: "number",
      input_type: "number",
      input_step: 1,
      instructions: t("sg_format_integer"),
    },
    price_per_carat_pc: {
      key: "price_per_carat_pc",
      label: t("sg_price_per_carat_pc"),
      icon: "diagram2",
      type: "number",
      input_type: "number",
      input_step: 0.01,
      instructions: t("sg_format_decimal_2"),
      pricing_total_key: "pc_to",
    },
    pf_invoiced_price: {
      key: "pf_invoiced_price",
      label: t("sg_pf_invoiced_price"),
      icon: "file-earmark-text",
      type: "number",
      input_type: "number",
      input_step: 0.01,
      instructions: t("sg_format_decimal_2"),
    },
    price_per_carat_pf: {
      key: "price_per_carat_pf",
      label: t("sg_price_per_carat_pf"),
      icon: "diagram2",
      type: "number",
      input_type: "number",
      input_step: 0.01,
      instructions: t("sg_format_decimal_2"),
      pricing_total_key: "pf_invoiced_price",
    },
    price_per_carat_all: {
      key: "price_per_carat_all",
      label: t("sg_price_per_carat_all"),
      icon: "arrow-up",
      type: "number",
      input_type: "number",
      input_step: 0.01,
      instructions: t("sg_format_decimal_2"),
    },
    dimensions_lwh: {
      key: "dimensions_lwh",
      label: t("sg_dimensions_lwh"),
      icon: "aspect-ratio",
      type: "dimensions_merged",
      dimension_field_keys: ["length_mm", "width_mm", "height_mm"],
    },
  };
}
