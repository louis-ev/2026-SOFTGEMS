import { describe, expect, it } from "vitest";
import {
  enrichSelectionFolder,
  fetchAllSelectionFolders,
  parseSelectionFolderPath,
  resolveSelectionType,
  selectionDocumentNumber,
  selectionFolderPath,
  selectionFolderSlugFromPath,
  selectionMembershipTypeSlug,
  selectionTypeRootPath,
} from "@/utils/selection_paths.js";

describe("selection_paths", () => {
  it("builds top-level type roots and folder paths", () => {
    expect(selectionTypeRootPath("box")).toBe("box");
    expect(selectionFolderPath("memo-in", "12")).toBe("memo-in/12");
    expect(selectionTypeRootPath("")).toBe("");
    expect(selectionFolderPath("nope", "1")).toBe("");
  });

  it("parses top-level and legacy nested selection paths", () => {
    expect(parseSelectionFolderPath("box/12")).toEqual({
      type_slug: "box",
      folder_slug: "12",
      selection_type: "bo\u00eete",
    });
    expect(parseSelectionFolderPath("selections/box/12")).toEqual({
      type_slug: "box",
      folder_slug: "12",
      selection_type: "bo\u00eete",
    });
    expect(parseSelectionFolderPath("selections/42")).toEqual({
      type_slug: "",
      folder_slug: "",
      selection_type: "",
    });
  });

  it("derives document number and type from path", () => {
    expect(selectionDocumentNumber("box/12")).toBe("12");
    expect(selectionDocumentNumber({ $path: "memo-in/3" })).toBe("3");
    expect(resolveSelectionType({ $path: "box/5" })).toBe("bo\u00eete");
    expect(
      resolveSelectionType({
        $path: "selections/42",
        selection_type: "memo in",
      })
    ).toBe("memo in");
    expect(
      selectionMembershipTypeSlug({ $path: "buying-invoice/2" })
    ).toBe("buying-invoice");
    expect(selectionFolderSlugFromPath("box/7")).toBe("7");
  });

  it("enriches folders with derived selection_type", () => {
    expect(enrichSelectionFolder({ $path: "memo-out/1" })).toEqual({
      $path: "memo-out/1",
      selection_type: "memo out",
    });
  });

  it("fetches all selection folders across type roots", async () => {
    const api = {
      getFolders({ path: folder_path }) {
        if (folder_path === "box") {
          return Promise.resolve([{ $path: "box/1" }]);
        }
        if (folder_path === "memo-in") {
          return Promise.resolve([{ $path: "memo-in/2" }]);
        }
        return Promise.resolve([]);
      },
    };
    const rows = await fetchAllSelectionFolders(api);
    const paths = rows.map((r) => r.$path).sort();
    expect(paths).toEqual(["box/1", "memo-in/2"]);
  });
});
