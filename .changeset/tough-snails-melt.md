---
'@watergis/maplibre-gl-terradraw': patch
---

feat: added fontGlyphs property to MaplibreMeasureControl to allow users to set text-font easily for measuring layers.

As default, this maesure control uses maplibre's default font glyphs(Open Sans Regular,Arial Unicode MS Regular) described at https://maplibre.org/maplibre-style-spec/layers/#text-font

If you are using your own maplibre style or different map privider, you probably need to set the font glyphs to match your maplibre style.

Font glyph availability depends on what types of glyphs are supported by your maplibre style (e.g., Carto, Openmap tiles, Protomap, Maptiler, etc.) Please make sure the font glyphs are available in your maplibre style.

Usage:

```js
const drawControl = new MaplibreMeasureControl();
drawControl.fontGlyphs = ['Open Sans Italic'];
map.addControl(drawControl);
```
