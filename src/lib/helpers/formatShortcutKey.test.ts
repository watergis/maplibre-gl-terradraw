import { afterEach, describe, expect, it, vi } from 'vitest';
import { formatShortcutKey } from './formatShortcutKey';

/**
 * Stub the global `navigator` so platform-dependent labels can be tested.
 * Pass `undefined` to simulate a non-browser (SSR) environment.
 */
const stubNavigator = (nav: Partial<Navigator> & { userAgentData?: { platform?: string } }) => {
	vi.stubGlobal('navigator', nav);
};

describe('formatShortcutKey', () => {
	afterEach(() => {
		vi.unstubAllGlobals();
	});

	describe('on macOS', () => {
		it('should label "meta" as "Command"', () => {
			stubNavigator({ platform: 'MacIntel' });
			expect(formatShortcutKey('meta')).toBe('Command');
		});

		it('should label "alt" as "Option"', () => {
			stubNavigator({ platform: 'MacIntel' });
			expect(formatShortcutKey('alt')).toBe('Option');
		});

		it('should detect macOS from userAgentData.platform', () => {
			stubNavigator({ userAgentData: { platform: 'macOS' }, platform: '' });
			expect(formatShortcutKey('meta')).toBe('Command');
		});

		it('should detect iOS devices as macOS-like', () => {
			stubNavigator({ platform: 'iPhone' });
			expect(formatShortcutKey('meta')).toBe('Command');
		});
	});

	describe('on non-macOS platforms', () => {
		it('should label "meta" as "Ctrl"', () => {
			stubNavigator({ platform: 'Win32' });
			expect(formatShortcutKey('meta')).toBe('Ctrl');
		});

		it('should label "ctrl" and "control" as "Ctrl"', () => {
			stubNavigator({ platform: 'Win32' });
			expect(formatShortcutKey('ctrl')).toBe('Ctrl');
			expect(formatShortcutKey('control')).toBe('Ctrl');
		});

		it('should label "alt" as "Alt"', () => {
			stubNavigator({ platform: 'Linux x86_64' });
			expect(formatShortcutKey('alt')).toBe('Alt');
		});
	});

	describe('primary command modifier on macOS', () => {
		it('should label "ctrl" and "control" as "Command"', () => {
			stubNavigator({ platform: 'MacIntel' });
			expect(formatShortcutKey('ctrl')).toBe('Command');
			expect(formatShortcutKey('control')).toBe('Command');
		});
	});

	describe('platform-independent labels', () => {
		it('should label "shift" as "Shift"', () => {
			stubNavigator({ platform: 'MacIntel' });
			expect(formatShortcutKey('shift')).toBe('Shift');
		});

		it('should uppercase single-character keys', () => {
			expect(formatShortcutKey('z')).toBe('Z');
			expect(formatShortcutKey('p')).toBe('P');
		});

		it('should capitalize multi-character key names', () => {
			expect(formatShortcutKey('Backspace')).toBe('Backspace');
			expect(formatShortcutKey('enter')).toBe('Enter');
		});

		it('should be case-insensitive for modifier names', () => {
			stubNavigator({ platform: 'MacIntel' });
			expect(formatShortcutKey('META')).toBe('Command');
			expect(formatShortcutKey('Shift')).toBe('Shift');
		});
	});

	describe('non-browser (SSR) environment', () => {
		it('should fall back to non-macOS labels when navigator is undefined', () => {
			vi.stubGlobal('navigator', undefined);
			expect(formatShortcutKey('meta')).toBe('Ctrl');
			expect(formatShortcutKey('alt')).toBe('Alt');
		});
	});
});
