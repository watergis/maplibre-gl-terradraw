---
'@watergis/maplibre-gl-terradraw': patch
---

fix: direct update properties in MeasureControl

Previously, MeasureControl added own point source to manage elevation label data because TerraDraw didn't allow third party to update properties directly. For point geometry, now it uses td-measure-point source directly.

Furthermore, now the control directly update properties in Terra Draw point/linestring/polygon source. Hence, measured properties of point, line and polygon can be accessed via select mode or getFeatures function.
