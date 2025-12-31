---
'@watergis/maplibre-gl-terradraw': minor
---

feat: added `AWS_ELEVATION_TILES` and `MAPTERHORN_TILES` constant variables for easily setting terrain source for MaplibreMeasureControl.

The constant variables can be used like the below code.

```ts
import { MAPTERHORN_TILES, MaplibreMeasureControl } from 'maplibre-gl-terradraw';

const control = new MaplibreMeasureControl({
	terrainSource: MAPTERHORN_TILES
});
```

Furthermore, default terrainSource of MaplibreMeasureControl is now changed to Mapterhorn tiles instead of AWS elevation tiles.
