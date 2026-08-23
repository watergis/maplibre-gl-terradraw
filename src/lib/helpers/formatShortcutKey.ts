import { capitalize } from './capitalize';

/**
 * Detects whether the current platform is macOS.
 * Falls back to `false` in non-browser environments (e.g. SSR).
 * @returns boolean
 */
const isMacPlatform = (): boolean => {
	if (typeof navigator === 'undefined') return false;
	const platform =
		(navigator as Navigator & { userAgentData?: { platform?: string } }).userAgentData?.platform ??
		navigator.platform ??
		navigator.userAgent ??
		'';
	return /Mac|iPhone|iPad|iPod/i.test(platform);
};

/**
 * Formats a keyboard shortcut key name into a human friendly label for tooltips.
 * `ctrl`/`control`/`meta` are the primary command modifier and are shown as `Command` on macOS
 * and `Ctrl` on other platforms, so the label always matches the key the user actually presses.
 * @param key key name from a keyboard shortcut config (e.g. `ctrl`, `shift`, `z`)
 * @returns display label
 */
export const formatShortcutKey = (key: string): string => {
	switch (key.toLowerCase()) {
		case 'meta':
		case 'ctrl':
		case 'control':
			return isMacPlatform() ? 'Command' : 'Ctrl';
		case 'alt':
			return isMacPlatform() ? 'Option' : 'Alt';
		case 'shift':
			return 'Shift';
		default:
			return key.length === 1 ? key.toUpperCase() : capitalize(key);
	}
};
