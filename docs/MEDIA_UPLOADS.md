# Gem photos & videos — constraints and behaviour

This document captures the media gallery contract for SoftGems. Align with [`settings_base.json`](../settings_base.json) and [`SGGemMediaSection.vue`](../client/src/components/gems/SGGemMediaSection.vue).

## Data model

Photos and videos are **`gem.$files`** entries validated under **`gems` → `$files` → `fields`** in [`settings_base.json`](../settings_base.json).

- Inclusion in the **Photos & videos** UI requires **`is_gem_media === true`** (strict equality) **and** file **`$type`** of **`image`** or **`video`**.

Defined file-level fields relevant to this section:

| Field | Schema type | Role |
| --- | --- | --- |
| `is_gem_media` | `boolean` | Marks this file for the Photos & videos section (set on upload via `additional_meta`). |
| `caption` | `string` | Optional caption (inherited `$files` field); not surfaced in V1 gallery UI unless extended later. |

This section does **not** use `is_gem_certificate`. Certificate PDFs remain listed only in [**Certificates**](CERTIFICATES.md).

## Upload constraints

- **Images and videos only**: the picker uses **`accept="image/*,video/*"`** with an extra client check (MIME prefixes `image/` / `video/` and common extensions).
- On upload, **`additional_meta: { is_gem_media: true }`** is merged into file meta via **`importFile`** / **`validateMeta`** (same path as certificates).
- Multiple files per gem are supported.

## Presentation rules

- [`SGGemMediaSection.vue`](../client/src/components/gems/SGGemMediaSection.vue) renders on the gem **open view** **above** the Certificates section (`SGGemOpenView`).
- Listing order: **`$date_uploaded` descending**.
- **`$cover`** on the gem remains separate and is unchanged by this workflow.

Preview and URLs follow **`makeMediaFileURL`** like other gem files (**`MediaContent`** at modest resolution).

## Editing and removal

- **Remove**: after confirmation, the client calls **`deleteItem`** on the file meta path — same destructive pattern as certificate removal (`SGGemMediaRemoveModal`).

## References

| Topic | Location |
| --- | --- |
| Gems `$files` field schema | [`settings_base.json`](../settings_base.json) → `schema.$folders.gems.$files.fields` |
| Media UI | [`SGGemMediaSection.vue`](../client/src/components/gems/SGGemMediaSection.vue) |
| Certificates sibling | [**`CERTIFICATES.md`**](CERTIFICATES.md) |
