import { describe, expect, it, vi } from "vitest";
import {
  applyPairedGemPartnerUpdates,
  buildPairedGemListLabel,
  gemMatchesPairedGemSearch,
  getGemIdFromPath,
  getPairedGemConflict,
  normalizePairedGemId,
  sanitizePairedGemId,
  syncPairedGemLinks,
} from "@/utils/gem_pairing.js";

describe("getGemIdFromPath", () => {
  it("returns the last path segment", () => {
    expect(getGemIdFromPath("gems/1390")).toBe("1390");
  });

  it("ignores trailing slashes", () => {
    expect(getGemIdFromPath("gems/1390/")).toBe("1390");
  });
});

describe("normalizePairedGemId", () => {
  it("extracts id from a folder path", () => {
    expect(normalizePairedGemId("gems/326")).toBe("326");
  });

  it("keeps bare ids unchanged", () => {
    expect(normalizePairedGemId("30")).toBe("30");
  });
});

describe("sanitizePairedGemId", () => {
  it("rejects self-pairs", () => {
    expect(sanitizePairedGemId("30", "30")).toBe("");
    expect(sanitizePairedGemId("gems/30", "30")).toBe("");
  });

  it("keeps a different partner id", () => {
    expect(sanitizePairedGemId("326", "30")).toBe("326");
  });
});

describe("buildPairedGemListLabel", () => {
  it("uses internal gem id and secondary characteristics", () => {
    expect(
      buildPairedGemListLabel({
        $path: "gems/42",
        weight_ct: 1.25,
        color: "Blue",
        stone_type: "Sapphire",
        reference_supplier: "SUP-001",
      })
    ).toEqual({
      gem_id: "42",
      secondary: "1.25 ct  Blue  Sapphire",
    });
  });
});

describe("gemMatchesPairedGemSearch", () => {
  const gem = {
    $path: "gems/100",
    weight_ct: 2,
    color: "Red",
    stone_type: "Ruby",
  };

  it("matches by gem id", () => {
    expect(gemMatchesPairedGemSearch(gem, "100")).toBe(true);
  });

  it("matches by secondary fields", () => {
    expect(gemMatchesPairedGemSearch(gem, "ruby")).toBe(true);
  });

  it("returns true for empty needle", () => {
    expect(gemMatchesPairedGemSearch(gem, "")).toBe(true);
  });
});

describe("getPairedGemConflict", () => {
  it("returns null when the target gem is not paired", () => {
    expect(
      getPairedGemConflict({
        target_gem: { paired_gem: "" },
        current_gem_id: "10",
      })
    ).toBeNull();
  });

  it("returns null when already paired with the current gem", () => {
    expect(
      getPairedGemConflict({
        target_gem: { paired_gem: "10" },
        current_gem_id: "10",
      })
    ).toBeNull();
  });

  it("returns the other partner id when paired elsewhere", () => {
    expect(
      getPairedGemConflict({
        target_gem: { paired_gem: "99" },
        current_gem_id: "10",
      })
    ).toBe("99");
  });
});

describe("applyPairedGemPartnerUpdates", () => {
  it("updates matching gems in a list", () => {
    const gems = [{ $path: "gems/326", paired_gem: "" }];
    applyPairedGemPartnerUpdates(gems, [{ gem_id: "326", paired_gem: "30" }]);
    expect(gems[0].paired_gem).toBe("30");
  });

  it("never applies a self-pair", () => {
    const gems = [{ $path: "gems/326", paired_gem: "30" }];
    applyPairedGemPartnerUpdates(gems, [{ gem_id: "326", paired_gem: "326" }]);
    expect(gems[0].paired_gem).toBe("");
  });
});

