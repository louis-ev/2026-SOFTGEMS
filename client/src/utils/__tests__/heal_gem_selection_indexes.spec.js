import { describe, expect, it, vi } from "vitest";
import {
  gemIndexHealPatch,
  gemsNeedingIndexHeal,
  healGemIndexesForSelection,
  selectionFolderIsBox,
} from "@/utils/heal_gem_selection_indexes.js";

describe("gemIndexHealPatch", () => {
  it("adds missing membership path", () => {
    const patch = gemIndexHealPatch({
      gem: { selection_membership_paths: {} },
      selection_path: "memo-in/3",
      is_box: false,
      added_at_iso: "2026-01-01T00:00:00.000Z",
    });
    expect(patch.needs_heal).toBe(true);
    expect(patch.box_conflict).toBe(false);
    expect(patch.new_meta).toEqual({
      selection_membership_paths: {
        "memo-in/3": "2026-01-01T00:00:00.000Z",
      },
    });
  });

  it("is a no-op when membership path already present", () => {
    const patch = gemIndexHealPatch({
      gem: {
        selection_membership_paths: {
          "memo-in/3": "2026-01-01T00:00:00.000Z",
        },
      },
      selection_path: "memo-in/3",
      is_box: false,
    });
    expect(patch.needs_heal).toBe(false);
    expect(patch.new_meta).toBeNull();
  });

  it("sets empty box_selection_path for box selections", () => {
    const patch = gemIndexHealPatch({
      gem: {
        box_selection_path: "",
        selection_membership_paths: {
          "box/1": "2026-01-01T00:00:00.000Z",
        },
      },
      selection_path: "box/1",
      is_box: true,
    });
    expect(patch.needs_heal).toBe(true);
    expect(patch.box_conflict).toBe(false);
    expect(patch.new_meta).toEqual({ box_selection_path: "box/1" });
  });

  it("does not overwrite a conflicting box_selection_path", () => {
    const patch = gemIndexHealPatch({
      gem: {
        box_selection_path: "box/9",
        selection_membership_paths: {},
      },
      selection_path: "box/1",
      is_box: true,
      added_at_iso: "2026-02-01T00:00:00.000Z",
    });
    expect(patch.box_conflict).toBe(true);
    expect(patch.new_meta).toEqual({
      selection_membership_paths: {
        "box/1": "2026-02-01T00:00:00.000Z",
      },
    });
    expect(patch.new_meta.box_selection_path).toBeUndefined();
  });
});

describe("selectionFolderIsBox", () => {
  it("detects box from path", () => {
    expect(selectionFolderIsBox({ $path: "box/2" })).toBe(true);
    expect(selectionFolderIsBox({ $path: "memo-in/2" })).toBe(false);
  });
});

describe("gemsNeedingIndexHeal", () => {
  it("lists gems that need healing", () => {
    const needing = gemsNeedingIndexHeal({
      selection_path: "memo-in/2",
      selection_folder: { $path: "memo-in/2" },
      gems: [
        {
          $path: "gems/1",
          selection_membership_paths: {
            "memo-in/2": "2026-01-01T00:00:00.000Z",
          },
        },
        { $path: "gems/2", selection_membership_paths: {} },
      ],
    });
    expect(needing.map((g) => g.$path)).toEqual(["gems/2"]);
  });
});

describe("healGemIndexesForSelection", () => {
  it("updates only gems that need healing", async () => {
    const updateMeta = vi.fn().mockResolvedValue(undefined);
    const api = { updateMeta };

    const gems = [
      {
        $path: "gems/1",
        selection_membership_paths: {
          "memo-in/2": "2026-01-01T00:00:00.000Z",
        },
      },
      {
        $path: "gems/2",
        selection_membership_paths: {},
      },
    ];

    const result = await healGemIndexesForSelection({
      api,
      selection_path: "memo-in/2",
      selection_folder: {
        $path: "memo-in/2",
        selection_entries: ["gems/1", "gems/2"],
        selection_date: "2026-03-01",
      },
      gems,
    });

    expect(result.healed).toEqual(["gems/2"]);
    expect(result.skipped).toEqual(["gems/1"]);
    expect(updateMeta).toHaveBeenCalledTimes(1);
    expect(updateMeta).toHaveBeenCalledWith({
      path: "gems/2",
      new_meta: {
        selection_membership_paths: {
          "memo-in/2": "2026-03-01",
        },
      },
    });
    expect(gems[1].selection_membership_paths["memo-in/2"]).toBe("2026-03-01");
  });

  it("records box conflicts without overwriting box_selection_path", async () => {
    const updateMeta = vi.fn().mockResolvedValue(undefined);
    const api = { updateMeta };

    const result = await healGemIndexesForSelection({
      api,
      selection_path: "box/1",
      selection_folder: {
        $path: "box/1",
        selection_entries: ["gems/3"],
      },
      gems: [
        {
          $path: "gems/3",
          box_selection_path: "box/9",
          selection_membership_paths: {},
        },
      ],
    });

    expect(result.box_conflicts).toEqual(["gems/3"]);
    expect(result.healed).toEqual(["gems/3"]);
    expect(updateMeta.mock.calls[0][0].new_meta.box_selection_path).toBeUndefined();
  });
});
