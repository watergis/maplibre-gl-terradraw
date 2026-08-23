import { describe, expect, it } from 'vitest';
import { buildUndoRedoShortcuts } from './buildUndoRedoShortcuts';

describe('buildUndoRedoShortcuts', () => {
	it('should expand a "ctrl" shortcut into control and meta variants', () => {
		expect(buildUndoRedoShortcuts({ key: 'z', heldKeys: ['ctrl'] })).toEqual([
			{ key: 'z', heldKeys: ['control'] },
			{ key: 'z', heldKeys: ['meta'] }
		]);
	});

	it('should expand a "meta" shortcut into control and meta variants', () => {
		expect(buildUndoRedoShortcuts({ key: 'z', heldKeys: ['meta'] })).toEqual([
			{ key: 'z', heldKeys: ['control'] },
			{ key: 'z', heldKeys: ['meta'] }
		]);
	});

	it('should preserve additional modifiers alongside the primary modifier', () => {
		expect(buildUndoRedoShortcuts({ key: 'z', heldKeys: ['ctrl', 'shift'] })).toEqual([
			{ key: 'z', heldKeys: ['control', 'shift'] },
			{ key: 'z', heldKeys: ['meta', 'shift'] }
		]);
	});

	it('should be case-insensitive for modifier names', () => {
		expect(buildUndoRedoShortcuts({ key: 'z', heldKeys: ['Control', 'Shift'] })).toEqual([
			{ key: 'z', heldKeys: ['control', 'shift'] },
			{ key: 'z', heldKeys: ['meta', 'shift'] }
		]);
	});

	it('should pass through a shortcut without a primary modifier unchanged', () => {
		expect(buildUndoRedoShortcuts({ key: 'y', heldKeys: ['shift'] })).toEqual([
			{ key: 'y', heldKeys: ['shift'] }
		]);
	});

	it('should pass through a plain key shortcut unchanged', () => {
		expect(buildUndoRedoShortcuts({ key: 'z', heldKeys: [] })).toEqual([
			{ key: 'z', heldKeys: [] }
		]);
	});

	it('should not mutate the input shortcut', () => {
		const input = { key: 'z', heldKeys: ['ctrl'] };
		buildUndoRedoShortcuts(input);
		expect(input).toEqual({ key: 'z', heldKeys: ['ctrl'] });
	});
});
