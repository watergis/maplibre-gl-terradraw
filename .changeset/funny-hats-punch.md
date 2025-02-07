---
'@watergis/maplibre-gl-terradraw': minor
---

feat: make `isExpanded` as a property of MaplibreTerradrawContro to allow users to get or set the state.

```ts
const drawControl = new MaplibreTerradrawControl();

// get the state of isExpanded
console.log(drawControl.isExpanded);

// expand tool
drawControl.isExpanded = true;

// collapse tool
drawControl.isExpanded = false;

// subscribe expanded/collapsed events
drawControl.on('expanded', () => {
	console.log('expanded');
});
drawControl.on('collapsed', () => {
	console.log('collapsed');
});
```
