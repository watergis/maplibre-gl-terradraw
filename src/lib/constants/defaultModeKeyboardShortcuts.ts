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
	}
};
