---
'@watergis/maplibre-gl-terradraw': minor
---

feat: Use different maplibre layer name and CSS class name for MaplibreTerradrawControl and MaplibreMeasureControl.

This release contains **breaking changes** on `MaplibreMeasureControl` as described in the below.

- the list of changes on maplibre layer names

| old layer name                  | MaplibreTerradrawControl | MaplibreMeasureControl     |
| ------------------------------- | ------------------------ | -------------------------- |
| td-point                        | td-point                 | td-measure-point           |
| td-point-lower                  | td-point-lower           | td-measure-point-lower     |
| td-linestring                   | td-linestring            | td-measure-linestring      |
| td-polygon                      | td-polygon               | td-measure-polygon         |
| td-polygon-outline              | td-polygon-outline       | td-measure-polygon-outline |
| terradraw-measure-point-label   | n/a                      | td-measure-point-label     |
| terradraw-measure-line-label    | n/a                      | td-measure-line-label      |
| terradraw-measure-line-node     | n/a                      | td-measure-line-node       |
| terradraw-measure-polygon-label | n/a                      | td-measure-polygon-label   |

There is no change on `MaplibreTerradrawControl`, however layer names for `MaplibreMeasureControl` were changed.

- the list of class names on `maplibre-gl-terradraw.scss`

| MaplibreTerradrawControl                            | MaplibreMeasureControl                                      |
| --------------------------------------------------- | ----------------------------------------------------------- |
| maplibregl-terradraw-render-button                  | maplibregl-terradraw-measure-render-button                  |
| maplibregl-terradraw-add-point-button               | maplibregl-terradraw-measure-add-point-button               |
| maplibregl-terradraw-add-linestring-button          | maplibregl-terradraw-measure-add-linestring-button          |
| maplibregl-terradraw-add-polygon-button             | maplibregl-terradraw-measure-add-polygon-button             |
| maplibregl-terradraw-add-rectangle-button           | maplibregl-terradraw-measure-add-rectangle-button           |
| maplibregl-terradraw-add-angled-rectangle-button    | maplibregl-terradraw-measure-add-angled-rectangle-button    |
| maplibregl-terradraw-add-circle-button              | maplibregl-terradraw-measure-add-circle-button              |
| maplibregl-terradraw-add-freehand-button            | maplibregl-terradraw-measure-add-freehand-button            |
| maplibregl-terradraw-add-freehand-linestring-button | maplibregl-terradraw-measure-add-freehand-linestring-button |
| maplibregl-terradraw-add-select-button              | maplibregl-terradraw-measure-add-select-button              |
| maplibregl-terradraw-add-sensor-button              | maplibregl-terradraw-measure-add-sensor-button              |
| maplibregl-terradraw-add-sector-button              | maplibregl-terradraw-measure-add-sector-button              |
| maplibregl-terradraw-add-control                    | maplibregl-terradraw-measure-add-control                    |
| maplibregl-terradraw-delete-button                  | maplibregl-terradraw-measure-delete-button                  |
| maplibregl-terradraw-delete-selection-button        | maplibregl-terradraw-measure-delete-selection-button        |
| maplibregl-terradraw-download-button                | maplibregl-terradraw-measure-download-button                |

There is no change on `MaplibreTerradrawControl`, however all class names now have `maplibregl-terradraw-measure-` prefix for `MaplibreMeasureControl`.

- Use both controls together

Because of this change, now you can use both controls together on the same maplibre map. The below is an example code how to use both controls together.

```ts
// add Default Control to the top-left corner of the map
// standard control will add layers with prefix of 'td'
const drawControl = new MaplibreTerradrawControl.MaplibreTerradrawControl({
	open: true
});
map.addControl(drawControl, 'top-left');

// add MeasureControl to the top-right corner of the map
// measure control will add layers with prefix of 'td-measure'
const measureControl = new MaplibreTerradrawControl.MaplibreMeasureControl({
	open: true,
	computeElevation: true
});
map.addControl(measureControl, 'top-right');

// there will be drawing event conflict between two Terra Draw controls.
// so we need to reset the active mode of one control when the other control's mode is changed.
drawControl.on('mode-changed', (e) => {
	if (e.mode !== 'render') {
		measureControl.resetActiveMode();
	}
});
measureControl.on('mode-changed', (e) => {
	if (e.mode !== 'render') {
		drawControl.resetActiveMode();
	}
});
```
