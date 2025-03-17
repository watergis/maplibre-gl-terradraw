---
'@watergis/maplibre-gl-terradraw': patch
---

fix: upgraded TerraDraw to v1.3.0. Furthermore, added a helper function `roundFeatureCoordinates` to round coordinates before adding features to TerraDraw to avoid invalid feature coordiante error.

Sample usage of `roundFeatureCoordinates` is as follows:

```ts
const drawControl = new MaplibreTerraDrawControl({
	adapterOptions: {
		coordinatePrecision: 6
	}
});
map.addControl(drawControl);

map.once('load', () => {
	const features = []; // add your geojson features here
	const draw = drawControl.getTerradrawInstance();
	draw.addFeatures(roundFeatureCoordinates(features), 6);
});
```
