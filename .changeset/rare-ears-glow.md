---
'@watergis/maplibre-gl-terradraw': patch
---

fix: add forceAreaUnit option for MaplibreMeasureControl to return specified area unit always.

`forceAreaUnit` parameter can accept from the following units:

- `auto`
- metric unit: `m2` `km2`, `a` or `ha`
- imperial unit: `ft2`, `yd2`, `acre` or `mi2`

Default is selected for `auto` which can convert area unit automatically depending on a scale. If an imperial unit is slected for this option, but you select `metric` for `areaUnit` option, `auto` will be applied. You has to select one of metric unit if you select `metric` for `areaUnit`.
