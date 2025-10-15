# @watergis/maplibre-gl-terradraw

## 1.9.1

### Patch Changes

- 82636b2: fix: upgraded terradraw to v1.8.0 and maplibre-gl-adapter to v1.2.2

## 1.9.0

### Minor Changes

- f3fa252: feat: add Marker mode to MaplibreTerradrawControl and MaplibreMeasureControl by upgrading terra-draw to v1.17.0.

## 1.8.3

### Patch Changes

- 3009d69: fix: button state synchronization when Terra Draw mode is changed programmatically
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

## 1.8.2

### Patch Changes

- 7657cc1: refactor: renamed convertAreaUnit to convertArea. also added more tests for convertArea and convertDistance function.
- 2b396ab: feat: Add elevation unit support based on measureUnitType property.
  - When measureUnitType is set to 'imperial', elevation displays in feet (ft) instead of meters (m).
  - When measureUnitType is set to 'metric', elevation displays in meters (m).
  - The elevation unit symbol can be customized via measureUnitSymbols property.
  - When measureUnitType changes, existing elevation values are automatically recalculated to display in the appropriate unit.

  Examples:

  ```typescript
  // Use imperial units for elevation
  const control = new MaplibreMeasureControl({
  	measureUnitType: 'imperial',
  	computeElevation: true
  });

  // Change unit type dynamically
  control.measureUnitType = 'metric';

  // Customize elevation unit symbols
  control.measureUnitSymbols = {
  	...control.measureUnitSymbols,
  	foot: 'feet',
  	meter: 'meters'
  };
  ```

## 1.8.1

### Patch Changes

