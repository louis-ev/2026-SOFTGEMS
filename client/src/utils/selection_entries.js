/**
 * @param {*} raw
 * @returns {{ gem_path: string, sort_index?: number }[]}
 */
export function normalizeSelectionEntries(raw) {
  if (!Array.isArray(raw)) return [];
  const out = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const gp = String(item.gem_path || "").trim();
    if (!gp) continue;
    const row = { gem_path: gp };
    if (typeof item.sort_index === "number") row.sort_index = item.sort_index;
    out.push(row);
  }
  return out;
}
