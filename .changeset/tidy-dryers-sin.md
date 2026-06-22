---
'@watergis/maplibre-gl-terradraw': major
---

## New Feature: Text Label Mode (`text`)

Added `TerraDrawTextMode` — a custom Terra Draw mode that lets users place, edit, and drag freeform text labels anywhere on the map.

### Placement

- **Click** anywhere on the map to open a textarea popup at that location. Make sure that `text` mode in the control is active.
- Type a label and press **Enter** (or click the **Submit** button) to commit it as a GeoJSON `Point` feature with a `text` property.
- Press **Shift+Enter** to insert a newline without committing.
- Press **Escape** (or click outside) to dismiss the popup and discard the uncommitted feature.
- Clicking outside an open textarea while it contains text commits the label immediately.

### Editing

- Pass `editable: true` in the mode options to enable in-place editing.
- **Right-click** (desktop) or **long-press** (mobile) near an existing label to re-open the textarea pre-filled with its current text.
- Submit the edited popup to update the feature's `text` property.

### Dragging

- Labels with committed text are draggable via `TerraDrawSelectMode` when the `text` flag is configured with `draggable: true` (the default in `getDefaultModeOptions`).
- The map symbol layer tracking (`{prefix}-text-labels`) is updated live during a drag via the `terradraw.on('change')` event.

### Symbol layer management (`MaplibreTerradrawControl`)

When the `text` mode is included, `MaplibreTerradrawControl` automatically manages a dedicated MapLibre GL symbol layer on top of all other TerraDraw layers:

| Method                                    | Description                                                                                                                                                                                                                         |
| ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `createTerradrawTextLayer(map, styles?)`  | Adds (or refreshes) the `{prefix}-text` GeoJSON source and `{prefix}-text-labels` symbol layer, then calls `map.moveLayer` to ensure it renders above all other TerraDraw layers. Called on `onAdd` and after every `finish` event. |
| `selectTextLabelLayer(featureId)`         | Applies highlighted styles (larger text, white halo) to the selected text label. Called on `terradraw.on('select')`.                                                                                                                |
| `resetTextLabelLayer()`                   | Restores the default text-color, halo-color, and halo-width after a deselect. Called on `terradraw.on('deselect')`.                                                                                                                 |
| `clearTextLayers()`                       | Removes the symbol layer and GeoJSON source from the map. Called when all features are deleted.                                                                                                                                     |
| `deleteSelectedTextSymbolLayer(features)` | Updates the source data to remove only the deleted text features while keeping the rest. Called from `handleDeleteSelectedFeatures`.                                                                                                |

### Styling options (`TextModeStyling`)

Passed via `modeOptions.text.styles` or as the second argument to `createTerradrawTextLayer`:

| Property        | Type       | Default   | Description                                                       |
| --------------- | ---------- | --------- | ----------------------------------------------------------------- |
| `textColor`     | `HexColor` | `#000000` | MapLibre `text-color` paint property                              |
| `textSize`      | `number`   | `12`      | MapLibre `text-size` layout property (px)                         |
| `textHaloColor` | `HexColor` | `#3f97e0` | MapLibre `text-halo-color` paint property                         |
| `textHaloWidth` | `number`   | `5`       | MapLibre `text-halo-width` paint property (px)                    |
| `pointColor`    | `HexColor` | `#5CFF2E` | Anchor point color (rendered at width 0, so invisible by default) |
| `pointWidth`    | `number`   | `0`       | Anchor point radius                                               |

### Textarea DOM styling (`domStyles`)

This option is **optional** and only needed if you want to customise how the textarea and submit button look. Pass `domStyles.textArea` and/or `domStyles.submitButton` (each a `Partial<CSSStyleDeclaration>`) to override individual CSS properties. Any styles you provide are merged over the built-in defaults, so you only need to specify the properties you want to change.

### Callback

```ts
new TerraDrawTextMode({
	onTextCommit: (featureId, text) => {
		console.log(`Feature ${featureId} labelled: "${text}"`);
	}
});
```

`onTextCommit` fires after every successful commit (new placement or edit).

### Usage example

```ts
import { MaplibreTerradrawControl, TerraDrawTextMode } from '@watergis/maplibre-gl-terradraw';

const control = new MaplibreTerradrawControl({
	modes: ['text', 'select', 'delete'],
	modeOptions: {
		text: new TerraDrawTextMode({
			editable: true,
			placeholder: 'Add a label…',
			styles: {
				textColor: '#000000',
				textSize: 12,
				textHaloColor: '#3f97e0',
				textHaloWidth: 5
			},
			// Optional: override the default textarea / submit button appearance
			domStyles: {
				textArea: {
					fontSize: '14px',
					color: '#1a1a1a',
					borderRadius: '6px'
				},
				submitButton: {
					backgroundColor: '#2d7fc1',
					color: '#ffffff',
					fontWeight: 'bold'
				}
			},
			onTextCommit: (id, text) => console.log(id, text)
		})
	}
});

map.addControl(control, 'top-right');
```
