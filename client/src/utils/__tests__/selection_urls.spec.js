import { describe, expect, it } from "vitest";
import {
  isSelectionAppPath,
  isSelectionTypeDetailPath,
  parseSelectionUrlSegment,
  parseTypedSelectionRouteParams,
  redirectShortSelectionPath,
  selectionDetailPath,
  selectionHubPath,
  selectionListPath,
  selectionNewPath,
  selectionPdfExportRouteMatch,
  selectionStorageExportPath,
} from "@/utils/selection_urls.js";

describe("selection_urls", () => {
  it("builds hub, list, new and detail paths under /selections", () => {
    expect(selectionHubPath()).toBe("/selections");
    expect(selectionListPath("memo-in")).toBe("/selections/memo-in");
    expect(selectionNewPath("box")).toBe("/selections/box/new");
    expect(
      selectionDetailPath({
        type_slug: "memo-in",
        folder_slug: "42",
      })
    ).toBe("/selections/memo-in/42");
  });

  it("builds storage export path for Puppeteer", () => {
    expect(selectionStorageExportPath("box", "12")).toBe("/selections/box/12");
  });

  it("parses numeric URL segments only", () => {
    expect(parseSelectionUrlSegment("12")).toEqual({ folder_slug: "12" });
    expect(parseSelectionUrlSegment("42-acme-memo")).toEqual({
      folder_slug: "",
    });
  });

  it("parses typed route params", () => {
    expect(
      parseTypedSelectionRouteParams({
        type_slug: "box",
        selection_path: "12",
      })
    ).toEqual({
      type_slug: "box",
      folder_slug: "12",
    });
  });

  it("detects selection app paths", () => {
    expect(isSelectionAppPath("/selections")).toBe(true);
    expect(isSelectionAppPath("/selections/memo-in")).toBe(true);
    expect(isSelectionAppPath("/selections/box/12")).toBe(true);
    expect(isSelectionAppPath("/selections/box/new")).toBe(true);
    expect(isSelectionAppPath("/box")).toBe(false);
    expect(isSelectionAppPath("/gems")).toBe(false);
    expect(isSelectionTypeDetailPath("/selections/box/12")).toBe(true);
    expect(isSelectionTypeDetailPath("/box/12")).toBe(false);
  });

  it("matches PDF export routes only with export query on detail paths", () => {
    expect(
      selectionPdfExportRouteMatch({
        path: "/selections/box/12",
        query: { cols: "no,ref" },
      })
    ).toEqual({ type_slug: "box", folder_slug: "12" });
    expect(
      selectionPdfExportRouteMatch({
        path: "/selections/memo-in/19",
        query: { superadmintoken: "x" },
      })
    ).toEqual({ type_slug: "memo-in", folder_slug: "19" });
    expect(
      selectionPdfExportRouteMatch({
        path: "/selections/box/12",
        query: {},
      })
    ).toBeNull();
    expect(
      selectionPdfExportRouteMatch({
        path: "/selections/box",
        query: { cols: "no" },
      })
    ).toBeNull();
  });

  it("redirects short URLs to prefixed client paths", () => {
    expect(
      redirectShortSelectionPath({
        params: { type_slug: "box", rest: "12" },
        query: {},
      })
    ).toEqual({ path: "/selections/box/12", query: {} });
    expect(
      redirectShortSelectionPath({
        params: { type_slug: "box", rest: "" },
        query: {},
      })
    ).toEqual({ path: "/selections/box", query: {} });
  });
});
