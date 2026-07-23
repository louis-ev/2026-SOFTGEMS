import { describe, expect, it } from "vitest";
import {
  contact_address_country_options,
  contactAddressPostalLines,
  formatContactAddress,
  formatContactAddressPostal,
  readContactAddressFields,
  resolveCounterpartyPostalAddressLines,
} from "@/utils/contact_address.js";

describe("contact_address", () => {
  const sample_address = {
    address_street: "12 Rue de la Paix",
    address_city: "Paris",
    address_zip: "75002",
    address_country: "France",
  };

  it("formats structured address parts inline", () => {
    expect(formatContactAddress(sample_address)).toBe(
      "12 Rue de la Paix, Paris, 75002, France"
    );
  });

  it("formats structured address parts for postal display", () => {
    expect(formatContactAddressPostal(sample_address)).toBe(
      "12 Rue de la Paix\n75002 Paris\nFrance"
    );
    expect(contactAddressPostalLines(sample_address)).toEqual([
      "12 Rue de la Paix",
      "75002 Paris",
      "France",
    ]);
  });

  it("returns empty output when all address parts are empty", () => {
    expect(formatContactAddress({})).toBe("");
    expect(formatContactAddressPostal({})).toBe("");
    expect(contactAddressPostalLines({})).toEqual([]);
  });

  it("reads structured address fields from a record", () => {
    expect(
      readContactAddressFields({
        address_street: "12 Rue de la Paix",
        address_city: "Paris",
      })
    ).toEqual({
      address_street: "12 Rue de la Paix",
      address_city: "Paris",
      address_zip: "",
      address_country: "",
    });
  });

  it("prefers person address lines over company address lines", () => {
    expect(
      resolveCounterpartyPostalAddressLines({
        contact: {
          address_street: "Company street",
          address_city: "Lyon",
        },
        person: {
          address_street: "Person street",
          address_city: "Paris",
          address_zip: "75001",
        },
      })
    ).toEqual(["Person street", "75001 Paris"]);
  });

  it("falls back to company address lines when person address is empty", () => {
    expect(
      resolveCounterpartyPostalAddressLines({
        contact: sample_address,
        person: {},
      })
    ).toEqual(["12 Rue de la Paix", "75002 Paris", "France"]);
  });

  it("exposes COC country options for contact address country", () => {
    expect(contact_address_country_options).toContain("France");
    expect(contact_address_country_options).toContain("Thailand");
    expect([...contact_address_country_options]).toEqual(
      [...contact_address_country_options].sort((a, b) =>
        a.localeCompare(b, undefined, { sensitivity: "base" })
      )
    );
  });
});
