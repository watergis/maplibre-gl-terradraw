---
'@watergis/maplibre-gl-terradraw': patch
---

fix: button state synchronization when Terra Draw mode is changed programmatically

- **Button sync fix**: Control buttons now automatically update their visual state when modes are changed via `setMode()`
- **New example**: Added programmatic mode control example demonstrating external button integration
- **MaplibreValhallaControl fix**: Resolved crash when style sources are not yet loaded during initialization

```ts
const draw = new MaplibreTerradrawControl({
	modes: ['point', 'linestring', 'polygon', 'select'],
	open: true
});

map.addControl(draw, 'top-left');

// Button states now automatically sync with programmatic mode changes
draw.getTerraDrawInstance().setMode('select'); // ✅ Select button becomes active
draw.getTerraDrawInstance().setMode('polygon'); // ✅ Polygon button becomes active
```
