import { normalizeGemsTableSelectedMetadataKeys } from "@/utils/gems_table_metadata.js";

export const gems_metadata_keys_localstorage_key = "sg_gems_metadata_keys";
export const selections_gems_metadata_keys_localstorage_key =
  "sg_selections_gems_metadata_keys";

export const gems_table_columns_storage_scopes = Object.freeze({
  all_gems: "all-gems",
});

const scoped_storage_key_prefix = `${gems_metadata_keys_localstorage_key}:`;
const scoped_order_storage_key_prefix = `${gems_metadata_keys_localstorage_key}_order:`;

/**
 * @param {string|null|undefined} scope
 * @returns {string|null}
 */
export function buildGemsMetadataKeysStorageKey(scope) {
  const cleaned_scope = String(scope || "").trim();
  if (!cleaned_scope) return null;
  return `${scoped_storage_key_prefix}${cleaned_scope}`;
}

/**
 * @param {string|null|undefined} scope
 * @returns {string|null}
 */
export function buildGemsMetadataKeysOrderStorageKey(scope) {
  const cleaned_scope = String(scope || "").trim();
  if (!cleaned_scope) return null;
  return `${scoped_order_storage_key_prefix}${cleaned_scope}`;
}

/**
 * @param {string} scope
 * @returns {string[]}
 */
export function loadGemsMetadataKeysFromStorage(scope) {
  const storage_key = buildGemsMetadataKeysStorageKey(scope);
  if (!storage_key) return [];

  const stored_keys = readStoredMetadataKeys(storage_key);
  if (stored_keys.length > 0) return stored_keys;

  if (scope === gems_table_columns_storage_scopes.all_gems) {
    return readStoredMetadataKeys(gems_metadata_keys_localstorage_key);
  }

  if (String(scope).startsWith("selection:")) {
    return readStoredMetadataKeys(selections_gems_metadata_keys_localstorage_key);
  }

  return [];
}

/**
 * Full column-picker order (enabled + disabled), scoped like selected keys.
 * @param {string} scope
 * @returns {string[]}
 */
export function loadGemsMetadataKeysOrderFromStorage(scope) {
  const storage_key = buildGemsMetadataKeysOrderStorageKey(scope);
  if (!storage_key) return [];
  return readStoredMetadataKeys(storage_key);
}

/**
 * @param {string|null|undefined} scope
 * @param {string[]} metadata_keys
 */
export function persistGemsMetadataKeysToStorage(scope, metadata_keys) {
  const storage_key = buildGemsMetadataKeysStorageKey(scope);
  if (!storage_key) return;

  const normalized_keys = normalizeGemsTableSelectedMetadataKeys(
    Array.isArray(metadata_keys) ? metadata_keys : []
  );

  try {
    localStorage.setItem(storage_key, JSON.stringify(normalized_keys));
  } catch {
    // Ignore storage write errors.
  }
}

/**
 * @param {string|null|undefined} scope
 * @param {string[]} metadata_keys
 */
export function persistGemsMetadataKeysOrderToStorage(scope, metadata_keys) {
  const storage_key = buildGemsMetadataKeysOrderStorageKey(scope);
  if (!storage_key) return;

  const normalized_keys = normalizeGemsTableSelectedMetadataKeys(
    Array.isArray(metadata_keys) ? metadata_keys : []
  );

  try {
    localStorage.setItem(storage_key, JSON.stringify(normalized_keys));
  } catch {
    // Ignore storage write errors.
  }
}

/**
 * Clear selected columns and picker order for a scope (back to catalog defaults).
 * @param {string|null|undefined} scope
 */
export function clearGemsMetadataKeysStorage(scope) {
  const selected_key = buildGemsMetadataKeysStorageKey(scope);
  const order_key = buildGemsMetadataKeysOrderStorageKey(scope);

  try {
    if (selected_key) localStorage.removeItem(selected_key);
    if (order_key) localStorage.removeItem(order_key);

    if (scope === gems_table_columns_storage_scopes.all_gems) {
      localStorage.removeItem(gems_metadata_keys_localstorage_key);
    }
    if (String(scope || "").startsWith("selection:")) {
      localStorage.removeItem(selections_gems_metadata_keys_localstorage_key);
    }
  } catch {
    // Ignore storage write errors.
  }
}

function readStoredMetadataKeys(storage_key) {
  try {
    const stored_keys_json = localStorage.getItem(storage_key);
    if (!stored_keys_json) return [];
    const stored_keys = JSON.parse(stored_keys_json);
    if (!Array.isArray(stored_keys)) return [];
    return normalizeGemsTableSelectedMetadataKeys(
      stored_keys.filter((metadata_key) => typeof metadata_key === "string")
    );
  } catch {
    return [];
  }
}
