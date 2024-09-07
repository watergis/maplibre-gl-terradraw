---
'@watergis/maplibre-gl-terradraw': minor
---

feat: allows to change the order of Terra Draw modes on the plugin.

Now, an array of modes can be passed to the constructor of the plugin, and the mode controls will be added exactly the same order. You can also remove unnecessary modes from the array when you initialize the plugin.

For instance, you can only add point and select control on the plugin like the below code.

```ts
const drawControl = new MaplibreTerradrawControl({
	modes: ['point', 'select']
});
map.addControl(drawControl, 'top-left');
```
