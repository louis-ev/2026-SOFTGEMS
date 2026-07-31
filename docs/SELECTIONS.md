# Selections (CDC §2.4)

This document describes how **selections** are stored and exposed in Softgems, aligned with [cahier_des_charges_softgems.md](cahier_des_charges_softgems.md) §2.4 and the field notes in [FIELDS.md](FIELDS.md).

## Data model

- Each **selection type** is a **top-level folder type** in the schema (sibling of `gems` / `address_book`), see [settings_base.json](../settings_base.json) → `schema.$folders.{type_slug}`.
- There is **no** `selections/` storage parent. Disk layout mirrors other roots: `softgems_content/gems/…`, `softgems_content/memo-in/…`, `softgems_content/box/…`, etc.
- Each type uses `slug_naming: "sequence"` and `slug_sequence_start: 1`, e.g. `box/1`, `memo-in/2`. Sequence counters are **per type** (native dodoc `.slug-sequence.json` in each `{type_slug}/`).
- **Selection type** is **derived from the folder path** (`box/12` → `boîte`); it is no longer stored in meta. Client helper: [`selection_paths.js`](../client/src/utils/selection_paths.js) (`resolveSelectionType`, `parseSelectionFolderPath`).
- **Document number** for PDFs and the open view is the **folder slug** (e.g. `12` for `box/12`), via `selectionDocumentNumber()`. The former `document_number_name` meta field is removed.
- **Folder meta** (in `meta.txt`):

  - **`internal_name`** (string, required): display title.
  - **`selection_date`**, **`counterparty_path`**, **`reference_number`**, **`currency`**, **`notes`**: optional header fields (date, counterparty, reference, currency are editable on the open view). **`selection_date`** defaults to **today’s local date** when a selection is created and is stored as an **ISO 8601 calendar date** (`YYYY-MM-DD`, schema `type: "date"`) — not a full timestamp like `$date_created`.
  - **`counterparty_path`**: optional string pointing to either an address-book contact folder (`address_book/{slug}`) or a person within a company contact (`address_book/{slug}/contacts/{person_slug}`). UI: two-step picker in [SGSelectionCounterpartyEditor.vue](../client/src/components/selections/SGSelectionCounterpartyEditor.vue) (company/individual, then optional company contact); label helpers: [address_book_paths.js](../client/src/utils/address_book_paths.js).
  - **`partnership_purchase`** / **`partnership_purchased_percentage`**: optional on **`buying invoice`** selections only (`buying-invoice/{n}`) — partnership purchase checkbox and purchased percentage (0–100). UI: [SGSelectionBuyingInvoiceFieldsSection.vue](../client/src/components/selections/SGSelectionBuyingInvoiceFieldsSection.vue).
  - **`selection_entries`**: JSON **array** of gem folder paths, e.g.
    ```json
    ["gems/12", "gems/45"]
    ```
    - **Display order** is computed client-side (not stored): stone type A→Z, then weight (ct) lightest→heaviest within each type. See `sortSelectionGems` in [client/src/utils/selection_entries.js](../client/src/utils/selection_entries.js).

- **Files** on the selection folder: `$files` with thumbs, same pattern as other folder types.
  - **Main document** (all types except **`simple`**): exactly one **PDF**, flagged with **`is_selection_main_document: true`** and **`is_selection_attachment: false`**. Shown in its own section directly under the selection title on the open view; replacing uploads a new PDF and removes the previous one.
  - **Attachments** (all types, including **`simple`**): optional extra files (PDF or images), flagged with **`is_selection_attachment: true`**. Listed in the **Attachments** section; **`simple`** selections have attachments only (no main document).

### Gem ↔ box (type **boîte**)

- On **`gems`** meta: optional **`box_selection_path`** (string), e.g. `box/3`, or empty if the stone is not in a box.
- **Rule:** a gem may belong to **at most one** box selection. The canonical pointer is **`box_selection_path`** on the gem; the box folder’s **`selection_entries`** must stay **consistent** with that (V1: client orchestration via `assignGemToBox` in [client/src/utils/assign_gem_to_box.js](../client/src/utils/assign_gem_to_box.js)). Box folders live at `box/{n}`.

