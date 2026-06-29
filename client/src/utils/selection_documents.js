/** Selection types without a single main PDF (attachments only). */
export const SELECTION_TYPES_WITHOUT_MAIN_DOCUMENT = Object.freeze(["simple"]);

export function selectionTypeHasMainDocument(selection_type) {
  const value = String(selection_type || "").trim();
  if (!value) return false;
  return !SELECTION_TYPES_WITHOUT_MAIN_DOCUMENT.includes(value);
}

export function isSelectionMainDocumentFile(file) {
  return file?.is_selection_main_document === true;
}

export function isSelectionAttachmentFile(file) {
  if (!file) return false;
  if (isSelectionMainDocumentFile(file)) return false;
  if (isSelectionGeneratedPdfFile(file)) return false;
  if (file.is_selection_attachment === false) return false;
  if (file.is_gem_media === true || file.is_gem_certificate === true) return false;
  return true;
}

export function findSelectionMainDocumentFile(selection_folder) {
  const files = Array.isArray(selection_folder?.$files)
    ? selection_folder.$files
    : [];
  return (
    files
      .filter((file) => file && isSelectionMainDocumentFile(file))
      .slice()
      .sort(
        (a, b) =>
          +new Date(b?.$date_uploaded || 0) - +new Date(a?.$date_uploaded || 0),
      )[0] || null
  );
}

export function isSelectionGeneratedPdfFile(file) {
  return file?.is_selection_generated_pdf === true;
}

export function findSelectionGeneratedPdfFiles(selection_folder) {
  const files = Array.isArray(selection_folder?.$files)
    ? selection_folder.$files
    : [];
  return files
    .filter((file) => file && isSelectionGeneratedPdfFile(file))
    .slice()
    .sort(
      (a, b) =>
        +new Date(b?.$date_uploaded || 0) - +new Date(a?.$date_uploaded || 0)
    );
}

export function isPdfFile(file) {
  if (!file) return false;
  const name = String(file.name || "").toLowerCase();
  return file.type === "application/pdf" || name.endsWith(".pdf");
}
