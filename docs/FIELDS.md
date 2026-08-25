# SoftGems Field Specification

Source updated from `fields(2).xlsx` (latest client sheet).

## Hidden and Purple Rows from Client Sheet

The following rows are explicitly hidden in the XLSX and marked in purple (`#D9D2E9`):

Purple-highlighted rows are **TODO for later** and **not in V1 scope**.

| Section               | Field            | Fill Method        | Notes                                            |
| --------------------- | ---------------- | ------------------ | ------------------------------------------------ |
| Stone Characteristics | `color_grading`  | select from a list | Hidden in source sheet. TODO for later (not V1). |
| Stone Characteristics | `quality_grade`  | select from a list | Hidden in source sheet. TODO for later (not V1). |
| Stone Characteristics | `clarity`        | select from a list | Hidden in source sheet. TODO for later (not V1). |
| Costs                 | `treatment_cost` | manual             | Hidden in source sheet.                          |
| Costs                 | `total_cost`     | derived            | Purchase price (`T. Buy Px`).                    |

Other purple-highlighted (visible) rows in the sheet are also TODO for later (not V1): `cut_quality`, report `category`, report `location`, and the full `Grading & Traceability` + `Treatment` blocks.

## Global Status Logic

| Field    | Fill Method | Rule                                                                                                                                                |
| -------- | ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `status` | automatic (editable on create) | Default `reference` when stone is created (field editable on the new-gem form). Stored values are **selection-type slugs** where applicable (`memo-in`, `buying-invoice`, `sale-invoice`, `return-memo-in`, `return-memo-out`, `importation-return`). UI labels are inventory-oriented: Reference, Memo in, Purchased, Sold, Returned (`return-memo-in`, `return-memo-out`, and `importation-return` all show Returned for now). Adding a gem to a selection sets `status` to the slug for that selection type. Removing a gem restores status from the most recently added linked selection that still applies; otherwise, if the current status still matches the removed selection’s slug, the previous value is taken from the gem’s **`status` field history** (`meta_archive.jsonl`). Display: [gem_status.js](../client/src/utils/gem_status.js). Logic: [gem_selection_status.js](../client/src/utils/gem_selection_status.js). |

## Identification

| Field                   | Fill Method        | Notes                                                         |
| ----------------------- | ------------------ | ------------------------------------------------------------- |
| `id` / `stone_id`       | automatic          | Reference number increments by 1 for each new stone.          |
| `box_reference`         | automatic          | Shows box reference when stone is associated to a box.        |
| `reference_supplier`    | manual             | Supplier unique identifier for gemstone or parcel.            |
| `reference_customer`    | manual             | Customer unique identifier for gemstone or parcel.            |
| `numero_de_mise_a_consommation` | manual     | Alphanumeric consumption entry number (MAC). Editable in Identification on the gem open view. |
| `paired_gem`            | select from gem list | User selects another gem to pair with current gem. On create and edit, reciprocal pairing is auto-set on the selected gem; changing or clearing pairing also unlinks the previous partner. |
| `parent_id`             | automatic          | Set on the new gem when splitting (`parent_id` = original gem ID). Child gem open view shows a **Split from gem #…** cartouche (with cover) linking to the original. |
| `splits`                | automatic          | On the original gem: array of `{ id, date }` for each gem split off it, oldest first. Survives repeated splits. Cleared on duplicate/split copies so children do not inherit the parent’s list. Original gem open view shows a **This gem has been split** cartouche; click opens a history modal with links to each child. |

### Duplicate gem (V1)

From the gem open view (⋯ menu → **Duplicate gem**): `copyFolder` creates a new sequential gem folder (media, cover, certificates and stone fields copied). The confirmation modal lists meta that will change on the copy. Applied patch ([`gem_duplicate.js`](../client/src/utils/gem_duplicate.js)):

- new ID (sequence)
- `status` → `reference`
- `paired_gem` cleared (no reciprocal re-pair)
- `box_selection_path` and `selection_membership_paths` cleared (copy is not added to any selection)
- `splits` cleared (duplicate is not the same parcel history)
- modifications history reset (source `meta_archive.jsonl` is not kept; a fresh `created` entry is written)

UI: [`SGGemDuplicateModal.vue`](../client/src/components/gems/SGGemDuplicateModal.vue).

