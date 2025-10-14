import type { TerradrawControlOptions } from '../interfaces/TerradrawControlOptions';

/**
 * Default control options
 */
export const defaultControlOptions: TerradrawControlOptions = {
	modes: [
		'render',
		'point',
		'marker',
		'linestring',
		'polygon',
		'rectangle',
		'angled-rectangle',
		'sensor',
		'sector',
		'circle',
		'freehand',
		'freehand-linestring',
		'select',
		'delete-selection',
		'delete',
		'download'
	],
	open: false
};
