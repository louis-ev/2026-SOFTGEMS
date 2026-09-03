# Selections (CDC §2.4)

This document describes how **selections** are stored and exposed in Softgems, aligned with [cahier_des_charges_softgems.md](cahier_des_charges_softgems.md) §2.4 and the field notes in [FIELDS.md](FIELDS.md).

## Data model

- Each **selection type** is a **top-level folder type** in the schema (sibling of `gems` / `address_book`), see [settings_base.json](../settings_base.json) → `schema.$folders.{type_slug}`.
- There is **no** `selections/` storage parent. Disk layout mirrors other roots: `softgems_content/gems/…`, `softgems_content/memo-in/…`, `softgems_content/box/…`, etc.
- Each type uses `slug_naming: "sequence"` and `slug_sequence_start: 1`, e.g. `box/1`, `memo-in/2`. Sequence counters are **per type** (native dodoc `.slug-sequence.json` in each `{type_slug}/`).
- **Selection type** is **derived from the folder path** (`box/12` → `boîte`); it is no longer stored in meta. Client helper: [`selection_paths.js`](../client/src/utils/selection_paths.js) (`resolveSelectionType`, `parseSelectionFolderPath`).
- **Document number** for PDFs and the open view is the **folder slug** (e.g. `12` for `box/12`), via `selectionDocumentNumber()`. The former `document_number_name` meta field is removed.
- **Folder meta** (in `meta.txt`):

  - **`internal_name`** (string, optional): display title. At creation, set to `{type label} #{folder slug}` (e.g. `Memo in #12`, `Box #3`); editable on the open view. Empty values display as **—** in lists and titles.
  - **`selection_date`**, **`counterparty_path`**, **`reference_number`**, **`currency`**, **`exchange_rate`**, **`notes`**: optional header fields (date, counterparty, purchase order, currency, USD→EUR exchange rate when currency is USD, and notes are editable on the open view). **`selection_date`** defaults to **today’s local date** when a selection is created and is stored as an **ISO 8601 calendar date** (`YYYY-MM-DD`, schema `type: "date"`) — not a full timestamp like `$date_created`.
  - **`currency`**: select with exactly two options — **`USD ($)`** or **`EUR (€)`** (stored as `USD` / `EUR`). Empty values **display as USD ($)**. PDF export uses this field for amount formatting (`$…` / `… €`), the payment line, and the bank-account intro. Helpers: [`selection_currency.js`](../client/src/utils/selection_currency.js).
  - **`exchange_rate`**: optional number, shown only when effective currency is **USD**. USD→EUR rate (e.g. `0.86`), entered manually. Used by **Stock fiscal** to convert USD fiscal values to EUR (shown as `USD → EUR rate = 0.86` on the buying invoice). Helpers: [`selection_exchange_rate.js`](../client/src/utils/selection_exchange_rate.js).
  - **`reference_number`**: optional **purchase order No.** shown on the PDF as “N° Commande” / “Purchase order No.” when non-empty (omitted from the PDF when empty).
  - **`notes`**: optional rich-text HTML (bold / italic / link via TextInput editor). Editable in a **Notes** section under Document details. On PDF export, when non-empty, shown after the gems table (and VAT when present), before the payment line and bank footer — content only, no “Notes” heading. Uses the document body typography. Same content in EN and FR PDF exports (not bilingual-switched).
  - **`counterparty_path`**: optional string pointing to either an address-book contact folder (`address_book/{slug}`) or a person within a company contact (`address_book/{slug}/contacts/{person_slug}`). UI: two-step picker in [SGSelectionCounterpartyEditor.vue](../client/src/components/selections/SGSelectionCounterpartyEditor.vue) (company/individual, then optional company contact); label helpers: [address_book_paths.js](../client/src/utils/address_book_paths.js). Company contacts may store **`supplier_account_number`** (schema on `address_book`), which is pulled into the PDF as “N° Compte Fournisseur” / “Supplier account No.” when set (omitted when empty). Company **`tva_number`** is shown under the counterparty address on the PDF (“VAT No.:” / “N° TVA :”) when set (omitted when empty); if the counterparty is a person, the parent company’s VAT number is used.
  - **`partnership_purchase`** / **`partnership_purchased_percentage`**: on **`buying invoice`** (`buying-invoice/{n}`) — optional partnership checkbox; percentage (0–100) shown when checked. On **`sale invoice`** (`sale-invoice/{n}`) — optional **Partnership Invoice** checkbox with the same percentage field when checked. UI: [SGSelectionBuyingInvoiceFieldsSection.vue](../client/src/components/selections/SGSelectionBuyingInvoiceFieldsSection.vue).
  - **`selection_entries`**: JSON **array** of gem folder paths, e.g.
    ```json
    ["gems/12", "gems/45"]
    ```
    - **Display order** is computed client-side (not stored): stone type A→Z, then weight (ct) lightest→heaviest within each type (`sortSelectionGems`). The open-view table uses that as the **default**; column sort arrows can change it (like all gems). PDF export keeps the type/weight order.

