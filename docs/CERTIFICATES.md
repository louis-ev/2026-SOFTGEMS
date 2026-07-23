# Gem certificates — constraints and behaviour

This document captures the certificate feature contract for SoftGems. Keep it aligned with [`settings_base.json`](../settings_base.json) and [`SGGemCertificatesSection.vue`](../client/src/components/gems/SGGemCertificatesSection.vue).

## Data model

Certificates are **not** stored on gem folder meta as a standalone array.

- Each certificate is an entry in **`gem.$files`**, validated under **`gems` → `$files` → `fields`** in [`settings_base.json`](../settings_base.json).
- Inclusion in the Certificates UI is **`is_gem_certificate === true`** (strict equality). Any other value (missing, `"true"` string only if ever stored incorrectly, etc.) should be treated as *not* a certificate for listing purposes unless we explicitly normalize elsewhere.

Defined file-level fields relevant to certificates:

| Field | Schema type | Role |
| --- | --- | --- |
| `is_gem_certificate` | `boolean` | Marks this file as a certificate for the Certificates section (set on upload via `additional_meta`). |
| `provider_path` | `string` | Provider; **`address_book/{company}`** or **`address_book/{company}/contacts/{person}`** when a company contact person is selected (same rules as selection **`counterparty_path`**). |
| `certificate_reference` | `string` | Report / reference number (free text). |
| `certificate_date` | `date` | Calendar date (stored as ISO 8601 `YYYY-MM-DD`; validated server-side via `normalizeCalendarDate`). |
| `certificate_price` | `any` | Numeric price when set; **`null`/empty clears** in UI (needs `any` so the API can persist nullable values alongside strict number validation). |

`caption` and other inherited `$files` fields remain valid for gems.

## Upload constraints

- **PDF only**: client restricts picker to PDF MIME / `.pdf`; non-PDF uploads must not be submitted through the certificate upload control.
- On upload, the client sends **`additional_meta: { is_gem_certificate: true }`** with the multipart upload so the core [`importFile`](../core2/file.js) path merges it via **`validateMeta`** against **`$files.fields`**.
- Multiple certificates per gem are supported (many PDFs).

## Presentation rules

**Certificates section** ([`SGGemCertificatesSection.vue`](../client/src/components/gems/SGGemCertificatesSection.vue)):

- Lists files where **`is_gem_certificate === true`**, newest first (`$date_uploaded` descending).
- The gem **open view** surfaces **`$files`** uploads in **Certificates** and in **Photos & videos** ([`docs/MEDIA_UPLOADS.md`](./MEDIA_UPLOADS.md)); **`$cover`** remains the overview image on the gem. The legacy **`SGGemFilesList`** component is still unused there.

Open/download links follow the same media URL rules as other gem files (`makeMediaFileURL`). PDF thumbnails use **`MediaContent`** with a modest **`resolution`** (thumb quality / payload trade-off).

## Selection PDF export links

When a gem certificate is included in a **selection PDF**, each certificate with an absolute **`https://`** or **`http://`** URL is rendered as a clickable link (`Provider – Ref`).

Relative certificate file paths are turned into absolute URLs using **`resolveAppPublicOrigin()`** ([`app_public_url.js`](../client/src/utils/app_public_url.js)), which reads **`window.app_infos.public_url`** (from the **`public_url`** setting in `settings.json`, exposed server-side via **`getPublicUrl()`**).

Set **`public_url`** to the public site origin (e.g. `https://softgems.example.com`) so PDF links remain correct when Puppeteer runs on a machine whose browser origin is **`localhost`**. If **`public_url`** is empty, the client falls back to **`window.location.origin`**.

## Editing and removal

- Field edits (**provider**, **reference**, **date**, **price**) use the same **`SGGemFieldCard`** + **`SGGemEditFieldModal`** pattern as gem folder fields: PATCH the **file meta** (`file.$path` via **`updateMeta`**); the server validates against **`gems.$files.fields`**. The provider field uses **`SGSelectionCounterpartyEditor`** (company from **`address_book`**, optional contact person at that company — same path rules as selection **`counterparty_path`**).
- **Remove**: after confirmation (**`BaseModal2`**, destructive action), the client calls **`deleteItem`** on the file meta path — the PDF and its meta are **removed from storage** and **`$files`** updates via the usual store/socket path (`fileRemoved`).

Live updates rely on existing store/socket behaviour (`getFolder` store reference plus `folderUpdated` / `fileUpdated`); no dedicated refetch hook is required for certificate saves.

## Legacy

Older data may still contain **`gem_certificates`** on gem meta from an earlier prototype. That field is **out of schema** for new builds and **ignored** by the current Certificates UI.

## References

| Topic | Location |
| --- | --- |
| Gems file field schema | [`settings_base.json`](../settings_base.json) → `schema.$folders.gems.$files.fields` |
| Certificates UI | [`SGGemCertificatesSection.vue`](../client/src/components/gems/SGGemCertificatesSection.vue) |
| Gem open shell (cover, certificates, photos/videos; no Files grid here) | [`SGGemOpenView.vue`](../client/src/views/SGGemOpenView.vue) |
| Reusable files grid component (unused on gem open) | [`SGGemFilesList.vue`](../client/src/components/gems/SGGemFilesList.vue) |
| Upload merges user meta onto file meta | [`core2/file.js`](../core2/file.js) → `importFile` (`validateMeta` + assignment into stored meta) |
| Copy / field spec sibling | [`FIELDS.md`](./FIELDS.md) |
| Photos & videos uploads | [`MEDIA_UPLOADS.md`](./MEDIA_UPLOADS.md) |
