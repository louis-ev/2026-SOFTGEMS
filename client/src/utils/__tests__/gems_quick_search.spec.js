import { describe, it, expect } from "vitest";
import {
  parseGemsQuickSearchInput,
  gemMatchesQuickSearch,
  serializeFieldFilter,
  upsertFieldFilterInSearch,
  removeFieldFilterFromSearch,
  removeLegacyFilterFromSearch,
  isGemsColumnFilterableKey,
  collectAvailableEnumFilterValues,
  hasAvailableEmptyNumberField,
} from "@/utils/gems_quick_search.js";

describe("gems_quick_search field filters", () => {
  it("recognizes filterable column keys", () => {
    expect(isGemsColumnFilterableKey("color")).toBe(true);
    expect(isGemsColumnFilterableKey("weight_ct")).toBe(true);
    expect(isGemsColumnFilterableKey("pv_selling_price")).toBe(true);
    expect(isGemsColumnFilterableKey("id")).toBe(true);
    expect(isGemsColumnFilterableKey("status")).toBe(true);
    expect(isGemsColumnFilterableKey("reference_supplier")).toBe(true);
    expect(isGemsColumnFilterableKey("reference_customer")).toBe(true);
    expect(
      isGemsColumnFilterableKey("numero_de_mise_a_consommation"),
    ).toBe(true);
    expect(isGemsColumnFilterableKey("country_of_cut")).toBe(true);
    expect(isGemsColumnFilterableKey("treatment_type")).toBe(true);
    expect(isGemsColumnFilterableKey("$date_modified")).toBe(true);
    expect(isGemsColumnFilterableKey("paired_gem")).toBe(true);
    expect(isGemsColumnFilterableKey("selection_nums_box")).toBe(true);
    expect(isGemsColumnFilterableKey("selection_nums_memo_in")).toBe(true);
  });

  it("parses and matches paired_gem number filters", () => {
    const parsed = parseGemsQuickSearchInput("paired=9");
    expect(parsed.field_filters.paired_gem).toEqual({
      mode: "number",
      exact: 9,
    });
    expect(
      gemMatchesQuickSearch(
        { $path: "gems/3", paired_gem: "9" },
        parsed,
      ),
    ).toBe(true);
    expect(
      gemMatchesQuickSearch(
        { $path: "gems/3", paired_gem: "10" },
        parsed,
      ),
    ).toBe(false);
    expect(
      gemMatchesQuickSearch({ $path: "gems/3", paired_gem: "" }, parsed),
    ).toBe(false);
  });

  it("parses and matches edited date range and coc / treatment enums", () => {
    const parsed = parseGemsQuickSearchInput(
      "edited=2026-03-01..2026-03-31 coc=Thailand treatment=Natural",
    );
    expect(parsed.field_filters.$date_modified).toEqual({
      mode: "date",
      min: "2026-03-01",
      max: "2026-03-31",
    });
    expect(parsed.field_filters.country_of_cut.values).toEqual(["Thailand"]);
    expect(parsed.field_filters.treatment_type.values).toEqual(["Natural"]);

    expect(
      gemMatchesQuickSearch(
        {
          $path: "gems/1",
          $date_modified: "2026-03-15T12:00:00.000Z",
          country_of_cut: "Thailand",
          treatment_type: "Natural",
        },
        parsed,
      ),
    ).toBe(true);
    expect(
      gemMatchesQuickSearch(
        {
          $path: "gems/2",
          $date_modified: "2026-04-01T12:00:00.000Z",
          country_of_cut: "Thailand",
          treatment_type: "Natural",
        },
        parsed,
      ),
    ).toBe(false);
  });

  it("parses and matches id / ref supplier field filters", () => {
    const parsed = parseGemsQuickSearchInput(
      'id=12-20 ref_supplier=ABC status=reference',
    );
    expect(parsed.field_filters.id).toEqual({
      mode: "number",
      min: 12,
      max: 20,
    });
    expect(parsed.field_filters.reference_supplier).toEqual({
      mode: "enum",
      values: ["ABC"],
    });
    expect(parsed.field_filters.status).toEqual({
      mode: "enum",
      values: ["reference"],
    });
    expect(parsed.id_needle).toBe("");

    expect(
      gemMatchesQuickSearch(
        {
          $path: "gems/15",
          reference_supplier: "ABC",
          status: "reference",
        },
        parsed,
      ),
    ).toBe(true);
    expect(
      gemMatchesQuickSearch(
        {
          $path: "gems/5",
          reference_supplier: "ABC",
          status: "reference",
        },
        parsed,
      ),
    ).toBe(false);
  });

  it("parses enum filters with quoted multi-word values", () => {
    const parsed = parseGemsQuickSearchInput(
      'color=Blue,"Violet Blue" shape=Oval',
    );
    expect(parsed.field_filters.color).toEqual({
      mode: "enum",
      values: ["Blue", "Violet Blue"],
    });
    expect(parsed.field_filters.shape).toEqual({
      mode: "enum",
      values: ["Oval"],
    });
  });

  it("matches enum empty sentinel for missing field values", () => {
    const parsed = parseGemsQuickSearchInput("shape=__empty__");
    expect(parsed.field_filters.shape).toEqual({
      mode: "enum",
      values: ["__empty__"],
    });
    expect(
      gemMatchesQuickSearch({ $path: "gems/1", shape: "" }, parsed),
    ).toBe(true);
    expect(
      gemMatchesQuickSearch({ $path: "gems/2", shape: "   " }, parsed),
    ).toBe(true);
    expect(
      gemMatchesQuickSearch({ $path: "gems/3" }, parsed),
    ).toBe(true);
    expect(
      gemMatchesQuickSearch({ $path: "gems/4", shape: "Oval" }, parsed),
    ).toBe(false);

    const mixed = parseGemsQuickSearchInput("shape=__empty__,Oval");
    expect(
      gemMatchesQuickSearch({ $path: "gems/5", shape: "" }, mixed),
    ).toBe(true);
    expect(
      gemMatchesQuickSearch({ $path: "gems/6", shape: "Oval" }, mixed),
    ).toBe(true);
    expect(
      gemMatchesQuickSearch({ $path: "gems/7", shape: "Round" }, mixed),
    ).toBe(false);

    expect(
      serializeFieldFilter("shape", {
        mode: "enum",
        values: ["__empty__"],
      }),
    ).toBe("shape=__empty__");
  });

  it("matches number empty sentinel for missing numeric values", () => {
    const parsed = parseGemsQuickSearchInput("weight=__empty__");
    expect(parsed.field_filters.weight_ct).toEqual({
      mode: "number",
      empty: true,
    });
    expect(
      gemMatchesQuickSearch({ $path: "gems/1", weight_ct: "" }, parsed),
    ).toBe(true);
    expect(gemMatchesQuickSearch({ $path: "gems/2" }, parsed)).toBe(true);
    expect(
      gemMatchesQuickSearch({ $path: "gems/3", weight_ct: 1.2 }, parsed),
    ).toBe(false);

    const mixed = parseGemsQuickSearchInput("weight=__empty__,2");
    expect(mixed.field_filters.weight_ct).toEqual({
      mode: "number",
      empty: true,
      exact: 2,
    });
    expect(
      gemMatchesQuickSearch({ $path: "gems/4", weight_ct: "" }, mixed),
    ).toBe(true);
    expect(
      gemMatchesQuickSearch({ $path: "gems/5", weight_ct: 2 }, mixed),
    ).toBe(true);
    expect(
      gemMatchesQuickSearch({ $path: "gems/6", weight_ct: 3 }, mixed),
    ).toBe(false);

    expect(
      serializeFieldFilter("weight_ct", { mode: "number", empty: true }),
    ).toBe("weight=__empty__");
    expect(
      serializeFieldFilter("weight_ct", {
        mode: "number",
        empty: true,
        exact: 2,
      }),
    ).toBe("weight=__empty__,2");
  });

  it("filters selection-nums columns by document number exact/range/empty", () => {
    const gem_in_box_3 = {
      $path: "gems/1",
      box_selection_path: "box/3",
      selection_membership_paths: {
        "memo-in/2": "2024-01-01T00:00:00.000Z",
        "memo-in/10": "2024-02-01T00:00:00.000Z",
        "sale-invoice/7": "2024-03-01T00:00:00.000Z",
      },
    };
    const gem_no_box = {
      $path: "gems/2",
      box_selection_path: "",
      selection_membership_paths: {},
    };

    const exact = parseGemsQuickSearchInput("sel_box=3");
    expect(exact.field_filters.selection_nums_box).toEqual({
      mode: "number",
      exact: 3,
    });
    expect(gemMatchesQuickSearch(gem_in_box_3, exact)).toBe(true);
    expect(gemMatchesQuickSearch(gem_no_box, exact)).toBe(false);

    // UI apply path: metadata key ? short alias token ? parse ? match
    const from_ui = upsertFieldFilterInSearch("", "selection_nums_box", {
      mode: "number",
      exact: 3,
    });
    expect(from_ui).toBe("sel_box=3");
    expect(
      gemMatchesQuickSearch(gem_in_box_3, parseGemsQuickSearchInput(from_ui)),
    ).toBe(true);

    const range = parseGemsQuickSearchInput("sel_memo_in=2-5");
    expect(range.field_filters.selection_nums_memo_in).toEqual({
      mode: "number",
      min: 2,
      max: 5,
    });
    expect(gemMatchesQuickSearch(gem_in_box_3, range)).toBe(true);
    // Multi-membership: 10 is also present; exact on 10 must still match.
    expect(
      gemMatchesQuickSearch(
        gem_in_box_3,
        parseGemsQuickSearchInput("sel_memo_in=10"),
      ),
    ).toBe(true);
    expect(
      gemMatchesQuickSearch(
        gem_in_box_3,
        parseGemsQuickSearchInput("sel_memo_in=8-12"),
      ),
    ).toBe(true);
    expect(
      gemMatchesQuickSearch(
        {
          $path: "gems/3",
          selection_membership_paths: {
            "memo-in/9": "2024-01-01T00:00:00.000Z",
          },
        },
        range,
      ),
    ).toBe(false);

    const empty = parseGemsQuickSearchInput("sel_box=__empty__");
    expect(gemMatchesQuickSearch(gem_no_box, empty)).toBe(true);
    expect(gemMatchesQuickSearch(gem_in_box_3, empty)).toBe(false);
    expect(
      hasAvailableEmptyNumberField(
        [gem_in_box_3, gem_no_box],
        parseGemsQuickSearchInput(""),
        "selection_nums_box",
      ),
    ).toBe(true);
    expect(
      hasAvailableEmptyNumberField(
        [gem_in_box_3],
        parseGemsQuickSearchInput(""),
        "selection_nums_box",
      ),
    ).toBe(false);

    const or_empty = parseGemsQuickSearchInput("sel_box=__empty__,3");
    expect(gemMatchesQuickSearch(gem_no_box, or_empty)).toBe(true);
    expect(gemMatchesQuickSearch(gem_in_box_3, or_empty)).toBe(true);
    expect(
      gemMatchesQuickSearch(
        { $path: "gems/9", box_selection_path: "box/9" },
        or_empty,
      ),
    ).toBe(false);

    expect(
      gemMatchesQuickSearch(
        gem_in_box_3,
        parseGemsQuickSearchInput("sel_sale_invoice=7"),
      ),
    ).toBe(true);
    expect(
      gemMatchesQuickSearch(
        gem_in_box_3,
        parseGemsQuickSearchInput("selection_nums_box=3"),
      ),
    ).toBe(true);

    expect(
      serializeFieldFilter("selection_nums_box", {
        mode: "number",
        exact: 3,
      }),
    ).toBe("sel_box=3");
  });

  it("parses exact and range number filters via aliases", () => {
    const exact = parseGemsQuickSearchInput("weight=2 pieces=3");
    expect(exact.field_filters.weight_ct).toEqual({
      mode: "number",
      exact: 2,
    });
    expect(exact.field_filters.number_of_pieces).toEqual({
      mode: "number",
      exact: 3,
    });

    const range = parseGemsQuickSearchInput("weight=1-3 l=5-7 w=3");
    expect(range.field_filters.weight_ct).toEqual({
      mode: "number",
      min: 1,
      max: 3,
    });
    expect(range.field_filters.length_mm).toEqual({
      mode: "number",
      min: 5,
      max: 7,
    });
    expect(range.field_filters.width_mm).toEqual({
      mode: "number",
      exact: 3,
    });
  });

  it("keeps legacy ID / stone / weight on remainder tokens", () => {
    const parsed = parseGemsQuickSearchInput("42 sap color=Blue");
    expect(parsed.id_needle).toBe("42");
    expect(parsed.stone_families).toContain("sapphire");
    expect(parsed.field_filters.color.values).toEqual(["Blue"]);
  });

  it("structured weight= replaces legacy weight_spec", () => {
    const parsed = parseGemsQuickSearchInput("weight=2 =3");
    expect(parsed.field_filters.weight_ct.exact).toBe(2);
    expect(parsed.weight_spec).toBe(null);
  });

  it("serializes and upserts filters into the search string", () => {
    expect(
      serializeFieldFilter("color", {
        mode: "enum",
        values: ["Blue", "Violet Blue"],
      }),
    ).toBe('color=Blue,"Violet Blue"');

    expect(
      serializeFieldFilter("weight_ct", { mode: "number", min: 1, max: 3 }),
    ).toBe("weight=1-3");

    const next = upsertFieldFilterInSearch("sap", "color", {
      mode: "enum",
      values: ["Blue"],
    });
    expect(next).toBe("sap color=Blue");

    const replaced = upsertFieldFilterInSearch(next, "color", {
      mode: "enum",
      values: ["Red"],
    });
    expect(replaced).toBe("sap color=Red");

    expect(removeFieldFilterFromSearch(replaced, "color")).toBe("sap");
  });

  it("ANDs fields and ORs enum values when matching", () => {
    const parsed = parseGemsQuickSearchInput("color=Blue,Red shape=Oval");
    const blue_oval = {
      $path: "gems/1",
      color: "Blue",
      shape: "Oval",
      weight_ct: 2,
    };
    const red_round = {
      $path: "gems/2",
      color: "Red",
      shape: "Round",
      weight_ct: 2,
    };
    const green_oval = {
      $path: "gems/3",
      color: "Green",
      shape: "Oval",
      weight_ct: 2,
    };
    expect(gemMatchesQuickSearch(blue_oval, parsed)).toBe(true);
    expect(gemMatchesQuickSearch(red_round, parsed)).toBe(false);
    expect(gemMatchesQuickSearch(green_oval, parsed)).toBe(false);

    const color_only = parseGemsQuickSearchInput("color=Blue,Red");
    expect(gemMatchesQuickSearch(red_round, color_only)).toBe(true);
  });

  it("ANDs per-axis dimension filters", () => {
    const parsed = parseGemsQuickSearchInput("l=5-7 w=3");
    expect(
      gemMatchesQuickSearch(
        { $path: "gems/1", length_mm: 6, width_mm: 3, height_mm: 1 },
        parsed,
      ),
    ).toBe(true);
    expect(
      gemMatchesQuickSearch(
        { $path: "gems/2", length_mm: 6, width_mm: 2, height_mm: 1 },
        parsed,
      ),
    ).toBe(false);
    expect(
      gemMatchesQuickSearch(
        { $path: "gems/3", length_mm: 2, width_mm: 3, height_mm: 1 },
        parsed,
      ),
    ).toBe(false);
  });

  it("removes legacy id chip from search while keeping field filters", () => {
    const next = removeLegacyFilterFromSearch("42 color=Blue", "id");
    expect(next).toBe("color=Blue");
  });

  it("collects enum values available under other active filters", () => {
    const gems = [
      { $path: "gems/1", color: "Blue", shape: "Oval" },
      { $path: "gems/2", color: "Red", shape: "Round" },
      { $path: "gems/3", color: "Blue", shape: "Round" },
      { $path: "gems/4", color: "Blue", shape: "" },
    ];
    const parsed = parseGemsQuickSearchInput("color=Blue");
    const shapes = collectAvailableEnumFilterValues(gems, parsed, "shape");
    expect(shapes.has("oval")).toBe(true);
    expect(shapes.has("round")).toBe(true);
    expect(shapes.has("__empty__")).toBe(true);
    // Red is excluded by color=Blue, so only Blue gems' shapes count ? both present.
    const colors = collectAvailableEnumFilterValues(gems, parsed, "color");
    // Excepting color, all colors in inventory remain available for faceting.
    expect(colors.has("blue")).toBe(true);
    expect(colors.has("red")).toBe(true);

    const shape_filtered = parseGemsQuickSearchInput("shape=Oval");
    const colors_under_oval = collectAvailableEnumFilterValues(
      gems,
      shape_filtered,
      "color",
    );
    expect(colors_under_oval.has("blue")).toBe(true);
    expect(colors_under_oval.has("red")).toBe(false);
  });

  it("detects available empty number fields under other filters", () => {
    const gems = [
      { $path: "gems/1", color: "Blue", weight_ct: 1.2 },
      { $path: "gems/2", color: "Blue", weight_ct: "" },
      { $path: "gems/3", color: "Red", weight_ct: "" },
    ];
    const blue = parseGemsQuickSearchInput("color=Blue");
    expect(hasAvailableEmptyNumberField(gems, blue, "weight_ct")).toBe(true);

    const red = parseGemsQuickSearchInput("color=Red");
    expect(hasAvailableEmptyNumberField(gems, red, "weight_ct")).toBe(true);

    const filled_only = [
      { $path: "gems/1", color: "Blue", weight_ct: 1.2 },
      { $path: "gems/2", color: "Blue", weight_ct: 2 },
    ];
    expect(
      hasAvailableEmptyNumberField(filled_only, blue, "weight_ct"),
    ).toBe(false);
  });
});
