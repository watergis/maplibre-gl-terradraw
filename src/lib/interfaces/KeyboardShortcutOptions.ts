import type { TerradrawMode } from './TerradrawMode';

type ModeShortcutKey =
	| 'a'
	| 'b'
	| 'c'
	| 'd'
	| 'e'
	| 'f'
	| 'g'
	| 'h'
	| 'i'
	| 'j'
	| 'k'
	| 'l'
	| 'm'
	| 'n'
	| 'o'
	| 'p'
	| 'q'
	| 'r'
	| 's'
	| 't'
	| 'u'
	| 'v'
	| 'w'
	| 'x'
	| 'y'
	| 'z';

export const defaultModeKeyboardShortcuts: ModeKeyboardShortcuts = {
	point: 'p',
	polygon: 'g',
	linestring: 'l',
	marker: 'm',
	'angled-rectangle': 'a',
	render: 'r',
	rectangle: 't',
	sensor: 'e',
	circle: 'c',
	freehand: 'f',
	sector: 'o',
	select: 's'
};

export type ModeKeyboardShortcuts = Partial<Record<TerradrawMode, ModeShortcutKey>>;
