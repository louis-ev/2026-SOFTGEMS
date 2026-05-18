# Selections (CDC §2.4)

This document describes how **selections** are stored and exposed in Softgems, aligned with [cahier_des_charges_softgems.md](cahier_des_charges_softgems.md) §2.4 and the field notes in [FIELDS.md](FIELDS.md).

## Data model

- Root folder type: **`selections`** (see [settings_base.json](../settings_base.json) → `schema.$folders.selections`).
- Each selection is a folder: `selections/{slug}` with numeric `slug` when `slug_naming` is `sequence` (same idea as `gems`).
- **Folder meta** (in `meta.txt`):
  - **`internal_name`** (string, required): display title.
  - **`selection_type`** (string, required): one of the CDC types (see below).
  - **`selection_date`**, **`counterparty_path`**, **`reference_number`**, **`currency`**, **`notes`**: optional header fields (V1 uses a subset in the UI; extend per [FIELDS.md](FIELDS.md)).
  - **`selection_entries`**: JSON **array** of line objects, e.g.
    ```json
    [
      { "gem_path": "gems/12", "sort_index": 0 }
    ]
    ```
    - **`gem_path`**: stable folder path of the gem.
    - **`sort_index`**: optional ordering key for tables / exports.

- **Files** on the selection folder: `$files` with thumbs, same pattern as other folder types. Uploads set `is_selection_attachment: true` in file meta so they are easy to filter in the UI.

### Gem ↔ box (type **boîte**)

- On **`gems`** meta: optional **`box_selection_path`** (string), e.g. `selections/42`, or empty if the stone is not in a box.
- **Rule:** a gem may belong to **at most one** selection whose `selection_type` is **`boîte`**. The canonical pointer is **`box_selection_path`** on the gem; the box folder’s **`selection_entries`** must stay **consistent** with that (V1: client orchestration via `assignGemToBox` in [client/src/utils/assign_gem_to_box.js](../client/src/utils/assign_gem_to_box.js)).

Other selection types may include many gems in `selection_entries` without using `box_selection_path`.

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

Labels in the UI are translated in [en_softgems.js](../client/src/adc-core/lang/en_softgems.js). The canonical list in code is `SELECTION_TYPE_VALUES` in [client/src/utils/selection_types.js](../client/src/utils/selection_types.js).

## URL convention (Discourse-style)

Readable URLs keep a **stable numeric folder id** and append a **slug of `internal_name`**:

- Pattern: **`/selections/{folder_slug}-{title_slug}`**
- Example: `/selections/42-memo-in-acme`
- Only the **`folder_slug`** prefix is authoritative for API calls (`getFolder` / `PATCH` on `selections/{folder_slug}`). The suffix is ignored by the server and can be corrected client-side with `router.replace` after rename.

Helpers: [client/src/utils/selection_urls.js](../client/src/utils/selection_urls.js) (`parseSelectionPathParam`, `selectionDetailPath`, `slugifySelectionTitle`).

## Related UI routes

- List + panel: [SGSelectionsView.vue](../client/src/views/SGSelectionsView.vue)
- Create: [SGSelectionNewView.vue](../client/src/views/SGSelectionNewView.vue)
- Detail: [SGSelectionOpenView.vue](../client/src/views/SGSelectionOpenView.vue)
- Gem “box” assignment: [SGGemOpenView.vue](../client/src/views/SGGemOpenView.vue)

## Server validation

`selection_entries` is typed as an **`array`** in the schema; updates go through the same meta validation as other fields ([`validateMeta` in core2/utils.js](../core2/utils.js)).

## Further reading

- Functional detail per type: [FIELDS.md](FIELDS.md) (memo, invoice, importation flows).
- Product scope: [cahier_des_charges_softgems.md](cahier_des_charges_softgems.md) §2.4.
