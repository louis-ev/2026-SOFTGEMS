import { describe, expect, it } from "vitest";
import {
  contact_address_country_options,
  formatContactAddress,
  formatContactAddressMultiline,
  readContactAddressFields,
} from "@/utils/contact_address.js";

describe("contact_address", () => {
  it("formats structured address parts inline", () => {
    expect(
      formatContactAddress({
        address_street: "12 Rue de la Paix",
        address_city: "Paris",
        address_zip: "75002",
        address_country: "France",
      })
    ).toBe("12 Rue de la Paix, Paris, 75002, France");
  });

  it("formats structured address parts on multiple lines", () => {
    expect(
      formatContactAddressMultiline({
        address_street: "12 Rue de la Paix",
        address_city: "Paris",
        address_zip: "75002",
        address_country: "France",
      })
    ).toBe("12 Rue de la Paix\nParis\n75002\nFrance");
  });

  it("returns empty string when all address parts are empty", () => {
    expect(formatContactAddress({})).toBe("");
    expect(formatContactAddress({ address: "ignored legacy" })).toBe("");
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
