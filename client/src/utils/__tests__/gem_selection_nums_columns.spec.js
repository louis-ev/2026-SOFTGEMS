import { describe, expect, it } from "vitest";
import {
  formatGemSelectionNumsColumnValue,
  gems_table_selection_nums_box_column_key,
  gems_table_selection_nums_column_keys,
  gems_table_selection_nums_opt_in_column_keys,
  isGemsTableDefaultOffColumnKey,
  listGemSelectionDocumentNumbersForType,
  selectionNumsColumnKeyFromSlug,
  selectionTypeSlugFromNumsColumnKey,
} from "@/utils/gem_selection_nums_columns.js";

describe("gem_selection_nums_columns", () => {
  it("maps type slugs to virtual column keys and back", () => {
    expect(selectionNumsColumnKeyFromSlug("memo-in")).toBe(
      "selection_nums_memo_in"
    );
    expect(selectionTypeSlugFromNumsColumnKey("selection_nums_memo_in")).toBe(
      "memo-in"
    );
    expect(
      selectionTypeSlugFromNumsColumnKey("selection_nums_importation_return")
    ).toBe("importation-return");
    expect(gems_table_selection_nums_box_column_key).toBe("selection_nums_box");
  });

  it("keeps all selection-number columns opt-in in registry order", () => {
    expect(gems_table_selection_nums_column_keys[0]).toBe(
      "selection_nums_simple"
    );
    expect(gems_table_selection_nums_column_keys[1]).toBe("selection_nums_box");
    expect(gems_table_selection_nums_opt_in_column_keys).toEqual(
      gems_table_selection_nums_column_keys
    );
    expect(isGemsTableDefaultOffColumnKey("selection_nums_box")).toBe(true);
    expect(isGemsTableDefaultOffColumnKey("selection_nums_memo_in")).toBe(true);
  });

  it("lists document numbers from membership index + box path", () => {
    const gem = {
      box_selection_path: "box/3",
      selection_membership_paths: {
        "memo-in/2": "2024-01-01T00:00:00.000Z",
        "memo-in/10": "2024-02-01T00:00:00.000Z",
        "sale-invoice/5": "2024-03-01T00:00:00.000Z",
        "box/3": "2024-01-15T00:00:00.000Z",
      },
    };

    expect(listGemSelectionDocumentNumbersForType(gem, "box")).toEqual(["3"]);
    expect(listGemSelectionDocumentNumbersForType(gem, "memo-in")).toEqual([
      "2",
      "10",
    ]);
    expect(
      formatGemSelectionNumsColumnValue(gem, "selection_nums_memo_in")
    ).toBe("2, 10");
    expect(formatGemSelectionNumsColumnValue(gem, "selection_nums_box")).toBe(
      "3"
    );
    expect(
      formatGemSelectionNumsColumnValue(gem, "selection_nums_credit_note")
    ).toBe("");
  });

  it("includes box_selection_path even when membership map omits it", () => {
    const gem = {
      box_selection_path: "box/9",
      selection_membership_paths: {},
    };
    expect(listGemSelectionDocumentNumbersForType(gem, "box")).toEqual(["9"]);
  });
});
