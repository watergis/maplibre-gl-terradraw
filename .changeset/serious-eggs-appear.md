---
'@watergis/maplibre-gl-terradraw': minor
---

feat: add 'render' mode in default control options in constructor. Now, the position of render toggle mode button can be changed, or completely remove it from control to keep tool always open.

```ts
const drawControl = new MaplibreTerradrawControl({
	modes: [
		'render', // delete this if you want the tool to be always opened.
		'select',
		'point'
	],
	open: true // if you remove 'render' mode, make sure setting open as true.
});
map.addControl(drawControl, 'top-left');
```
