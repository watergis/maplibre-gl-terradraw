---
'@watergis/maplibre-gl-terradraw': minor
---

feat: add undo/redo mode to MaplibreTerradrawControl and MaplibreMeasureControl

- How to use Undo/Redo mode

`undo` and `redo` modes are now included in the default mode list. Undo/Redo buttons will appear in the control toolbar, allowing you to undo or redo drawing operations.

Keyboard shortcuts are also supported: `Ctrl+Z` / `Ctrl+Shift+Z`.

- Default behavior (no configuration needed)

Undo/Redo is enabled by default. It works out of the box without any additional setup.

- Custom configuration

Use the `undoRedo` option to customize the stack size or other settings:

```ts
import {
	TerraDrawModeUndoRedo,
	TerraDrawSessionUndoRedo,
	TerraDrawUndoRedoKeyboardShortcuts
} from 'terra-draw';

const control = new MaplibreTerradrawControl({
	undoRedo: {
		modeLevel: new TerraDrawModeUndoRedo({ maxStackSize: 50 }),
		sessionLevel: new TerraDrawSessionUndoRedo({ maxStackSize: 50 }),
		keyboardShortcuts: new TerraDrawUndoRedoKeyboardShortcuts()
	}
});
```

Please refer to the official guide at: https://github.com/JamesLMilner/terra-draw/blob/main/guides/6.EVENTS.md#undoredo

- Hiding the Undo/Redo buttons

Exclude `'undo'` and `'redo'` from the `modes` array:

```ts
const control = new MaplibreTerradrawControl({
	modes: ['point', 'linestring', 'polygon', 'select', 'delete']
});
```
