# Gem photos & videos — constraints and behaviour

This document captures the media gallery contract for SoftGems. Align with [`settings_base.json`](../settings_base.json) and [`SGGemMediaSection.vue`](../client/src/components/gems/SGGemMediaSection.vue).

## Data model

Photos and videos are **`gem.$files`** entries validated under **`gems` → `$files` → `fields`** in [`settings_base.json`](../settings_base.json).

- Inclusion in the **Photos & videos** UI requires **`is_gem_media === true`** (strict equality) **and** file **`$type`** of **`image`** or **`video`**.

Defined file-level fields relevant to this section:

| Field | Schema type | Role |
| --- | --- | --- |
| `is_gem_media` | `boolean` | Marks this file for the Photos & videos section (set on upload via `additional_meta`). |
| `dont_link_in_pdf` | `boolean` | When **`true`**, the file is **not** linked in the selection PDF Description column. Default (absent or `false`): included. |
| `caption` | `string` | Optional caption (inherited `$files` field); not surfaced in V1 gallery UI unless extended later. |

This section does **not** use `is_gem_certificate`. Certificate PDFs remain listed only in [**Certificates**](CERTIFICATES.md).

## Upload constraints

- **Images and videos only**: the picker uses **`accept="image/*,video/*"`** with an extra client check (MIME prefixes `image/` / `video/` and common extensions).
- On upload, **`additional_meta: { is_gem_media: true }`** is merged into file meta via **`importFile`** / **`validateMeta`** (same path as certificates).
- Multiple files per gem are supported.

## Presentation rules

- [`SGGemMediaSection.vue`](../client/src/components/gems/SGGemMediaSection.vue) renders on the gem **open view** **above** the Certificates section (`SGGemOpenView`).
- Listing order: **`$media_filename` ascending** (case-insensitive); falls back to the file meta slug when the filename is missing.
- When at least one media file is present, a hint explains that photos and videos are linked in the selection PDF unless unchecked per item.
- Each item has an **Include in PDF** checkbox (edit mode). Unchecking sets **`dont_link_in_pdf: true`** via **`updateMeta`** on the file meta path.
- **`$cover`** on the gem remains separate and is unchanged by this workflow.

Preview and URLs follow **`makeMediaFileURL`** like other gem files (**`MediaContent`** at modest resolution).

## Editing and removal

- **Include in PDF**: toggle per file in the gallery; persisted as **`dont_link_in_pdf`** on file meta.
- **Remove**: after confirmation, the client calls **`deleteItem`** on the file meta path — same destructive pattern as certificate removal (`SGGemMediaRemoveModal`).

## PDF export

Selection PDF links for gem photos and videos are built by [`selection_pdf_description.js`](../client/src/utils/selection_pdf_description.js) (`buildGemPdfMediaLinkBlocks` / `gemPdfMediaFiles`). Files with **`dont_link_in_pdf === true`** are omitted. Certificate links stay in the **Description** column (one per line). Photo/video links are rendered **under the cover preview** in the Photo column, inline (alphabetically by filename). See [SELECTIONS.md](SELECTIONS.md).

## References

| Topic | Location |
| --- | --- |
| Gems `$files` field schema | [`settings_base.json`](../settings_base.json) → `schema.$folders.gems.$files.fields` |
| Media UI | [`SGGemMediaSection.vue`](../client/src/components/gems/SGGemMediaSection.vue) |
| Certificates sibling | [**`CERTIFICATES.md`**](CERTIFICATES.md) |
