import type { ControlOptions } from '../interfaces/ControlOptions.js';

/**
 * Default control options
 */
export const defaultControlOptions: ControlOptions = {
	modes: [
		'render',
		'point',
		'linestring',
		'polygon',
		'rectangle',
		'angled-rectangle',
		'circle',
		'freehand',
		'select',
		'delete'
	],
	open: false
};