- **Files** on the selection folder: `$files` with thumbs, same pattern as other folder types.
  - **Main document** (all types except **`simple`**): exactly one **PDF**, flagged with **`is_selection_main_document: true`** and **`is_selection_attachment: false`**. Shown in its own section directly under the selection title on the open view; replacing uploads a new PDF and removes the previous one.
  - **Attachments** (all types, including **`simple`**): optional extra files (PDF or images), flagged with **`is_selection_attachment: true`**. Listed in the **Attachments** section; **`simple`** selections have attachments only (no main document).

### Gem ↔ box (type **boîte**)

- On **`gems`** meta: optional **`box_selection_path`** (string), e.g. `box/3`, or empty if the stone is not in a box.
- **Rule:** a gem may belong to **at most one** box selection. The canonical pointer is **`box_selection_path`** on the gem; the box folder’s **`selection_entries`** must stay **consistent** with that (V1: client orchestration via `assignGemToBox` in [client/src/utils/assign_gem_to_box.js](../client/src/utils/assign_gem_to_box.js)). Box folders live at `box/{n}`.
- **Box cover:** only **`box`** selection folders support a cover image (`meta_cover.jpeg`, schema `$cover`). Editable on the box open view header (same `CoverField` flow as gems). Other selection types have no `$cover` in schema.

Other selection types may include many gems in `selection_entries` without using `box_selection_path`.

### Gem page — selection memberships

The gem open view lists selections for the gem via the denormalized index on the gem (`selection_membership_paths` keys + `box_selection_path`), then fetches **only those folders** and keeps rows whose `selection_entries` still include the gem path. See [SGGemSelectionsSection.vue](../client/src/components/gems/SGGemSelectionsSection.vue), [listGemIndexedSelectionPaths](../client/src/utils/gem_selection_membership_paths.js), and [gem_selection_memberships.js](../client/src/utils/gem_selection_memberships.js).

**Index (denormalized on the gem):** `selection_membership_paths` maps full selection paths (e.g. `memo-in/2`) → ISO timestamp when the gem was added. Membership **presence** remains defined by selection `selection_entries` (source of truth); the gem field is a fetch index + date cache, written on add and cleared on remove via [gem_selection_membership_paths.js](../client/src/utils/gem_selection_membership_paths.js). The gem **modifications history** modal ([SGFolderModificationsHistory.vue](../client/src/components/softgems/SGFolderModificationsHistory.vue)) formats that map as `{type label} #{n} (date)` (e.g. `Memo in #2 (20/08/2026)`), not the raw object — see [folder_modifications_history.js](../client/src/utils/folder_modifications_history.js).

**Outstanding memo out (table row + gem page):** when walking `selection_membership_paths` newest → oldest, if `memo-out` appears before `return-memo-out` (or return never appears): gems tables ([SGGemsTable.vue](../client/src/components/gems/SGGemsTable.vue)) set `data-memo-out-outstanding` with text in `--c-rouge`; the gem open view ([SGGemOpenView.vue](../client/src/views/SGGemOpenView.vue)) shows a cartouche ([SGMemoOutStatusCard.vue](../client/src/components/gems/SGMemoOutStatusCard.vue)) linking to that memo out. Helpers: `isGemMemoOutOutstanding` / `resolveOutstandingMemoOutPath` in [gem_selection_membership_paths.js](../client/src/utils/gem_selection_membership_paths.js).

**Heal on selection open (silent):** when a selection’s gems are loaded and the user can edit, Softgems automatically backfills missing `selection_membership_paths` / empty `box_selection_path` via [heal_gem_selection_indexes.js](../client/src/utils/heal_gem_selection_indexes.js) ([SGSelectionGemsSection.vue](../client/src/components/selections/SGSelectionGemsSection.vue)). This only updates denormalized gem indexes — not selection `selection_entries`. A gem whose `box_selection_path` points at a *different* box is left unchanged for that field (conflict).

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
| **`/selections/box/new`** | `box` (create) | Creates a box selection immediately (`internal_name` like `Box #12`) and opens it |
| **`/selections/box/12`** | `box/12` | Open selection #12 |

