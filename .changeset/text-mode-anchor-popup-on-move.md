---
'@watergis/maplibre-gl-terradraw': patch
---

fix: keep the text mode label editor popup anchored to its point when the map is panned or zoomed. Previously the textarea popup stayed at a fixed screen position while the map moved underneath it; it now follows the map so it stays over the label being edited.
