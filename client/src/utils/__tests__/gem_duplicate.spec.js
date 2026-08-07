import { describe, expect, it } from "vitest";
import {
  buildGemDuplicateNewMeta,
  listGemDuplicateMetaChanges,
} from "@/utils/gem_duplicate.js";
import { GEM_STATUS_REFERENCE } from "@/utils/gem_status.js";

const t = (key) => key;

describe("buildGemDuplicateNewMeta", () => {
  it("resets pairing, memberships, box, and status", () => {
    expect(buildGemDuplicateNewMeta()).toEqual({
      paired_gem: "",
      box_selection_path: "",
      selection_membership_paths: {},
      status: GEM_STATUS_REFERENCE,
    });
  });
});

describe("listGemDuplicateMetaChanges", () => {
  it("always lists the full reset policy", () => {
    const rows = listGemDuplicateMetaChanges(
      { $path: "gems/12", status: GEM_STATUS_REFERENCE },
      t
    );
    expect(rows.map((row) => row.key)).toEqual([
      "id",
      "status",
      "paired_gem",
      "box_selection_path",
      "selection_membership_paths",
      "history",
    ]);
    expect(rows[0].from_label).toBe("12");
    expect(rows[0].to_label).toBe("sg_duplicate_gem_new_id_value");
    expect(rows.find((row) => row.key === "paired_gem").from_label).toBe(
      "sg_duplicate_gem_empty_value"
    );
  });

  it("shows current values for status, pairing, box, and memberships", () => {
    const rows = listGemDuplicateMetaChanges(
      {
        $path: "gems/3",
        status: "sale-invoice",
        paired_gem: "9",
        box_selection_path: "box/2",
        selection_membership_paths: {
          "memo-in/1": "2026-01-01T00:00:00.000Z",
          "sale-invoice/4": "2026-02-01T00:00:00.000Z",
        },
      },
      t
    );
    expect(rows.find((row) => row.key === "paired_gem").from_label).toBe("9");
    expect(
      rows.find((row) => row.key === "selection_membership_paths").from_label
    ).toBe("memo-in/1, sale-invoice/4");
    expect(rows.find((row) => row.key === "status").to_label).toBe(
      "sg_status_value_reference"
    );
  });
});