describe("syncPairedGemLinks", () => {
  it("sets reciprocal pairing on the new target (30 ? 326 means 326 ? 30)", async () => {
    const updateMeta = vi.fn().mockResolvedValue({});
    const getFolder = vi.fn().mockResolvedValue({ paired_gem: "" });
    const folderUpdated = vi.fn();
    const result = await syncPairedGemLinks({
      api: { updateMeta, getFolder, folderUpdated },
      gems_path: "gems",
      source_gem_id: "30",
      new_paired_gem_id: "326",
      previous_paired_gem_id: "",
    });

    expect(updateMeta).toHaveBeenCalledTimes(1);
    expect(updateMeta).toHaveBeenCalledWith({
      path: "gems/326",
      new_meta: { paired_gem: "30" },
    });
    expect(folderUpdated).toHaveBeenCalledWith({
      path_to_folder: "gems/326",
      changed_data: { paired_gem: "30" },
    });
    expect(result.partner_updates).toEqual([
      { gem_id: "326", paired_gem: "30" },
    ]);
    expect(result.failed_paths).toEqual([]);
  });

  it("never writes a self-pair when source equals target", async () => {
    const updateMeta = vi.fn().mockResolvedValue({});
    const result = await syncPairedGemLinks({
      api: { updateMeta },
      gems_path: "gems",
      source_gem_id: "30",
      new_paired_gem_id: "30",
      previous_paired_gem_id: "",
    });

    expect(updateMeta).not.toHaveBeenCalled();
    expect(result.partner_updates).toEqual([]);
  });

  it("clears the target's previous partner when re-pairing that target", async () => {
    const updateMeta = vi.fn().mockResolvedValue({});
    const getFolder = vi.fn().mockImplementation(({ path }) => {
      if (path === "gems/326") return Promise.resolve({ paired_gem: "99" });
      if (path === "gems/99") return Promise.resolve({ paired_gem: "326" });
      return Promise.resolve({ paired_gem: "" });
    });
    const result = await syncPairedGemLinks({
      api: { updateMeta, getFolder },
      gems_path: "gems",
      source_gem_id: "30",
      new_paired_gem_id: "326",
      previous_paired_gem_id: "",
    });

    expect(updateMeta).toHaveBeenCalledWith({
      path: "gems/326",
      new_meta: { paired_gem: "30" },
    });
    expect(updateMeta).toHaveBeenCalledWith({
      path: "gems/99",
      new_meta: { paired_gem: "" },
    });
    expect(result.partner_updates).toEqual([
      { gem_id: "326", paired_gem: "30" },
      { gem_id: "99", paired_gem: "" },
    ]);
  });

  it("does not clear a previous partner that no longer points back", async () => {
    const updateMeta = vi.fn().mockResolvedValue({});
    const getFolder = vi.fn().mockImplementation(({ path }) => {
      if (path === "gems/326") return Promise.resolve({ paired_gem: "99" });
      // 99 was already re-paired elsewhere
      if (path === "gems/99") return Promise.resolve({ paired_gem: "12" });
      return Promise.resolve({ paired_gem: "" });
    });
    await syncPairedGemLinks({
      api: { updateMeta, getFolder },
      gems_path: "gems",
      source_gem_id: "30",
      new_paired_gem_id: "326",
      previous_paired_gem_id: "",
    });

    expect(updateMeta).toHaveBeenCalledTimes(1);
    expect(updateMeta).toHaveBeenCalledWith({
      path: "gems/326",
      new_meta: { paired_gem: "30" },
    });
  });

  it("normalizes folder-path ids before syncing", async () => {
    const updateMeta = vi.fn().mockResolvedValue({});
    const getFolder = vi.fn().mockResolvedValue({ paired_gem: "" });
    await syncPairedGemLinks({
      api: { updateMeta, getFolder },
      gems_path: "gems",
      source_gem_id: "gems/30",
      new_paired_gem_id: "gems/326",
      previous_paired_gem_id: "",
    });

    expect(updateMeta).toHaveBeenCalledWith({
      path: "gems/326",
      new_meta: { paired_gem: "30" },
    });
  });

  it("clears the previous partner when changing pairing", async () => {
    const updateMeta = vi.fn().mockResolvedValue({});
    const getFolder = vi.fn().mockImplementation(({ path }) => {
      if (path === "gems/30") return Promise.resolve({ paired_gem: "" });
      if (path === "gems/20") return Promise.resolve({ paired_gem: "10" });
      return Promise.resolve({ paired_gem: "" });
    });
    const result = await syncPairedGemLinks({
      api: { updateMeta, getFolder },
      gems_path: "gems",
      source_gem_id: "10",
      new_paired_gem_id: "30",
      previous_paired_gem_id: "20",
    });

    expect(updateMeta).toHaveBeenCalledTimes(2);
    expect(updateMeta).toHaveBeenCalledWith({
      path: "gems/30",
      new_meta: { paired_gem: "10" },
    });
    expect(updateMeta).toHaveBeenCalledWith({
      path: "gems/20",
      new_meta: { paired_gem: "" },
    });
    expect(result.partner_updates).toEqual([
      { gem_id: "30", paired_gem: "10" },
      { gem_id: "20", paired_gem: "" },
    ]);
  });

  it("clears the previous partner when removing pairing", async () => {
    const updateMeta = vi.fn().mockResolvedValue({});
    const getFolder = vi.fn().mockResolvedValue({ paired_gem: "10" });
    const result = await syncPairedGemLinks({
      api: { updateMeta, getFolder },
      gems_path: "gems",
      source_gem_id: "10",
      new_paired_gem_id: "",
      previous_paired_gem_id: "20",
    });

    expect(updateMeta).toHaveBeenCalledTimes(1);
    expect(updateMeta).toHaveBeenCalledWith({
      path: "gems/20",
      new_meta: { paired_gem: "" },
    });
    expect(result.partner_updates).toEqual([
      { gem_id: "20", paired_gem: "" },
    ]);
  });

  it("returns failed paths without throwing", async () => {
    const updateMeta = vi
      .fn()
      .mockRejectedValueOnce(new Error("network"))
      .mockResolvedValueOnce({});
    const getFolder = vi.fn().mockImplementation(({ path }) => {
      if (path === "gems/30") return Promise.resolve({ paired_gem: "" });
      if (path === "gems/20") return Promise.resolve({ paired_gem: "10" });
      return Promise.resolve({ paired_gem: "" });
    });
    const result = await syncPairedGemLinks({
      api: { updateMeta, getFolder },
      gems_path: "gems",
      source_gem_id: "10",
      new_paired_gem_id: "30",
      previous_paired_gem_id: "20",
    });

    expect(result.failed_paths).toEqual(["gems/30"]);
    expect(result.partner_updates).toEqual([
      { gem_id: "20", paired_gem: "" },
    ]);
  });
});
