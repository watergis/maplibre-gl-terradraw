/**
 * The list of available Terra Draw drawing modes for MaplibreTerraDrawControl
 */
export const AvailableModes = [
	'render',
	'point',
	'linestring',
	'polygon',
	'rectangle',
	'circle',
	'freehand',
	'angled-rectangle',
	'sensor',
	'sector',
	'select',
	'delete-selection',
	'delete'
] as const;

/**
 * The list of available Terra Draw drawing modes for MaplibreMeasureControl
 */
export const AvailableMeasureModes = [
	'render',
	'linestring',
	'polygon',
	'rectangle',
	'circle',
	'freehand',
	'angled-rectangle',
	'sensor',
	'sector',
	'delete'
] as const;