- 2ae8ed5: chore: upgraded TerraDraw to [v1.6.0](https://github.com/JamesLMilner/terra-draw/blob/main/packages/terra-draw/CHANGELOG.md#1160-2025-10-06)

## 1.8.0

### Minor Changes

- e85b338: feat: added `measureUnitType` and `measureUnitSymbols` options in MaplibreMeasureControl constructor options.

  This release contains breaking changes on MaplibreMeasureControl interfaces to simplify measure unit type interfaces. Please read carefully the following release notes.
  - **breaking change** deleted `distanceUnit` and `areaUnit` options and merged them into `measureUnitType`.
  - **breaking change** omitted `radian` and `degrees` unit for distance unit. Now both area and distance only support `metric` or `imperial`.
  - **breaking change** `forceAreaUnit` and `forceDistanceUnit` now use full unit names instead of short unit symbol names.
    - `forceAreaUnit` can accepts:
      - 'auto'
      - 'square meters', 'square kilometers', 'ares', 'hectares'
      - 'square feet', 'square yards', 'acres', 'square miles'
    - `forceDistanceUnit` can accepts:
      - 'auto'
      - 'kilometer', 'meter', 'centimeter'
      - 'mile', 'foot', 'inch'
  - added `measureUnitSymbol` option in MaplibreMeasureControl. Now users can bring their own unit symbol definition for each measure unit.

  As default, measure symbols are defined as follows.

  ```ts
  export const defaultMeasureUnitSymbols: MeasureUnitSymbolType = {
  	kilometer: 'km',
  	meter: 'm',
  	centimeter: 'cm',
  	mile: 'mi',
  	foot: 'ft',
  	inch: 'in',
  	'square meters': 'm²',
  	'square kilometers': 'km²',
  	ares: 'a',
  	hectares: 'ha',
  	'square feet': 'ft²',
  	'square yards': 'yd²',
  	acres: 'acres',
  	'square miles': 'mi²'
  };
  ```

  You can override this setting through `measureUnitSymbol` option through MaplibreMeasureControl constructor.

### Patch Changes

- dbcc71d: fix: make sure passing measureUnitSymbols to helper functions

## 1.7.6

### Patch Changes

- af38602: feat: add more imperial distance unit when `miles` is selected. It auto scales between inch, feet and miles depending on the length of segment.

## 1.7.5

### Patch Changes

- 1c5a84d: feat: added forceDistanceUnit property in MaplibreMeasureControl to allow users to use the same distance unit always.
  - `forceDistanceUnit` parameter can accept from the following units:
    - `auto`
    - metric unit: `cm`, `m`, `km`

  Default is selected for auto which can convert metric distance unit automatically depending on a scale. If other unit type other than `kilometers` is set to `distanceUnit` property (for example, `miles`, `degrees`, `radian`), this `forceDistanceUnit` is ignored and cosidered as `auto`. In case, if you want to use other units other than metric, please use `distanceUnit` property instead.

- 9e5cbee: fixed and optimised `calcDistance` function used in MeasureControl as follows:
  - fix: don't override distancePrecision when distanceUnit is changed. Instead, set default precision inside distancePrecision property
  - refactor: merged getDistanceUnitName and convertMetricDistance into convertDistance helper function

## 1.7.4

### Patch Changes

- 9cf3df4: chore: upgraded terra-draw to v1.15.0.

## 1.7.3

### Patch Changes

- 294976d: feat: upgraded terradraw to v1.14.0
- 0d78aa7: fix: use updateFeatureGeometry and updateFeatureProeprties in ValhallaControl instead of adding/removing features.
- bb415ed: fix: fixed the bug not updating elevation for line feature nodes.

## 1.7.2

### Patch Changes

- 192af3d: fix: fixed bug of not embedding valhalla_isochrone.svg in the output css file by deleting maxSize setting in postcss.config.js

## 1.7.1

### Patch Changes

- a5f4b8c: fix: fixed bug of getFeatures method of MaplibreValhallaControl to ensure returning all existing features.
- bd90cb6: fix: add forceAreaUnit option for MaplibreMeasureControl to return specified area unit always.

  `forceAreaUnit` parameter can accept from the following units:
  - `auto`
  - metric unit: `m2` `km2`, `a` or `ha`
  - imperial unit: `ft2`, `yd2`, `acre` or `mi2`

  Default is selected for `auto` which can convert area unit automatically depending on a scale. If an imperial unit is slected for this option, but you select `metric` for `areaUnit` option, `auto` will be applied. You has to select one of metric unit if you select `metric` for `areaUnit`.

## 1.7.0

### Minor Changes

- 21fc439: feat: add MaplibreValhallaControl to integrate routing/isochrone api with Terra Draw.

### Patch Changes

- 21fc439: fix: add setting-changed event type to trigger event when setting is changed within the control.

## 1.6.1

### Patch Changes

- 70afd4b: fix: changed all SVG icon color to #5f6368 and optimised CSS settings as follows:
  - Use #5f6368 instead of black color for all icons
  - Included original SVG icons in src/scss/icons folder, and use the paths in scss files for better maintainablity.
  - Use postcss to convert SVG file to embed inline SVG in the final output CSS.
  - Made polygon icon size to 80%
  - final CSS file size was reduced to 26kb (current version is 137kb)

## 1.6.0

### Minor Changes

- ddf77e0: feat: Use different maplibre layer name and CSS class name for MaplibreTerradrawControl and MaplibreMeasureControl.

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

### Patch Changes

- 2ad484e: fix: use some icons from [font-gis](https://viglino.github.io/font-gis/) library. main control button is differentiate for standard and measure control now. Also, point, line, polygon, rectangle, angled-rectangle and circle are using icon from font-gis.
- 54e27ff: fix: add freehand-linestring to default modes of MaplibreMeasureControl.

## 1.5.1

### Patch Changes

- a2832a1: fix: keep background layer after calling cleanStyle with excludeTerraDrawLayers option. Previously background layer is deleted mistakenly

## 1.5.0

### Minor Changes

- c5da394: feat: added freehand-linestring mode by upgrading terra-draw to 1.11.0.

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

### Patch Changes

- fe2f02d: chore: update dependencies such as vite (6 to 7), etc

## 1.4.0

### Minor Changes

- f32e89b: feat: upgraded terra-draw from v1.5.0 to [v1.8.0](https://github.com/JamesLMilner/terra-draw/blob/main/packages/terra-draw/CHANGELOG.md#180-2025-06-12), and terra-draw-maplibre-gl-adapter to v1.1.1

## 1.3.14

### Patch Changes

- c8c1f03: fix: fixed bug of mode-changed event is not dispatched when mode is changed.

## 1.3.13

### Patch Changes

- f855296: fix: fixed bug of using structuredClone in MeasureControl constructor.

## 1.3.12

### Patch Changes

- d8b0d64: chore: upgraded terradraw to 1.5.0
- f9977d9: fix: clean td-point-lower and td-polygon-outline in cleanStyle function

## 1.3.11

### Patch Changes

- 113d122: fix: fixed MeasureControl constructor to copy modeOptions correctly (sstructuredClone seems destroying terradraw's mode instances)

## 1.3.10

### Patch Changes

- 13da4fc: feat: added fontGlyphs property to MaplibreMeasureControl to allow users to set text-font easily for measuring layers.

  As default, this maesure control uses maplibre's default font glyphs(Open Sans Regular,Arial Unicode MS Regular) described at https://maplibre.org/maplibre-style-spec/layers/#text-font

  If you are using your own maplibre style or different map privider, you probably need to set the font glyphs to match your maplibre style.

  Font glyph availability depends on what types of glyphs are supported by your maplibre style (e.g., Carto, Openmap tiles, Protomap, Maptiler, etc.) Please make sure the font glyphs are available in your maplibre style.

  Usage:

  ```js
  const drawControl = new MaplibreMeasureControl();
  drawControl.fontGlyphs = ['Open Sans Italic'];
  map.addControl(drawControl);
  ```

## 1.3.9

### Patch Changes

- 9bf9970: fix: make sure starting terradraw when maplibre map is loaded.

## 1.3.8

### Patch Changes

- 1e87766: chore: upgrade terra-draw to 1.4.3, terra-draw-maplibre-gl-adapter to 1.0.3

## 1.3.7

### Patch Changes

- 88d254a: chore: upgrade terra-draw to [v.1.4.0](https://github.com/JamesLMilner/terra-draw/blob/main/packages/terra-draw/CHANGELOG.md#140-2025-03-26)

## 1.3.6

### Patch Changes

- 360ff60: fix: if distance unit is kilometer and the distance is less than 1km or 1m, it converts distance to appropriate unit either meter or centimeter.

  This change adds new property `totalUnit` for segments of a linestring. Now in `lineLayerLabelSpec` maplibre style, uses `totalUnit` property for total distance label. Because total unit and segment unit might become different now.

## 1.3.5

### Patch Changes

- 4d16076: chore: updated terra-draw to v1.3.1, and maplibre adapter to 1.0.2
- 3a3de6d: fix: changed line color of MeasureControl to grey, so it is visible in dark base style

## 1.3.4

### Patch Changes

- e287be3: fix: upgraded TerraDraw to v1.3.0. Furthermore, added a helper function `roundFeatureCoordinates` to round coordinates before adding features to TerraDraw to avoid invalid feature coordiante error.

  Sample usage of `roundFeatureCoordinates` is as follows:

  ```ts
  const drawControl = new MaplibreTerraDrawControl({
  	adapterOptions: {
  		coordinatePrecision: 6
  	}
  });
  map.addControl(drawControl);

  map.once('load', () => {
  	const features = []; // add your geojson features here
  	const draw = drawControl.getTerradrawInstance();
  	draw.addFeatures(roundFeatureCoordinates(features), 6);
  });
  ```

## 1.3.3

### Patch Changes

- accde43: chore: updated dependencies in package.json
- 36d37e3: fix: fixed bug of not removing measure label when draw.removeFeatures to delete features from terra-draw. When the plugin updates altitude in source and feature no longer exists, it will not add measure label again.

## 1.3.2

### Patch Changes

- a567539: chore: upgraded terradraw to v1.2.0, and did the following changes:
  - feat: enable editable for default mode option of point, linestring and polygon. Now, point, linestring and polygon mode can be edited directly without using select mode, and node can be deleted by right click.
  - refactor: use TerraDrawExtend.FeatureID instead of string | number

## 1.3.1

### Patch Changes

- 1d14866: chore: updated devDependencies.
- e514d7f: refactor: moved following util functions from MeasureControl to helpers to reduce code size of the control.
  - queryTerrainElevation
  - getDistanceUnitName
  - calcArea
  - queryElevationByPoint
  - calcDistance

- 10b795e: fix: remove elevation label for point if computeElevation property is disabled.

## 1.3.0

### Minor Changes

- 3bf213a: feat: add support of `point` mode for MeasureControl. `point` queries or computes elevation from either maplibre terrain or raster DEM dataset directly depending on the settings. Because of this change, `AvailableMeasureModes` and `MeasureControlMode` were deleted since it will be the same with default control modes.

### Patch Changes

- 3bf213a: fix: fixed measure labels are not deleted when a selected feature is removed.

## 1.2.3

### Patch Changes

- 19ce0e1: feat: added computeElevation property in MeasureControl to change setting of the instance.
- b455dd5: feat: add cleanStyle method to only get terradraw related layers or without them on maplibre style. `cleanStyle` method can be used like below.

  ```ts
  import { MaplibreTerradrawControl } from '@watergis/maplibre-gl-terradraw';

  const drawControl = new MaplibreTerradrawControl();
  const style = map.getStyle();

  // return a maplibre style after deleting terradraw related layers and sources
  console.log(drawControl.cleanStyle(style, { excludeTerraDrawLayers: true }));

  // return a maplibre style only with terradraw related layers and sources
  console.log(drawControl.cleanStyle(style, { onlyTerraDrawLayers: true }));

  // return a given maplibre style as original
  console.log(drawControl.cleanStyle(style));
  ```

  Apart from using it through control instance, static method of `cleanMaplibreStyle` is also available.

  ```ts
  import {
  	cleanMaplibreStyle,
  	TERRADRAW_SOURCE_IDS,
  	TERRADRAW_MEASURE_SOURCE_IDS
  } from '@watergis/maplibre-gl-terradraw';

  // delete MaplibreTerradrawControl layers
  cleanMaplibreStyle(map.getStyle, { excludeTerraDrawLayers: true }, TERRADRAW_SOURCE_IDS);

  // delete MaplibreMeasureControl layers
  // note. if you changed source IDs from default settings, this constant variable will not work.
  cleanMaplibreStyle(map.getStyle, { excludeTerraDrawLayers: true }, TERRADRAW_MEASURE_SOURCE_IDS);
  ```

## 1.2.2

### Patch Changes

- 895be53: fix: updated terrain-rgb package, so the bundled package size can be reduced.

## 1.2.1

### Patch Changes

- 6c8e120: fix: fixed bug of not computing elevation from maplibre terrain source.

## 1.2.0

### Minor Changes

- 831a6d5: feat: compute elevation directly from DEM tilesets either TerrainRGB or Terrarim without enabling maplibre terrain.

  If `computeElevation` is enabled, it will try to get elevation from terrarium source from AWS as default.
  Due to the issue of network, elevation is no longer fetched `on('change')` event of TerraDraw. Elevation is computed after finishing adding or modifying LineString feature (`on('finish')` event).

  ```ts
  drawControl = new MaplibreMeasureControl({
  	modes: terradrawModes as unknown as MeasureControlMode[],
  	open: isOpen,
  	distanceUnit: distanceUnit,
  	distancePrecision,
  	areaPrecision,
  	computeElevation: true,
  	// terrainSource is not necessary to set if you want to get elevation from AWS
  	// you can change it to your own DEM source
  	terrainSource: {
  		url: 'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png',
  		encoding: 'terrarium',
  		tileSize: 256,
  		minzoom: 5,
  		maxzoom: 15,
  		tms: false
  	}
  });
  map.addControl(drawControl, 'top-left');
  ```

  Please set `undefined` explicitly to `terrainSource` if you want to get elevation maplibre terrain other than getting elevation from DEM dataset. This can compute elevation inside `on('change')` event which will be showing altitude realtime. But users has to enable terrain in advance.

  ```ts
  drawControl = new MaplibreMeasureControl({
  	modes: terradrawModes as unknown as MeasureControlMode[],
  	open: isOpen,
  	distanceUnit: distanceUnit,
  	distancePrecision,
  	areaPrecision,
  	computeElevation: true,
  	terrainSource: undefined
  });
  map.addControl(drawControl, 'top-left');
  ```

### Patch Changes

- 8d9027d: chore: updated dependencies

## 1.1.0

### Minor Changes

- 8bd3c19: feat: make `isExpanded` as a property of MaplibreTerradrawContro to allow users to get or set the state.

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

### Patch Changes

- 9f9c425: chore: update terra-draw to v1.1.0

## 1.0.1

### Patch Changes

- 2fd9f81: fix: changed moduleResolution to bundler for typescript.

## 1.0.0

### Major Changes

- 323da77: feat: upgrade TerraDraw tp v1.0.0 from beta. Drop support of maplibre v2 and v3 since it is no longer supported by TerraDraw.

## 0.8.5

### Patch Changes

- 4ade13a: refactor: moved getDistanceUnitName to MeasureControl class

## 0.8.4

### Patch Changes

- c561a3d: fix: add distanceUnit, distancePrecision and areaPrecision properties to able to change measure unit and precision value in MeasureControl.
- 4e4f037: chore: updated dependencies.
- d8b3ca2: feat: add areaUnit property to switch unit in area either metric or imperial.

## 0.8.3

### Patch Changes

- f397f4b: - fix: fixed a bug of layer ordering of MeasureControl when addFeatures is used to restore data.
  - fix: added recalc public method to re-measure area/distance of features.
  - fix: delete text-font from default measure label style
  - fix: adjusted text-size and text-letter-spacing to look better
  - fix: adjusted measure label and layer style to avoid using true black and white.
  - fix: use `$type` to filter feature for measuring label layers.

## 0.8.2

### Patch Changes

- 8375993: feat: add `computeElevation` option in MeasureControl to enable querying elevation from raster-dem source.

## 0.8.1

### Patch Changes

- fab72bc: fix: use TerraDrawExtend.BaseAdapterConfig type for adapterOptions.

## 0.8.0

### Minor Changes

- a348105: feat: exposed TerraDraw adapter options from the plugin constructor.

  Default adapter options can be changed like the below code. Please refer to more detailed default adapter options at [here](https://github.com/JamesLMilner/terra-draw/blob/main/src/adapters/common/base.adapter.ts#L28-L48)

  ```ts
  const drawControl = new MaplibreTerradrawControl.MaplibreTerradrawControl({
  	adapterOptions: {
  		coordinatePrecision: 9
  	}
  });
  map.addControl(drawControl, 'top-left');
  ```

## 0.7.3

### Patch Changes

- cb56751: chore: updated dependencies in package.json as follows:
  - support `maplibre-gl` to v5 as `peerDependencies`
  - delete turfjs from `peerDependencies` since they are bundled in the package.
  - add `terradraw` marked as optional in `peerDependencies` meta because TerraDraw is included in the plugin package. Terradraw is only required when users want to do their own customization.

## 0.7.2

### Patch Changes

- dd174c9: chore: updated teraddraw to beta.11

## 0.7.1

### Patch Changes

- 0addc97: fix: update properties to include measured distance/area in getFeatures function.

## 0.7.0

### Minor Changes

- 29b7a4b: feat: add download button to fetch geojson feature collection. Furtheremore, select, delete and download button are disabled when no feature is drawn.

### Patch Changes

- 29b7a4b: feat: update TerraDraw to 1.0.0-beta.10

## 0.6.6

### Patch Changes

- db9b16f: fix: fixed bug of polygon validation.

## 0.6.5

### Patch Changes

- b46c62b: feat: add maplibre v5 pre to peerDependencies, and added GlobeControl to the demo.
- 1ac5ce8: fix: delete unfinished geojson features if measured feature is cancelled. Furtheremore, deleted polygon validation from MeasureControl.
- 9d35b87: fix: add select and delete-selection for default mode of MeasureControl

## 0.6.4

### Patch Changes

- e7b1a5f: refactor: restructure folder structure to make sure each constant and interface is in a file. Also, upadated dependencies.

## 0.6.3

### Patch Changes

- 5a285ce: fix: support select and delete-selection mode for MeasureControl. Use change event to compute distance and area instead of finished.

## 0.6.2

### Patch Changes

- 42e6ef0: fix: changed TerraDraw mode style for MeasureControl to differentiate from normal control. Also, circle layer for line label is added to visualize node of distance.

## 0.6.1

### Patch Changes

- af6beaf: fix: only add relevant source for user specified modes. For example, only line layer and source is added if no modes of polygon are used.

## 0.6.0

### Minor Changes

- 36861d2: This release has a breaking change of the plugin interface. Please read carefully this changelog.

  added MaplibreMeasureControl to provide measure line and area control easily.

  Usage of `MaplibreMeasureControl` is like the below code.

  ```ts
  const drawControl = new MaplibreMeasureControl({
  	modes: [
  		'linestring',
  		'polygon',
  		'rectangle',
  		'angled-rectangle',
  		'circle',
  		'sector',
  		'sensor',
  		'freehand',
  		'delete'
  	],
  	open: true
  });
  map.addControl(drawControl, 'top-left');
  ```

  Due to adding new plugin control, `default` export was removed.

  New usage of `MaplibreTerradrawControl` will be like below.
  - NPM

  ```diff
  - import MaplibreTerradrawControl from '$lib/index.js';
  + import { MaplibreTerradrawControl } from '$lib/index.js';
  ```

  - CDN

  for CDN, library name of `MaplibreTerradrawControl` needs to be added.

  ```diff
  - const draw = new MaplibreTerradrawControl();
  + const draw = new MaplibreTerradrawControl.MaplibreTerradrawControl();
  ```

  Furthermore, all interfaces and constants are now exported from index.js.

## 0.5.1

### Patch Changes

- 9358be9: chore: updated vite and other dependencies. Moved exports.types before import and require in package.json

## 0.5.0

### Minor Changes

- 853a8a1: feat: add on/off function to the control for subscribing some events (currently only two modes - mode-changed and feature-deleted are supported)

## 0.4.4

### Patch Changes

- fc1c04f: fix: in some timing, TerraDraw throw error of 'Can not register unless mode is unregistered'. Hence, it resets \_state in modes as unregistered before adding.

## 0.4.3

### Patch Changes

- 5529521: chore: updated devDependencies.

## 0.4.2

### Patch Changes

- cdf5c1d: fix: fixed bug of angled-rectangle, sensor and sector SVG icons which were not rotated with transform in some browser.
- 37a9836: fix: fixed bug when render button is removed. add default hidden mode if no render buttom.

## 0.4.1

### Patch Changes

- fa9ec0f: call this.deactivate() when calling map.removeControl(drawControl)

## 0.4.0

### Minor Changes

- 2e23ac1: feat: add `delete-selection` mode to allow users to delete only selected feature. New `delete-selection` mode is enabled when `select` mode is chosen. As default, it appears right after `select` mode, but you can change it in constructor.

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

## 0.3.1

### Patch Changes

- ec05a90: call TerraDraw.stop() when calling onRemove()

## 0.3.0

### Minor Changes

- c8742be: feat: added Sensor mode and Sector mode to the plugin.

## 0.2.1

### Patch Changes

- c4e42ff: remove controlContrainer on map.removeControl(drawControl)

## 0.2.0

### Minor Changes

- bc8d9c3: feat: add 'delete' mode to arrow users to show/hide delete button in prefered order.

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

- bf466fb: feat: add 'render' mode in default control options in constructor. Now, the position of render toggle mode button can be changed, or completely remove it from control to keep tool always open.

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

### Patch Changes

- aac04eb: fix: show tooltip for each button.
- 0a6130e: fix: fixed bug of angled-rectangle icon in active state. Rotate 45 degree of SVG itself.

## 0.1.2

### Patch Changes

- d1633d4: fix: added rotateable and scalable for linestring.

## 0.1.1

### Patch Changes

- 1935d2c: refactor: removed unused variable from the code
- 5c56e28: fix: merge modeOptions param into the first argument of constructor to make the interface simple.

  In v0.1.0, it used the second argument of constructor to customise drawing options for each Terra Draw mode. The second argment was now merged into the first argument as shown in the below sample code.

  ```js
  const drawControl = new MaplibreTerradrawControl({
  	// only show polgyon, line and select mode.
  	modes: ['polygon', 'linestring', 'select'],
  	modeOptions: {
  		select: new TerraDrawSelectMode({
  			flags: {
  				// only update polygon settings for select mode.
  				// default settings will be used for other geometry types
  				// in this case, line uses default options of the plugin.
  				polygon: {
  					feature: {
  						draggable: false, // users cannot drag to move polygon
  						rotateable: true,
  						scaleable: true,
  						coordinates: {
  							midpoints: false, // users cannot add a node on the middle of edge.
  							draggable: true,
  							deletable: false // users cannot delete a node.
  						}
  					}
  				}
  			}
  		})
  	}
  });
  map.addControl(drawControl, 'top-left');
  ```

## 0.1.0

### Minor Changes

- 4d9a435: feat: allows to overwrite default Terra Draw mode instances by using the second argument of constructor.

  For example, if you only want to use polygon control, and you want to disable draggable option and node insertion/deletion on an edge of a polygon, the setting can be as follows.

  ```ts
  const drawControl = new MaplibreTerradrawControl(
  	{
  		modes: ['polygon', 'select']
  	},
  	{
  		select: new TerraDrawSelectMode({
  			flags: {
  				polygon: {
  					feature: {
  						draggable: false, // users cannot drag to move polygon
  						rotateable: true,
  						scaleable: true,
  						coordinates: {
  							midpoints: false, // users cannot add a node on the middle of edge.
  							draggable: true,
  							deletable: false // users cannot delete a node.
  						}
  					}
  				}
  			}
  		})
  	}
  );
  map.addControl(drawControl, 'top-left');
  ```

- 4d9a435: feat: allows to change the order of Terra Draw modes on the plugin.

  Now, an array of modes can be passed to the constructor of the plugin, and the mode controls will be added exactly the same order. You can also remove unnecessary modes from the array when you initialize the plugin.

  For instance, you can only add point and select control on the plugin like the below code.

  ```ts
  const drawControl = new MaplibreTerradrawControl({
  	modes: ['point', 'select']
  });
  map.addControl(drawControl, 'top-left');
  ```

## 0.0.6

### Patch Changes

- 0d9c15e: fix: updated peerDependencies in package.json to support maplibre v2 to v4 since terra-draw is supporting maplibre from v2

## 0.0.5

### Patch Changes

- 8ec1f8c: feat: added `open` option in the control constructor. Default is false. If true is set to `open` option, editor controller will be expaned as default.

  To expand control as default, create control instance like below.

  ```js
  const drawControl = new MaplibreTerradrawControl({ open: true });
  ```

## 0.0.4

### Patch Changes

- 069bd2e: fix: moved maplibre-gl and terra-draw to peerDependencies. and updated all other dependencies.

## 0.0.3

### Patch Changes

- bfe061e: fix: added TerraDrawRenderMode control as 'render' mode, and it will be used as default state.

## 0.0.2

### Patch Changes

- bbd65a7: fix: added index.d.ts and fixed package.json
