---
'@watergis/maplibre-gl-terradraw': minor
---

feat: split Valhalla logic into dedicated modes and store isochrone results as polygons directly in Terra Draw

### New features

- Added dedicated Valhalla modes:
  - TerraDrawValhallaRoutingMode
  - TerraDrawValhallaTimeIsochroneMode
  - TerraDrawValhallaDistanceIsochroneMode
- Time and distance isochrone results are now stored as contour polygons directly in the Terra Draw store.
- Routing results are handled in mode logic, including route line updates and route-node point features.
- Valhalla responsibilities are moved from control-level layer handling into mode-level behavior for simpler management.
- The default Valhalla mode styles are now merged into the mode instances you pass through `modeOptions`, so replacing a mode only to set its `url` no longer drops the control's default styling. Styles you specify yourself still take precedence.
- The routing node points can now be styled per node type through `TerraDrawValhallaRoutingMode` styles: `startPointColor` / `startPointWidth` / `startPointOutlineColor` / `startPointOutlineWidth` for the first node, the same `goalPoint*` properties for the last node and `viaPoint*` properties for the intermediate nodes. Their defaults are defined in `defaultValhallaControlOptions`.

### Breaking changes

- Removed the following ValhallaControlOptions layer specs:
  - routingLineLayerNodeSpec
  - timeIsochronePolygonLayerSpec
  - timeIsochroneLineLayerSpec
  - distanceIsochronePolygonLayerSpec
  - distanceIsochroneLineLayerSpec
- If your app config still sets these properties, remove them.

### Example usage of the new modes

```ts
import {
	MaplibreValhallaControl,
	TerraDrawValhallaRoutingMode,
	TerraDrawValhallaTimeIsochroneMode,
	TerraDrawValhallaDistanceIsochroneMode
} from '@watergis/maplibre-gl-terradraw';

const valhallaUrl = 'https://your-valhalla.example.com';

const drawControl = new MaplibreValhallaControl({
	modes: ['routing', 'time-isochrone', 'distance-isochrone'],
	modeOptions: {
		routing: new TerraDrawValhallaRoutingMode({
			url: valhallaUrl,
			costingModel: 'auto',
			distanceUnit: 'kilometers'
		}),
		'time-isochrone': new TerraDrawValhallaTimeIsochroneMode({
			url: valhallaUrl,
			costingModel: 'pedestrian',
			contours: [
				{ time: 5, distance: 1, color: '#ff0000' },
				{ time: 10, distance: 2, color: '#ffaa00' },
				{ time: 15, distance: 3, color: '#00aaff' }
			]
		}),
		'distance-isochrone': new TerraDrawValhallaDistanceIsochroneMode({
			url: valhallaUrl,
			costingModel: 'bicycle',
			contours: [
				{ time: 5, distance: 1, color: '#ff0000' },
				{ time: 10, distance: 2, color: '#ffaa00' },
				{ time: 15, distance: 3, color: '#00aaff' }
			]
		})
	}
});

map.addControl(drawControl, 'top-right');
```
