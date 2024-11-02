# @watergis/maplibre-gl-terradraw

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
