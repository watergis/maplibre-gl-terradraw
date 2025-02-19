---
'@watergis/maplibre-gl-terradraw': minor
---

feat: add support of `point` mode for MeasureControl. `point` queries or computes elevation from either maplibre terrain or raster DEM dataset directly depending on the settings. Because of this change, `AvailableMeasureModes` and `MeasureControlMode` were deleted since it will be the same with default control modes.
