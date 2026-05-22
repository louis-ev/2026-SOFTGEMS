# Selections (CDC §2.4)

This document describes how **selections** are stored and exposed in Softgems, aligned with [cahier_des_charges_softgems.md](cahier_des_charges_softgems.md) §2.4 and the field notes in [FIELDS.md](FIELDS.md).

## Data model

- Root folder type: **`selections`** (see [settings_base.json](../settings_base.json) → `schema.$folders.selections`).
- Each selection is a folder: `selections/{slug}` with numeric `slug` when `slug_naming` is `sequence` (same idea as `gems`).
- **Folder meta** (in `meta.txt`):
  - **`internal_name`** (string, required): display title.
  - **`selection_type`** (string, required): one of the CDC types (see below).
  - **`selection_date`**, **`counterparty_path`**, **`reference_number`**, **`currency`**, **`notes`**: optional header fields (date, counterparty, reference, currency are editable on the open view).
  - **`selection_entries`**: JSON **array** of gem folder paths, e.g.
    ```json
    ["gems/12", "gems/45"]
    ```
    - **Display order** is computed client-side (not stored): stone type A→Z, then weight (ct) lightest→heaviest within each type. See `sortSelectionGems` in [client/src/utils/selection_entries.js](../client/src/utils/selection_entries.js).

- **Files** on the selection folder: `$files` with thumbs, same pattern as other folder types. Uploads set `is_selection_attachment: true` in file meta so they are easy to filter in the UI.

### Gem ↔ box (type **boîte**)

- On **`gems`** meta: optional **`box_selection_path`** (string), e.g. `selections/42`, or empty if the stone is not in a box.
- **Rule:** a gem may belong to **at most one** selection whose `selection_type` is **`boîte`**. The canonical pointer is **`box_selection_path`** on the gem; the box folder’s **`selection_entries`** must stay **consistent** with that (V1: client orchestration via `assignGemToBox` in [client/src/utils/assign_gem_to_box.js](../client/src/utils/assign_gem_to_box.js)).

Other selection types may include many gems in `selection_entries` without using `box_selection_path`.

### Gem page — selection memberships

The gem open view lists **all selections** that contain the gem (any type): folders whose `selection_entries` include the gem path, plus the current box via `box_selection_path` if not already listed. See [SGGemSelectionsSection.vue](../client/src/components/gems/SGGemSelectionsSection.vue) and [gem_selection_memberships.js](../client/src/utils/gem_selection_memberships.js).

## `selection_type` values (stored strings)

Stored values match the CDC list (literal strings, including spaces):

| Value |
| --- |
| `simple` |
| `boîte` |
| `memo in` |
| `return memo in` |
| `buying invoice` |
| `memo out` |
| `return memo out` |
| `sale invoice` |
| `partner invoice` |
| `credit note` |
| `importation` |
| `importation return` |

Labels, URL slugs, and sidebar icons are defined in [selection_type_registry.js](../client/src/utils/selection_type_registry.js). Stored strings remain in [selection_types.js](../client/src/utils/selection_types.js).

## Navigation

- **Main sidebar:** top-level **Selections** item (`/selections`).
- **Secondary sidebar (56px):** one icon per type + hub grid icon; visible on all `/selections/*` routes via [SGSelectionsLayout.vue](../client/src/layouts/SGSelectionsLayout.vue).
- **Hub:** `/selections` — card grid (icon + label per type).
- **Typed list:** `/selections/{type_slug}` — table filtered to that type, sorted by **`$date_created`** descending.

## URL convention (Discourse-style)

Readable URLs keep a **stable numeric folder id**, a **type slug**, and append a **slug of `internal_name`**:

- Hub: **`/selections`**
- List: **`/selections/{type_slug}`** (e.g. `/selections/memo-in`)
- Create: **`/selections/{type_slug}/new`**
- Detail: **`/selections/{type_slug}/{folder_slug}-{title_slug}`** (e.g. `/selections/memo-in/42-acme-memo`)
- Only the **`folder_slug`** prefix is authoritative for API calls (`getFolder` / `PATCH` on `selections/{folder_slug}`). The type slug and title suffix are for navigation; legacy URLs without a type slug redirect after load.

Helpers: [selection_urls.js](../client/src/utils/selection_urls.js) (`selectionListPath`, `selectionDetailPath`, `parseSelectionFolderParam`, …).

## Related UI routes

- Layout + type sidebar: [SGSelectionsLayout.vue](../client/src/layouts/SGSelectionsLayout.vue)
- Hub: [SGSelectionsHubView.vue](../client/src/views/SGSelectionsHubView.vue)
- List + panel: [SGSelectionsView.vue](../client/src/views/SGSelectionsView.vue)
- Create: [SGSelectionNewView.vue](../client/src/views/SGSelectionNewView.vue)
- Detail: [SGSelectionOpenView.vue](../client/src/views/SGSelectionOpenView.vue)
- Gem memberships: [SGGemSelectionsSection.vue](../client/src/components/gems/SGGemSelectionsSection.vue)

## Server validation

`selection_entries` is typed as an **`array`** in the schema; updates go through the same meta validation as other fields ([`validateMeta` in core2/utils.js](../core2/utils.js)).

## Further reading

- Functional detail per type: [FIELDS.md](FIELDS.md) (memo, invoice, importation flows).
- Product scope: [cahier_des_charges_softgems.md](cahier_des_charges_softgems.md) §2.4.
