import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  assignGemToBox,
  clearOrphanedGemBoxRefs,
} from "@/utils/assign_gem_to_box.js";

function createApi({ folders }) {
  const store = { ...folders };
  return {
    store,
    getFolder: vi.fn(async ({ path }) => {
      if (!store[path]) {
        const err = { code: "not_found" };
        throw err;
      }
      return { ...store[path], $path: path };
    }),
    updateMeta: vi.fn(async ({ path, new_meta }) => {
      store[path] = { ...(store[path] || {}), ...new_meta, $path: path };
      return store[path];
    }),
  };
}

describe("assignGemToBox", () => {
  let api;

  beforeEach(() => {
    api = createApi({
      folders: {
        "gems/12": {
          box_selection_path: "box/2",
          selection_membership_paths: {
            "box/2": "2026-01-01T00:00:00.000Z",
          },
        },
        "box/4": {
          selection_type: "boîte",
          selection_entries: [],
        },
      },
    });
  });

  it("continues when the previous box folder is missing (orphaned pointer)", async () => {
    await assignGemToBox({
      api,
      gem_path: "gems/12",
      new_box_folder_path: "box/4",
    });

    expect(api.getFolder).toHaveBeenCalledWith({ path: "box/2" });
    expect(api.store["gems/12"].box_selection_path).toBe("box/4");
    expect(api.store["gems/12"].selection_membership_paths["box/2"]).toBeUndefined();
    expect(api.store["box/4"].selection_entries).toEqual(["gems/12"]);
  });

  it("removes the gem from the previous box when it still exists", async () => {
    api.store["box/2"] = {
      selection_type: "boîte",
      selection_entries: ["gems/12", "gems/99"],
    };

    await assignGemToBox({
      api,
      gem_path: "gems/12",
      new_box_folder_path: "box/4",
    });

    expect(api.store["box/2"].selection_entries).toEqual(["gems/99"]);
    expect(api.store["gems/12"].box_selection_path).toBe("box/4");
    expect(api.store["box/4"].selection_entries).toEqual(["gems/12"]);
  });
});

describe("clearOrphanedGemBoxRefs", () => {
  it("clears box_selection_path and membership for listed gems", async () => {
    const api = createApi({
      folders: {
        "gems/1": {
          box_selection_path: "box/2",
          selection_membership_paths: {
            "box/2": "2026-01-01T00:00:00.000Z",
            "memo-in/1": "2026-02-01T00:00:00.000Z",
          },
        },
        "gems/2": {
          box_selection_path: "box/9",
          selection_membership_paths: {
            "box/2": "2026-01-01T00:00:00.000Z",
          },
        },
      },
    });

    await clearOrphanedGemBoxRefs({
      api,
      box_path: "box/2",
      gem_paths: ["gems/1", "gems/2"],
    });

    expect(api.store["gems/1"].box_selection_path).toBe("");
    expect(api.store["gems/1"].selection_membership_paths).toEqual({
      "memo-in/1": "2026-02-01T00:00:00.000Z",
    });
    expect(api.store["gems/2"].box_selection_path).toBe("box/9");
    expect(api.store["gems/2"].selection_membership_paths).toEqual({});
  });
});
