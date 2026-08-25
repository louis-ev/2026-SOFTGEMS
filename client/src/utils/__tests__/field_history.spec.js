import { describe, expect, it } from "vitest";
import { extract_field_entries } from "@/utils/field_history.js";

describe("extract_field_entries", () => {
  it("reads a field from a batched updated entry", () => {
    const rows = extract_field_entries(
      [
        {
          ts: "2026-08-25T16:00:00.000Z",
          event: "updated",
          fields: { weight_ct: 50, number_of_pieces: 20 },
          author: "authors/1",
        },
      ],
      "weight_ct"
    );
    expect(rows).toEqual([
      {
        ts: "2026-08-25T16:00:00.000Z",
        value: 50,
        author_path: "authors/1",
        event: "updated",
      },
    ]);
  });
});
