export const ADDRESS_BOOK_ROOT = "address_book";
export const ADDRESS_BOOK_CONTACTS_SEGMENT = "contacts";

/**
 * @param {*} path_raw
 * @returns {{ kind: "contact" | "person", contact_slug: string, person_slug: string } | null}
 */
export function parseAddressBookPath(path_raw) {
  const path = String(path_raw || "").trim();
  if (!path.startsWith(`${ADDRESS_BOOK_ROOT}/`)) return null;

  const segments = path.split("/").filter(Boolean);
  if (segments.length === 2 && segments[0] === ADDRESS_BOOK_ROOT) {
    return {
      kind: "contact",
      contact_slug: segments[1] || "",
      person_slug: "",
    };
  }

  if (
    segments.length === 4 &&
    segments[0] === ADDRESS_BOOK_ROOT &&
    segments[2] === ADDRESS_BOOK_CONTACTS_SEGMENT
  ) {
    return {
      kind: "person",
      contact_slug: segments[1] || "",
      person_slug: segments[3] || "",
    };
  }

  return null;
}

/**
 * @param {*} contact_slug
 * @returns {string}
 */
export function buildAddressBookContactPath(contact_slug) {
  const slug = String(contact_slug || "").trim();
  return slug ? `${ADDRESS_BOOK_ROOT}/${slug}` : "";
}

/**
 * @param {*} contact_slug
 * @param {*} person_slug
 * @returns {string}
 */
export function buildAddressBookPersonPath(contact_slug, person_slug) {
  const contact_path = buildAddressBookContactPath(contact_slug);
  const person = String(person_slug || "").trim();
  return contact_path && person
    ? `${contact_path}/${ADDRESS_BOOK_CONTACTS_SEGMENT}/${person}`
    : "";
}

/**
 * @param {{ first_name?: *, last_name?: *, full_name?: * }} [person]
 * @returns {string}
 */
export function formatPersonDisplayName(person) {
  const first_name = String(person?.first_name || "").trim();
  const last_name = String(person?.last_name || "").trim();
  if (first_name && last_name) return `${first_name} ${last_name}`;
  if (last_name) return last_name;
  if (first_name) return first_name;
  return String(person?.full_name || "").trim();
}

/**
 * @param {*} contact_label
 * @param {*} person_label
 * @returns {string}
 */
export function formatCounterpartyPersonLabel(contact_label, person_label) {
  const contact = String(contact_label || "").trim();
  const person = String(person_label || "").trim();
  if (contact && person) return `${contact} — ${person}`;
  return person || contact || "";
}

/**
 * @param {*} contact
 * @returns {string}
 */
export function formatAddressBookContactLabel(contact) {
  const raw = typeof contact?.name === "string" ? contact.name.trim() : "";
  if (raw) return raw;
  const path = String(contact?.$path || "").trim();
  if (!path) return "";
  const segments = path.split("/");
  return segments[segments.length - 1] || "";
}

export function splitCounterpartyPath(path_raw) {
  const path = String(path_raw || "").trim();
  if (!path) {
    return { contact_path: "", person_path: "" };
  }

  const parsed = parseAddressBookPath(path);
  if (!parsed) {
    return { contact_path: path, person_path: "" };
  }

  if (parsed.kind === "person") {
    return {
      contact_path: buildAddressBookContactPath(parsed.contact_slug),
      person_path: path,
    };
  }

  return { contact_path: path, person_path: "" };
}

/**
 * @param {{ contact_path?: *, person_path?: *, is_company?: boolean }} args
 * @returns {string}
 */
export function buildCounterpartyPathFromDraft({
  contact_path,
  person_path,
  is_company,
}) {
  const contact = String(contact_path || "").trim();
  if (!contact) return "";
  const person = String(person_path || "").trim();
  if (is_company && person) return person;
  return contact;
}

/**
 * @param {object} api
 * @param {*} path_raw
 * @returns {Promise<string>}
 */
export async function resolveAddressBookPathLabel(api, path_raw) {
  const path = String(path_raw || "").trim();
  if (!path) return "";

  const parsed = parseAddressBookPath(path);
  if (!parsed) return path;

  if (parsed.kind === "contact") {
    const cached = api?.store?.[path];
    if (cached?.name) return String(cached.name).trim();
    try {
      const folder = await api.getFolder({ path });
      return (
        formatAddressBookContactLabel(folder) || parsed.contact_slug || ""
      );
    } catch {
      return parsed.contact_slug || "";
    }
  }

  const person_path = path;
  const contact_path = buildAddressBookContactPath(parsed.contact_slug);

  let person_label = "";
  const person_cached = api?.store?.[person_path];
  if (person_cached) {
    person_label = formatPersonDisplayName(person_cached);
  }
  if (!person_label) {
    try {
      const person_folder = await api.getFolder({ path: person_path });
      person_label =
        formatPersonDisplayName(person_folder) || parsed.person_slug;
    } catch {
      person_label = parsed.person_slug;
    }
  }

  let contact_label = "";
  const contact_cached = api?.store?.[contact_path];
  if (contact_cached?.name) {
    contact_label = String(contact_cached.name).trim();
  }
  if (!contact_label) {
    try {
      const contact_folder = await api.getFolder({ path: contact_path });
      contact_label =
        formatAddressBookContactLabel(contact_folder) || parsed.contact_slug;
    } catch {
      contact_label = parsed.contact_slug;
    }
  }

  return formatCounterpartyPersonLabel(contact_label, person_label);
}

/**
 * @param {object} api
 * @param {string[]} paths
 * @returns {Promise<Record<string, string>>}
 */
export async function resolveAddressBookPathLabels(api, paths) {
  const unique_paths = [
    ...new Set(
      (Array.isArray(paths) ? paths : [])
        .map((path) => String(path || "").trim())
        .filter(Boolean)
    ),
  ];
  const entries = await Promise.all(
    unique_paths.map(async (path) => [
      path,
      await resolveAddressBookPathLabel(api, path),
    ])
  );
  return Object.fromEntries(entries);
}
