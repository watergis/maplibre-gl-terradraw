import { MaplibreTerradrawControl } from './MaplibreTerradrawControl';
import { defaultValhallaControlOptions } from '../constants';
import type { ValhallaControlOptions, ValhallaOptions } from '../interfaces';
import { LngLat, type Map } from 'maplibre-gl';
import type { GeoJSONStoreGeometries, TerraDrawExtend } from 'terra-draw';
import { debounce } from '../helpers/debounce';
import {
	ValhallaRouting,
	type distanceUnitType,
	type meansOfTransportType
} from '../helpers/valhallaRouting';

/**
 * Maplibre GL Terra Draw Measure Control
 */
export class MaplibreValhallaControl extends MaplibreTerradrawControl {
	private valhallaOptions: ValhallaOptions;

	/**
	 * Get the URL of Valhalla API
	 */
	get valhallaUrl() {
		return this.valhallaOptions.url as string;
	}
	/**
	 * Set the URL of Valhalla API
	 * @param value URL of Valhalla API
	 */
	set valhallaUrl(value: string) {
		this.valhallaOptions.url = value;
	}

	/**
	 * Get the means of transport for Valhalla routing api
	 * @returns meansOfTransportType
	 * @example 'pedestrian', 'bicycle', 'auto'
	 */
	get routingMeansOfTransport() {
		return this.valhallaOptions.routingOptions?.meansOfTransport as meansOfTransportType;
	}
	/**
	 * Set the means of transport for Valhalla routing api
	 * @param value meansOfTransportType
	 * @example 'pedestrian', 'bicycle', 'auto'
	 */
	set routingMeansOfTransport(value: meansOfTransportType) {
		if (!this.valhallaOptions.routingOptions) {
			this.valhallaOptions.routingOptions = {};
		}
		this.valhallaOptions.routingOptions.meansOfTransport = value;
	}

	/**
	 * Get the distance unit for Valhalla routing api
	 * @returns distanceUnitType
	 * @example 'kilometers', 'miles'
	 */
	get routingDistanceUnit() {
		return this.valhallaOptions.routingOptions?.distanceUnit as distanceUnitType;
	}

	/**
	 * Set the distance unit for Valhalla routing api
	 * @param value distanceUnitType
	 * @example 'kilometers', 'miles'
	 */
	set routingDistanceUnit(value: distanceUnitType) {
		if (!this.valhallaOptions.routingOptions) {
			this.valhallaOptions.routingOptions = {};
		}
		this.valhallaOptions.routingOptions.distanceUnit = value;
	}

	/**
	 * Constructor
	 * @param options Plugin control options
	 */
	constructor(options?: ValhallaControlOptions) {
		let _options: ValhallaControlOptions = {
			...JSON.parse(JSON.stringify(defaultValhallaControlOptions)),
			modeOptions: { ...defaultValhallaControlOptions.modeOptions }
		};

		if (options) {
			_options = Object.assign(_options, options);
		}

		// replace {prefix} with prefixId for sources and layers
		if (!_options.adapterOptions) {
			_options.adapterOptions = {};
		}
		_options.adapterOptions.prefixId = _options.adapterOptions?.prefixId ?? 'td-valhalla';

		super({
			modes: _options.modes,
			open: _options.open,
			modeOptions: _options.modeOptions,
			adapterOptions: _options.adapterOptions
		});
		this.valhallaOptions = _options.valhallaOptions as ValhallaOptions;
		if (!this.valhallaOptions.url) {
			throw new Error(
				'Valhalla URL is required for this control. Please set valhallaOptions.url in options.'
			);
		}
		this._cssPrefix = 'valhalla-';
	}

	/**
	 * add the plugin control to maplibre
	 * @param map Maplibre Map object
	 * @returns HTML Element
	 */
	public onAdd(map: Map): HTMLElement {
		this.controlContainer = super.onAdd(map);
		return this.controlContainer;
	}

	/**
	 * Remove the plugin control from maplibre
	 * @returns void
	 */
	public onRemove(): void {
		this.unregisterValhallaControl();
		super.onRemove();
	}

	/**
	 * Activate Terra Draw to start drawing
	 */
	public activate() {
		super.activate();
		this.registerValhallaControl();
	}

	/**
	 * Register  measure control related maplibre sources and layers
	 */
	private registerValhallaControl() {
		if (!this.map) return;

		const lineModes = this.options.modes?.filter((m) => ['linestring'].includes(m));

		if (lineModes && lineModes.length > 0) {
			const drawInstance = this.getTerraDrawInstance();
			if (drawInstance) {
				// subscribe change event of TerraDraw to calc distance
				drawInstance.on('finish', this.handleTerradrawFeatureReady.bind(this));
			}
		}
	}

	/**
	 * Register  measure control related maplibre sources and layers
	 */
	private unregisterValhallaControl() {
		if (!this.map) return;

		const drawInstance = this.getTerraDrawInstance();
		if (drawInstance) {
			// subscribe change event of TerraDraw to calc distance
			drawInstance.off('finish', this.handleTerradrawFeatureReady.bind(this));
		}
	}

	/**
	 * Handle finish event of terradraw. It will be called after finishing adding a feature
	 * @param id Feature ID
	 */
	private handleTerradrawFeatureReady = debounce((id: TerraDrawExtend.FeatureId) => {
		if (!this.map) return;
		this.computeRouteByLineFeatureID(id);
	}, 300);

	/**
	 * Compute elevation by a LineString feature ID
	 * @param id FeatureID
	 */
	private computeRouteByLineFeatureID = async (id: TerraDrawExtend.FeatureId) => {
		if (!this.map) return;
		// console.log(this.options);

		if (!this.valhallaOptions.url) return;

		const feature = this.terradraw?.getSnapshotFeature(id);
		if (!feature || (feature && feature.geometry.type !== 'LineString')) return;
		// console.log(feature);

		const routingEngine = new ValhallaRouting(this.valhallaUrl);
		const tripData: LngLat[] = feature.geometry.coordinates.map((c) => {
			const coord = c as [number, number];
			return new LngLat(coord[0], coord[1]);
		});
		// console.log(tripData);
		if (!tripData || (tripData && tripData.length < 2)) return;

		const result = await routingEngine.calcRoute(
			tripData,
			this.routingMeansOfTransport,
			this.routingDistanceUnit
		);
		// console.log(result);
		if (!result || !result.feature) return;
		const newGeometry = result?.feature.geometry as GeoJSONStoreGeometries;
		// this.terradraw?.updateFeatureGeometry(id, newGeometry);

		feature.geometry = newGeometry;
		feature.properties = {
			...feature.properties,
			distance: result.feature.properties.distance,
			distance_unit: result.feature.properties.distance_unit,
			time: result.feature.properties.time
		};

		// to update the feature properties, remove and add are needed currently
		this.terradraw?.removeFeatures([id]);
		this.terradraw?.addFeatures([feature]);
	};
}
