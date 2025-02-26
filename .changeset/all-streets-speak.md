---
'@watergis/maplibre-gl-terradraw': patch
---

chore: upgraded terradraw to v1.2.0, and did the following changes:

- feat: enable editable for default mode option of point, linestring and polygon. Now, point, linestring and polygon mode can be edited directly without using select mode, and node can be deleted by right click.
- refactor: use TerraDrawExtend.FeatureID instead of string | number
