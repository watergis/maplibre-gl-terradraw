---
'@watergis/maplibre-gl-terradraw': patch
---

fix: set coordinates.midpoints to false for default settings of TerraDrawRectangleMode and TerraDrawAngledRectangleMode to solve the bug that midpoints are remained in the previous locations when the polygon is resized.
