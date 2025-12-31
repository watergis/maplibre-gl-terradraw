---
'@watergis/maplibre-gl-terradraw': minor
---

feat: added `showDeleteConfirmation` property in the constructor options to allow users to set whether confirmation dialog is shown when clicking delete all button.

The example usage is shown as below code.

```ts
import { MaplibreTerradrawControl } from '@watergis/maplibre-gl-terradraw';

const terradrawControl = new MaplibreTerradrawControl({
	modes: ['point', 'linestring', 'polygon', 'delete'],
	showDeleteConfirmation: true // Show confirmation dialog before deleting all features
});

map.addControl(terradrawControl, 'top-right');
```

When `showDeleteConfirmation` is set to `true`, a modal confirmation dialog will appear before deleting all features, preventing accidental data loss. Default value is `false`.

This property is also available for `MaplibreMeasureControl` and `MaplibreValhallaControl` as well.