Other selection types may include many gems in `selection_entries` without using `box_selection_path`.

### Gem page — selection memberships

The gem open view lists **all selections** that contain the gem (any type): folders whose `selection_entries` include the gem path, plus the current box via `box_selection_path` if not already listed. See [SGGemSelectionsSection.vue](../client/src/components/gems/SGGemSelectionsSection.vue) and [gem_selection_memberships.js](../client/src/utils/gem_selection_memberships.js).

**Add dates (denormalized on the gem):** `selection_membership_paths` maps full selection paths (e.g. `memo-in/2`) → ISO timestamp when the gem was added to that selection. Membership **presence** is always derived from selection `selection_entries` (source of truth); the gem field is an index/date cache, written on add and cleared on remove via [gem_selection_membership_paths.js](../client/src/utils/gem_selection_membership_paths.js).

**Heal on open (opt-in):** when a selection’s gems are loaded, Softgems detects missing `selection_membership_paths` / empty `box_selection_path` and shows a notice under the table ([SGSelectionGemsSection.vue](../client/src/components/selections/SGSelectionGemsSection.vue)). The author can click **Fix gem shortcut info** to run [heal_gem_selection_indexes.js](../client/src/utils/heal_gem_selection_indexes.js). A gem whose `box_selection_path` points at a *different* box is left unchanged for that field (conflict).

## `selection_type` values (CDC strings)

Type is implied by the **first path segment** (see [selection_type_registry.js](../client/src/utils/selection_type_registry.js)). Stored CDC strings (for labels, gem status, PDF registry):

| Slug (path)           | CDC value (`resolveSelectionType`) |
| --------------------- | ---------------------------------- |
| `simple`              | `simple`                           |
| `box`                 | `boîte`                            |
| `memo-in`             | `memo in`                          |
| `return-memo-in`      | `return memo in`                   |
| `buying-invoice`      | `buying invoice`                   |
| `memo-out`            | `memo out`                         |
| `return-memo-out`     | `return memo out`                  |
| `sale-invoice`        | `sale invoice`                     |
| `partner-invoice`     | `partner invoice`                  |
| `credit-note`         | `credit note`                      |
| `importation`         | `importation`                      |
| `importation-return`  | `importation return`               |

Labels, URL slugs, and sidebar icons are defined in [selection_type_registry.js](../client/src/utils/selection_type_registry.js).

## Navigation

- **Main sidebar:** top-level **Selections** item (`/selections`).
- **Secondary sidebar (56px):** one icon per type + hub grid icon; visible on all `/selections/*` routes via [SGSelectionsLayout.vue](../client/src/layouts/SGSelectionsLayout.vue).
- **Hub:** `/selections` — card grid (icon + label per type).
- **Typed list:** `/selections/{type_slug}` — table for that type only, sorted by **`$date_created`** descending.

## URL convention

**Storage / API** paths are top-level (`box/12`). **Client URLs** keep a `/selections/` UI prefix so types stay grouped under the Selections hub.

| Client URL | Storage / API | Role |
| ---------- | ------------- | ---- |
| **`/selections`** | — | Hub (all types) |
| **`/selections/box`** | `box` | Box list |
| **`/selections/box/new`** | `box` (create) | Create box selection |
| **`/selections/box/12`** | `box/12` | Open selection #12 |

Short storage-style URLs redirect into the UI: `/box` → `/selections/box`, `/box/12` → `/selections/box/12`.

PDF export (Puppeteer) opens `/selections/box/12?cols=…` (Exporter maps storage `box/12` → that client URL).

Old flat URLs (`/selections/42`, title-suffixed slugs) are **not** supported after migration — use the typed paths above.

Helpers: [selection_urls.js](../client/src/utils/selection_urls.js), [selection_paths.js](../client/src/utils/selection_paths.js).

