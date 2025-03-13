---
'@watergis/maplibre-gl-terradraw': patch
---

fix: fixed bug of not removing measure label when draw.removeFeatures to delete features from terra-draw. When the plugin updates altitude in source and feature no longer exists, it will not add measure label again.
