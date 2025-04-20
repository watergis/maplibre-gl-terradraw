---
'@watergis/maplibre-gl-terradraw': patch
---

fix: fixed MeasureControl constructor to copy modeOptions correctly (sstructuredClone seems destroying terradraw's mode instances)
