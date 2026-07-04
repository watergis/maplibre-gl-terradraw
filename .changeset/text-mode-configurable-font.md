---
'@watergis/maplibre-gl-terradraw': patch
---

feat: make TextMode label font configurable.

Set it declaratively via `TextModeStyling.textFont`, or at runtime via the new `fontGlyphs` property on `MaplibreTerradrawControl`.

Defaults to `['sans-serif']` so labels are not constrained by the map style's available glyphs. `MaplibreMeasureControl` / `MaplibreValhallaControl` now reuse this base `fontGlyphs` implementation, so setting their `fontGlyphs` also updates the TextMode label font.
