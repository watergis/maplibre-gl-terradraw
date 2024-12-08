import type { CircleLayerSpecification, SymbolLayerSpecification } from 'maplibre-gl';
import type { ModeOptions } from './ModeOptions.js';
import type { MeasureControlMode } from './TerradrawMode.js';

/**
 * MeasureControl Plugin control constructor options
 */
export interface MeasureControlOptions {
	/**
	 * Terradraw modes added to the control.
	 * The mode will be added in the same order of the array.
	 * Default is all modes in the below order:
	 * ['render','linestring','polygon', 'rectangle','angled-rectangle','circle', 'freehand','sector','sensor', 'delete']
	 *
	 * You can change the order of modes, or can get rid of some modes which you don't need for your app.
	 */
	modes?: MeasureControlMode[];
	/**
	 * Open editor as default if true. Default is false
	 */
	open?: boolean;

	/**
	 * Overwrite Terra Draw mode options if you specified.
	 */
	modeOptions?: ModeOptions;

	/**
	 * Maplibre symbol layer specification (on line nodes) for line distance layer
	 */
	lineLayerLabelSpec?: SymbolLayerSpecification;

	/**
	 * Maplibre circle layer specification for visualizing node style of line distance layer
	 */
	lineLayerNodeSpec?: CircleLayerSpecification;

	/**
	 * Maplibre symbol layer specification (centroid) for polygon area layer
	 */
	polygonLayerSpec?: SymbolLayerSpecification;
}
