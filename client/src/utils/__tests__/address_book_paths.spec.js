import { describe, expect, it, vi } from "vitest";
import {
  buildAddressBookContactPath,
  buildAddressBookPersonPath,
  buildCounterpartyPathFromDraft,
  formatCounterpartyPersonLabel,
  formatPersonDisplayName,
  parseAddressBookPath,
  resolveAddressBookPathLabel,
  resolveAddressBookPathLabels,
  splitCounterpartyPath,
} from "@/utils/address_book_paths.js";

describe("parseAddressBookPath", () => {
  it("parses contact paths", () => {
    expect(parseAddressBookPath("address_book/42")).toEqual({
      kind: "contact",
      contact_slug: "42",
      person_slug: "",
    });
  });

  it("parses person paths", () => {
    expect(parseAddressBookPath("address_book/42/contacts/7")).toEqual({
      kind: "person",
      contact_slug: "42",
      person_slug: "7",
    });
  });

  it("returns null for unrelated paths", () => {
    expect(parseAddressBookPath("selections/1")).toBeNull();
  });
});

describe("formatPersonDisplayName", () => {
  it("joins first and last names", () => {
    expect(
      formatPersonDisplayName({ first_name: "Jane", last_name: "Doe" })
    ).toBe("Jane Doe");
  });
});

describe("formatCounterpartyPersonLabel", () => {
  it("combines company and person labels", () => {
    expect(formatCounterpartyPersonLabel("Acme", "Jane Doe")).toBe(
      "Acme — Jane Doe"
    );
  });
});

describe("splitCounterpartyPath", () => {
  it("splits person paths into contact and person drafts", () => {
    expect(splitCounterpartyPath("address_book/1/contacts/3")).toEqual({
      contact_path: "address_book/1",
      person_path: "address_book/1/contacts/3",
    });
  });

  it("keeps company-only paths on the contact draft", () => {
    expect(splitCounterpartyPath("address_book/1")).toEqual({
      contact_path: "address_book/1",
      person_path: "",
    });
  });
});

describe("buildCounterpartyPathFromDraft", () => {
  it("stores the person path when a company contact is selected", () => {
    expect(
      buildCounterpartyPathFromDraft({
        contact_path: "address_book/1",
        person_path: "address_book/1/contacts/3",
        is_company: true,
      })
    ).toBe("address_book/1/contacts/3");
  });

  it("stores the company path when no contact person is selected", () => {
    expect(
      buildCounterpartyPathFromDraft({
        contact_path: "address_book/1",
        person_path: "",
        is_company: true,
      })
    ).toBe("address_book/1");
  });
});

describe("buildAddressBook paths", () => {
  it("builds contact and person paths", () => {
    expect(buildAddressBookContactPath("42")).toBe("address_book/42");
    expect(buildAddressBookPersonPath("42", "7")).toBe(
      "address_book/42/contacts/7"
    );
  });
});

describe("resolveAddressBookPathLabel", () => {
  it("resolves contact labels from cache", async () => {
    const api = {
      store: { "address_book/1": { name: "Acme" } },
      getFolder: vi.fn(),
    };
    await expect(resolveAddressBookPathLabel(api, "address_book/1")).resolves.toBe(
      "Acme"
    );
  });

  it("falls back to contact slug instead of full path when fetch fails", async () => {
    const api = {
      store: {},
      getFolder: vi.fn().mockRejectedValue(new Error("denied")),
    };
    await expect(
      resolveAddressBookPathLabel(api, "address_book/bellerophon")
    ).resolves.toBe("bellerophon");
  });

  it("resolves person labels with contact context", async () => {
    const api = {
      store: {
        "address_book/1": { name: "Acme" },
        "address_book/1/contacts/3": {
          first_name: "Jane",
          last_name: "Doe",
        },
      },
      getFolder: vi.fn(),
    };
    await expect(
      resolveAddressBookPathLabel(api, "address_book/1/contacts/3")
    ).resolves.toBe("Acme — Jane Doe");
  });
});

describe("resolveAddressBookPathLabels", () => {
  it("deduplicates paths", async () => {
    const api = {
      store: {
        "address_book/1": { name: "Acme" },
        "address_book/2": { name: "Beta" },
      },
      getFolder: vi.fn(),
    };
    await expect(
      resolveAddressBookPathLabels(api, [
        "address_book/1",
        "address_book/1",
        "address_book/2",
      ])
    ).resolves.toEqual({
      "address_book/1": "Acme",
      "address_book/2": "Beta",
    });
  });
});
