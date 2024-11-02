---
'@watergis/maplibre-gl-terradraw': minor
---

feat: add `delete-selection` mode to allow users to delete only selected feature. New `delete-selection` mode is enabled when `select` mode is chosen. As default, it appears right after `select` mode, but you can change it in constructor.

```
const drawControl = new MaplibreTerradrawControl({
	modes: [
		'render',
		'select',
        'delete-selection', // place `delete-selection` after select mode. Or you can delete it if this feature is not needed.
		'point',
		'delete'
	],
	open: true
});
map.addControl(drawControl, 'top-left');
```
