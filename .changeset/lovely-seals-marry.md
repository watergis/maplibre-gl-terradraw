---
'@watergis/maplibre-gl-terradraw': minor
---

feat: compute elevation directly from DEM tilesets either TerrainRGB or Terrarim without enabling maplibre terrain.

If `computeElevation` is enabled, it will try to get elevation from terrarium source from AWS as default.
Due to the issue of network, elevation is no longer fetched `on('change')` event of TerraDraw. Elevation is computed after finishing adding or modifying LineString feature (`on('finish')` event).

```ts
drawControl = new MaplibreMeasureControl({
	modes: terradrawModes as unknown as MeasureControlMode[],
	open: isOpen,
	distanceUnit: distanceUnit,
	distancePrecision,
	areaPrecision,
	computeElevation: true,
	// terrainSource is not necessary to set if you want to get elevation from AWS
	// you can change it to your own DEM source
	terrainSource: {
		url: 'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png',
		encoding: 'terrarium',
		tileSize: 256,
		minzoom: 5,
		maxzoom: 15,
		tms: false
	}
});
map.addControl(drawControl, 'top-left');
```

Please set `undefined` explicitly to `terrainSource` if you want to get elevation maplibre terrain other than getting elevation from DEM dataset. This can compute elevation inside `on('change')` event which will be showing altitude realtime. But users has to enable terrain in advance.

```ts
drawControl = new MaplibreMeasureControl({
	modes: terradrawModes as unknown as MeasureControlMode[],
	open: isOpen,
	distanceUnit: distanceUnit,
	distancePrecision,
	areaPrecision,
	computeElevation: true,
	terrainSource: undefined
});
map.addControl(drawControl, 'top-left');
```
