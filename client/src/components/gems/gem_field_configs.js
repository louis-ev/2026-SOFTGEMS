import {
  color_suggestions,
  country_of_cut_suggestions,
  origin_country_suggestions,
  shape_suggestions,
  stone_type_suggestions,
  treatment_type_suggestions,
} from "@/suggestions/softgems";
import {
  GEM_STATUS_MANUAL_SLUGS,
  gemStatusLabel,
} from "@/utils/gem_status.js";

const sortSuggestions = (suggestions) =>
  [...suggestions].sort((a, b) => a.localeCompare(b));

const sorted_color_suggestions = sortSuggestions(color_suggestions);
const sorted_origin_country_suggestions = sortSuggestions(
  origin_country_suggestions
);
const sorted_country_of_cut_suggestions = sortSuggestions(
  country_of_cut_suggestions
);
const sorted_shape_suggestions = sortSuggestions(shape_suggestions);
const sorted_stone_type_suggestions = sortSuggestions(stone_type_suggestions);
const sorted_treatment_type_suggestions = sortSuggestions(
  treatment_type_suggestions
);

/**
 * Returns the full field config map for all gem fields.
 * @param {Function} t - Vue $t translation function
 */
export function buildGemFieldConfigs(t) {
  const status_options = GEM_STATUS_MANUAL_SLUGS.map((value) => ({
    value,
    label: gemStatusLabel(t, value),
  }));

  return {
    status: {
      key: "status",
      label: t("sg_status"),
      icon: null,
      type: "select",
      options: status_options,
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
    numero_de_mise_a_consommation: {
      key: "numero_de_mise_a_consommation",
      label: t("sg_numero_de_mise_a_consommation"),
      icon: "receipt",
      type: "text",
    },
    paired_gem: {
      key: "paired_gem",
      label: t("sg_paired_gem"),
      icon: "link",
      type: "paired_gem_picker",
      modal_size: "x-large",
      modal_nopadding: true,
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
    country_of_cut: {
      key: "country_of_cut",
      label: t("sg_country_of_cut"),
      icon: "scissors",
      type: "select",
      options: sorted_country_of_cut_suggestions,
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
    import_price: {
      key: "import_price",
      label: t("sg_import_price"),
      icon: "globe",
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
    price_per_carat_import: {
      key: "price_per_carat_import",
      label: t("sg_price_per_carat_import"),
      icon: "diagram2",
      type: "number",
      input_type: "number",
      input_step: 0.01,
      instructions: t("sg_format_decimal_2"),
      pricing_total_key: "import_price",
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
      input_type: "number",
      input_step: 0.01,
      instructions: t("sg_format_decimal_2"),
    },
    price_per_carat_pvd: {
      key: "price_per_carat_pvd",
      label: t("sg_price_per_carat_pvd"),
      icon: "diagram2",
      type: "number",
      input_type: "number",
      input_step: 0.01,
      instructions: t("sg_format_decimal_2"),
      pricing_total_key: "pvd_asking_price",
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
    dimensions_lwh: {
      key: "dimensions_lwh",
      label: t("sg_dimensions_lwh"),
      icon: "aspect-ratio",
      type: "dimensions_merged",
      dimension_field_keys: ["length_mm", "width_mm", "height_mm"],
    },
  };
}
