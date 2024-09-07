---
'@watergis/maplibre-gl-terradraw': minor
---

feat: allows to change the order of Terra Draw modes on the plugin.

Now, an array of modes can be passed to the constructor of the plugin, and the mode controls will be added exactly the same order. You can also remove unnecessary modes from the array when you initialize the plugin.

```ts
const drawControl = new MaplibreTerradrawControl({
	modes: [
		'point',
		'linestring',
		'polygon',
		'rectangle',
		'angled-rectangle',
		'circle',
		'freehand',
		'select'
	]
});
```
