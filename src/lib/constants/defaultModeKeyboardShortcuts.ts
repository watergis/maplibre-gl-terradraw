import type { ModeKeyboardShortcuts } from '../interfaces';

export const defaultModeKeyboardShortcuts: ModeKeyboardShortcuts = {
	point: {
		key: 'p',
		heldKeys: []
	},
	polygon: {
		key: 'g',
		heldKeys: []
	},
	linestring: {
		key: 'l',
		heldKeys: []
	},
	marker: {
		key: 'm',
		heldKeys: []
	},
	'angled-rectangle': {
		key: 'a',
		heldKeys: []
	},
	render: {
		key: 'y',
		heldKeys: []
	},
	rectangle: {
		key: 'r',
		heldKeys: []
	},
	sensor: {
		key: 'e',
		heldKeys: []
	},
	circle: {
		key: 'c',
		heldKeys: []
	},
	freehand: {
		key: 'f',
		heldKeys: []
	},
	'freehand-linestring': {
		key: 'h',
		heldKeys: []
	},
	sector: {
		key: 'o',
		heldKeys: []
	},
	text: {
		key: 't',
		heldKeys: []
	},
	select: {
		key: 's',
		heldKeys: []
	},
	download: {
		key: 'd',
		heldKeys: []
	},
	delete: {
		key: 'Backspace',
		heldKeys: []
	},
	'delete-selection': {
		key: 'Backspace',
		heldKeys: ['shift']
	},

	// `undo`/`redo` are the single source of truth for the undo-redo shortcuts. They are
	// forwarded to TerraDraw's own `TerraDrawUndoRedoKeyboardShortcuts` (see MaplibreTerradrawControl
	// constructor), which performs the actual keyboard handling, and are used here only for the tooltip.
	// `ctrl` is the cross-platform primary modifier: Command (⌘) on macOS, Ctrl elsewhere.
	undo: {
		key: 'z',
		heldKeys: ['ctrl']
	},
	redo: {
		key: 'z',
		heldKeys: ['ctrl', 'shift']
	}
};