## Related UI routes

- Layout + type sidebar: [SGSelectionsLayout.vue](../client/src/layouts/SGSelectionsLayout.vue)
- Hub: [SGSelectionsHubView.vue](../client/src/views/SGSelectionsHubView.vue)
- List + panel: [SGSelectionsView.vue](../client/src/views/SGSelectionsView.vue)
- Create: [SGSelectionNewView.vue](../client/src/views/SGSelectionNewView.vue)
- Detail: [SGSelectionOpenView.vue](../client/src/views/SGSelectionOpenView.vue)
- Selection title (click to edit **`internal_name`** when allowed): [SGSelectionOpenView.vue](../client/src/views/SGSelectionOpenView.vue)
- Document details (date, document number from folder slug, counterparty, reference, currency): [SGSelectionHeaderFieldsSection.vue](../client/src/components/selections/SGSelectionHeaderFieldsSection.vue)
- Main PDF: [SGSelectionMainDocumentSection.vue](../client/src/components/selections/SGSelectionMainDocumentSection.vue), [SGSelectionMainDocumentField.vue](../client/src/components/selections/SGSelectionMainDocumentField.vue)
- Attachments: [SGSelectionFilesSection.vue](../client/src/components/selections/SGSelectionFilesSection.vue)
- Gem memberships: [SGGemSelectionsSection.vue](../client/src/components/gems/SGGemSelectionsSection.vue)

## PDF export (V1)

Enabled for: **box**, **return memo in**, **buying invoice**, **memo out**, **return memo out**, **sale invoice**, **partner invoice**, **credit note**, **importation return** (not `simple`, `memo in`, `importation`).

