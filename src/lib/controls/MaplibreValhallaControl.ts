import { MaplibreTerradrawControl } from './MaplibreTerradrawControl';
import { defaultValhallaControlOptions } from '../constants';
import type {
	TerradrawMode,
	TerradrawValhallaMode,
	ValhallaControlOptions,
	ValhallaOptions
} from '../interfaces';
import {
	GeoJSONSource,
	LngLat,
	type CircleLayerSpecification,
	type GeoJSONSourceSpecification,
	type Map,
	type StyleSpecification,
	type SymbolLayerSpecification
} from 'maplibre-gl';
import type { GeoJSONStoreFeatures, GeoJSONStoreGeometries, TerraDrawExtend } from 'terra-draw';
import {
	debounce,
	ModalDialog,
	routingDistanceUnitOptions,
	type routingDistanceUnitType,
	routingMeansOfTransportOptions,
	ValhallaRouting,
	type routingMeansOfTransportType,
	TERRADRAW_SOURCE_IDS,
	cleanMaplibreStyle
} from '../helpers';

/**
 * Maplibre GL Terra Draw Measure Control
 */
export class MaplibreValhallaControl extends MaplibreTerradrawControl {
	private controlOptions: ValhallaControlOptions;
	private valhallaOptions: ValhallaOptions;
	private _modalDialog: ModalDialog | undefined;

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
	 * @returns routingMeansOfTransportType
	 * @example 'pedestrian', 'bicycle', 'auto'
	 */
	get routingMeansOfTransport() {
		return this.valhallaOptions.routingOptions?.meansOfTransport as routingMeansOfTransportType;
	}
	/**
	 * Set the means of transport for Valhalla routing api
	 * @param value routingMeansOfTransportType
	 * @example 'pedestrian', 'bicycle', 'auto'
	 */
	set routingMeansOfTransport(value: routingMeansOfTransportType) {
		if (!this.valhallaOptions.routingOptions) {
			this.valhallaOptions.routingOptions = {};
		}
		this.valhallaOptions.routingOptions.meansOfTransport = value;
	}

	/**
	 * Get the distance unit for Valhalla routing api
	 * @returns routingDistanceUnitType
	 * @example 'kilometers', 'miles'
	 */
	get routingDistanceUnit() {
		return this.valhallaOptions.routingOptions?.distanceUnit as routingDistanceUnitType;
	}

	/**
	 * Set the distance unit for Valhalla routing api
	 * @param value routingDistanceUnitType
	 * @example 'kilometers', 'miles'
	 */
	set routingDistanceUnit(value: routingDistanceUnitType) {
		if (!this.valhallaOptions.routingOptions) {
			this.valhallaOptions.routingOptions = {};
		}
		this.valhallaOptions.routingOptions.distanceUnit = value;
	}

	/**
	 * Get/Set font glyph for valhalla control layers
	 *
	 * As default, this maesure control uses maplibre's default font glyphs(`Open Sans Regular,Arial Unicode MS Regular`) described at https://maplibre.org/maplibre-style-spec/layers/#text-font
	 *
	 * If you are using your own maplibre style or different map privider, you probably need to set the font glyphs to match your maplibre style.
	 *
	 * Font glyph availability depends on what types of glyphs are supported by your maplibre style (e.g., Carto, Openmap tiles, Protomap, Maptiler, etc.)
	 * Please make sure the font glyphs are available in your maplibre style.
	 *
	 * Usage:
	 *
	 * ```js
	 * const drawControl = new MaplibreValhallaControl()
	 * drawControl.fontGlyphs = ['Open Sans Italic']
	 * map.addControl(drawControl)
	 * ```
	 */
	get fontGlyphs() {
		const layers = [this.controlOptions.lineLayerNodeLabelSpec];
		const firstLayer = layers[0];
		return (firstLayer &&
			firstLayer.layout &&
			firstLayer.layout['text-font']) as unknown as string[];
	}

