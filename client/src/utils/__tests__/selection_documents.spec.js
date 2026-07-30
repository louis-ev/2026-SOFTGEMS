import { describe, it, expect } from "vitest";
import { SELECTION_TYPE_VALUES } from "@/utils/selection_types.js";
import {
  isSelectionAttachmentFile,
  isSelectionMainDocumentFile,
  selectionTypeHasMainDocument,
} from "@/utils/selection_documents.js";

describe("selectionTypeHasMainDocument", () => {
  it("returns false only for simple selections", () => {
    expect(selectionTypeHasMainDocument("simple")).toBe(false);
  });

  it("returns true for every other CDC selection type", () => {
    for (const selection_type of SELECTION_TYPE_VALUES) {
      if (selection_type === "simple") continue;
      expect(selectionTypeHasMainDocument(selection_type)).toBe(true);
    }
  });
});

describe("selection file flags", () => {
  it("separates main document from attachments", () => {
    const main = { is_selection_main_document: true };
    const attachment = { is_selection_attachment: true };

    expect(isSelectionMainDocumentFile(main)).toBe(true);
    expect(isSelectionAttachmentFile(main)).toBe(false);
    expect(isSelectionAttachmentFile(attachment)).toBe(true);
  });

  it("excludes generated PDFs from attachments", () => {
    const generated = {
      is_selection_generated_pdf: true,
      is_selection_attachment: true,
    };

    expect(isSelectionAttachmentFile(generated)).toBe(false);
  });

  it("requires an explicit attachment flag", () => {
    expect(isSelectionAttachmentFile({ $type: "pdf" })).toBe(false);
    expect(
      isSelectionAttachmentFile({ is_selection_attachment: false })
    ).toBe(false);
  });
});
