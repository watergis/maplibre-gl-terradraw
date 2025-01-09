---
'@watergis/maplibre-gl-terradraw': minor
---

feat: exposed TerraDraw adapter options from the plugin constructor.

Default adapter options can be changed like the below code. Please refer to more detailed default adapter options at [here](https://github.com/JamesLMilner/terra-draw/blob/main/src/adapters/common/base.adapter.ts#L28-L48)

```ts
const drawControl = new MaplibreTerradrawControl.MaplibreTerradrawControl({
	adapterOptions: {
		coordinatePrecision: 9
	}
});
map.addControl(drawControl, 'top-left');
```
