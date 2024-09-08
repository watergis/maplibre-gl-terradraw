---
'@watergis/maplibre-gl-terradraw': patch
---

fix: merge modeOptions param into the first argument of constructor to make the interface simple.

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
