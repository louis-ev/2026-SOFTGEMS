import { describe, expect, it } from "vitest";
import {
  formatFolderHistoryEntryTitle,
  formatFolderHistoryEntryValue,
  formatFolderHistoryFieldName,
  formatSelectionMembershipPathsHistoryValue,
} from "@/utils/folder_modifications_history.js";

const t = (key, values) => {
  const map = {
    sg_status: "Status",
    sg_section_gem_selections: "Selections",
    sg_duplicate_gem_field_box: "Box",
    sg_splits: "Split gems",
    sg_gem_notes: "Notes",
    sg_selection_entries: "Gems",
    sg_created_with_fields: `Created (${values?.count} fields)`,
    sg_field_history: "History",
    sg_status_value_purchased: "Purchased",
    sg_status_value_reference: "Reference",
    sg_selection_type_memo_in: "Memo in",
    sg_selection_type_box: "Box",
    sg_selection_type_sale_invoice: "Sale invoice",
  };
  return map[key] || key;
};

const gem_opts = { t, history_kind: "gem" };
const selection_opts = { t, history_kind: "selection" };

describe("formatFolderHistoryFieldName", () => {
  it("uses gem field labels and extra history labels", () => {
    expect(
      formatFolderHistoryFieldName(
        { event: "updated", field: "status" },
        gem_opts
      )
    ).toBe("Status");
    expect(
      formatFolderHistoryFieldName(
        { event: "updated", field: "selection_membership_paths" },
        gem_opts
      )
    ).toBe("Selections");
    expect(
      formatFolderHistoryFieldName(
        { event: "updated", field: "box_selection_path" },
        gem_opts
      )
    ).toBe("Box");
  });
});

describe("formatSelectionMembershipPathsHistoryValue", () => {
  it("lists type label, document number, and date newest first", () => {
    expect(
      formatSelectionMembershipPathsHistoryValue(
        {
          "memo-in/2": "2026-01-15T12:00:00.000Z",
          "box/3": "2026-08-20T12:00:00.000Z",
        },
        t
      )
    ).toBe("Box #3 (20/08/2026)\nMemo in #2 (15/01/2026)");
  });

  it("returns a dash for an empty map", () => {
    expect(formatSelectionMembershipPathsHistoryValue({}, t)).toBe("\u2014");
    expect(formatSelectionMembershipPathsHistoryValue(null, t)).toBe("\u2014");
  });
});

describe("formatFolderHistoryEntryValue", () => {
  it("does not stringify membership maps as [object Object]", () => {
    const value = formatFolderHistoryEntryValue(
      {
        event: "updated",
        field: "selection_membership_paths",
        value: {
          "sale-invoice/4": "2026-02-01T12:00:00.000Z",
        },
      },
      gem_opts
    );
    expect(value).toBe("Sale invoice #4 (01/02/2026)");
    expect(value).not.toContain("[object Object]");
  });

  it("formats gem status with inventory labels", () => {
    expect(
      formatFolderHistoryEntryValue(
        { event: "updated", field: "status", value: "buying-invoice" },
        gem_opts
      )
    ).toBe("Purchased");
  });

  it("formats box path and splits", () => {
    expect(
      formatFolderHistoryEntryValue(
        { event: "updated", field: "box_selection_path", value: "box/3" },
        gem_opts
      )
    ).toBe("Box #3");
    expect(
      formatFolderHistoryEntryValue(
        {
          event: "updated",
          field: "splits",
          value: [{ id: "40", date: "2026-08-13T12:00:00.000Z" }],
        },
        gem_opts
      )
    ).toBe("#40 (13/08/2026)");
  });

  it("formats generic objects instead of [object Object]", () => {
    expect(
      formatFolderHistoryEntryValue(
        {
          event: "updated",
          field: "unknown_meta",
          value: { foo: "bar", nested: { a: 1 } },
        },
        gem_opts
      )
    ).toBe("foo: bar\nnested: a: 1");
  });
});

describe("formatFolderHistoryEntryTitle", () => {
  it("joins field label and readable memberships on one line", () => {
    expect(
      formatFolderHistoryEntryTitle(
        {
          event: "updated",
          field: "selection_membership_paths",
          value: {
            "memo-in/2": "2026-01-15T12:00:00.000Z",
            "box/3": "2026-08-20T12:00:00.000Z",
          },
        },
        gem_opts
      )
    ).toBe("Selections: Box #3 (20/08/2026), Memo in #2 (15/01/2026)");
  });

  it("keeps selection gems history readable", () => {
    expect(
      formatFolderHistoryEntryTitle(
        {
          event: "updated",
          field: "selection_entries",
          value: ["gems/12", "gems/45"],
        },
        selection_opts
      )
    ).toBe("Gems: 2 gems: 12, 45");
  });

  it("formats created entries with a field count", () => {
    expect(
      formatFolderHistoryEntryTitle(
        { event: "created", fields: { status: "reference", stone_type: "Ruby" } },
        gem_opts
      )
    ).toBe("Created (2 fields)");
  });
});