- **UI:** **Exporter en PDF** on [SGSelectionOpenView.vue](../client/src/views/SGSelectionOpenView.vue) opens [SGSelectionPdfExportModal.vue](../client/src/components/selections/SGSelectionPdfExportModal.vue) — fixed columns per selection type (read-only list from [selection_pdf_export_registry.js](../client/src/utils/selection_pdf_export_registry.js)); after generation, inline PDF preview and optional **Set as main document** (replaces any existing main document).
- **Print view:** canonical folder URL `/selections/{type_slug}/{folder_slug}?cols=…` (columns encoded from the registry for that type) → static [SGSelectionExportView.vue](../client/src/views/SGSelectionExportView.vue) + [SGSelectionPdfDocument.vue](../client/src/components/selections/SGSelectionPdfDocument.vue); Puppeteer via `exportFolder` — `_export` in [api2.js](../core2/api2.js) sets `export_query` from `selection_pdf_export`; [Exporter.js](../core2/Exporter.js) merges `export_query` like publication export params.
- **Absolute links in PDF:** certificate, photo, and video hyperlinks use [`resolveAppPublicOrigin()`](../client/src/utils/app_public_url.js) (`window.app_infos.public_url` from the **`public_url`** setting in `settings.json`, exposed via [`getPublicUrl()`](../core2/utils.js) in [index.pug](../index.pug)). Set **`public_url`** to the public site URL so links stay correct when Puppeteer opens the print view on **`localhost`**. See also [CERTIFICATES.md](CERTIFICATES.md) and [MEDIA_UPLOADS.md](MEDIA_UPLOADS.md).
- **Layout:** A4 invoice-style document ([`SGSelectionPdfDocument.vue`](../client/src/components/selections/SGSelectionPdfDocument.vue)) matching the ACF invoice reference: `210mm` page, `17.8mm` side padding, single `8pt` body size (line-height 1.4), everything in `#1C2B3A`. **Brand:** official ACF logo SVG inlined via [`AcfLogoMark.vue`](../client/src/components/selections/AcfLogoMark.vue) (source: `client/public/images/acf/acf-logo.svg`), ~`18mm` wide and centered; Inter + Crimson Pro via [`acf_brand.css`](../client/public/fonts/acf_brand.css) per ACF Brand Guidelines. **Header:** centered logo, then left block (title with bold document number, `Paris, date`, **N° Commande :**, **N° Compte Fournisseur:**) and counterparty name + address starting at ~72% of the content width. **Table:** chrome from [`ACF INV N°20265.pdf`](../ACF%20Assets/ACF%20INV%20N%C2%B020265.pdf) — white cells, black `0.5pt` horizontal rules + outer left/right (no internal column grid); fixed column widths from [selection_pdf_columns.js](../client/src/utils/selection_pdf_columns.js) — source of truth [`ACF Assets/column size.pdf`](../ACF%20Assets/column%20size.pdf) (priced: No 5%, REF 7.5%, Description 30%, Photo 15%, Qty 7.5%, weight 10%, price /ct 11%, Total 14%); align No + Photo center, Total right, other columns left; `17mm` gem photos. **Totals:** `TOTAL` row in the main table; VAT / grand total in a separate right-aligned 3-column boxed grid. **Number formats** ([selection_pdf_gem_helpers.js](../client/src/utils/selection_pdf_gem_helpers.js)): decimal comma (`2,15`), per-carat without grouping (`7500,00`), currency totals `$16 125,00`. **Payment line:** amount in words via [number_to_words_en.js](../client/src/utils/number_to_words_en.js) — "Please kindly transfer Four hundred… dollars (424 476$US)". VAT 20%, bank footer, legal text (non-priced layouts only). **Pagination:** per-page margins (`12mm` top, `18mm` bottom) and the centered ACF company footer repeated on **every printed page** come from the print engine — `_applySelectionPdfExportQuery` in [api2.js](../core2/api2.js) sets `pdf_page_margins` + `pdf_footer_lines`, applied as `margin` + `footerTemplate` in [puppeteer.js](../core2/puppeteer.js) / [electron.js](../electron/electron.js) (a CSS `position: fixed` footer overlaps rows at page bottom and spills onto the next page, so the in-flow footer is hidden in `@media print`); `thead` repeats, rows avoid page breaks.
- **Storage:** every export is saved on the selection folder with `is_selection_generated_pdf: true`, `is_selection_attachment: false`, and `$date_uploaded` as generation date; listed only in [SGSelectionGeneratedPdfsSection.vue](../client/src/components/selections/SGSelectionGeneratedPdfsSection.vue) (never in Attachments). After preview, **Set as main document** updates the file with `is_selection_main_document: true` and removes the previous main document if any. Authors may **delete** generated PDFs and the main document from the open view (same confirmation modal pattern as attachments).
- **Registry / columns:** [selection_pdf_export_registry.js](../client/src/utils/selection_pdf_export_registry.js), [selection_pdf_columns.js](../client/src/utils/selection_pdf_columns.js).
- **PDF language:** English column headers and invoice titles; French legal text and footer for memo types.

## Server validation

`selection_entries` is typed as an **`array`** in the schema; updates go through the same meta validation as other fields ([`validateMeta` in core2/utils.js](../core2/utils.js)).

PDF export requires a top-level selection path: `{type_slug}/{folder_slug}` (two path segments, like `gems/{n}`).

## Migration from flat `selections/{n}`

Legacy flat folders (`selections/42`) are migrated to top-level `{type_slug}/{n}` with **counters reset per type** (ordered by `$date_created`). Run once after deploying the top-level type schema:

```bash
node scripts/migrate_selections_nested.js --dry-run
node scripts/migrate_selections_nested.js
```

The script moves folders to content-root type directories, strips `selection_type` and `document_number_name` from meta, updates gem `box_selection_path` and `selection_membership_paths`, writes per-type `.slug-sequence.json`, and removes the global `selections/.slug-sequence.json` (and any leftover legacy path-map files). If a previous nested layout (`selections/{type}/{n}`) is present, it is remounted to `{type}/{n}` as well.

## Further reading

- Functional detail per type: [FIELDS.md](FIELDS.md) (memo, invoice, importation flows).
- Product scope: [cahier_des_charges_softgems.md](cahier_des_charges_softgems.md) §2.4.
