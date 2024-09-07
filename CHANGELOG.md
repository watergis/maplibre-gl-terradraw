# @watergis/maplibre-gl-terradraw

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
