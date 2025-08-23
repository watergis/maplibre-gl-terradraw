import type { ModeOptions } from './ModeOptions';
import type { TerraDrawExtend } from 'terra-draw';
import type { TerradrawValhallaMode } from './TerradrawMode';
import type { Contour, ContourType, routingDistanceUnitType, costingModelType } from '../helpers';
import type {
	CircleLayerSpecification,
	FillLayerSpecification,
	LineLayerSpecification,
	SymbolLayerSpecification
} from 'maplibre-gl';
/**
 * ValhallaControl Plugin control constructor options
 */
export interface ValhallaControlOptions {
	/**
	 * Terradraw modes added to the control.
	 * The mode will be added in the same order of the array.
	 * Default is all modes in the below order:
	 * ['render','point','linestring','polygon', 'rectangle','angled-rectangle','circle', 'freehand','sector','sensor', 'delete']
	 *
	 * You can change the order of modes, or can get rid of some modes which you don't need for your app.
	 */
	modes?: TerradrawValhallaMode[];
	/**
	 * Open editor as default if true. Default is false
	 */
	open?: boolean;

	/**
	 * Overwrite Terra Draw mode options if you specified.
	 */
	modeOptions?: ModeOptions;

	/**
	 * Valhalla options for the control.
	 */
	valhallaOptions?: ValhallaOptions;

	/**
	 * TerraDrawMaplibreGLAdapter options. Please refer the default adapter settings (BaseAdapterConfig) at the below TerraDraw code.
	 * https://github.com/JamesLMilner/terra-draw/blob/806e319d5680a3f69edeff7dd629da3f1b4ff9bf/src/adapters/common/base.adapter.ts#L28-L48
	 */
	adapterOptions?: TerraDrawExtend.BaseAdapterConfig & { prefixId?: string };

	/**
	 * Maplibre symbol layer specification (on line nodes) for line distance layer
	 */
	routingLineLayerNodeLabelSpec?: SymbolLayerSpecification;

	/**
	 * Maplibre circle layer specification for visualizing node style of line distance layer
	 */
	routingLineLayerNodeSpec?: CircleLayerSpecification;

	/**
	 * Maplibre fill layer specification for isochrone polygon layer
	 */
	isochronePolygonLayerSpec?: FillLayerSpecification;

	/**
	 * Maplibre line layer specification for isochrone line layer
	 */
	isochroneLineLayerSpec?: LineLayerSpecification;

	/**
	 * Maplibre symbol layer specification for isochrone label layer
	 */
	isochroneLabelLayerSpec?: SymbolLayerSpecification;
}

export interface ValhallaOptions {
	/**
	 * URL of Valhalla API.
	 * Default is empty string, which means you need to set the URL before using the control.
	 * If you want to use the demo Valhalla API, set the URL to 'https://valhalla.water-gis.com'.
	 * However, this demo api is only available for Rwanda, Uganda and Kenya.
	 *
	 * If the URL is not set, the control constructor will throw an error.
	 *
	 * Please read more about how to set up your own Valhalla API at https://valhalla.github.io/valhalla/
	 */
	url?: string;

	routingOptions?: {
		/**
		 * Means of transport for Valhalla routing API.
		 * 'auto', 'bicycle', 'pedestrian' models are available in the plugin.
		 * https://valhalla.github.io/valhalla/api/turn-by-turn/api-reference/#costing-models
		 */
		costingModel?: costingModelType;
		/**
		 * Dustance unit for Valhalla routing API.
		 * https://valhalla.github.io/valhalla/api/turn-by-turn/api-reference/#directions-options
		 */
		distanceUnit?: routingDistanceUnitType;
	};

	isochroneOptions?: {
		/**
		 * The type of contour to compute isochrone either 'time' or 'distance'
		 */
		contourType?: ContourType;
		/**
		 * Means of transport for Valhalla isochrone API.
		 * 'auto', 'bicycle', 'pedestrian' models are available in the plugin.
		 * https://valhalla.github.io/valhalla/api/isochrone/api-reference/#costing-parameters
		 */
		costingModel?: costingModelType;

		/**
		 * List of contours for isochrone API.
		 * Each contour has time, distance and color properties.
		 */
		contours?: Contour[];
	};
}
