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
    expect(isGemsColumnFilterableKey("country_of_cut")).toBe(true);
    expect(isGemsColumnFilterableKey("treatment_type")).toBe(true);
    expect(isGemsColumnFilterableKey("$date_modified")).toBe(true);
    expect(isGemsColumnFilterableKey("paired_gem")).toBe(false);
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

    const range = parseGemsQuickSearchInput("weight=1-3 dimensions=5-7");
    expect(range.field_filters.weight_ct).toEqual({
      mode: "number",
      min: 1,
      max: 3,
    });
    expect(range.field_filters.dimensions_lwh).toEqual({
      mode: "number",
      min: 5,
      max: 7,
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

  it("matches dimensions on any axis", () => {
    const parsed = parseGemsQuickSearchInput("dimensions=5-7");
    expect(
      gemMatchesQuickSearch(
        { $path: "gems/1", length_mm: 6, width_mm: 2, height_mm: 1 },
        parsed,
      ),
    ).toBe(true);
    expect(
      gemMatchesQuickSearch(
        { $path: "gems/2", length_mm: 2, width_mm: 2, height_mm: 1 },
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
    ];
    const parsed = parseGemsQuickSearchInput("color=Blue");
    const shapes = collectAvailableEnumFilterValues(gems, parsed, "shape");
    expect(shapes.has("oval")).toBe(true);
    expect(shapes.has("round")).toBe(true);
    // Red is excluded by color=Blue, so only Blue gems' shapes count ù both present.
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
});
