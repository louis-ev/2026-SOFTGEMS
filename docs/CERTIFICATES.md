# Gem certificates — constraints and behaviour

This document captures the certificate feature contract for SoftGems. Keep it aligned with [`settings_base.json`](../settings_base.json) and [`SGGemCertificatesSection.vue`](../client/src/components/gems/SGGemCertificatesSection.vue).

## Data model

Certificates are **not** stored on gem folder meta as a standalone array.

- Each certificate is an entry in **`gem.$files`**, validated under **`gems` → `$files` → `fields`** in [`settings_base.json`](../settings_base.json).
- Inclusion in the Certificates UI is **`is_gem_certificate === true`** (strict equality). Any other value (missing, `"true"` string only if ever stored incorrectly, etc.) should be treated as *not* a certificate for listing purposes unless we explicitly normalize elsewhere.

Defined file-level fields relevant to certificates:

| Field | Schema type | Role |
| --- | --- | --- |
| `is_gem_certificate` | `boolean` | Marks this file as a certificate for the Certificates section. |
| `provider_path` | `string` | Provider/contact; value is typically an **`authors`** folder path (address book convention in the client). |
| `certificate_reference` | `string` | Report / reference number (free text). |
| `certificate_date` | `string` | Date (stored as ISO `YYYY-MM-DD` from the `<input type="date">`; keep format stable for exports). |
| `certificate_price` | `any` | Numeric price when set; **`null`/empty clears** in UI (needs `any` so the API can persist nullable values alongside strict number validation). |

`caption` and other inherited `$files` fields remain valid for gems.

## Upload constraints

- **PDF only**: client restricts picker to PDF MIME / `.pdf`; non-PDF uploads must not be submitted through the certificate upload control.
- On upload, the client sends **`additional_meta: { is_gem_certificate: true }`** with the multipart upload so the core [`importFile`](../core2/file.js) path merges it via **`validateMeta`** against **`$files.fields`**.
- Multiple certificates per gem are supported (many PDFs).

## Presentation rules

**Certificates section** ([`SGGemCertificatesSection.vue`](../client/src/components/gems/SGGemCertificatesSection.vue)):

- Lists files where **`is_gem_certificate === true`**, newest first (`$date_uploaded` descending).

**General “Files” grid** ([`SGGemFilesList.vue`](../client/src/components/gems/SGGemFilesList.vue)):

- Lists files where **`is_gem_certificate !== true`**, so certificate PDFs are not duplicated beside the Certificates block.

Open/download links follow the same media URL rules as other gem files (`makeMediaFileURL`).

## Editing and removal

- Field edits (**provider**, **reference**, **date**, **price**) PATCH the **file meta** (`file.$path` via the client **`updateMeta`** helper); the server validates against **`gems.$files.fields`**.
- **Remove** does **not** delete the blob: it sets **`is_gem_certificate: false`**. The file then appears again in the general Files grid (metadata such as provider fields may remain on the meta object until cleared manually if needed).

Live updates rely on existing store/socket behaviour (`getFolder` store reference plus `folderUpdated` / `fileUpdated`); no dedicated refetch hook is required for certificate saves.

## Legacy

Older data may still contain **`gem_certificates`** on gem meta from an earlier prototype. That field is **out of schema** for new builds and **ignored** by the current Certificates UI.

## References

| Topic | Location |
| --- | --- |
| Gems file field schema | [`settings_base.json`](../settings_base.json) → `schema.$folders.gems.$files.fields` |
| Certificates UI | [`SGGemCertificatesSection.vue`](../client/src/components/gems/SGGemCertificatesSection.vue) |
| Files grid filter | [`SGGemFilesList.vue`](../client/src/components/gems/SGGemFilesList.vue) |
| Upload merges user meta onto file meta | [`core2/file.js`](../core2/file.js) → `importFile` (`validateMeta` + assignment into stored meta) |
| Copy / field spec sibling | [`FIELDS.md`](./FIELDS.md) |
