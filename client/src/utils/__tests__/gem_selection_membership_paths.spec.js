import { describe, expect, it, vi } from "vitest";
import {
  getGemMembershipAddedAt,
  isGemMemoOutOutstanding,
  listGemIndexedSelectionPaths,
  normalizeMembershipPathsMap,
  recordGemSelectionMembership,
  resolveOutstandingMemoOutPath,
  clearGemSelectionMembership,
} from "@/utils/gem_selection_membership_paths.js";

describe("normalizeMembershipPathsMap", () => {
  it("reads selection_membership_paths and legacy selection_gem_added_at", () => {
    const map = normalizeMembershipPathsMap(
      { "selections/2": "2026-06-02T00:00:00.000Z" },
      { "selections/1": "2026-05-01T00:00:00.000Z" }
    );
    expect(map["selections/1"]).toBe("2026-05-01T00:00:00.000Z");
    expect(map["selections/2"]).toBe("2026-06-02T00:00:00.000Z");
  });
});

describe("isGemMemoOutOutstanding", () => {
  it("is true when memo-out is newer than return-memo-out", () => {
    expect(
      isGemMemoOutOutstanding({
        selection_membership_paths: {
          "memo-out/1": "2026-06-02T00:00:00.000Z",
          "return-memo-out/1": "2026-05-01T00:00:00.000Z",
        },
      })
    ).toBe(true);
  });

  it("is true when only memo-out is present", () => {
    expect(
      isGemMemoOutOutstanding({
        selection_membership_paths: {
          "memo-out/3": "2026-04-01T00:00:00.000Z",
          "sale-invoice/1": "2026-07-01T00:00:00.000Z",
        },
      })
    ).toBe(true);
  });

  it("is false when return-memo-out is newer than memo-out", () => {
    expect(
      isGemMemoOutOutstanding({
        selection_membership_paths: {
          "memo-out/1": "2026-05-01T00:00:00.000Z",
          "return-memo-out/2": "2026-06-01T00:00:00.000Z",
        },
      })
    ).toBe(false);
  });

  it("is false when neither memo-out nor return-memo-out is present", () => {
    expect(
      isGemMemoOutOutstanding({
        selection_membership_paths: {
          "memo-in/1": "2026-06-01T00:00:00.000Z",
        },
      })
    ).toBe(false);
  });
});

describe("resolveOutstandingMemoOutPath", () => {
  it("returns the newest outstanding memo-out path", () => {
    expect(
      resolveOutstandingMemoOutPath({
        selection_membership_paths: {
          "memo-out/7": "2026-06-02T00:00:00.000Z",
          "return-memo-out/1": "2026-05-01T00:00:00.000Z",
          "sale-invoice/1": "2026-07-01T00:00:00.000Z",
        },
      })
    ).toBe("memo-out/7");
  });

  it("returns empty when return-memo-out is newer", () => {
    expect(
      resolveOutstandingMemoOutPath({
        selection_membership_paths: {
          "memo-out/1": "2026-05-01T00:00:00.000Z",
          "return-memo-out/2": "2026-06-01T00:00:00.000Z",
        },
      })
    ).toBe("");
  });
});

describe("getGemMembershipAddedAt", () => {
  it("returns ISO for a known selection path", () => {
    expect(
      getGemMembershipAddedAt(
        {
          selection_membership_paths: {
            "selections/5": "2026-01-15T12:00:00.000Z",
          },
        },
        "selections/5"
      )
    ).toBe("2026-01-15T12:00:00.000Z");
  });
});

describe("listGemIndexedSelectionPaths", () => {
  it("unions membership map keys with box_selection_path", () => {
    expect(
      listGemIndexedSelectionPaths({
        box_selection_path: "box/2",
        selection_membership_paths: {
          "memo-in/3": "2026-01-01T00:00:00.000Z",
          "box/2": "2026-02-01T00:00:00.000Z",
        },
      }).sort()
    ).toEqual(["box/2", "memo-in/3"]);
  });

  it("includes box_selection_path even when membership map is empty", () => {
    expect(
      listGemIndexedSelectionPaths({
        box_selection_path: "box/9",
        selection_membership_paths: {},
      })
    ).toEqual(["box/9"]);
  });
});

describe("recordGemSelectionMembership", () => {
  it("writes a new path without overwriting an existing timestamp", async () => {
    const updateMeta = vi.fn();
    const api = {
      getFolder: vi.fn().mockResolvedValue({
        selection_membership_paths: {
          "selections/1": "2026-01-01T00:00:00.000Z",
        },
      }),
      updateMeta,
    };

    await recordGemSelectionMembership({
      api,
      gem_path: "gems/1",
      selection_path: "selections/1",
    });
    expect(updateMeta).not.toHaveBeenCalled();

    await recordGemSelectionMembership({
      api,
      gem_path: "gems/1",
      selection_path: "selections/2",
    });
    expect(updateMeta).toHaveBeenCalledWith({
      path: "gems/1",
      new_meta: {
        selection_membership_paths: {
          "selections/1": "2026-01-01T00:00:00.000Z",
          "selections/2": expect.any(String),
        },
      },
    });
  });
});

describe("clearGemSelectionMembership", () => {
  it("removes the selection path from the map", async () => {
    const updateMeta = vi.fn();
    const api = {
      getFolder: vi.fn().mockResolvedValue({
        selection_membership_paths: {
          "selections/1": "2026-01-01T00:00:00.000Z",
          "selections/2": "2026-06-01T00:00:00.000Z",
        },
      }),
      updateMeta,
    };

    await clearGemSelectionMembership({
      api,
      gem_path: "gems/1",
      selection_path: "selections/1",
    });

    expect(updateMeta).toHaveBeenCalledWith({
      path: "gems/1",
      new_meta: {
        selection_membership_paths: {
          "selections/2": "2026-06-01T00:00:00.000Z",
        },
      },
    });
  });
});
