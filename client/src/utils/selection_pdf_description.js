import { pdfShapeAbbreviation } from "@/suggestions/softgems/pdf_shape_abbreviations.js";
import {
  makeGemMediaFileAbsoluteUrl,
  makeGemMediaFilePath,
} from "@/utils/selection_pdf_gem_helpers.js";

/**
 * @param {object} gem
 * @returns {string}
 */
export function formatGemPdfTitleLine(gem) {
  const color = String(gem?.color || "").trim();
  const stone_type = String(gem?.stone_type || "").trim();
  const shape_abbr = pdfShapeAbbreviation(gem?.shape);
  return [color, stone_type, shape_abbr].filter(Boolean).join(" ");
}

/**
 * @param {object} gem
 * @returns {string}
 */
export function formatGemPdfDimensionsLine(gem) {
  const fmt = (raw) => {
    const n = Number(raw);
    if (!Number.isFinite(n)) return "";
    return n.toLocaleString("en-GB", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  };
  const length = fmt(gem?.length_mm);
  const width = fmt(gem?.width_mm);
  const height = fmt(gem?.height_mm);
  if (!length && !width && !height) return "";
  return `${length || "—"} x ${width || "—"} x ${height || "—"}`;
}

/**
 * @param {object} gem
 * @returns {object[]}
 */
export function gemCertificateFiles(gem) {
  const files = Array.isArray(gem?.$files) ? gem.$files : [];
  return files
    .filter((file) => file && file.is_gem_certificate === true)
    .slice()
    .sort(
      (a, b) =>
        +new Date(b?.$date_uploaded || 0) - +new Date(a?.$date_uploaded || 0)
    );
}

/**
 * @param {object} gem
 * @returns {object[]}
 */
export function gemVideoFiles(gem) {
  const files = Array.isArray(gem?.$files) ? gem.$files : [];
  return files
    .filter((file) => file && file.is_gem_media === true && file.$type === "video")
    .slice()
    .sort(
      (a, b) =>
        +new Date(b?.$date_uploaded || 0) - +new Date(a?.$date_uploaded || 0)
    );
}

/**
 * @param {object} certificate_file
 * @returns {string}
 */
export function formatCertificateLinkLabel(certificate_file) {
  const provider = String(certificate_file?.provider_path || "").trim();
  const provider_label = provider
    ? provider.split("/").filter(Boolean).pop() || provider
    : "";
  const reference = String(
    certificate_file?.certificate_reference || ""
  ).trim();
  if (provider_label && reference) return `${provider_label} ${reference}`;
  if (reference) return reference;
  if (provider_label) return provider_label;
  const filename = String(certificate_file?.$media_filename || "").trim();
  return filename || "Certificate";
}

/**
 * @param {object} video_file
 * @param {number} index
 * @returns {string}
 */
export function formatVideoLinkLabel(video_file, index = 0) {
  const filename = String(video_file?.$media_filename || "").trim();
  if (filename) return filename;
  return index === 0 ? "Video" : `Video ${index + 1}`;
}

/**
 * @typedef {{ type: 'text'|'link', text: string, href?: string, is_certificate_link?: boolean }} PdfDescriptionBlock
 */

/**
 * @param {object} gem
 * @param {string} [origin]
 * @returns {PdfDescriptionBlock[]}
 */
export function buildGemPdfDescriptionBlocks(gem, origin = "") {
  /** @type {PdfDescriptionBlock[]} */
  const blocks = [];
  /** @type {PdfDescriptionBlock[]} */
  const certificate_blocks = [];

  const title = formatGemPdfTitleLine(gem);
  if (title) blocks.push({ type: "text", text: title });

  const dimensions = formatGemPdfDimensionsLine(gem);
  if (dimensions) blocks.push({ type: "text", text: dimensions });

  const treatment = String(gem?.treatment_type || "").trim();
  if (treatment) blocks.push({ type: "text", text: treatment });

  const origin_country = String(gem?.origin_country || "").trim();
  if (origin_country) {
    blocks.push({ type: "text", text: `Origin: ${origin_country}` });
  }

  const country_of_cut = String(gem?.country_of_cut || "").trim();
  if (country_of_cut) {
    blocks.push({ type: "text", text: `Country of cut: ${country_of_cut}` });
  }

  gemVideoFiles(gem).forEach((video_file, index) => {
    const href = makeGemMediaFileAbsoluteUrl(video_file, origin);
    const text = formatVideoLinkLabel(video_file, index);
    if (href) blocks.push({ type: "link", text, href });
    else if (text) blocks.push({ type: "text", text });
  });

  gemCertificateFiles(gem).forEach((certificate_file) => {
    const text = formatCertificateLinkLabel(certificate_file);
    const href =
      makeGemMediaFileAbsoluteUrl(certificate_file, origin) ||
      makeGemMediaFilePath(certificate_file);
    if (!text || !href) return;
    certificate_blocks.push({
      type: "link",
      text,
      href,
      is_certificate_link: true,
    });
  });

  return [...blocks, ...certificate_blocks];
}
