# Selections (CDC §2.4)

This document describes how **selections** are stored and exposed in Softgems, aligned with [cahier_des_charges_softgems.md](cahier_des_charges_softgems.md) §2.4 and the field notes in [FIELDS.md](FIELDS.md).

## Data model

- Root folder type: **`selections`** (see [settings_base.json](../settings_base.json) → `schema.$folders.selections`).
- Each selection is a folder: `selections/{slug}` with numeric `slug` when `slug_naming` is `sequence` (same idea as `gems`).
- **Folder meta** (in `meta.txt`):

  - **`internal_name`** (string, required): display title.
  - **`selection_type`** (string, required): one of the CDC types (see below).
  - **`selection_date`**, **`document_number_name`**, **`counterparty_path`**, **`reference_number`**, **`currency`**, **`notes`**: optional header fields (date, document number / name, counterparty, reference, currency are editable on the open view). **`selection_date`** defaults to **today’s local date** when a selection is created and is stored as an **ISO 8601 calendar date** (`YYYY-MM-DD`, schema `type: "date"`) — not a full timestamp like `$date_created`.
  - **`counterparty_path`**: optional string pointing to either an address-book contact folder (`address_book/{slug}`) or a person within a company contact (`address_book/{slug}/contacts/{person_slug}`). UI: two-step picker in [SGSelectionCounterpartyEditor.vue](../client/src/components/selections/SGSelectionCounterpartyEditor.vue) (company/individual, then optional company contact); label helpers: [address_book_paths.js](../client/src/utils/address_book_paths.js).
  - **`partnership_purchase`** / **`partnership_purchased_percentage`**: optional on **`buying invoice`** selections only — partnership purchase checkbox and purchased percentage (0–100). UI: [SGSelectionBuyingInvoiceFieldsSection.vue](../client/src/components/selections/SGSelectionBuyingInvoiceFieldsSection.vue).
  - **`selection_entries`**: JSON **array** of gem folder paths, e.g.
    ```json
    ["gems/12", "gems/45"]
    ```
    - **Display order** is computed client-side (not stored): stone type A→Z, then weight (ct) lightest→heaviest within each type. See `sortSelectionGems` in [client/src/utils/selection_entries.js](../client/src/utils/selection_entries.js).

- **Files** on the selection folder: `$files` with thumbs, same pattern as other folder types.
  - **Main document** (all types except **`simple`**): exactly one **PDF**, flagged with **`is_selection_main_document: true`** and **`is_selection_attachment: false`**. Shown in its own section directly under the selection title on the open view; replacing uploads a new PDF and removes the previous one.
  - **Attachments** (all types, including **`simple`**): optional extra files (PDF or images), flagged with **`is_selection_attachment: true`**. Listed in the **Attachments** section; **`simple`** selections have attachments only (no main document).

### Gem ↔ box (type **boîte**)

- On **`gems`** meta: optional **`box_selection_path`** (string), e.g. `selections/42`, or empty if the stone is not in a box.
- **Rule:** a gem may belong to **at most one** selection whose `selection_type` is **`boîte`**. The canonical pointer is **`box_selection_path`** on the gem; the box folder’s **`selection_entries`** must stay **consistent** with that (V1: client orchestration via `assignGemToBox` in [client/src/utils/assign_gem_to_box.js](../client/src/utils/assign_gem_to_box.js)).

Other selection types may include many gems in `selection_entries` without using `box_selection_path`.

### Gem page — selection memberships

The gem open view lists **all selections** that contain the gem (any type): folders whose `selection_entries` include the gem path, plus the current box via `box_selection_path` if not already listed. See [SGGemSelectionsSection.vue](../client/src/components/gems/SGGemSelectionsSection.vue) and [gem_selection_memberships.js](../client/src/utils/gem_selection_memberships.js).

**Add dates (denormalized on the gem):** `selection_membership_paths` maps `selections/{slug}` → ISO timestamp when the gem was added to that selection. Membership **presence** is always derived from selection `selection_entries` (source of truth); the gem field is only a date cache, written on add and cleared on remove via [gem_selection_membership_paths.js](../client/src/utils/gem_selection_membership_paths.js).

## `selection_type` values (stored strings)

Stored values match the CDC list (literal strings, including spaces):

