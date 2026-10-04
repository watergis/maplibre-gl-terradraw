---
'@watergis/maplibre-gl-terradraw': minor
---

feat: add `ellipse` mode (`TerraDrawEllipseMode` introduced in Terra Draw v1.33.0) to the default, measure controls. In select mode, an ellipse can be resized per axis from its center and rotated. The default select flag of `circle` is changed from `resizable: 'center'` to `resizable: 'center-fixed'` so that a circle keeps its aspect ratio when resized.
