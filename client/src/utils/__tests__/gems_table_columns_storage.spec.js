import { afterEach, describe, expect, it } from "vitest";
import {
  buildGemsMetadataKeysStorageKey,
  gems_metadata_keys_localstorage_key,
  gems_table_columns_storage_scopes,
  loadGemsMetadataKeysFromStorage,
  persistGemsMetadataKeysToStorage,
  selections_gems_metadata_keys_localstorage_key,
} from "@/utils/gems_table_columns_storage.js";

describe("gems_table_columns_storage", () => {
  afterEach(() => {
    localStorage.clear();
  });

  it("builds scoped storage keys", () => {
    expect(
      buildGemsMetadataKeysStorageKey(gems_table_columns_storage_scopes.all_gems)
    ).toBe("sg_gems_metadata_keys:all-gems");
    expect(buildGemsMetadataKeysStorageKey("selection:memo-in")).toBe(
      "sg_gems_metadata_keys:selection:memo-in"
    );
    expect(buildGemsMetadataKeysStorageKey("")).toBeNull();
  });

  it("persists and loads scoped column preferences", () => {
    persistGemsMetadataKeysToStorage("selection:memo-out", [
      "id",
      "status",
      "weight_ct",
    ]);

    expect(loadGemsMetadataKeysFromStorage("selection:memo-out")).toEqual([
      "id",
      "status",
      "weight_ct",
    ]);
    expect(loadGemsMetadataKeysFromStorage("selection:memo-in")).toEqual([]);
  });

  it("migrates legacy all-gems storage", () => {
    localStorage.setItem(
      gems_metadata_keys_localstorage_key,
      JSON.stringify(["id", "status", "color"])
    );

    expect(
      loadGemsMetadataKeysFromStorage(gems_table_columns_storage_scopes.all_gems)
    ).toEqual(["id", "status", "color"]);
  });

  it("migrates legacy selections storage for selection scopes", () => {
    localStorage.setItem(
      selections_gems_metadata_keys_localstorage_key,
      JSON.stringify(["id", "status", "reference_supplier"])
    );

    expect(loadGemsMetadataKeysFromStorage("selection:memo-in")).toEqual([
      "id",
      "status",
      "reference_supplier",
    ]);
  });
});
