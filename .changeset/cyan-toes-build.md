---
'@watergis/maplibre-gl-terradraw': minor
---

feat: add MaplibreMeasureControl to provide measure line and area control easily.

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

This release has a breaking change of the plugin interface. Due to adding new plugin control, `default` export was removed.

New usage of `MaplibreTerradrawControl` will be like below.

```diff
- import MaplibreTerradrawControl from '$lib/index.js';
+ import { MaplibreTerradrawControl } from '$lib/index.js';
```

Furthermore, all interfaces and constants are now exported from index.js.
