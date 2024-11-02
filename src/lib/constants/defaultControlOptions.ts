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
		'sensor',
		'sector',
		'circle',
		'freehand',
		'select',
		'delete-selection',
		'delete'
	],
	open: false
};
