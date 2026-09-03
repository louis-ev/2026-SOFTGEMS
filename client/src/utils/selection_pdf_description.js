import { pdfShapeAbbreviation } from "@/suggestions/softgems/pdf_shape_abbreviations.js";
import {
  makeGemMediaFileAbsoluteUrl,
  makeGemMediaViewerAbsoluteUrl,
} from "@/utils/selection_pdf_gem_helpers.js";
import {
  normalizeSelectionPdfLang,
  selectionPdfT,
} from "@/utils/selection_pdf_strings.js";

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
 * @param {{ $media_filename?: string, $path?: string }} file
 * @returns {string}
 */
export function gemFileMediaFilename(file) {
  const name = String(file?.$media_filename || "").trim();
  if (name) return name;
  const path_slug = String(file?.$path || "")
    .split("/")
    .filter(Boolean)
    .pop();
  return path_slug || "";
}

/**
 * @param {{ $media_filename?: string, $path?: string }} a
 * @param {{ $media_filename?: string, $path?: string }} b
 * @returns {number}
 */
export function compareGemFilesByMediaFilename(a, b) {
  return gemFileMediaFilename(a).localeCompare(gemFileMediaFilename(b), undefined, {
    sensitivity: "base",
  });
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
export function gemPdfMediaFiles(gem) {
  const files = Array.isArray(gem?.$files) ? gem.$files : [];
  return files
    .filter(
      (file) =>
        file &&
        file.is_gem_media === true &&
        (file.$type === "image" || file.$type === "video") &&
        file.dont_link_in_pdf !== true
    )
    .slice()
    .sort(compareGemFilesByMediaFilename);
}

/**
 * @param {object} gem
 * @returns {object[]}
 */
export function gemVideoFiles(gem) {
  return gemPdfMediaFiles(gem).filter((file) => file.$type === "video");
}

/** Separator between provider name and certificate reference in PDF links. */
export const selection_pdf_certificate_link_separator = " – ";

/**
 * @param {string} provider_path
 * @param {Record<string, string>} [provider_labels_by_path]
 * @returns {string}
 */
export function resolveCertificateProviderLabel(
  provider_path,
  provider_labels_by_path = {}
) {
  const path = String(provider_path || "").trim();
  if (!path) return "";
  const mapped = String(provider_labels_by_path[path] || "").trim();
  // Prefer resolved company/contact name; never show a raw address_book path.
  if (mapped && !mapped.startsWith("address_book/")) return mapped;
  const segments = path.split("/").filter(Boolean);
  return segments[segments.length - 1] || "";
}

/**
 * @param {object} certificate_file
 * @param {Record<string, string>} [provider_labels_by_path]
 * @param {string} [lang="en"]
 * @returns {string}
 */
export function formatCertificateLinkLabel(
  certificate_file,
  provider_labels_by_path = {},
  lang = "en"
) {
  const provider_label = resolveCertificateProviderLabel(
    certificate_file?.provider_path,
    provider_labels_by_path
  );
  const reference = String(
    certificate_file?.certificate_reference || ""
  ).trim();
  if (provider_label && reference) {
    return `${provider_label}${selection_pdf_certificate_link_separator}${reference}`;
  }
  if (reference) return reference;
  if (provider_label) return provider_label;
  const filename = String(certificate_file?.$media_filename || "").trim();
  return filename || selectionPdfT(lang, "certificate_fallback");
}

/**
 * @param {object} video_file
 * @param {number} index
 * @param {string} [lang="en"]
 * @returns {string}
 */
export function formatVideoLinkLabel(video_file, index = 0, lang = "en") {
  return formatMediaLinkLabel(video_file, index, lang);
}

/**
 * @param {object} media_file
 * @param {number} index
 * @param {string} [lang="en"]
 * @returns {string}
 */
export function formatMediaLinkLabel(media_file, index = 0, lang = "en") {
  const filename = String(media_file?.$media_filename || "").trim();
  if (filename) return filename;
  const is_video = media_file?.$type === "video";
  const fallback = selectionPdfT(
    lang,
    is_video ? "video_fallback" : "photo_fallback"
  );
  return index === 0 ? fallback : `${fallback} ${index + 1}`;
}

/**
 * @typedef {{ type: 'text'|'link', text: string, href?: string, is_certificate_link?: boolean, is_media_link?: boolean }} PdfDescriptionBlock
 */

/**
 * Description column: text fields + certificate links (one link block each).
 * Photo/video links are built separately for the Photo column.
 *
 * @param {object} gem
 * @param {string} [origin]
 * @param {{ provider_labels_by_path?: Record<string, string>, lang?: string }} [options]
 * @returns {PdfDescriptionBlock[]}
 */
export function buildGemPdfDescriptionBlocks(gem, origin = "", options = {}) {
  const provider_labels_by_path =
    options?.provider_labels_by_path &&
    typeof options.provider_labels_by_path === "object"
      ? options.provider_labels_by_path
      : {};
  const lang = normalizeSelectionPdfLang(options?.lang);
  /** @type {PdfDescriptionBlock[]} */
  const blocks = [];

  const title = formatGemPdfTitleLine(gem);
  if (title) blocks.push({ type: "text", text: title });

  const dimensions = formatGemPdfDimensionsLine(gem);
  if (dimensions) blocks.push({ type: "text", text: dimensions });

  const treatment = String(gem?.treatment_type || "").trim();
  if (treatment) blocks.push({ type: "text", text: treatment });

  const origin_country = String(gem?.origin_country || "").trim();
  if (origin_country) {
    blocks.push({
      type: "text",
      text: selectionPdfT(lang, "origin_prefix", { value: origin_country }),
    });
  }

  const country_of_cut = String(gem?.country_of_cut || "").trim();
  if (country_of_cut) {
    blocks.push({
      type: "text",
      text: selectionPdfT(lang, "country_of_cut_prefix", {
        value: country_of_cut,
      }),
    });
  }

  const reference_customer = String(gem?.reference_customer || "").trim();
  if (reference_customer) {
    blocks.push({
      type: "text",
      text: selectionPdfT(lang, "reference_customer_prefix", {
        value: reference_customer,
      }),
    });
  }

  gemCertificateFiles(gem).forEach((certificate_file) => {
    const text = formatCertificateLinkLabel(
      certificate_file,
      provider_labels_by_path,
      lang
    );
    const href = makeGemMediaFileAbsoluteUrl(certificate_file, origin);
    if (!text || !href || !/^https?:\/\//i.test(href)) return;
    blocks.push({
      type: "link",
      text,
      href,
      is_certificate_link: true,
    });
  });

  return blocks;
}

/**
 * Photo/video links for under the cover preview in the PDF Photo column.
 *
 * @param {object} gem
 * @param {string} [origin]
 * @param {{ lang?: string }} [options]
 * @returns {PdfDescriptionBlock[]}
 */
export function buildGemPdfMediaLinkBlocks(gem, origin = "", options = {}) {
  const lang = normalizeSelectionPdfLang(options?.lang);
  /** @type {PdfDescriptionBlock[]} */
  const link_blocks = [];

  gemPdfMediaFiles(gem).forEach((media_file, index) => {
    const href = makeGemMediaViewerAbsoluteUrl(media_file, origin);
    const text = formatMediaLinkLabel(media_file, index, lang);
    if (href && /^https?:\/\//i.test(href)) {
      link_blocks.push({
        type: "link",
        text,
        href,
        is_media_link: true,
      });
    } else if (text) {
      link_blocks.push({ type: "text", text, is_media_link: true });
    }
  });

  return link_blocks;
}
