import { describe, expect, it } from "vitest";
import {
  buildGemSelectionMembershipRows,
  compareMembershipRowsByGemAddedAt,
  filterMembershipRowsByType,
  membershipTypeFilterOptions,
} from "@/utils/gem_selection_membership_rows.js";

describe("compareMembershipRowsByGemAddedAt", () => {
  it("sorts newest added_at first", () => {
    const rows = [
      { $path: "selections/1", added_at: "2026-01-01T00:00:00.000Z" },
      { $path: "selections/2", added_at: "2026-06-01T00:00:00.000Z" },
    ];
    expect([...rows].sort(compareMembershipRowsByGemAddedAt)[0].$path).toBe(
      "selections/2"
    );
  });
});

describe("buildGemSelectionMembershipRows", () => {
  it("attaches added_at from selection_membership_paths and sorts by it", () => {
    const rows = buildGemSelectionMembershipRows({
      gem_path: "gems/1",
      gem: {
        selection_membership_paths: {
          "selections/10": "2026-05-01T00:00:00.000Z",
          "selections/20": "2026-06-01T00:00:00.000Z",
        },
      },
      selection_folders: [
        {
          $path: "selections/10",
          selection_type: "memo in",
          selection_entries: ["gems/1"],
        },
        {
          $path: "selections/20",
          selection_type: "importation",
          selection_entries: ["gems/1"],
        },
      ],
    });
    expect(rows.map((r) => r.$path)).toEqual([
      "selections/20",
      "selections/10",
    ]);
    expect(rows[0].added_at).toBe("2026-06-01T00:00:00.000Z");
  });
});

describe("filterMembershipRowsByType", () => {
  it("filters by selection_type value", () => {
    const rows = [
      { selection_type: "memo in" },
      { selection_type: "importation" },
    ];
    expect(filterMembershipRowsByType(rows, "memo in")).toHaveLength(1);
    expect(filterMembershipRowsByType(rows, "")).toHaveLength(2);
  });
});

describe("membershipTypeFilterOptions", () => {
  it("returns registry defs only for types present on rows", () => {
    const options = membershipTypeFilterOptions([
      { selection_type: "importation" },
      { selection_type: "memo in" },
    ]);
    expect(options.map((o) => o.value)).toEqual(["memo in", "importation"]);
  });
});
