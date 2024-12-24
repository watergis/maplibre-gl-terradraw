# @watergis/maplibre-gl-terradraw

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
