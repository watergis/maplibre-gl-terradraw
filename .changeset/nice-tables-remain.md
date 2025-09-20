---
'@watergis/maplibre-gl-terradraw': patch
---

fixed and optimised `calcDistance` function used in MeasureControl as follows:

- fix: don't override distancePrecision when distanceUnit is changed. Instead, set default precision inside distancePrecision property
- refactor: merged getDistanceUnitName and convertMetricDistance into convertDistance helper function
