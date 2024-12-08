---
'@watergis/maplibre-gl-terradraw': minor
---

This release has a breaking change of the plugin interface. Please read carefully this changelog.

added MaplibreMeasureControl to provide measure line and area control easily.

Usage of `MaplibreMeasureControl` is like the below code.

```ts
const drawControl = new MaplibreMeasureControl({
	modes: [
		'linestring',
		'polygon',
		'rectangle',
		'angled-rectangle',
		'circle',
		'sector',
		'sensor',
		'freehand',
		'delete'
	],
	open: true
});
map.addControl(drawControl, 'top-left');
```

Due to adding new plugin control, `default` export was removed.

New usage of `MaplibreTerradrawControl` will be like below.

- NPM

```diff
- import MaplibreTerradrawControl from '$lib/index.js';
+ import { MaplibreTerradrawControl } from '$lib/index.js';
```

- CDN

for CDN, library name of `MaplibreTerradrawControl` needs to be added.

```diff
- const draw = new MaplibreTerradrawControl();
+ const draw = new MaplibreTerradrawControl.MaplibreTerradrawControl();
```

Furthermore, all interfaces and constants are now exported from index.js.
