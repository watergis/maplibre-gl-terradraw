---
'@watergis/maplibre-gl-terradraw': minor
---

feat: add 'delete' mode to arrow users to show/hide delete button in prefered order.

```ts
const drawControl = new MaplibreTerradrawControl({
	modes: [
		'render',
		'select',
		'point',
		'delete' // delete mode must be specified to show delete button in the tool
	],
	open: true
});
map.addControl(drawControl, 'top-left');
```
