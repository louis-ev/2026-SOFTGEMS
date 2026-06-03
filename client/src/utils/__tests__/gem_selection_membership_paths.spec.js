import { describe, expect, it, vi } from "vitest";
import {
  getGemMembershipAddedAt,
  normalizeMembershipPathsMap,
  recordGemSelectionMembership,
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