### Split gem (V1)

From the gem open view (⋯ menu → **Split gem**, only when `number_of_pieces` > 1): same `copyFolder` clone as duplicate. The modal starts on **pieces**:

1. **Pieces:** how many pieces to split off, defaulting to 1. The notice shows the original count (and `{min} to {max}` when more than one value is possible). If the original has exactly 2 pieces, the field is prefilled with 1 and read-only. A compact preview shows the proportional weight (new gem vs remaining) and how many parent selections the copy will join. **Split** (primary, right) confirms immediately with that proportional weight and **all** parent selections. **Advanced split** (to the left of Split) opens the weight and selection screen. Cancel stays on the left.
2. **Advanced:** a proportional suggestion (`original weight × new pieces / original pieces`) is shown as the field placeholder; leaving it blank uses that suggestion. The user can override it. A side-by-side comparison shows original (from → remaining) vs new gem for pieces, weight, and prices when Cost /ct is available. Below, checkboxes list the original’s selections (including its box); all are checked by default and can be unchecked. **Split** on this screen uses the entered weight and only the checked selections.

After confirmation, the modal shows three progress steps: create the new gem, update the original, then add to selections `{current}/{total}` (omitted when none are selected).

After the copy, the original is updated by subtraction. The copy then inherits the chosen parent selections (`selection_entries` + gem index + box assignment when a box is checked).

- New gem `weight_ct` = entered or suggested weight; original `weight_ct` = original − new (must stay > 0).
- New gem `number_of_pieces` = entered count; original = original − new (must leave at least 1 piece).
- **Prices:** if Cost per carat can be computed (`base_price_pcb` / original `weight_ct`), every set price total (Cost, Import, PV, PVD, PC, PF) is recalculated from its own /ct × the new or remaining weight. If Cost /ct is missing, prices are left unchanged.
- New gem also gets `parent_id` = original gem ID, plus the duplicate resets on copy (new ID, pairing cleared, fresh history). Memberships start cleared on the copy, then the selected parent selections are applied.
- Original gem appends `{ id, date }` to `splits` (ISO date) when the copy is created.
- Open-view cartouches: child shows **Split from gem #…** (cover, links to original); original shows **This gem has been split** and opens a history modal with child links.

Helpers: [`gem_split.js`](../client/src/utils/gem_split.js). UI: [`SGGemSplitModal.vue`](../client/src/components/gems/SGGemSplitModal.vue).

## Notes

| Field   | Fill Method | Notes                                                                                                                                 |
| ------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `notes` | manual      | Optional rich-text HTML (bold / italic / link). Editable in a **Notes** section on the gem open view ([`SGGemNotesSection.vue`](../client/src/components/gems/SGGemNotesSection.vue)). Optional **Notes** column in the gems inventory table (plain-text preview; full text on hover). Copied when duplicating a gem. |

## Stone Characteristics

| Field              | Fill Method        | Notes                                                                                        |
| ------------------ | ------------------ | -------------------------------------------------------------------------------------------- |
| `number_of_pieces` | manual             |                                                                                              |
| `stone_type`       | select from a list | See options below.                                                                           |
| `weight_ct`        | manual             | Weight in carats.                                                                            |
| `color`            | select from a list | See options below.                                                                           |
| `color_grading`    | select from a list | Hidden + purple in source. TODO for later (not V1).                                          |
| `quality_grade`    | select from a list | Hidden + purple in source. TODO for later (not V1).                                          |
| `shape`            | select from a list | See options below.                                                                           |
| `origin_country`   | select from a list | See options below.                                                                           |
| `treatment_type`   | select from a list | See options below. Inventory table shows compact codes (N, TE, O Min…) with the full stored label on hover; editor keeps the full lab-style string. Display map: [treatment_type_display.js](../client/src/utils/treatment_type_display.js). |
| `cut_quality`      | select from a list | Purple-highlighted in source. TODO for later (not V1). Example values: `flat/good/deep/...`. |
| `length_mm`        | manual             | Stone length in mm.                                                                          |
| `width_mm`         | manual             | Stone width in mm.                                                                           |
| `height_mm`        | manual             | Stone height in mm.                                                                          |
| `clarity`          | select from a list | Hidden + purple in source. TODO for later (not V1).                                          |

### Stone Type Options