Short storage-style URLs redirect into the UI: `/box` → `/selections/box`, `/box/12` → `/selections/box/12`.

PDF export (Puppeteer) opens `/selections/box/12?cols=…` (Exporter maps storage `box/12` → that client URL).

Old flat URLs (`/selections/42`, title-suffixed slugs) are **not** supported after migration — use the typed paths above.

Helpers: [selection_urls.js](../client/src/utils/selection_urls.js), [selection_paths.js](../client/src/utils/selection_paths.js).

## Related UI routes

- Layout + type sidebar: [SGSelectionsLayout.vue](../client/src/layouts/SGSelectionsLayout.vue)
- Hub: [SGSelectionsHubView.vue](../client/src/views/SGSelectionsHubView.vue)
- List + panel: [SGSelectionsView.vue](../client/src/views/SGSelectionsView.vue)
- Create (direct, no name form): [SGSelectionNewView.vue](../client/src/views/SGSelectionNewView.vue)
- Detail: [SGSelectionOpenView.vue](../client/src/views/SGSelectionOpenView.vue)
- Selection title (click to edit **`internal_name`** when allowed): [SGSelectionOpenView.vue](../client/src/views/SGSelectionOpenView.vue)
- Document details (date, document number from folder slug, counterparty, reference, currency, USD→EUR exchange rate when currency is USD): [SGSelectionHeaderFieldsSection.vue](../client/src/components/selections/SGSelectionHeaderFieldsSection.vue)
- Main PDF: [SGSelectionMainDocumentSection.vue](../client/src/components/selections/SGSelectionMainDocumentSection.vue), [SGSelectionMainDocumentField.vue](../client/src/components/selections/SGSelectionMainDocumentField.vue)
- Attachments: [SGSelectionFilesSection.vue](../client/src/components/selections/SGSelectionFilesSection.vue)
- Gem memberships: [SGGemSelectionsSection.vue](../client/src/components/gems/SGGemSelectionsSection.vue)

## PDF export (V1)

Enabled for: **box**, **return memo in**, **buying invoice**, **memo out**, **return memo out**, **sale invoice**, **credit note**, **importation return** (not `simple`, `memo in`, `importation`).

