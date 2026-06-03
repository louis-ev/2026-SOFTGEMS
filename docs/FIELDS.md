# SoftGems Field Specification

Source updated from `fields(2).xlsx` (latest client sheet).

## Hidden and Purple Rows from Client Sheet

The following rows are explicitly hidden in the XLSX and marked in purple (`#D9D2E9`):

Purple-highlighted rows are **TODO for later** and **not in V1 scope**.

| Section               | Field            | Fill Method        | Notes                                            |
| --------------------- | ---------------- | ------------------ | ------------------------------------------------ |
| Identification        | `parent_id`      | automatic          | Shows parent ID in case of split.                |
| Stone Characteristics | `color_grading`  | select from a list | Hidden in source sheet. TODO for later (not V1). |
| Stone Characteristics | `quality_grade`  | select from a list | Hidden in source sheet. TODO for later (not V1). |
| Stone Characteristics | `clarity`        | select from a list | Hidden in source sheet. TODO for later (not V1). |
| Costs                 | `treatment_cost` | manual             | Hidden in source sheet.                          |
| Costs                 | `total_cost`     | derived            | Purchase price (`T. Buy Px`).                    |

Other purple-highlighted (visible) rows in the sheet are also TODO for later (not V1): `cut_quality`, report `category`, report `location`, and the full `Grading & Traceability` + `Treatment` blocks.

## Global Status Logic

| Field    | Fill Method | Rule                                                                                                                                                |
| -------- | ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `status` | automatic (editable on create) | Default `reference` when stone is created (field editable on the new-gem form). Stored values are **selection-type slugs** where applicable (`memo-in`, `buying-invoice`, `sale-invoice`, `return-memo-in`, `return-memo-out`). Adding a gem to a selection sets `status` to the slug for that selection type. Removing a gem restores status from the most recently added linked selection that still applies, else the status saved before that selection link. Display: [gem_status.js](../client/src/utils/gem_status.js) (labels via selection-type i18n). Logic: [gem_selection_status.js](../client/src/utils/gem_selection_status.js). |

## Identification

| Field                   | Fill Method        | Notes                                                         |
| ----------------------- | ------------------ | ------------------------------------------------------------- |
| `id` / `stone_id`       | automatic          | Reference number increments by 1 for each new stone.          |
| `box_reference`         | automatic          | Shows box reference when stone is associated to a box.        |
| `reference_supplier`    | manual             | Supplier unique identifier for gemstone or parcel.            |
| `reference_customer`    | manual             | Customer unique identifier for gemstone or parcel.            |
| `paired_gem`            | select from gem list | User selects another gem to pair with current gem. On create, reciprocal pairing is auto-set on the selected gem. |
| `parent_id`             | automatic          | Shows parent ID in case of split. (hidden + purple in source) |

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
| `treatment_type`   | select from a list | See options below.                                                                           |
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
| `base_price_pcb`         | manual             | **Total price only** (PCb). Per-carat (PCb/Ct) is **derived in the app** from `weight_ct`; see [Pricing logic](#pricing-pcb-pa-pv-pvd-pc-pf). |
| `purchased_price_pa`     | manual             | **Total price only** (PA). Per-carat (PA/Ct) is **derived**; see [Pricing logic](#pricing-pcb-pa-pv-pvd-pc-pf). |
| `total_cost`             | derived            | Purchase price (`T. Buy Px`). Hidden + purple in source. TODO for later (not V1). |

## Pricing (PCb, PA, PV, PVD, PC, PF)

This section documents **how pricing works in the SoftGems client** (single source of truth per line = **total price** stored in gem meta; **per-carat** values are not persisted for these pairs).

### Rules

- **Persisted**: for each pair line (see table below), only the **total** is stored in meta. Matching “/ Ct” values are **virtual** in the app and are not written as separate price fields for those lines.
- **Displayed “/ Ct”**: computed when `weight_ct` is valid and > 0: **`per_carat = total / weight_ct`**, rounded for display/calculations as implemented in the client (see `computePerCarat` / `computeTotal` in [`client/src/mixins/GemPricing.js`](../client/src/mixins/GemPricing.js); currently 2 decimal places via `toFixed(2)`).
- **Editing the total**: saves the total; the UI refreshes the derived per-carat.
- **Editing “/ Ct”** (virtual field): saves **`total = per_carat × weight_ct`** (same rounding rules as code). **`weight_ct` is never changed** by price edits.
- **No or zero weight**: the intended UX is that **per-carat entry is disabled** (or shows inactive) until a valid carat weight is set; totals remain editable regardless.
- **Changing `weight_ct`**: totals stay the same; displayed per-carat values update from the new weight.

### Pairs (notation → stored field → virtual “/ Ct” UI key)

| Line | Stored total field (`settings_base` / meta) | Virtual per-carat key (UI / table only, **not** in schema as a persisted price) |
| ---- | --------------------------------------------- | --------------------------------------------------------------------------------- |
| PCb  | `base_price_pcb`                              | `price_per_carat_pcb`                                                             |
| PA   | `purchased_price_pa`                          | `price_per_carat_pa`                                                              |
| PV   | `pv_selling_price`                            | `price_per_carat_pv`                                                              |
| PC   | `pc_to`                                       | `price_per_carat_pc`                                                              |
| PF   | `pf_invoiced_price`                           | `price_per_carat_pf`                                                              |

### PVD (asking price)

- **PVD** and **PVD/Ct** in the open gem view are **read-only**: they are **derived from PV** (e.g. `PV × 1.15`) for display.
- **`price_per_carat_pvd`**: same derivation, expressed per carat (display-only).

### Implementation pointers

- Pair definitions: [`client/src/mixins/GemPricing.js`](../client/src/mixins/GemPricing.js)
- Field labels, virtual `pricing_total_key`: [`client/src/components/gems/gem_field_configs.js`](../client/src/components/gems/gem_field_configs.js)
- Gems list table ([`client/src/components/gems/SGGemsTable.vue`](../client/src/components/gems/SGGemsTable.vue)): one column per pricing line (PCb, PA, PV, PVD, PC, PF) — **total** on the first line, derived **per carat + `/ct`** on the second; virtual `price_per_carat_*` keys are not separate columns ([`gem_virtual_per_carat_column_keys`](../client/src/mixins/GemPricing.js)).
- Column customizer ([`client/src/components/gems/SGGemColumnsModal.vue`](../client/src/components/gems/SGGemColumnsModal.vue)): same column keys as the table; legacy per-carat and `length_mm` / `width_mm` / `height_mm` selections are normalized via [`gems_table_metadata.js`](../client/src/utils/gems_table_metadata.js).
- **Not shown in the gems table (V1):** `box_selection_path` (box membership is edited via selection flows and the open gem view; see [`docs/SELECTIONS.md`](SELECTIONS.md)). Removed from V1: `price_per_carat_all`.
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
- `partner invoice`
- `credit note`
- `importation`
- `importation return`

## Partnership (Partner Invoice)

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
| `import_price`                 | automatic / manual       | Default `PCb` or `PA` cost; must remain manually editable.                           |
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

## Related specification

Certificate PDF uploads and `@file`-level fields (`is_gem_certificate`, provider, etc.) are documented in **[`CERTIFICATES.md`](./CERTIFICATES.md)**.
