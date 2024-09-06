---
'@watergis/maplibre-gl-terradraw': patch
---

feat: added `open` option in the control constructor. Default is false. If true is set to `open` option, editor controller will be expaned as default.

To expand control as default, create control instance like below.

```js
const drawControl = new MaplibreTerradrawControl({ open: true });
```
