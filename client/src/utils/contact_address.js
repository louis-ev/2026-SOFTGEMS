import { country_of_cut_suggestions } from "@/suggestions/softgems/country_of_cut_suggestions.js";

export const CONTACT_ADDRESS_FIELD_KEYS = [
  "address_street",
  "address_city",
  "address_zip",
  "address_country",
];

/** Country select options for contact addresses (same list as gem COC). */
export const contact_address_country_options = [...country_of_cut_suggestions].sort(
  (a, b) => a.localeCompare(b, undefined, { sensitivity: "base" })
);

export function cleanContactAddressPart(value) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

export function readContactAddressPart(record, field_key) {
  if (!record || !field_key) return "";
  const raw = record[field_key];
  return typeof raw === "string" ? raw : "";
}

export function readContactAddressFields(record) {
  return Object.fromEntries(
    CONTACT_ADDRESS_FIELD_KEYS.map((key) => [
      key,
      readContactAddressPart(record, key),
    ])
  );
}

export function contactAddressParts(record) {
  return CONTACT_ADDRESS_FIELD_KEYS.map((key) =>
    cleanContactAddressPart(readContactAddressPart(record, key))
  ).filter(Boolean);
}

function readContactAddressField(record, field_key) {
  return cleanContactAddressPart(readContactAddressPart(record, field_key));
}

/** Postal-style lines: street; ZIP + city; country. */
export function contactAddressPostalLines(record) {
  const street = readContactAddressField(record, "address_street");
  const city = readContactAddressField(record, "address_city");
  const zip = readContactAddressField(record, "address_zip");
  const country = readContactAddressField(record, "address_country");

  const lines = [];
  if (street) lines.push(street);

  const city_zip_line = [zip, city].filter(Boolean).join(" ");
  if (city_zip_line) lines.push(city_zip_line);

  if (country) lines.push(country);
  return lines;
}

/** Formats a contact or person folder address for compact display (tables, etc.). */
export function formatContactAddress(record, { separator = ", " } = {}) {
  return contactAddressParts(record).join(separator);
}

/** Formats a contact or person folder address for PDF / multiline display. */
export function formatContactAddressPostal(record) {
  return contactAddressPostalLines(record).join("\n");
}

/** @deprecated Use formatContactAddressPostal */
export function formatContactAddressMultiline(record) {
  return formatContactAddressPostal(record);
}

/** Prefer a person address when present; otherwise use the company/contact folder. */
export function resolveCounterpartyPostalAddressLines({ contact, person } = {}) {
  const person_lines = person ? contactAddressPostalLines(person) : [];
  if (person_lines.length) return person_lines;
  return contact ? contactAddressPostalLines(contact) : [];
}
