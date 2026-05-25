import type { ModeKeyboardShortcuts } from '../interfaces';

export const defaultValhallaModeKeyboardShortcuts: ModeKeyboardShortcuts = {
	'time-isochrone': {
		key: 't',
		heldKeys: []
	},
	'distance-isochrone': {
		key: 'i',
		heldKeys: []
	},
	routing: {
		key: 'u',
		heldKeys: []
	},
	settings: {
		key: 'y',
		heldKeys: ['meta', 'shift']
	}
};
