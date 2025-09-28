---
'@watergis/maplibre-gl-terradraw': minor
---

feat: added `measureUnitType` and `measureUnitSymbols` options in MaplibreMeasureControl constructor options.

- **breaking change** deleted `distanceUnit` and `areaUnit` options and merged them into `measureUnitType`.
- **breaking change** omitted `radian` and `degrees` unit for distance unit. Now both area and distance only support `metric` or `imperial`.
- **breaking change** `forceAreaUnit` and `forceDistanceUnit` now use full unit names instead of short unit symbol names.
  - `forceAreaUnit` can accepts:
    - 'auto'
    - 'square meters', 'square kilometers', 'ares', 'hectares'
    - 'square feet', 'square yards', 'acres', 'square miles'
  - `forceDistanceUnit` can accepts:
    - 'auto'
    - 'kilometer', 'meter', 'centimeter'
    - 'mile', 'foot', 'inch'
- added `measureUnitSymbol` option in MaplibreMeasureControl. Now users can bring their own unit symbol definition for each measure unit.

As default, measure symbols are defined as follows.

```ts
export const defaultMeasureUnitSymbols: MeasureUnitSymbolType = {
	kilometer: 'km',
	meter: 'm',
	centimeter: 'cm',
	mile: 'mi',
	foot: 'ft',
	inch: 'in',
	'square meters': 'm²',
	'square kilometers': 'km²',
	ares: 'a',
	hectares: 'ha',
	'square feet': 'ft²',
	'square yards': 'yd²',
	acres: 'acres',
	'square miles': 'mi²'
};
```

You can override this setting through `measureUnitSymbol` option through MaplibreMeasureControl constructor.
