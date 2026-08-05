import { describe, it, expect } from "vitest";
import { htmlToPlainText, isEmptyRichText } from "@/utils/rich_text.js";

describe("rich_text", () => {
  it("strips tags and collapses whitespace", () => {
    expect(htmlToPlainText("<p>Hello <strong>world</strong></p>")).toBe(
      "Hello world"
    );
    expect(htmlToPlainText("<p><br></p>")).toBe("");
    expect(htmlToPlainText("")).toBe("");
    expect(htmlToPlainText(null)).toBe("");
  });

  it("detects empty rich text", () => {
    expect(isEmptyRichText("")).toBe(true);
    expect(isEmptyRichText("<p><br></p>")).toBe(true);
    expect(isEmptyRichText("<p>Note</p>")).toBe(false);
  });
});
