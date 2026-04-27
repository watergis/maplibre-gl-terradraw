export const MODE_ACTION_SHORTCUTS = {
	delete: {
		key: 'Backspace',
		heldKeys: [] as const
	},
	'delete-selected': {
		key: 'Backspace',
		heldKeys: ['shift'] as const
	}
} as const;
