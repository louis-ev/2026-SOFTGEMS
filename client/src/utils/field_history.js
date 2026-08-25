/**
 * Builds a chronological list (newest first) of history rows for one meta field
 * from a flat API log ({ @/components/softgems/SGContactEditTextModal.vue } parity).
 *
 * @param {Array<object>} entries
 * @param {string} field_key
 * @returns {Array<{ ts: string, value: *, author_path: string, event: string }>}
 */
export function extract_field_entries(entries, field_key) {
  const rows = [];
  const list = Array.isArray(entries) ? entries : [];

  for (const entry of list) {
    if (
      entry.event === "created" &&
      entry.fields &&
      Object.prototype.hasOwnProperty.call(entry.fields, field_key)
    ) {
      rows.push({
        ts: entry.ts,
        value: entry.fields[field_key],
        author_path: entry.author || "",
        event: "created",
      });
    } else if (entry.event === "updated" && entry.field === field_key) {
      rows.push({
        ts: entry.ts,
        value: entry.value,
        author_path: entry.author || "",
        event: "updated",
      });
    } else if (
      entry.event === "updated" &&
      entry.fields &&
      Object.prototype.hasOwnProperty.call(entry.fields, field_key)
    ) {
      rows.push({
        ts: entry.ts,
        value: entry.fields[field_key],
        author_path: entry.author || "",
        event: "updated",
      });
    }
  }
  return rows.reverse();
}
