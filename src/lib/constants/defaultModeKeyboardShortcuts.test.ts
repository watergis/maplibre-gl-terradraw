import { describe, it, expect } from 'vitest';
import { defaultModeKeyboardShortcuts } from './defaultModeKeyboardShortcuts';
import { defaultValhallaModeKeyboardShortcuts } from './defaultValhallaModeKeyboardShortcuts';
import { AvailableModes } from './AvailableModes';

describe('defaultModeKeyboardShortcuts', () => {
	it('should define a shortcut for every available mode', () => {
		for (const mode of AvailableModes) {
			expect(defaultModeKeyboardShortcuts).toHaveProperty(mode);
		}
	});

	it('should define a shortcut for polyline mode', () => {
		expect(defaultModeKeyboardShortcuts).toHaveProperty('polyline');
		expect(defaultModeKeyboardShortcuts.polyline).toEqual({ key: 'q', heldKeys: [] });
	});

	it('should assign polyline a shortcut with no held keys so it is a plain keypress', () => {
		expect(defaultModeKeyboardShortcuts.polyline?.heldKeys).toEqual([]);
	});

	it('should not reuse the polyline key for any other mode', () => {
		const polylineKey = defaultModeKeyboardShortcuts.polyline?.key;

		const modesWithSameKey = Object.entries({
			...defaultModeKeyboardShortcuts,
			...defaultValhallaModeKeyboardShortcuts
		})
			.filter(
				([, shortcut]) =>
					shortcut?.key.toLowerCase() === polylineKey?.toLowerCase() &&
					shortcut?.heldKeys.length === 0
			)
			.map(([mode]) => mode);

		expect(modesWithSameKey).toEqual(['polyline']);
	});

	it('should keep polyline distinct from the other linestring-like modes', () => {
		const polylineKey = defaultModeKeyboardShortcuts.polyline?.key;

		expect(polylineKey).not.toBe(defaultModeKeyboardShortcuts.linestring?.key);
		expect(polylineKey).not.toBe(defaultModeKeyboardShortcuts['freehand-linestring']?.key);
	});

	it('should not contain any duplicate key + heldKeys combination', () => {
		const canonical = Object.values(defaultModeKeyboardShortcuts).map((shortcut) =>
			[shortcut.key.toLowerCase(), ...shortcut.heldKeys.map((k) => k.toLowerCase()).sort()].join(
				'+'
			)
		);

		expect(new Set(canonical).size).toBe(canonical.length);
	});
});