- Beryl, Emerald, Aquamarine, Morganite, Heliodor
- Corundum, Ruby, Sapphire, Star Ruby, Star Sapphire
- Quartz, Amethyst, Citrine, Rose Quartz
- Chalcedony, Agate, Tiger's Eye
- Feldspar, Moonstone, Sunstone
- Garnet, Demantoid Garnet, Tsavorite Garnet, Spessartine Garnet, Hessonite Garnet
- Alexandrite, Chrysoberyl, Spinel, Topaz, Tourmaline, Tanzanite, Zircon
- Peridot, Diopside, Enstatite, Scapolite, Danburite
- Rhodochrosite, Malachite, Amazonite, Lapis Lazuli, Turquoise
- Coral, Opal, Cacholong, Ebony, Rosewood
- Pearl, Natural Pearl, Cultured Pearl
- Precious Stones, Semi-Precious Stones

### Color Options

- Red, Orangy Red, Orange, Yellow, Yellowish Green, Green, Bluish Green, Greenish Blue, Blue, Violet Blue, Violet, Purple
- Light Pink, Pastel Pink, Pink, Intense Pink, Vivid Pink, Purplish Red, Intense Red, Vivid Red, Deep Red, Dark Red
- Light Orangy Pink, Pastel Orangy Pink, Pastel Pinkish Orange, Orangy Pink, Pinkish Orange, Intense Orangy Pink, Vivid Orange, Deep Orange, Deep Brownish Red, Brown, Deep Brown
- Light Yellow, Pastel Yellow, Intense Yellow, Vivid Yellow, Brownish Yellow
- Pastel Yellowish Green, Light Green, Pastel Green, Intense Green, Vivid Yellowish Green, Vivid Green, Deep Yellowish Green, Deep Green
- Pastel Bluish Green, Pastel Greenish Blue, Intense Bluish Green, Intense Greenish Blue, Vivid Bluish Green, Vivid Greenish Blue, Deep Bluish Green, Deep Greenish Blue
- Light Blue, Pastel Blue, Violetish Blue, Intense Blue, Vivid Blue, Deep Blue, Dark Blue
- Light Purple, Pastel Violet, Pastel Purple, Intense Purple, Vivid Violet, Vivid Purple, Deep Violet, Deep Purple
- Grey, Black, Pigeon Blood, Royal Blue, Padparadscha

### Shape Options

- Round Brilliant, Oval, Cushion, Square Cushion, Pear Shape, Marquise, Heart, Princess
- Baguette, Trapezoid, Triangle (Trilliant), Hexagonal, Octagonal, Lozenge
- Fancy Shape, Mixed Cut, Rose Cut, Briolette, Cabochon, Sugarloaf Cabochon
- Buff Top, Carved, Pierced, Bead, Drop, Rough, Polished Rough

### Origin / Country Options

- Afghanistan, Australia, Brazil, Cambodia, China, Colombia, Ethiopia, India, Kenya
- Madagascar, Malawi, Mali, Mozambique, Myanmar, Namibia, Nigeria, Russia, Sri Lanka
- Tajikistan, Tanzania, Thailand, Vietnam, Zambia, East Africa, West Africa, Africa
- Kashmir, Panjshir, Unknown, Basalt-related deposit

### Treatment Type Options

- Natural
- No indications of heating
- Indications of heating / TE
- Indications of heating with residues (TE1/2/3/4/5)
- Indications of heating with diffusion (Be/Ti/Cr)
- Indications of heating with Lead Glass filling (F1/2/3)
- No indications of clarity modification
- Oil - Insignificant / Minor / Moderate / Significant
- Resin - Insignificant / Minor / Moderate / Significant
- Type A (Natural)
- Type B (Impregnated)

## Reports

Multiplicity rule: can be multiple reports for one stone.

| Field       | Fill Method                   | Notes                                                                                             |
| ----------- | ----------------------------- | ------------------------------------------------------------------------------------------------- |
| `provider`  | select from address book      |                                                                                                   |
| `reference` | manual                        |                                                                                                   |
| `category`  | select from list / expression | Purple-highlighted in source. TODO for later (not V1). Example: `express`, `rough to cut`, `...`. |
| `date`      | calendar                      | Default is today's date.                                                                          |
| `location`  | select                        | Purple-highlighted in source. TODO for later (not V1). Example: `paris`, `bangkok`, `...`.        |
| `price`     | manual                        |                                                                                                   |

