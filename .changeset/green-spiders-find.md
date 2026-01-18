---
'@watergis/maplibre-gl-terradraw': minor
---

feat: custom callback can be passed for distanceUnit and areaUnit properties of MaplibreMeasureControl.

Note: this change contains **breaking changes** for MaplibreMeasureControl.

**Breaking Changes:**

- `forceDistanceUnit` was renamed to `distanceUnit`.
- `forceAreaUnit` was renamed to `areaUnit`.
- `'auto'` value is no longer supported for either `distanceUnit` or `areaUnit`. If you are using `'auto'` for these properties, please set it to `undefined`. This will apply default auto-unit conversion to compute distance or area.

**Migration Guide:**

- If using `forceDistanceUnit: 'auto'` → change to `distanceUnit: undefined`
- If using `forceDistanceUnit: 'kilometer'` → change to `distanceUnit: 'kilometer'`
- If using `forceAreaUnit: 'auto'` → change to `areaUnit: undefined`
- If using `forceAreaUnit: 'acres'` → change to `areaUnit: 'acres'`

**New Features:**

- Both properties now accept callback functions for custom unit conversion logic.
- When a specific unit is specified (e.g., `'kilometer'`, `'acres'`), it will be used regardless of the `measureUnitType` setting. Previously, if you set `measureUnitType: 'metric'` and `forceAreaUnit: 'acres'`, it would ignore the forced unit and auto-select a metric unit. Now it correctly uses the specified unit.

**Examples:**

Custom distance unit conversion (convert to KM if distance >= 10,000 meters):

```ts
const customConversion: DistanceUnitCallBackType = (valueInMeter) => {
	if (valueInMeter >= 10000) {
		return { distance: valueInMeter / 1000, unit: 'KM' };
	} else {
		return { distance: valueInMeter, unit: 'M' };
	}
};
control.distanceUnit = customConversion;
```

Custom area unit conversion (convert to KM² if area >= 10,000 m²):

```ts
const customConversion: AreaUnitCallBackType = (valueInSquareMeter) => {
	if (valueInSquareMeter >= 10000) {
		return { area: valueInSquareMeter / 1000000, unit: 'KM²' };
	} else {
		return { area: valueInSquareMeter, unit: 'M²' };
	}
};
control.areaUnit = customConversion;
```
