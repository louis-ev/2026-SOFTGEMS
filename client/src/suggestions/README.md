# SoftGems Suggestions

This folder contains reusable suggestion lists for SoftGems fields.

## Current files

- `stone_type_suggestions.js`: suggestion list for stone type field.
- `status_suggestions.js`: options for gem status.
- `color_suggestions.js`: options for gem color.
- `shape_suggestions.js`: options for gem shape.
- `origin_country_suggestions.js`: options for gem origin/country.
- `treatment_type_suggestions.js`: options for treatment type.
- `pair_single_indicator_suggestions.js`: options for pair/single indicator.

## Usage

```js
import { stone_type_suggestions } from "@/suggestions/softgems";
```

Keep these files as plain arrays so they can be reused by:

- text inputs with datalist/autocomplete
- select components
- filtering helpers
- validation logic
