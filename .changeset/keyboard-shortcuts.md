---
'@watergis/maplibre-gl-terradraw': minor
---

Add keyboard shortcuts for mode switching and drawing actions.

All three controls (`MaplibreTerradrawControl`, `MaplibreValhallaControl`, and `MaplibreMeasureControl`) now listen for keyboard events and activate the corresponding drawing mode or action. Default bindings ship out of the box — for example `p` for point, `g` for polygon, `l` for linestring, `c` for circle, `s` for select, `Backspace` to delete all features, `Shift+Backspace` to delete the current selection, and `d` to download — with Ctrl/⌘+Z / Ctrl/⌘+Shift+Z wired to TerraDraw's built-in undo/redo handler.

The full shortcut map is customisable: pass a `keyboardShortcuts` option to any control constructor to override individual bindings or disable them entirely by setting a key to `null`. Duplicate shortcut detection runs at mount time and throws an error early so conflicts are caught during development.

Shortcuts are suppressed when focus is inside an `<input>`, `<textarea>`, `<select>`, or any `contenteditable` element to avoid interfering with text entry.
