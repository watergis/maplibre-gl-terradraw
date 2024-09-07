---
'@watergis/maplibre-gl-terradraw': minor
---

feat: allows to overwrite default Terra Draw mode instances by using the second argument of constructor.

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
