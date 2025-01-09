import type { CircleLayerSpecification, SymbolLayerSpecification } from 'maplibre-gl';
import type { ModeOptions } from './ModeOptions.js';
import type { MeasureControlMode } from './MeasureControlMode.js';

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
	 * TerraDrawMaplibreGLAdapter options. Please refer the default adapter settings at the below TerraDraw code.
	 * https://github.com/JamesLMilner/terra-draw/blob/806e319d5680a3f69edeff7dd629da3f1b4ff9bf/src/adapters/common/base.adapter.ts#L28-L48
	 */
	adapterOptions?: {
		coordinatePrecision?: number;
		minPixelDragDistanceDrawing?: number;
		minPixelDragDistance?: number;
		minPixelDragDistanceSelecting?: number;
	};

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
