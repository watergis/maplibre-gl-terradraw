---
'@watergis/maplibre-gl-terradraw': patch
---

fix: changed all SVG icon color to #5f6368 and optimised CSS settings as follows:

- Use #5f6368 instead of black color for all icons
- Included original SVG icons in src/scss/icons folder, and use the paths in scss files for better maintainablity.
- Use postcss to convert SVG file to embed inline SVG in the final output CSS.
- Made polygon icon size to 80%
- final CSS file size was reduced to 26kb (current version is 137kb)
