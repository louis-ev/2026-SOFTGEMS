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

export function contactAddressParts(record) {
  return CONTACT_ADDRESS_FIELD_KEYS.map((key) =>
    cleanContactAddressPart(readContactAddressPart(record, key))
  ).filter(Boolean);
}

/** Formats a contact or person folder address for display (table, PDF, etc.). */
export function formatContactAddress(record, { separator = ", " } = {}) {
  return contactAddressParts(record).join(separator);
}

export function formatContactAddressMultiline(record) {
  return formatContactAddress(record, { separator: "\n" });
}

export function readContactAddressFields(record) {
  return Object.fromEntries(
    CONTACT_ADDRESS_FIELD_KEYS.map((key) => [
      key,
      readContactAddressPart(record, key),
    ])
  );
}