## Costs

| Field                    | Fill Method        | Notes                                                                             |
| ------------------------ | ------------------ | --------------------------------------------------------------------------------- |
| `cut_cost`               | manual             |                                                                                   |
| `certification_cost`     | automatic          | From reports category.                                                            |
| `treatment_cost`         | manual             | Hidden + purple in source. TODO for later (not V1).                               |
| `base_price_pcb`         | manual             | **Base acquisition cost** (UI label: **Cost**; legacy notation PCb). **Total price only** — per-carat is **derived in the app** from `weight_ct`; see [Pricing logic](#pricing-cost-pa-pv-pvd-pc-pf). |
| `purchased_price_pa`     | manual             | **Removed from V1 UI** (schema/meta retained). Legacy **PA** total; per-carat was derived. Existing values remain on gems but are not shown or editable in the client. |
| `total_cost`             | derived            | Purchase price (`T. Buy Px`). Hidden + purple in source. TODO for later (not V1). |

## Pricing (Cost, Import, PV, PVD, PC, PF)

`base_price_pcb` is the persisted meta key for **Cost** (legacy internal name PCb). The UI and exports use the label **Cost**; do not rename the meta key without a data migration.

**PA (`purchased_price_pa`)** was removed from the V1 gem UI (open gem pricing section, inventory table, column customizer) and from selection PDF export price-line options. Buying invoice, return memo in, and importation return PDF defaults use **Cost** (`base_price_pcb`) instead. The field remains in `settings_base.json` and on existing gem meta for backward compatibility.

This section documents **how pricing works in the SoftGems client** (single source of truth per line = **total price** stored in gem meta; **per-carat** values are not persisted for these pairs).

### Rules

- **Persisted**: for each pair line (see table below), only the **total** is stored in meta. Matching “/ Ct” values are **virtual** in the app and are not written as separate price fields for those lines.
- **Displayed “/ Ct”**: computed when the stored **total** is set and `weight_ct` is valid and > 0: **`per_carat = total / weight_ct`**, rounded for display/calculations as implemented in the client (see `computePerCarat` / `computeTotal` in [`client/src/mixins/GemPricing.js`](../client/src/mixins/GemPricing.js); currently 2 decimal places via `toFixed(2)`). When the total is unset (null / empty), the derived per-carat displays as empty (—), not `0`.
- **Editing the total**: saves the total; the UI refreshes the derived per-carat. Opening the pair editor for an unset total shows blank inputs (not `0`).
- **Editing “/ Ct”** (virtual field): saves **`total = per_carat × weight_ct`** (same rounding rules as code). **`weight_ct` is never changed** by price edits.
- **No or zero weight**: the intended UX is that **per-carat entry is disabled** (or shows inactive) until a valid carat weight is set; totals remain editable regardless.
- **Changing `weight_ct`**: totals stay the same; displayed per-carat values update from the new weight.

### Pairs (notation → stored field → virtual “/ Ct” UI key)

| Line | Stored total field (`settings_base` / meta) | Virtual per-carat key (UI / table only, **not** in schema as a persisted price) |
| ---- | --------------------------------------------- | --------------------------------------------------------------------------------- |
| Cost (PCb) | `base_price_pcb`                          | `price_per_carat_pcb`                                                             |
| Import | `import_price`                              | `price_per_carat_import`                                                          |
| PV   | `pv_selling_price`                            | `price_per_carat_pv`                                                              |
| PVD  | `pvd_asking_price`                            | `price_per_carat_pvd`                                                             |
| PC   | `pc_to`                                       | `price_per_carat_pc`                                                              |
| PF   | `pf_invoiced_price`                           | `price_per_carat_pf`                                                              |

### PVD (asking price)

- **PVD** is a full editable pricing pair (Total + /ct), persisted as `pvd_asking_price`.
- When editing **PV**, a checkbox (checked by default) offers to also update PVD to **`PV × 1.15`**. Uncheck to save PV only.
- PVD can always be edited independently; editing PVD never changes PV.
- Helper: `computePvdFromPv` in [`GemPricing.js`](../client/src/mixins/GemPricing.js).

### Implementation pointers

- Pair definitions: [`client/src/mixins/GemPricing.js`](../client/src/mixins/GemPricing.js)
- Field labels, virtual `pricing_total_key`: [`client/src/components/gems/gem_field_configs.js`](../client/src/components/gems/gem_field_configs.js)
- Gems list table ([`client/src/components/gems/SGGemsTable.vue`](../client/src/components/gems/SGGemsTable.vue)): one column per pricing line (Cost, Import, PV, PVD, PC, PF) — **total** on the first line, derived **per carat + `/ct`** on the second; virtual `price_per_carat_*` keys are not separate columns ([`gem_virtual_per_carat_column_keys`](../client/src/mixins/GemPricing.js)).
- **Default column order** (when no saved column preference exists): `id`, `status`, `$cover`, `number_of_pieces`, `stone_type`, `weight_ct`, `color`, `shape`, `origin_country`, `dimensions_lwh`, `treatment_type`, `base_price_pcb`, `import_price`, `pv_selling_price`, `pvd_asking_price`, `pc_to`, `pf_invoiced_price`, `paired_gem`, `country_of_cut`, `reference_supplier`, `reference_customer`, `numero_de_mise_a_consommation`, `$date_modified`, then one `selection_nums_*` column per selection type in [registry](../client/src/utils/selection_type_registry.js) order — see [`gems_table_catalog_column_keys`](../client/src/utils/gems_table_metadata.js). All selection-number columns are in the catalog / column customizer but **off by default** and stay unchecked on Reset; cell values are derived client-side from `selection_membership_paths` + `box_selection_path` (no extra server fetch) via [`gem_selection_nums_columns.js`](../client/src/utils/gem_selection_nums_columns.js).
- Column customizer ([`client/src/components/gems/SGGemColumnsModal.vue`](../client/src/components/gems/SGGemColumnsModal.vue)): same column keys as the table; legacy per-carat and `length_mm` / `width_mm` / `height_mm` selections are normalized via [`gems_table_metadata.js`](../client/src/utils/gems_table_metadata.js).
- **Raw path fields not shown as columns:** `box_selection_path` and `selection_membership_paths` stay excluded from the picker (virtual `selection_nums_*` columns show document numbers instead). Removed from V1: `price_per_carat_all`.
- Persisted gem fields: [`settings_base.json`](../settings_base.json) → `schema.$folders.gems.fields`

## Selection-Driven Entry Flows

The sheet indicates that the following sections are entered via selections:

- `simple`
- `boite`
- `memo in`
- `return memo in`
- `buying invoice`
- `memo out`
- `return memo out`
- `sale invoice`
- `credit note`
- `importation`
- `importation return`

## Partnership

Multiplicity rule: can be multiple partners for one stone.

| Field          | Fill Method              | Notes                                                      |
| -------------- | ------------------------ | ---------------------------------------------------------- |
| `partner_name` | select from address book |                                                            |
| `percentage`   | manual                   | Enter supplier percentage on stone (can be more than one). |
| `amount`       | manual                   | Listed as made from a selection in source.                 |
| `pdf`          | link                     | Link to invoice.                                           |

## Importation Data (Importation)

Multiplicity rule: can be multiple imports for one stone.

| Field                          | Fill Method              | Notes                                                                                |
| ------------------------------ | ------------------------ | ------------------------------------------------------------------------------------ |
| `supplier_company`             | select from address book |                                                                                      |
| `french_customs_hs_code`       | automatic                | One code for precious stones (ruby, sapphire, emerald), one for semiprecious stones. |
| `customs_category`             | automatic                | `pierres precieuses` / `pierres fines`.                                              |
| `eu_non_eu_merchandise_status` | automatic                | EU if purchased (including partnership), non-EU if not purchased.                    |
| `import_type`                  | select from a list       | `importation definitive` / `temporaire`.                                             |
| `import_number`                | manual                   |                                                                                      |
| `import_date`                  | calendar                 | Default is today's date.                                                             |
| `import_price`                 | manual                   | **Total import price only**; per-carat is **derived** from `weight_ct` (same rules as Cost). Remains manually editable. |
| `pdf`                          | link                     |                                                                                      |
| `link`                         | link                     |                                                                                      |

## Export Data (Importation Return)

Multiplicity rule: can be multiple exports for one stone.

| Field            | Fill Method              | Notes                                                     |
| ---------------- | ------------------------ | --------------------------------------------------------- |
| `client_company` | select from address book |                                                           |
| `export_type`    | select from a list       | `export temporaire` / `perfectionnement passif`.          |
| `export_number`  | manual                   |                                                           |
| `export_date`    | calendar                 | Default is today's date.                                  |
| `export_price`   | automatic / manual       | Default importation price; keep editable for adjustments. |
| `pdf_link`       | link                     |                                                           |

## Memo and Invoice Flows

### Memo In (from Supplier to Us)

Multiplicity rule: only one.

| Field             | Fill Method              | Notes                    |
| ----------------- | ------------------------ | ------------------------ |
| `supplier`        | select from address book |                          |
| `memo_in_number`  | manual                   |                          |
| `memo_in_date`    | calendar                 | Default is today's date. |
| `memo_in_price`   | manual                   |                          |
| `pdf`             | link                     |                          |
| `link_to_memo_in` | link                     |                          |

### Return Memo In (from Us to Supplier)

Multiplicity rule: can be multiple.

| Field           | Fill Method                  | Notes                                                                                             |
| --------------- | ---------------------------- | ------------------------------------------------------------------------------------------------- |
| `supplier`      | select from address book     |                                                                                                   |
| `return_number` | select from list / automatic | Pick open memo in for selected supplier; auto-number pattern `memo in number /1`, then `/2`, etc. |
| `return_date`   | calendar                     | Default is today's date.                                                                          |
| `return_price`  | automatic / manual           | Default memo in price; adjustable when needed.                                                    |
| `return_pdf`    | link                         |                                                                                                   |
| `link`          | link                         |                                                                                                   |

### Memo Out (to Customer)

Multiplicity rule: can be multiple.

| Field             | Fill Method              | Notes                                  |
| ----------------- | ------------------------ | -------------------------------------- |
| `customer`        | select from address book |                                        |
| `memo_out_number` | automatic                | Increments by 1 for each new memo out. |
| `memo_out_date`   | calendar                 | Default is today's date.               |
| `memo_out_price`  | manual                   | Show `PC`.                             |
| `pdf`             | link                     |                                        |
| `link`            | link                     |                                        |

### Return Memo Out (from Customer to Us)

Multiplicity rule: can be multiple.

| Field             | Fill Method                  | Notes                                                                                   |
| ----------------- | ---------------------------- | --------------------------------------------------------------------------------------- |
| `customer`        | select from address book     |                                                                                         |
| `memo_out_number` | select from list / automatic | Pick open memo out for selected customer; auto numbering follows return sequence logic. |
| `memo_out_date`   | calendar                     | Default is today's date.                                                                |
| `memo_out_price`  | automatic                    | Show `PC`.                                                                              |
| `pdf`             | link                         |                                                                                         |
| `link`            | link                         |                                                                                         |

### Purchase

Multiplicity rule: only one.

| Field              | Fill Method              | Notes                    |
| ------------------ | ------------------------ | ------------------------ |
| `supplier`         | select from address book |                          |
| `purchase_number`  | manual                   |                          |
| `purchase_date`    | calendar                 | Default is today's date. |
| `purchase_price`   | manual                   |                          |
| `pdf`              | link                     |                          |
| `link_to_purchase` | link                     |                          |

On every selection folder, when **`currency` is USD** (empty values display as USD), an optional **`exchange_rate`** number (USD→EUR, e.g. `0.86`) is shown in Document details and entered manually. See [SELECTIONS.md](SELECTIONS.md) and [`selection_exchange_rate.js`](../client/src/utils/selection_exchange_rate.js).

On the **buying invoice** selection folder (`buying-invoice/{n}`), optional header fields (see [SGSelectionBuyingInvoiceFieldsSection.vue](../client/src/components/selections/SGSelectionBuyingInvoiceFieldsSection.vue)):

| Field                             | Fill Method | Notes                                              |
| --------------------------------- | ----------- | -------------------------------------------------- |
| `partnership_purchase`            | manual      | Checkbox — partnership purchase (`achat en partenariat`). |
| `partnership_purchased_percentage`| manual      | Shown when checkbox is checked; integer **0–100**. |

On the **sale invoice** selection folder (`sale-invoice/{n}`), the same meta keys are available as **Partnership Invoice** (checkbox) + percentage when checked.

**Stock fiscal** (Stats → Stock fiscal): **only gems with `status === buying-invoice`** (UI: Purchased / Buying Invoice) are included; all other statuses are excluded. For each such gem, the table shows gem id, `numero_de_mise_a_consommation`, cost, linked buying invoice, partner (counterparty), applied %, fiscal value = gem Cost (`base_price_pcb`) × applied % ÷ 100, and **fiscal value in EUR**. Applied % comes from the linked buying invoice when `partnership_purchase` and `partnership_purchased_percentage` are set; otherwise from a single sale invoice with Partnership Invoice checked and a set %; otherwise 100%. USD fiscal values are converted with the buying invoice **`exchange_rate`** (shown as `USD → EUR rate = 0.86` on the invoice cell); EUR amounts are kept as-is; a missing USD rate leaves the EUR cell blank. Implementation: [`client/src/utils/stock_fiscal.js`](../client/src/utils/stock_fiscal.js).

### Sale

Multiplicity rule: only one.

| Field           | Fill Method              | Notes                                       |
| --------------- | ------------------------ | ------------------------------------------- |
| `customer`      | select from address book |                                             |
| `sale_number`   | automatic                | Increments by 1 for each new sale document. |
| `sale_date`     | calendar                 | Default is today's date.                    |
| `sale_price_pf` | manual                   | Show `PF`.                                  |
| `pdf`           | link                     |                                             |
| `link`          | link                     |                                             |

## Grading and Traceability (Purple in Source - TODO Later, Not V1)

| Field                    | Fill Method | Notes                                                  |
| ------------------------ | ----------- | ------------------------------------------------------ |
| `bid_id`                 | TBD         | Purple-highlighted in source. TODO for later (not V1). |
| `grading`                | TBD         | Purple-highlighted in source. TODO for later (not V1). |
| `clarity`                | TBD         | Purple-highlighted in source. TODO for later (not V1). |
| `color_estimated`        | TBD         | Purple-highlighted in source. TODO for later (not V1). |
| `shape_estimated`        | TBD         | Purple-highlighted in source. TODO for later (not V1). |
| `quality_estimated`      | TBD         | Purple-highlighted in source. TODO for later (not V1). |
| `date_of_acquisition`    | TBD         | Purple-highlighted in source. TODO for later (not V1). |
| `coc_country_of_cutting` | TBD         | Purple-highlighted in source. TODO for later (not V1). |

## Treatment (Purple in Source - TODO Later, Not V1)

| Field             | Fill Method | Notes                                                  |
| ----------------- | ----------- | ------------------------------------------------------ |
| `treatment_date`  | TBD         | Purple-highlighted in source. TODO for later (not V1). |
| `treatment_type`  | TBD         | Purple-highlighted in source. TODO for later (not V1). |
| `treatment_price` | TBD         | Purple-highlighted in source. TODO for later (not V1). |

## Cutting Operations

| Field              | Fill Method | Notes                   |
| ------------------ | ----------- | ----------------------- |
| `rough_weight`     | TBD         |                         |
| `rough_dimensions` | TBD         |                         |
| `cut_weight`       | TBD         |                         |
| `cut_dimensions`   | TBD         |                         |
| `cutter_name`      | TBD         |                         |
| `cutting_date`     | TBD         |                         |
| `cutting_price`    | TBD         |                         |
| `photo_type`       | select      | Values: `Rough`, `Cut`. |

## Address book (companies)

Company folders under `address_book/{slug}` may store:

| Field                     | Fill Method | Notes                                                                 |
| ------------------------- | ----------- | --------------------------------------------------------------------- |
| `supplier_account_number` | manual      | Optional. Shown on selection PDFs as supplier account No. when the company is the selection counterparty (or parent company of a person counterparty). Omitted from the PDF when empty. UI: [SGContactOpenView.vue](../client/src/views/SGContactOpenView.vue). |

## Related specification

Certificate PDF uploads and `@file`-level fields (`is_gem_certificate`, provider, etc.) are documented in **[`CERTIFICATES.md`](./CERTIFICATES.md)**.
Selection PDF bilingual strings: [selection_pdf_strings.js](../client/src/utils/selection_pdf_strings.js) (see [SELECTIONS.md](./SELECTIONS.md)).
