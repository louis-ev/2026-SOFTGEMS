# Gems CSV Fields Reference

This document lists the fields found in the provided CSV sample, with a suggested type and possible values.

## Notes

- Decimal values in the sample use commas (example: `1,238`); convert to numeric format during import.
- Empty values should be stored as `NULL`.
- Unknown placeholders like `?` should be normalized to `NULL` plus an optional import warning.
- For controlled fields (`shape`, `color`, `origin`, `mode`, `lab`), use normalized canonical values.

## Field Definitions

### `Comment`
- Suggested type: `string` (nullable)
- Possible values (sample): `Ali stone`, `William stone (his cost 250 000$)`, `Ali's mother stone`, `ACF stone 50%`, `Consigned to Ali`

### `ACF ID`
- Suggested type: `integer` (nullable)
- Possible values (sample): `1`, `2`, ..., `69`
- Notes: appears to be an internal row/reference identifier.

### `Ali's ID`
- Suggested type: `string` (nullable)
- Possible values (sample): numeric ids like `1391`, `1270`, special values like `?`, text like `William stone`, and empty values.
- Notes: keep as `string` because source contains non-numeric entries.

### `Pcs`
- Suggested type: `integer`
- Possible values (sample): `1`

### `Type Stone`
- Suggested type: `enum` (or `string` with lookup table)
- Possible values (sample):
  - `Sapphire`
  - `Ruby`
  - `Tanzanite`
  - `Spinel (Tanzania)`

### `Old Weight`
- Suggested type: `decimal(10,3)` (nullable)
- Possible values (sample): `1,238`, `3,016`, `12,209`, `30,67`, etc.

### `New Weight`
- Suggested type: `decimal(10,3)` (nullable)
- Possible values (sample): `1,16`, `3,016`, `6`, `12,12`, `30,67`, etc.

### `Shape`
- Suggested type: `enum` (or `string` with lookup table)
- Possible values (sample):
  - `EC`
  - `OV`
  - `CN`
  - `SQ CN`
  - `PS`
  - `RD`
  - `SL`
- Notes: normalize abbreviations to canonical names if needed.

### `Dimensions`
- Suggested type: `string` at import + parsed numeric fields
- Possible values (sample): `6,65x4,39x3,88`, `10,77x6,21x3,95`, `11x90x11,45x10,07` (inconsistent pattern appears once)
- Recommended derived fields:
  - `length_mm` -> `decimal(10,2)`
  - `width_mm` -> `decimal(10,2)`
  - `depth_mm` -> `decimal(10,2)`

### `pairs`
- Suggested type: `string` (nullable)
- Possible values (sample): `pair 1390`, `pair 1332`, `pair 2363`, `pair 1404`, empty
- Notes: can be parsed into a relation table (`paired_stone_id`) if IDs are reliable.

### `Location`
- Suggested type: `enum` (or `string` with lookup table)
- Possible values (sample): `Bangkok`, empty

### `Mode`
- Suggested type: `enum` (or `string` with lookup table)
- Possible values (sample): `RETOUR`, empty

### `Color`
- Suggested type: `enum` (or `string` with lookup table)
- Possible values (sample):
  - `blue`
  - `red`
  - `light grey`
  - `orange`
  - `bluegreen`
  - `pink`
  - `intense pink`
  - `green`
  - `Royal Blue`
  - `padparadscha`
  - `violet`

### `Origin`
- Suggested type: `enum` (or `string` with lookup table)
- Possible values (sample):
  - `Ceylon (Sri Lanka)`
  - `Madagascar`
  - `Madagascar (Ilakaka)`
  - `Mozambique`
  - `East Africa`
  - `Basalt related deposit`
  - `Unknown`

### `Cut`
- Suggested type: `enum` (or `string` with lookup table)
- Possible values (sample):
  - `octogonal`
  - `oval`
  - `cushion`
  - `pear shape`
  - `square cushion`
  - `sugarloaf`

### `Cost/Ct`
- Suggested type: `decimal(12,2)` (nullable)
- Possible values (sample): `2059,77`, `500`, `6962,86`, `15500`, etc.

### `Cost`
- Suggested type: `decimal(14,2)` (nullable)
- Possible values (sample): `2550`, `4200`, `93000`, `252000`, etc.

### `Price Cut`
- Suggested type: `decimal(12,2)` (nullable)
- Possible values (sample): mostly `0`, sometimes values like `15`
- Notes: likely percent or fixed amount; confirm business meaning.

### `Price Cert`
- Suggested type: `decimal(12,2)` (nullable)
- Possible values (sample): `0`, `7`, `16`, `22`, `29`, `33`, `66`, `99`, `312`, `397`, `463`, `872`, `1396`

### `PV`
- Suggested type: `decimal(14,2)` (nullable)
- Possible values (sample): `4147,3`, `8838,5`, `10762,5`, `141000`, etc.
- Notes: likely selling price total.

### `PV/ct`
- Suggested type: `decimal(12,2)` (nullable)
- Possible values (sample): `3575`, `7111`, `650`, `23500`, etc.

### `Lab`
- Suggested type: `enum` (or `string` with lookup table)
- Possible values (sample):
  - `Bellerophon`
  - `AGL`
  - `SSEF`
  - `SSEF (H)`
  - empty

### `Cert Nr`
- Suggested type: `string` (nullable)
- Possible values (sample): `B11247`, `r-202142698`, `b0250`, `1130951`, `147669`, empty

## Optional Derived/Validation Fields

- `weight_loss_pct` (`decimal(6,3)`): `(old_weight - new_weight) / old_weight * 100`
- `cost_recalc` (`decimal(14,2)`): `cost_ct * new_weight`
- `pv_ct_recalc` (`decimal(12,2)`): `pv / new_weight`
- `data_quality_status` (`enum`): `complete`, `partial`, `inconsistent`