	set fontGlyphs(fontNames: string[]) {
		const layers = [this.controlOptions.lineLayerNodeLabelSpec];
		for (const layer of layers) {
			if (layer && layer.layout) {
				layer.layout['text-font'] = fontNames;
			}
			// layer exists in maplibre, update glyphs as well
			if (this.map && layer && this.map.getLayer(layer.id)) {
				this.map.setLayoutProperty(layer.id, 'text-font', fontNames);
			}
		}
	}

	/**
	 * Get the dialog instance for settings
	 */
	get settingDialog(): ModalDialog {
		return this._modalDialog as ModalDialog;
	}
	/**
	 * Set the dialog instance for settings
	 */
	set settingDialog(value: ModalDialog) {
		this._modalDialog = value;
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

		const prefixId = _options.adapterOptions?.prefixId ?? 'td-valhalla';

		(_options.lineLayerNodeLabelSpec as SymbolLayerSpecification).id =
			_options.lineLayerNodeLabelSpec?.id.replace('{prefix}', prefixId) as string;
		(_options.lineLayerNodeLabelSpec as SymbolLayerSpecification).source =
			_options.lineLayerNodeLabelSpec?.source.replace('{prefix}', prefixId) as string;

		(_options.lineLayerNodeSpec as CircleLayerSpecification).id =
			_options.lineLayerNodeSpec?.id.replace('{prefix}', prefixId) as string;
		(_options.lineLayerNodeSpec as CircleLayerSpecification).source =
			_options.lineLayerNodeSpec?.source.replace('{prefix}', prefixId) as string;

		super({
			modes: _options.modes as unknown as TerradrawMode[],
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
		this.controlOptions = _options;
	}

	/**
	 * add the plugin control to maplibre
	 * @param map Maplibre Map object
	 * @returns HTML Element
	 */
	public onAdd(map: Map): HTMLElement {
		this.controlContainer = super.onAdd(map);
		this.createSettingsDialog();
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
	 * clean maplibre style to filter only for terradraw related layers or without them.
	 * If options are not set, returns original style given to the function.
	 *
	 * This can be useful incase users only want to get terradraw related layers or without it.
	 *
	 * Usage:
	 * `cleanStyle(map.getStyle, { excludeTerraDrawLayers: true})`
	 * `cleanStyle(map.getStyle, { onlyTerraDrawLayers: true})`
	 *
	 * @param style maplibre style spec
	 * @param options.excludeTerraDrawLayers return maplibre style without terradraw layers and sources
	 * @param options.onlyTerraDrawLayers return maplibre style with only terradraw layers and sources
	 * @returns
	 */
	public cleanStyle(
		style: StyleSpecification,
		options?: { excludeTerraDrawLayers?: boolean; onlyTerraDrawLayers?: boolean }
	) {
		const sourceIds = TERRADRAW_SOURCE_IDS;

		const pointSource = this.controlOptions.lineLayerNodeSpec?.source;
		if (pointSource) sourceIds.push(pointSource);

		return cleanMaplibreStyle(style, options, sourceIds, this.options.adapterOptions?.prefixId);
	}

	/**
	 * Create the settings dialog for Valhalla control
	 */
	private createSettingsDialog() {
		this.settingDialog = new ModalDialog(
			`maplibregl-terradraw-${this.cssPrefix}settings-dialog`,
			'Settings'
		);
		this.settingDialog.create(
			this.map?.getContainer().parentElement as HTMLElement,
			(content: HTMLDivElement) => {
				// Means of Transport section
				const transportSection = document.createElement('div');
				transportSection.classList.add('setting-section');

				const transportLabel = document.createElement('label');
				transportLabel.textContent = 'Means of Transport';
				transportLabel.classList.add('setting-label');
				transportSection.appendChild(transportLabel);

				transportSection.appendChild(
					this.settingDialog.createSegmentButtons(
						routingMeansOfTransportOptions as unknown as { value: string; label: string }[],
						this.routingMeansOfTransport,
						(value: string) => {
							this.routingMeansOfTransport = value as routingMeansOfTransportType;
						}
					)
				);
				content.appendChild(transportSection);

				// Distance Unit section
				const unitSection = document.createElement('div');
				unitSection.classList.add('setting-section');

				const unitLabel = document.createElement('label');
				unitLabel.textContent = 'Distance Unit';
				unitLabel.classList.add('setting-label');
				unitSection.appendChild(unitLabel);

				unitSection.appendChild(
					this.settingDialog.createSegmentButtons(
						routingDistanceUnitOptions as unknown as { value: string; label: string }[],
						this.routingDistanceUnit,
						(value: string) => {
							this.routingDistanceUnit = value as routingDistanceUnitType;
						}
					)
				);
				content.appendChild(unitSection);

				return content;
			}
		);
	}

	/**
	 * Add Terra Draw drawing mode button
	 * @param mode Terra Draw mode name
	 */
	protected addTerradrawButton(mode: TerradrawMode) {
		const btn = document.createElement('button');
		btn.type = 'button';
		this.modeButtons[mode] = btn;

		if ((mode as TerradrawValhallaMode) === 'settings') {
			btn.classList.add(`maplibregl-terradraw-${this.cssPrefix}${mode}-button`);
			btn.addEventListener('click', this.handleSettingDialog.bind(this));
		} else {
			super.addTerradrawButton(mode);
		}
	}

	/**
	 * Handle the click event of the settings button
	 */
	private handleSettingDialog() {
		this.settingDialog?.open();
	}

	/**
	 * Register  measure control related maplibre sources and layers
	 */
	private registerValhallaControl() {
		if (!this.map) return;

		const lineModes = this.options.modes?.filter((m) => ['linestring'].includes(m));

		if (lineModes && lineModes.length > 0) {
			// add GeoJSON source for line node
			if (
				!this.map.getSource(
					(this.controlOptions.lineLayerNodeSpec as CircleLayerSpecification).source
				)
			) {
				this.map.addSource(
					(this.controlOptions.lineLayerNodeSpec as CircleLayerSpecification).source,
					{
						type: 'geojson',
						data: { type: 'FeatureCollection', features: [] }
					}
				);
			}

			// add GeoJSON layer for distance label node appearance
			if (
				!this.map.getLayer((this.controlOptions.lineLayerNodeSpec as CircleLayerSpecification).id)
			) {
				this.map.addLayer(this.controlOptions.lineLayerNodeSpec as CircleLayerSpecification);
			}
			if (
				!this.map.getLayer(
					(this.controlOptions.lineLayerNodeLabelSpec as SymbolLayerSpecification).id
				)
			) {
				this.map.addLayer(this.controlOptions.lineLayerNodeLabelSpec as SymbolLayerSpecification);
			}

			const drawInstance = this.getTerraDrawInstance();
			if (drawInstance) {
				// subscribe change event of TerraDraw to calc distance
				drawInstance.on('finish', this.handleTerradrawFeatureReady.bind(this));
				// subscribe feature-deleted event for the plugin control
				this.on('feature-deleted', this.onFeatureDeleted.bind(this));
			}
		}
	}

	/**
	 * Register  measure control related maplibre sources and layers
	 */
	private unregisterValhallaControl() {
		this.off('feature-deleted', this.onFeatureDeleted.bind(this));
		if (!this.map) return;

		if (this.map.getLayer((this.controlOptions.lineLayerNodeSpec as CircleLayerSpecification).id)) {
			this.map.removeLayer((this.controlOptions.lineLayerNodeSpec as CircleLayerSpecification).id);
		}
		if (
			this.map.getLayer((this.controlOptions.lineLayerNodeLabelSpec as SymbolLayerSpecification).id)
		) {
			this.map.removeLayer(
				(this.controlOptions.lineLayerNodeLabelSpec as SymbolLayerSpecification).id
			);
		}
		if (
			this.map.getSource((this.controlOptions.lineLayerNodeSpec as CircleLayerSpecification).source)
		) {
			this.map.removeSource(
				(this.controlOptions.lineLayerNodeSpec as CircleLayerSpecification).source
			);
		}

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

		if (!this.valhallaOptions.url) return;

		const feature = this.terradraw?.getSnapshotFeature(id);
		if (!feature || (feature && feature.geometry.type !== 'LineString')) return;

		const routingEngine = new ValhallaRouting(this.valhallaUrl);
		const tripData: LngLat[] = feature.geometry.coordinates.map((c) => {
			const coord = c as [number, number];
			return new LngLat(coord[0], coord[1]);
		});
		if (!tripData || (tripData && tripData.length < 2)) return;

		const result = await routingEngine.calcRoute(
			tripData,
			this.routingMeansOfTransport,
			this.routingDistanceUnit
		);
		if (!result || !result.feature) return;
		const newGeometry = result?.feature.geometry as GeoJSONStoreGeometries;
		// this.terradraw?.updateFeatureGeometry(id, newGeometry);

		feature.geometry = newGeometry;
		feature.properties = {
			...feature.properties,
			...result?.feature.properties
		};

		// to update the feature properties, remove and add are needed currently
		this.terradraw?.removeFeatures([id]);
		this.terradraw?.addFeatures([feature]);

		// add line node features to the map for label
		const pointFeactureCollection = result?.pointFeatures;
		const updatedFeatures = pointFeactureCollection.features.map((f) => {
			f.id = `${id}-${f.id}`;
			f.properties.originalId = id;
			return f;
		}) as unknown as GeoJSONStoreFeatures[];

		const geojsonSource: GeoJSONSourceSpecification = this.map.getStyle().sources[
			(this.controlOptions.lineLayerNodeSpec as CircleLayerSpecification).source
		] as GeoJSONSourceSpecification;
		if (geojsonSource) {
			if (
				typeof geojsonSource.data !== 'string' &&
				geojsonSource.data.type === 'FeatureCollection'
			) {
				geojsonSource.data.features = geojsonSource.data.features.filter(
					(f) => f.properties?.originalId !== id
				);
			}
			if (
				typeof geojsonSource.data !== 'string' &&
				geojsonSource.data.type === 'FeatureCollection'
			) {
				geojsonSource.data.features.push(...updatedFeatures);
			}

			(
				this.map.getSource(
					(this.controlOptions.lineLayerNodeSpec as CircleLayerSpecification).source
				) as GeoJSONSource
			)?.setData(geojsonSource.data);
			this.map.moveLayer((this.controlOptions.lineLayerNodeSpec as CircleLayerSpecification).id);
			this.map.moveLayer(
				(this.controlOptions.lineLayerNodeLabelSpec as SymbolLayerSpecification).id
			);
		}
	};

	/**
	 * Event definition when feature is deleted by terradraw
	 */
	private onFeatureDeleted(args: unknown) {
		if (!this.map) return;
		const drawInstance = this.getTerraDrawInstance();
		if (drawInstance) {
			let deletedIds: string[] = [];
			if (typeof args === 'object' && args !== null && 'deletedIds' in args) {
				deletedIds = (args as { deletedIds: string[] }).deletedIds;
			}

			const sources = [this.controlOptions.lineLayerNodeSpec as CircleLayerSpecification];
			const sourceIds = sources.map((src) => src.source);
			if (deletedIds && deletedIds.length > 0) {
				// delete only features by IDs
				this.clearExtendedFeatures(sourceIds, deletedIds);
			} else {
				// delete all features
				this.clearExtendedFeatures(sourceIds, undefined);
			}
		}
	}
}