- **UI:** **Export PDF** on [SGSelectionOpenView.vue](../client/src/views/SGSelectionOpenView.vue) opens [SGSelectionPdfExportModal.vue](../client/src/components/selections/SGSelectionPdfExportModal.vue) — **PDF language** (English / Français), pricing line, **Show VAT and total including VAT** (shown when a price line is selected; checked by default except **memo out**, where it is unchecked by default) with a VAT % number input (default `20`), optional **Show “Please kindly transfer…” payment line** (checked by default only for **sale invoice**; unchecked by default for other types), optional **customs summary (RSE / PF)** at the end of the PDF (off by default), bank footer when priced (**No footer** selected by default); after generation, inline PDF preview and optional **Set as main document** (replaces any existing main document).
- **Print view:** canonical folder URL `/selections/{type_slug}/{folder_slug}?cols=…&lang=en|fr&show_vat=0|1&vat_percent=20&show_payment_line=0|1&show_customs_summary=0|1` → static [SGSelectionExportView.vue](../client/src/views/SGSelectionExportView.vue) + [SGSelectionPdfDocument.vue](../client/src/components/selections/SGSelectionPdfDocument.vue); Puppeteer via `exportFolder` — `_export` in [api2.js](../core2/api2.js) sets `export_query` from `selection_pdf_export`; [Exporter.js](../core2/Exporter.js) merges `export_query` like publication export params.
- **Customs summary (optional):** when `show_customs_summary=1`, a new section starts after the main document (`page-break-before`) with logo + groups by gem `importation/{n}` membership (or “no importation”). Each group has a **Customs code / Name / Qty / Weight / Selected price** table with two rows — **710 391** (FR `RSE` / EN `Precious stone`, ruby/sapphire/emerald) and **710 399** (FR `PF` / EN `Semi Precious`, all other stone types) — plus group totals. Each importation group uses `page-break-inside: avoid`. Aggregation helper: [selection_pdf_customs_summary.js](../client/src/utils/selection_pdf_customs_summary.js).
- **PDF copy (editable):** bilingual document strings live in [selection_pdf_strings.js](../client/src/utils/selection_pdf_strings.js) (`en` / `fr`). French keeps accented capitals (e.g. `SIÈGE`). Company footer lines are language-specific and kept in sync with `pdf_footer_lines` in [api2.js](../core2/api2.js).
- **Absolute links in PDF:** certificate, photo, and video hyperlinks use [`resolveAppPublicOrigin()`](../client/src/utils/app_public_url.js) (`window.app_infos.public_url` from the **`public_url`** setting in `settings.json`, exposed via [`getPublicUrl()`](../core2/utils.js) in [index.pug](../index.pug)). Set **`public_url`** to the public site URL so links stay correct when Puppeteer opens the print view on **`localhost`**. See also [CERTIFICATES.md](CERTIFICATES.md) and [MEDIA_UPLOADS.md](MEDIA_UPLOADS.md).
- **Layout:** A4 invoice-style document ([`SGSelectionPdfDocument.vue`](../client/src/components/selections/SGSelectionPdfDocument.vue)) matching the ACF invoice reference: `210mm` page, `17.8mm` side padding, single `8pt` body size (line-height 1.4), everything in `#1C2B3A`. **Brand:** official ACF logo SVG inlined via [`AcfLogoMark.vue`](../client/src/components/selections/AcfLogoMark.vue) (source: `client/public/images/acf/acf-logo.svg`), ~`18mm` wide and centered; Inter + Crimson Pro via [`acf_brand.css`](../client/public/fonts/acf_brand.css) per ACF Brand Guidelines. **Header:** centered logo, then left block (title with bold document number, `Paris, date`, **Purchase order No.:** / **N° Commande :**, **Supplier account No.:** / **N° Compte Fournisseur:**) and counterparty name + address starting at ~72% of the content width, with the company **VAT No.** / **N° TVA** under the address when `tva_number` is set. **Table:** chrome from [`ACF INV N°20265.pdf`](../ACF%20Assets/ACF%20INV%20N%C2%B020265.pdf) — white cells, black `0.5pt` horizontal rules + outer left/right (no internal column grid); fixed column widths from [selection_pdf_columns.js](../client/src/utils/selection_pdf_columns.js) — source of truth [`ACF Assets/column size.pdf`](../ACF%20Assets/column%20size.pdf) (priced: No 5%, REF 7.5%, Description 30%, Photo 15%, Qty 7.5%, weight 10%, price /ct 11%, Total 14%); align No + Photo center, Total right, other columns left; `17mm` gem photos. **Totals:** `TOTAL` row in the main table; when `show_vat=1`, VAT / grand total in a separate right-aligned 3-column boxed grid (rate from `vat_percent`, default 20%). **Number formats** ([selection_pdf_gem_helpers.js](../client/src/utils/selection_pdf_gem_helpers.js)): decimal comma (`2,15`), per-carat without grouping (`7500,00`), currency totals `$16 125,00`. **Payment line:** after notes (when present) and before the bank footer; amount in words via [selection_pdf_payment_amount.js](../client/src/utils/selection_pdf_payment_amount.js) (lowercase; cents only when non-zero) — "Please kindly transfer four hundred… dollars and fifty cents (424 476.50 $US)." (uses grand total when VAT is shown, otherwise the pricing subtotal). Bank footer. **Legal text:** bilingual consignment clause always shown for **memo out** only (`legal_memo_out`); other types may show `legal_generic` on non-priced layouts. **Pagination:** per-page margins (`12mm` top, `18mm` bottom) and the centered ACF company footer repeated on **every printed page** come from the print engine — `_applySelectionPdfExportQuery` in [api2.js](../core2/api2.js) sets `pdf_page_margins` + `pdf_footer_lines`, applied as `margin` + `footerTemplate` in [puppeteer.js](../core2/puppeteer.js) / [electron.js](../electron/electron.js) (a CSS `position: fixed` footer overlaps rows at page bottom and spills onto the next page, so the in-flow footer is hidden in `@media print`); `thead` repeats, rows avoid page breaks.
- **Storage:** every export is saved on the selection folder with `is_selection_generated_pdf: true`, `is_selection_attachment: false`, and `$date_uploaded` as generation date; listed only in [SGSelectionGeneratedPdfsSection.vue](../client/src/components/selections/SGSelectionGeneratedPdfsSection.vue) (never in Attachments). After preview, **Set as main document** updates the file with `is_selection_main_document: true` and removes the previous main document if any. Authors may **delete** generated PDFs and the main document from the open view (same confirmation modal pattern as attachments).
- **Registry / columns:** [selection_pdf_export_registry.js](../client/src/utils/selection_pdf_export_registry.js), [selection_pdf_columns.js](../client/src/utils/selection_pdf_columns.js).
- **PDF language:** chosen at export time (`en` default). Titles, column headers, legal text, payment line, description prefixes (origin, country of cut, customer reference), and ACF company footer follow [selection_pdf_strings.js](../client/src/utils/selection_pdf_strings.js).

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
