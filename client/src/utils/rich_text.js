/**
 * Strip HTML tags and collapse whitespace for plain-text display.
 * @param {unknown} html
 * @returns {string}
 */
export function htmlToPlainText(html) {
  if (html === null || html === undefined) return "";
  const raw = String(html);
  if (!raw.trim()) return "";
  if (typeof document === "undefined") {
    return raw
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }
  const temp = document.createElement("div");
  temp.innerHTML = raw;
  return String(temp.innerText || temp.textContent || "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * True when rich-text HTML has no visible text.
 * @param {unknown} html
 * @returns {boolean}
 */
export function isEmptyRichText(html) {
  return htmlToPlainText(html) === "";
}
