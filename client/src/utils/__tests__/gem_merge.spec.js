import { describe, expect, it, vi } from "vitest";
import { GEM_STATUS_REFERENCE } from "@/utils/gem_status.js";
import {
  buildGemMergeParentMeta,
  canMergeGem,
  canShowMergeGem,
  computeGemMergePlan,
  listGemMergeLostFiles,
  listGemMergeLostMeta,
  listGemMergeParentChangeRows,
  listGemMergeSelectionPaths,
  runGemMerge,
} from "@/utils/gem_merge.js";

const t = (key) => key;

const parent = {
  $path: "gems/12",
  weight_ct: 40,
  number_of_pieces: 16,
  base_price_pcb: 8000,
  import_price: 9600,
  pv_selling_price: 12000,
  status: "buying-invoice",
  splits: [{ id: "45", date: "2026-05-01T00:00:00.000Z" }],
};

const child = {
  $path: "gems/45",
  parent_id: "12",
  weight_ct: 10,
  number_of_pieces: 4,
  base_price_pcb: 2000,
  import_price: 2400,
  pv_selling_price: 3000,
  status: "buying-invoice",
  stone_type: "Sapphire",
  color: "Blue",
  notes: "<p>Split parcel notes</p>",
  paired_gem: "9",
  splits: [],
  box_selection_path: "box/3",
  selection_membership_paths: {
    "memo-in/2": "2026-04-01T00:00:00.000Z",
    "box/3": "2026-04-01T00:00:00.000Z",
  },
  $cover: { $path: "gems/45/meta_cover.jpeg" },
  $files: [
    {
      $path: "gems/45/photo.jpg",
      $media_filename: "photo.jpg",
      is_gem_media: true,
    },
    {
      $path: "gems/45/cert.pdf",
      $media_filename: "cert.pdf",
      is_gem_certificate: true,
    },
  ],
};

describe("canShowMergeGem / canMergeGem", () => {
  it("shows merge when parent_id is set", () => {
    expect(canShowMergeGem(child)).toBe(true);
    expect(canShowMergeGem(parent)).toBe(false);
    expect(canShowMergeGem({})).toBe(false);
  });

  it("blocks merge when the child itself has splits", () => {
    expect(canMergeGem(child)).toBe(true);
    expect(
      canMergeGem({
        ...child,
        splits: [{ id: "90", date: "2026-06-01T00:00:00.000Z" }],
      })
    ).toBe(false);
  });
});

describe("computeGemMergePlan", () => {
  it("adds weight, pieces, and price totals", () => {
    const plan = computeGemMergePlan({ child, parent });
    expect(plan.ok).toBe(true);
    expect(plan.merged_weight).toBe(50);
    expect(plan.merged_pieces).toBe(20);
    expect(plan.prices.base_price_pcb).toBe(10000);
    expect(plan.prices.import_price).toBe(12000);
    expect(plan.prices.pv_selling_price).toBe(15000);
  });

  it("treats a missing side as 0", () => {
    const plan = computeGemMergePlan({
      child: { ...child, weight_ct: 3, base_price_pcb: undefined },
      parent: { ...parent, weight_ct: undefined, base_price_pcb: 100 },
    });
    expect(plan.merged_weight).toBe(3);
    expect(plan.prices.base_price_pcb).toBe(100);
  });

  it("errors when the parent folder is missing", () => {
    const plan = computeGemMergePlan({ child, parent: null });
    expect(plan.ok).toBe(false);
    expect(plan.errors).toContain("sg_merge_gem_error_parent_missing");
  });

  it("errors when the child has nested splits", () => {
    const plan = computeGemMergePlan({
      child: {
        ...child,
        splits: [{ id: "90", date: "2026-06-01T00:00:00.000Z" }],
      },
      parent,
    });
    expect(plan.ok).toBe(false);
    expect(plan.errors).toContain("sg_merge_gem_error_has_children");
  });

  it("errors when parent_id is empty", () => {
    const plan = computeGemMergePlan({
      child: { ...child, parent_id: "" },
      parent,
    });
    expect(plan.ok).toBe(false);
    expect(plan.errors).toContain("sg_merge_gem_error_no_parent");
  });
});

describe("buildGemMergeParentMeta", () => {
  it("writes summed totals and drops the child from splits", () => {
    const plan = computeGemMergePlan({ child, parent });
    expect(buildGemMergeParentMeta(plan, { parent, child_id: "45" })).toEqual({
      weight_ct: 50,
      number_of_pieces: 20,
      base_price_pcb: 10000,
      import_price: 12000,
      pv_selling_price: 15000,
      splits: [],
    });
  });

  it("keeps other split records", () => {
    const parent_with_two = {
      ...parent,
      splits: [
        { id: "45", date: "2026-05-01T00:00:00.000Z" },
        { id: "50", date: "2026-05-02T00:00:00.000Z" },
      ],
    };
    const plan = computeGemMergePlan({ child, parent: parent_with_two });
    expect(
      buildGemMergeParentMeta(plan, { parent: parent_with_two, child_id: "45" })
        .splits
    ).toEqual([{ id: "50", date: "2026-05-02T00:00:00.000Z" }]);
  });
});

describe("listGemMergeParentChangeRows", () => {
  it("shows parent + child = merged for weight", () => {
    const plan = computeGemMergePlan({ child, parent });
    const rows = listGemMergeParentChangeRows({ plan, parent, child, t });
    const weight = rows.find((row) => row.key === "weight_ct");
    expect(weight.from_label).toContain("40");
    expect(weight.addend_label).toContain("10");
    expect(weight.to_label).toContain("50");
  });
});

