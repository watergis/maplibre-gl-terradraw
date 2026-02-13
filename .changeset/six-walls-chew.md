---
'@watergis/maplibre-gl-terradraw': minor
---

feat: split valhalla isochrone button into two buttons for time isochrone and distance isochrone.

**IMPORTANT!** This release contains breaking changes for Valhalla isochrone control.

#### Breaking Changes

- Mode names have changed:
  - `point` → `time-isochrone`, `distance-isochrone`
- The `contourType` property has been removed.
- `costingModel` has been split into `timeCostingModel` and `distanceCostingModel`.

New default valhallaOptions parameters will be as following example.

```ts
	valhallaOptions: {
		url: '',
		routingOptions: {
			costingModel: 'auto',
			distanceUnit: 'kilometers'
		},
		isochroneOptions: {
			timeCostingModel: 'auto',
			distanceCostingModel: 'auto',
			contours: [
				{
					time: 3,
					distance: 1,
					color: '#ff0000'
				},
				{
					time: 5,
					distance: 2,
					color: '#ffff00'
				},
				{
					time: 10,
					distance: 3,
					color: '#0000ff'
				},
				{
					time: 15,
					distance: 4,
					color: '#ff00ff'
				}
			]
		}
	},
```
