/**
 * The list of available Terra Draw drawing modes for MaplibreTerraDrawControl
 *
 * `render` is a special mode and this is appeared as toggle button to expand/collapse the tool.
 * If you always want the tool to be visible, `render` can be removed and set `open` property of the constructor as true.
 *
 * `delete-selection` button is only appeared, when the select button is active.
 *
 * If no drawing feature is in TerraDraw, `delete` and `download` are disabled.
 */
export const AvailableModes = [
	'render',
	'point',
	'linestring',
	'polygon',
	'rectangle',
	'circle',
	'freehand',
	'freehand-linestring',
	'angled-rectangle',
	'sensor',
	'sector',
	'select',
	'delete-selection',
	'delete',
	'download'
] as const;

export const AvailableValhallaModes = [
	'render',
	'linestring',
	'point',
	'select',
	'delete-selection',
	'delete',
	'download',
	'settings'
] as const;