describe("listGemMergeLostMeta / files / selections", () => {
  it("lists only child fields that differ from the parent", () => {
    const rows = listGemMergeLostMeta(
      {
        ...child,
        stone_type: "Sapphire",
        color: "Blue",
      },
      {
        ...parent,
        stone_type: "Sapphire",
        color: "Red",
        status: "buying-invoice",
      },
      t
    );
    const keys = rows.map((row) => row.key);
    expect(keys).toContain("color");
    expect(keys).toContain("notes");
    expect(keys).toContain("paired_gem");
    expect(keys).not.toContain("stone_type");
    expect(keys).not.toContain("status");
    expect(keys).not.toContain("weight_ct");
    expect(keys).not.toContain("parent_id");
    expect(rows.find((row) => row.key === "color")).toMatchObject({
      value_label: "Blue",
      parent_label: "Red",
    });
    expect(rows.find((row) => row.key === "notes")).toMatchObject({
      value_label: "Split parcel notes",
      parent_label: "",
    });
  });

  it("omits empty child fields even when the parent has a value", () => {
    const rows = listGemMergeLostMeta(
      { ...child, color: "", notes: "", paired_gem: "", stone_type: "" },
      { ...parent, color: "Red", stone_type: "Ruby" },
      t
    );
    const keys = rows.map((row) => row.key);
    expect(keys).not.toContain("color");
    expect(keys).not.toContain("stone_type");
    expect(keys).not.toContain("notes");
  });

  it("lists cover, media, and certificates", () => {
    const lost = listGemMergeLostFiles(child);
    expect(lost.has_cover).toBe(true);
    expect(lost.media.map((file) => file.name)).toEqual(["photo.jpg"]);
    expect(lost.certificates.map((file) => file.name)).toEqual(["cert.pdf"]);
  });

  it("lists indexed selection paths including the box", () => {
    expect(listGemMergeSelectionPaths(child)).toEqual(
      expect.arrayContaining(["memo-in/2", "box/3"])
    );
  });
});

function createMergeApiMock({
  folders = {},
  fail_parent = false,
  fail_delete = false,
} = {}) {
  const store = { ...folders };
  const deleted = [];
  const api = {
    getFolder: vi.fn(async ({ path }) => {
      const folder = store[path];
      if (!folder) {
        const err = new Error(`missing ${path}`);
        err.code = "missing_folder";
        throw err;
      }
      return { ...folder };
    }),
    updateMeta: vi.fn(async ({ path, new_meta }) => {
      if (fail_parent && path === "gems/12") {
        throw { code: "parent_update_denied" };
      }
      store[path] = { ...(store[path] || { $path: path }), ...new_meta };
    }),
    deleteItem: vi.fn(async ({ path }) => {
      if (fail_delete) {
        throw { code: "delete_denied" };
      }
      deleted.push(path);
      delete store[path];
      return { path };
    }),
    getFieldHistory: vi.fn(async () => []),
  };
  return { api, store, deleted };
}

describe("runGemMerge", () => {
  const plan = computeGemMergePlan({ child, parent });

  it("removes the child from selections, updates the parent, then deletes", async () => {
    const { api, store, deleted } = createMergeApiMock({
      folders: {
        "gems/12": { ...parent },
        "gems/45": { ...child },
        "gems/9": { $path: "gems/9", paired_gem: "45" },
        "memo-in/2": {
          $path: "memo-in/2",
          selection_type: "memo in",
          selection_entries: ["gems/12", "gems/45"],
        },
        "box/3": {
          $path: "box/3",
          selection_entries: ["gems/12", "gems/45"],
        },
      },
    });
    const on_progress = vi.fn();

    const result = await runGemMerge({
      api,
      child,
      child_path: "gems/45",
      child_id: "45",
      parent,
      parent_path: "gems/12",
      parent_id: "12",
      plan,
      on_progress,
    });

    expect(result).toEqual({ parent_id: "12", parent_path: "gems/12" });
    expect(store["memo-in/2"].selection_entries).toEqual(["gems/12"]);
    expect(store["box/3"].selection_entries).toEqual(["gems/12"]);
    expect(store["gems/12"]).toMatchObject({
      weight_ct: 50,
      number_of_pieces: 20,
      base_price_pcb: 10000,
      splits: [],
    });
    expect(store["gems/9"].paired_gem).toBe("");
    expect(store["gems/45"]).toBeUndefined();
    expect(deleted).toEqual(["gems/45"]);
    expect(on_progress.mock.calls.map((call) => call[0])).toEqual([
      {
        step: "selections",
        current: 1,
        total: 2,
        selection_path: "memo-in/2",
      },
      {
        step: "selections",
        current: 2,
        total: 2,
        selection_path: "box/3",
      },
      { step: "parent" },
      { step: "delete" },
    ]);
    expect(GEM_STATUS_REFERENCE).toBeTruthy();
  });

  it("throws merge_delete_failed after the parent was already updated", async () => {
    const { api, store } = createMergeApiMock({
      folders: {
        "gems/12": { ...parent },
        "gems/45": { ...child, paired_gem: "", selection_membership_paths: {} },
      },
      fail_delete: true,
    });
    const child_no_sel = {
      ...child,
      paired_gem: "",
      box_selection_path: "",
      selection_membership_paths: {},
    };

    await expect(
      runGemMerge({
        api,
        child: child_no_sel,
        child_path: "gems/45",
        child_id: "45",
        parent,
        parent_path: "gems/12",
        parent_id: "12",
        plan: computeGemMergePlan({ child: child_no_sel, parent }),
      })
    ).rejects.toMatchObject({
      code: "merge_delete_failed",
      parent_id: "12",
      child_id: "45",
    });
    expect(store["gems/12"].weight_ct).toBe(50);
  });
});
