---
'@watergis/maplibre-gl-terradraw': patch
---

fix: if distance unit is kilometer and the distance is less than 1km or 1m, it converts distance to appropriate unit either meter or centimeter.

This change adds new property `totalUnit` for segments of a linestring. Now in `lineLayerLabelSpec` maplibre style, uses `totalUnit` property for total distance label. Because total unit and segment unit might become different now.