| Value                |
| -------------------- |
| `simple`             |
| `boîte`              |
| `memo in`            |
| `return memo in`     |
| `buying invoice`     |
| `memo out`           |
| `return memo out`    |
| `sale invoice`       |
| `partner invoice`    |
| `credit note`        |
| `importation`        |
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
- Selection title (click to edit **`internal_name`** when allowed): [SGSelectionOpenView.vue](../client/src/views/SGSelectionOpenView.vue)
- Document details (date, document number / name, counterparty, reference, currency): [SGSelectionHeaderFieldsSection.vue](../client/src/components/selections/SGSelectionHeaderFieldsSection.vue)
- Main PDF: [SGSelectionMainDocumentSection.vue](../client/src/components/selections/SGSelectionMainDocumentSection.vue), [SGSelectionMainDocumentField.vue](../client/src/components/selections/SGSelectionMainDocumentField.vue)
- Attachments: [SGSelectionFilesSection.vue](../client/src/components/selections/SGSelectionFilesSection.vue)
- Gem memberships: [SGGemSelectionsSection.vue](../client/src/components/gems/SGGemSelectionsSection.vue)

## PDF export (V1)

Enabled for: **box**, **return memo in**, **buying invoice**, **memo out**, **return memo out**, **sale invoice**, **partner invoice**, **credit note**, **importation return** (not `simple`, `memo in`, `importation`).

- **UI:** **Exporter en PDF** on [SGSelectionOpenView.vue](../client/src/views/SGSelectionOpenView.vue) opens [SGSelectionPdfExportModal.vue](../client/src/components/selections/SGSelectionPdfExportModal.vue) — fixed columns per selection type (read-only list from [selection_pdf_export_registry.js](../client/src/utils/selection_pdf_export_registry.js)); after generation, inline PDF preview and optional **Set as main document** (replaces any existing main document).
- **Print view:** canonical folder URL `/selections/{folder_slug}?cols=…` (columns encoded from the registry for that type) → static [SGSelectionExportView.vue](../client/src/views/SGSelectionExportView.vue) + [SGSelectionPdfDocument.vue](../client/src/components/selections/SGSelectionPdfDocument.vue); Puppeteer via `exportFolder` — `_export` in [api2.js](../core2/api2.js) sets `export_query` from `selection_pdf_export`; [Exporter.js](../core2/Exporter.js) merges `export_query` like publication export params.
- **Absolute links in PDF:** certificate and video hyperlinks use [`resolveAppPublicOrigin()`](../client/src/utils/app_public_url.js) (`window.app_infos.public_url` from the **`public_url`** setting in `settings.json`, exposed via [`getPublicUrl()`](../core2/utils.js) in [index.pug](../index.pug)). Set **`public_url`** to the public site URL so links stay correct when Puppeteer opens the print view on **`localhost`**. See also [CERTIFICATES.md](CERTIFICATES.md).
- **Layout:** invoice-style header (placeholder logo, order / supplier account numbers, counterparty name and postal address from address-book meta `address_street` / `address_city` / `address_zip` / `address_country` via [contact_address.js](../client/src/utils/contact_address.js) — street on one line, `ZIP city` on the next, country last), fixed table (`REF`, composite `Description`, photo, qty, weight, `$/ct`, total), VAT 20%, bank footer from instance presets `selection_pdf_bank_footer_en` (`SELECTION_PDF_BANK_FOOTER_EN`: array of `{ id, internal_name, body }`; pick one in export modal, default first; `bank_footer_id` in print URL; server resolves `bank_footer_en` into the print URL at export time), legal text and ACF footer. Description content uses [pdf_shape_abbreviations.js](../client/src/suggestions/softgems/pdf_shape_abbreviations.js) and [selection_pdf_description.js](../client/src/utils/selection_pdf_description.js) (title, dimensions, treatment, origin, country of cut, video links, then certificate links always as hyperlinks at the bottom).
- **Storage:** every export is saved on the selection folder with `is_selection_generated_pdf: true`, `is_selection_attachment: false`, and `$date_uploaded` as generation date; listed only in [SGSelectionGeneratedPdfsSection.vue](../client/src/components/selections/SGSelectionGeneratedPdfsSection.vue) (never in Attachments). After preview, **Set as main document** updates the file with `is_selection_main_document: true` and removes the previous main document if any.
- **Registry / columns:** [selection_pdf_export_registry.js](../client/src/utils/selection_pdf_export_registry.js), [selection_pdf_columns.js](../client/src/utils/selection_pdf_columns.js).
- **PDF language:** French only (titles, legal text, footer).

## Server validation

`selection_entries` is typed as an **`array`** in the schema; updates go through the same meta validation as other fields ([`validateMeta` in core2/utils.js](../core2/utils.js)).

## Further reading

- Functional detail per type: [FIELDS.md](FIELDS.md) (memo, invoice, importation flows).
- Product scope: [cahier_des_charges_softgems.md](cahier_des_charges_softgems.md) §2.4.
