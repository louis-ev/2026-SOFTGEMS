/**
 * @param {object|null|undefined} meta
 * @returns {string}
 */
export function formatFolderMetaJson(meta) {
  try {
    return JSON.stringify(meta || {}, null, 2);
  } catch {
    return "{}";
  }
}
