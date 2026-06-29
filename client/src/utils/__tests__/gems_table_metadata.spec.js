import { describe, expect, it } from "vitest";
import {
  buildGemsTableAllMetadataKeys,
  countGemsWithFilledTableColumnValue,
  gemHasFilledTableColumnValue,
  gems_table_catalog_column_keys,
} from "@/utils/gems_table_metadata.js";

describe("buildGemsTableAllMetadataKeys", () => {
  it("returns the full catalog even when gems is empty", () => {
    expect(buildGemsTableAllMetadataKeys([])).toEqual([
      ...gems_table_catalog_column_keys,
    ]);
  });

  it("returns the full catalog even when gems omit many fields", () => {
    const keys = buildGemsTableAllMetadataKeys([
      { $path: "gems/1", stone_type: "Ruby", weight_ct: 1.2 },
    ]);
    expect(keys).toContain("pf_invoiced_price");
    expect(keys).toContain("pc_to");
    expect(keys).toContain("dimensions_lwh");
  });

  it("merges extra keys discovered on loaded gems", () => {
    const keys = buildGemsTableAllMetadataKeys([
      { $path: "gems/1", description: "Note" },
    ]);
    expect(keys).toContain("description");
    expect(keys).toContain("stone_type");
  });
});

describe("gemHasFilledTableColumnValue", () => {
  it("detects filled and empty column values", () => {
    const gem = {
      $path: "gems/12",
      stone_type: "Ruby",
      pf_invoiced_price: "",
      length_mm: 5,
    };

    expect(gemHasFilledTableColumnValue(gem, "id")).toBe(true);
    expect(gemHasFilledTableColumnValue(gem, "stone_type")).toBe(true);
    expect(gemHasFilledTableColumnValue(gem, "pf_invoiced_price")).toBe(false);
    expect(gemHasFilledTableColumnValue(gem, "dimensions_lwh")).toBe(true);
    expect(countGemsWithFilledTableColumnValue([gem], "color")).toBe(0);
  });
});
