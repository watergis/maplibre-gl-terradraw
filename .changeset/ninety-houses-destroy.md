---
'@watergis/maplibre-gl-terradraw': patch
---

feat: add cleanStyle method to only get terradraw related layers or without them on maplibre style. `cleanStyle` method can be used like below.

```ts
import { MaplibreTerradrawControl } from '@watergis/maplibre-gl-terradraw';

const drawControl = new MaplibreTerradrawControl();
const style = map.getStyle();

// return a maplibre style after deleting terradraw related layers and sources
console.log(drawControl.cleanStyle(style, { excludeTerraDrawLayers: true }));

// return a maplibre style only with terradraw related layers and sources
console.log(drawControl.cleanStyle(style, { onlyTerraDrawLayers: true }));

// return a given maplibre style as original
console.log(drawControl.cleanStyle(style));
```

Apart from using it through control instance, static method of `cleanMaplibreStyle` is also available.

```ts
import {
	cleanMaplibreStyle,
	TERRADRAW_SOURCE_IDS,
	TERRADRAW_MEASURE_SOURCE_IDS
} from '@watergis/maplibre-gl-terradraw';

// delete MaplibreTerradrawControl layers
cleanMaplibreStyle(map.getStyle, { excludeTerraDrawLayers: true }, TERRADRAW_SOURCE_IDS);

// delete MaplibreMeasureControl layers
// note. if you changed source IDs from default settings, this constant variable will not work.
cleanMaplibreStyle(map.getStyle, { excludeTerraDrawLayers: true }, TERRADRAW_MEASURE_SOURCE_IDS);
```
