import type { KeyboardShortcut } from '../interfaces';

/**
 * A single undo/redo shortcut in the shape expected by TerraDraw's
 * `TerraDrawUndoRedoKeyboardShortcuts` constructor.
 */
export type UndoRedoKeyboardShortcut = {
	key: KeyboardShortcut['key'];
	heldKeys: KeyboardShortcut['heldKeys'];
};

const PRIMARY_MODIFIERS = new Set(['ctrl', 'control', 'meta']);

/**
 * Converts a plugin `KeyboardShortcut` into the `UndoRedoKeyboardShortcut[]` that TerraDraw expects.
 *
 * TerraDraw matches held keys by exact string comparison (unlike this plugin's own controller, which
 * treats `ctrl` as `ctrlKey || metaKey`). So a single cross-platform shortcut authored with the
 * primary modifier (`ctrl`/`control`/`meta`) is expanded into two concrete variants — `control` and
 * `meta` — so the shortcut fires on both Windows/Linux `Ctrl` and macOS `Command`.
 *
 * Shortcuts without a primary modifier (e.g. plain keys, or `shift`-only) are passed through unchanged.
 * @param shortcut a plugin keyboard shortcut (e.g. `defaultModeKeyboardShortcuts.undo`)
 * @returns one or two TerraDraw undo/redo shortcut variants
 */
export const buildUndoRedoShortcuts = (shortcut: KeyboardShortcut): UndoRedoKeyboardShortcut[] => {
	const heldKeys = shortcut.heldKeys.map((k) => k.toLowerCase());

	if (!heldKeys.some((k) => PRIMARY_MODIFIERS.has(k))) {
		return [{ key: shortcut.key, heldKeys: [...shortcut.heldKeys] }];
	}

	const otherKeys = heldKeys.filter((k) => !PRIMARY_MODIFIERS.has(k));
	return [
		{ key: shortcut.key, heldKeys: ['control', ...otherKeys] },
		{ key: shortcut.key, heldKeys: ['meta', ...otherKeys] }
	];
};
