---
'@watergis/maplibre-gl-terradraw': patch
---

- fix: fixed a bug of layer ordering of MeasureControl when addFeatures is used to restore data.
- fix: added recalc public method to re-measure area/distance of features.
- fix: delete text-font from default measure label style
- fix: adjusted text-size and text-letter-spacing to look better
- fix: adjusted measure label and layer style to avoid using true black and white.
- fix: use `$type` to filter feature for measuring label layers.
