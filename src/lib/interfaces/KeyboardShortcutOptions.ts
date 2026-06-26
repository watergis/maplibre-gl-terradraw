import type { TerradrawMode, TerradrawValhallaMode } from './TerradrawMode';

export type KeyboardShortcut = {
	key: KeyboardEvent['key'];
	heldKeys: KeyboardEvent['key'][];
};

export type ModeKeyboardShortcuts = Partial<
	Record<TerradrawMode | TerradrawValhallaMode, KeyboardShortcut>
>;
