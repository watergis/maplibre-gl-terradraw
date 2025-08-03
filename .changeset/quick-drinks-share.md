---
'@watergis/maplibre-gl-terradraw': minor
---

feat: added freehand-linestring mode by upgrading terra-draw to 1.11.0.

Introduced cache functionality to avoid fetching elevation by the same coordinates repeatedly. The below is an example how to use cache for elevation. If it is not specified, default setting is used for caching.

```ts
const draw = new MaplibreMeasureControl({
	elevationCacheConfig: {
		enabled: true, // enable cache
		maxSize: 1000, // max cache size
		ttl: 60 * 60 * 1000, // 1 hour
		precision: 9 // 9 is default precision of terra-draw adapter setting
	}
});
```
