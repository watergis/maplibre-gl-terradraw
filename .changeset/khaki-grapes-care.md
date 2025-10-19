---
'@watergis/maplibre-gl-terradraw': patch
---

fix: use td-measure-point source directly on point/maker mode of MeasureControl.

Previously, MeasureControl added own point source to manage elevation label data because TerraDraw didn't allow third party to update properties directly. For point geometry, now the control directly update properties in Terra Draw point source. This allows users to get access to elevation label for points through `getFeatures` method.
