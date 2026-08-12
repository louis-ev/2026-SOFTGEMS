import { describe, expect, it, beforeEach } from "vitest";
import {
  buildGemsQuickSearchStorageKey,
  gems_quick_search_localstorage_key,
  gems_quick_search_storage_scopes,
  loadGemsQuickSearchFromStorage,
  persistGemsQuickSearchToStorage,
} from "@/utils/gems_quick_search_storage.js";

describe("gems_quick_search_storage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("builds scoped storage keys", () => {
    expect(
      buildGemsQuickSearchStorageKey(gems_quick_search_storage_scopes.all_gems)
    ).toBe("sg_gems_quick_search:all-gems");
    expect(buildGemsQuickSearchStorageKey("selection:memo-in")).toBe(
      "sg_gems_quick_search:selection:memo-in"
    );
    expect(buildGemsQuickSearchStorageKey("")).toBeNull();
  });

  it("persists and loads per scope", () => {
    persistGemsQuickSearchToStorage(
      gems_quick_search_storage_scopes.all_gems,
      "status=memo-in"
    );
    persistGemsQuickSearchToStorage(
      "selection:memo-out",
      "mac=__empty__"
    );

    expect(
      loadGemsQuickSearchFromStorage(gems_quick_search_storage_scopes.all_gems)
    ).toBe("status=memo-in");
    expect(loadGemsQuickSearchFromStorage("selection:memo-out")).toBe(
      "mac=__empty__"
    );
    expect(loadGemsQuickSearchFromStorage("selection:memo-in")).toBe("");
  });

  it("falls back to legacy unscoped key for all-gems", () => {
    localStorage.setItem(gems_quick_search_localstorage_key, "weight=2");
    expect(
      loadGemsQuickSearchFromStorage(gems_quick_search_storage_scopes.all_gems)
    ).toBe("weight=2");
    expect(loadGemsQuickSearchFromStorage("selection:memo-in")).toBe("");
  });
});
