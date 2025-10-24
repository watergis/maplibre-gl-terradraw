---
'@watergis/maplibre-gl-terradraw': patch
---

fix: refine the default parameters of circle and rectangle of TerraDrawSelectMode.

As suggested by khoshbin via [#455](https://github.com/watergis/maplibre-gl-terradraw/issues/455). New default parameters of TerraDrawSelectMode for `circle` and `rectangle` are as follows.

As default, users cannot insert, edit or delete of each node now. Instead, the size of circle of rectangle will be scaled.

```ts
new TerraDrawSelectMode({
	flags: {
		circle: {
			feature: {
				draggable: true,
				coordinates: {
					resizable: 'center',
					deletable: false,
					midpoints: false
				}
			}
		},
		rectangle: {
			feature: {
				draggable: true,
				// I kept rotateable as true, since rotating can be useful for some circumstances.
				rotateable: true,
				coordinates: {
					resizable: 'opposite',
					deletable: false,
					midpoints: true
				}
			}
		}
	}
});
```

If you want to change options of each TerraDraw mode, you can do so by setting `modeOptions` of the constructor. Please check an example of how to change modeOptions at [this example here](https://terradraw.water-gis.com/examples/change-style).
