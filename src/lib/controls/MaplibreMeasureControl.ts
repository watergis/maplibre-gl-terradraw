import {
	Map,
	type CircleLayerSpecification,
	type GeoJSONSource,
	type GeoJSONSourceSpecification,
	type StyleSpecification,
	type SymbolLayerSpecification
} from 'maplibre-gl';
import { MaplibreTerradrawControl } from './MaplibreTerradrawControl';
import { centroid } from '@turf/centroid';
import { defaultMeasureControlOptions, defaultMeasureUnitSymbols } from '../constants';
import type {
	MeasureUnitType,
	forceAreaUnitType,
	forceDistanceUnitType,
	MeasureControlOptions,
	TerradrawMode,
	MeasureUnitSymbolType
} from '../interfaces';
import { type GeoJSONStoreFeatures, TerraDrawExtend } from 'terra-draw';
import {
	calcArea,
	calcDistance,
	cleanMaplibreStyle,
	convertElevation,
	debounce,
	MemoryCache,
	queryElevationByPoint,
	queryElevationFromRasterDEM,
	TERRADRAW_SOURCE_IDS
} from '../helpers';

/**
 * Maplibre GL Terra Draw Measure Control
 */
export class MaplibreMeasureControl extends MaplibreTerradrawControl {
	private measureOptions: MeasureControlOptions;
	private elevationCache: MemoryCache<number> | undefined;

	/**
	 * The unit of measurement can be metric or imperial. Default is metric.
	 * The measuring result will be recalculated once new value is set
	 */
	get measureUnitType() {
		return this.measureOptions.measureUnitType ?? 'metric';
	}
	set measureUnitType(value: MeasureUnitType) {
		const isSame = this.measureOptions.measureUnitType === value;
		this.measureOptions.measureUnitType = value;
		if (!isSame) {
			if (this.computeElevation) {
				this.recalculateElevationUnits();
			}
			this.recalc();
		}
	}

	/**
	 * The precision of distance value. It will be set different value when distance unit is changed. Using setter to override the value if you want.
	 */
	get distancePrecision() {
		const defaultPrecision = 2;
		return this.measureOptions.distancePrecision ?? defaultPrecision;
	}
	set distancePrecision(value: number) {
		const isSame = this.measureOptions.distancePrecision === value;
		this.measureOptions.distancePrecision = value;
		if (!isSame) this.recalc();
	}

	/**
	 * Default is `auto`. If `auto` is set, the unit is converted automatically based on the value.
	 * If a specific unit is specified (e.g., 'km', 'm', 'cm', 'mi', 'ft', 'in'), the value is always returned in that unit.
	 * This property is only effective when `distanceUnit` is set to 'kilometers' or 'miles'.
	 * If `distanceUnit` is set to other values (e.g., 'degrees', 'radians'), it will be ignored, and `auto` will be applied.
	 * If you need to force other unit type, please use DistanceUnit property.
	 */
	get forceDistanceUnit() {
		return this.measureOptions.forceDistanceUnit ?? 'auto';
	}
	set forceDistanceUnit(value: forceDistanceUnitType) {
		const isSame = this.measureOptions.forceDistanceUnit === value;
		this.measureOptions.forceDistanceUnit = value;
		if (!isSame) this.recalc();
	}

	/**
	 * The precision of area value. Using setter to override the value if you want.
	 */
	get areaPrecision() {
		return this.measureOptions.areaPrecision ?? 2;
	}
	set areaPrecision(value: number) {
		const isSame = this.measureOptions.areaPrecision === value;
		this.measureOptions.areaPrecision = value;
		if (!isSame) this.recalc();
	}

	/**
	 * Default is `auto`. If `auto` is set, unit is converted depending on the value and selection of area unit. If a specific unit is specified, it returns the value always the same. If a selected unit is not the same type of unit either metric of imperial, it will be ignored, and `auto` will be applied.
	 */
	get forceAreaUnit() {
		return this.measureOptions.forceAreaUnit ?? 'auto';
	}
	set forceAreaUnit(value: forceAreaUnitType) {
		const isSame = this.measureOptions.forceAreaUnit === value;
		this.measureOptions.forceAreaUnit = value;
		if (!isSame) this.recalc();
	}

	/**
	 * Measure unit symbols. If you want to change the default symbol, please overwrite the symbol by this option.
	 */
	get measureUnitSymbols() {
		return (
			this.measureOptions.measureUnitSymbols ??
			JSON.parse(JSON.stringify(defaultMeasureUnitSymbols))
		);
	}
	set measureUnitSymbols(value: MeasureUnitSymbolType) {
		const isSame = JSON.stringify(this.measureOptions.measureUnitSymbols) === JSON.stringify(value);
		this.measureOptions.measureUnitSymbols = value;
		if (!isSame) this.recalc();
	}

	/**
	 * The flag of whether computing elevation. Default is false.
	 * Using setter to override the value if you want.
	 */
	get computeElevation() {
		return this.measureOptions.computeElevation ?? false;
	}
	set computeElevation(value: boolean) {
		const isSame = this.measureOptions.computeElevation === value;
		this.measureOptions.computeElevation = value;
		if (!isSame) this.recalc();
	}

	/**
	 * Get/Set font glyph for measure control layers
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
	 * const drawControl = new MaplibreMeasureControl()
	 * drawControl.fontGlyphs = ['Open Sans Italic']
	 * map.addControl(drawControl)
	 * ```
	 */
	get fontGlyphs() {
		const layers = [
			this.measureOptions.pointLayerLabelSpec,
			this.measureOptions.lineLayerLabelSpec,
			this.measureOptions.polygonLayerSpec
		];
		const firstLayer = layers[0];
		return (firstLayer &&
			firstLayer.layout &&
			firstLayer.layout['text-font']) as unknown as string[];
	}

	set fontGlyphs(fontNames: string[]) {
		const layers = [
			this.measureOptions.pointLayerLabelSpec,
			this.measureOptions.lineLayerLabelSpec,
			this.measureOptions.polygonLayerSpec
		];
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
	 * Constructor
	 * @param options Plugin control options
	 */
	constructor(options?: MeasureControlOptions) {
		let measureOptions: MeasureControlOptions = {
			...JSON.parse(JSON.stringify(defaultMeasureControlOptions)),
			modeOptions: { ...defaultMeasureControlOptions.modeOptions }
		};

		if (options) {
			measureOptions = Object.assign(measureOptions, options);
		}

		// replace {prefix} with prefixId for sources and layers
		const prefixId = measureOptions.adapterOptions?.prefixId ?? 'td-measure';
		if (measureOptions.adapterOptions && !measureOptions.adapterOptions?.prefixId) {
			measureOptions.adapterOptions.prefixId = prefixId;
		}

		(measureOptions.pointLayerLabelSpec as SymbolLayerSpecification).id =
			measureOptions.pointLayerLabelSpec?.id.replace('{prefix}', prefixId) as string;
		(measureOptions.pointLayerLabelSpec as SymbolLayerSpecification).source =
			measureOptions.pointLayerLabelSpec?.source.replace('{prefix}', prefixId) as string;

		(measureOptions.routingLineLayerNodeSpec as CircleLayerSpecification).id =
			measureOptions.routingLineLayerNodeSpec?.id.replace('{prefix}', prefixId) as string;
		(measureOptions.routingLineLayerNodeSpec as CircleLayerSpecification).source =
			measureOptions.routingLineLayerNodeSpec?.source.replace('{prefix}', prefixId) as string;

		(measureOptions.lineLayerLabelSpec as SymbolLayerSpecification).id =
			measureOptions.lineLayerLabelSpec?.id.replace('{prefix}', prefixId) as string;
		(measureOptions.lineLayerLabelSpec as SymbolLayerSpecification).source =
			measureOptions.lineLayerLabelSpec?.source.replace('{prefix}', prefixId) as string;

		(measureOptions.polygonLayerSpec as SymbolLayerSpecification).id =
			measureOptions.polygonLayerSpec?.id.replace('{prefix}', prefixId) as string;
		(measureOptions.polygonLayerSpec as SymbolLayerSpecification).source =
			measureOptions.polygonLayerSpec?.source.replace('{prefix}', prefixId) as string;

		super({
			modes: measureOptions.modes,
			open: measureOptions.open,
			modeOptions: measureOptions.modeOptions,
			adapterOptions: measureOptions.adapterOptions
		});
		this._cssPrefix = 'measure-';
		this.measureOptions = measureOptions;
		if (
			this.measureOptions.elevationCacheConfig &&
			this.measureOptions.elevationCacheConfig?.enabled
		) {
			this.elevationCache = new MemoryCache<number>(
				this.measureOptions.elevationCacheConfig.maxSize,
				this.measureOptions.elevationCacheConfig.ttl
			);
		}
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
		this.unregisterMesureControl();
		super.onRemove();
	}

	/**
	 * Activate Terra Draw to start drawing
	 */
	public activate() {
		super.activate();
		this.registerMesureControl();
	}

	/**
	 * Recalculate area and distance in TerraDraw snapshot
	 *
	 * if you use `addFeatures` to restore GeoJSON features to TerraDraw, this recalc method needs to be called to re-measure again.
	 *
	 * For example, the below code is an example usage.
	 * ```
	 * drawInstance?.addFeatures(initData);
	 * map?.once('idle', ()=>{
	 *   drawControl.recalc()
	 * })
	 * ```
	 */
	public recalc() {
		const drawInstance = this.getTerraDrawInstance();
		if (drawInstance) {
			this.registerMesureControl();

			const snapshot = drawInstance.getSnapshot();
			for (const feature of snapshot) {
				const id: string = feature.id as string;
				const geometryType = feature.geometry.type;
				const mode = feature.properties.mode as TerradrawMode;
				if (['linestring', 'freehand-linestring'].includes(mode) && geometryType === 'LineString') {
					this.measureLine(id);
					this.computeElevationByLineFeatureID(id);
				} else if (mode === 'point' && geometryType === 'Point') {
					this.measurePoint(id);
					this.computeElevationByPointFeatureID(id);
				} else if (
					!['point', 'linestring', 'freehand-linestring', 'select', 'render'].includes(mode) &&
					geometryType === 'Polygon'
				) {
					this.measurePolygon(id);
				}
			}
		}
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

		const polygonSource = this.measureOptions.polygonLayerSpec?.source;
		if (polygonSource) sourceIds.push(polygonSource);

		const lineSource = this.measureOptions.lineLayerLabelSpec?.source;
		if (lineSource) sourceIds.push(lineSource);

		const pointSource = this.measureOptions.pointLayerLabelSpec?.source;
		if (pointSource) sourceIds.push(pointSource);

		return cleanMaplibreStyle(
			style,
			options,
			sourceIds,
			this.measureOptions.adapterOptions?.prefixId
		);
	}

	/**
	 * Register  measure control related maplibre sources and layers
	 */
	private registerMesureControl() {
		if (!this.map) return;

		const lineModes = this.options.modes?.filter((m) =>
			['linestring', 'freehand-linestring'].includes(m)
		);
		const pointMode = this.options.modes?.find((m) => m === 'point');

		if (pointMode) {
			// add GeoJSON source for distance label
			if (
				!this.map.getSource(
					(this.measureOptions.pointLayerLabelSpec as SymbolLayerSpecification).source
				)
			) {
				this.map.addSource(
					(this.measureOptions.pointLayerLabelSpec as SymbolLayerSpecification).source,
					{
						type: 'geojson',
						data: { type: 'FeatureCollection', features: [] }
					}
				);
			}

			// add GeoJSON layer for distance label node appearance
			if (
				!this.map.getLayer((this.measureOptions.pointLayerLabelSpec as SymbolLayerSpecification).id)
			) {
				this.map.addLayer(this.measureOptions.pointLayerLabelSpec as SymbolLayerSpecification);
			}
		}

		if (lineModes && lineModes.length > 0) {
			// add GeoJSON source for distance label
			if (
				!this.map.getSource(
					(this.measureOptions.lineLayerLabelSpec as SymbolLayerSpecification).source
				)
			) {
				this.map.addSource(
					(this.measureOptions.lineLayerLabelSpec as SymbolLayerSpecification).source,
					{
						type: 'geojson',
						data: { type: 'FeatureCollection', features: [] }
					}
				);
			}

			// add GeoJSON layer for distance label node appearance
			if (
				!this.map.getLayer(
					(this.measureOptions.routingLineLayerNodeSpec as CircleLayerSpecification).id
				)
			) {
				this.map.addLayer(this.measureOptions.routingLineLayerNodeSpec as CircleLayerSpecification);
			}

			// add GeoJSON layer for distance label appearance
			if (
				!this.map.getLayer((this.measureOptions.lineLayerLabelSpec as SymbolLayerSpecification).id)
			) {
				this.map.addLayer(this.measureOptions.lineLayerLabelSpec as SymbolLayerSpecification);
			}
		}

		const polygonModes = this.options.modes?.filter((m) =>
			[
				'polygon',
				'rectangle',
				'angled-rectangle',
				'circle',
				'sector',
				'sensor',
				'freehand'
			].includes(m)
		);
		if (polygonModes && polygonModes.length > 0) {
			// add GeoJSON source for distance label
			if (
				!this.map.getSource(
					(this.measureOptions.polygonLayerSpec as SymbolLayerSpecification).source
				)
			) {
				this.map.addSource(
					(this.measureOptions.polygonLayerSpec as SymbolLayerSpecification).source,
					{
						type: 'geojson',
						data: { type: 'FeatureCollection', features: [] }
					}
				);
			} // add GeoJSON layer for polygon area label appearance
			if (
				!this.map.getLayer((this.measureOptions.polygonLayerSpec as SymbolLayerSpecification).id)
			) {
				this.map.addLayer(this.measureOptions.polygonLayerSpec as SymbolLayerSpecification);
			}
		}

		if ((lineModes && lineModes.length > 0) || (polygonModes && polygonModes.length > 0)) {
			const drawInstance = this.getTerraDrawInstance();
			if (drawInstance) {
				// subscribe change event of TerraDraw to calc distance
				drawInstance.on('change', this.handleTerradrawFeatureChanged.bind(this));
				drawInstance.on('finish', this.handleTerradrawFeatureReady.bind(this));
				drawInstance.on('deselect', this.handleTerradrawDeselect.bind(this));

				// subscribe feature-deleted event for the plugin control
				this.on('feature-deleted', this.onFeatureDeleted.bind(this));
			}
		}
	}

	/**
	 * Handle deselect event of terradraw
	 */
	private handleTerradrawDeselect = () => {
		if (!this.map) return;
		if (this.computeElevation === true && this.measureOptions.terrainSource !== undefined) {
			const drawInstance = this.getTerraDrawInstance();
			if (!drawInstance) return;
			const snapshot = drawInstance.getSnapshot();
			const lineFeatures = snapshot.filter(
				(f) =>
					f.properties.mode &&
					['linestring', 'freehand-linestring'].includes(f.properties.mode as string) &&
					f.geometry.type === 'LineString'
			);
			if (lineFeatures.length > 0) {
				for (const f of lineFeatures) {
					this.computeElevationByLineFeatureID(f.id as string);
				}
			}

			const pointFeatures = snapshot.filter(
				(f) => f.properties.mode === 'point' && f.geometry.type === 'Point'
			);
			if (pointFeatures.length > 0) {
				for (const f of pointFeatures) {
					this.computeElevationByPointFeatureID(f.id as string);
				}
			}
		}
	};

	/**
	 * Handle finish event of terradraw. It will be called after finishing adding a feature
	 * @param id Feature ID
	 */
	private handleTerradrawFeatureReady = debounce((id: TerraDrawExtend.FeatureId) => {
		if (!this.map) return;
		this.computeElevationByLineFeatureID(id);
		this.computeElevationByPointFeatureID(id);
	}, 300);

	/**
	 * Handle change event of TerraDraw
	 * @param ids Feature IDs
	 */
	private handleTerradrawFeatureChanged(ids: TerraDrawExtend.FeatureId[], type: string) {
		if (!this.map) return;
		// skip if type is styling. Do continue if type is create, update or delete.
		if (type === 'styling') return;

		const sources = [
			this.measureOptions.pointLayerLabelSpec as SymbolLayerSpecification,
			this.measureOptions.lineLayerLabelSpec as SymbolLayerSpecification,
			this.measureOptions.routingLineLayerNodeSpec as CircleLayerSpecification,
			this.measureOptions.polygonLayerSpec as SymbolLayerSpecification
		];
		const sourceIds = sources.map((src) => src.source);

		if (type === 'delete') {
			this.clearExtendedFeatures(sourceIds, ids);
			return;
		}

		// type is create or update

		const drawInstance = this.getTerraDrawInstance();
		if (!drawInstance) return;
		const snapshot = drawInstance.getSnapshot();
		for (const id of ids) {
			const feature = snapshot.find((f) => f.id === id);
			if (feature) {
				const geometryType = feature.geometry.type;
				const mode = feature.properties.mode as TerradrawMode;
				if (['linestring', 'freehand-linestring'].includes(mode) && geometryType === 'LineString') {
					this.measureLine(id);
				} else if (mode === 'point' && geometryType === 'Point') {
					this.measurePoint(id);
				} else if (
					!['point', 'linestring', 'freehand-linestring', 'select', 'render'].includes(mode) &&
					geometryType === 'Polygon'
				) {
					this.measurePolygon(id);
				}
			} else {
				// if editing ID does not exist, delete all related features from measure layers
				this.clearExtendedFeatures(sourceIds, [id]);
			}
		}
	}

	/**
	 * Unregister measure control related maplibre sources and layers
	 */
	private unregisterMesureControl() {
		this.off('feature-deleted', this.onFeatureDeleted.bind(this));
		if (!this.map) return;
		if (
			this.map.getLayer((this.measureOptions.pointLayerLabelSpec as SymbolLayerSpecification).id)
		) {
			this.map.removeLayer(
				(this.measureOptions.pointLayerLabelSpec as SymbolLayerSpecification).id
			);
		}
		if (
			this.map.getLayer((this.measureOptions.lineLayerLabelSpec as SymbolLayerSpecification).id)
		) {
			this.map.removeLayer((this.measureOptions.lineLayerLabelSpec as SymbolLayerSpecification).id);
		}
		if (
			this.map.getLayer(
				(this.measureOptions.routingLineLayerNodeSpec as CircleLayerSpecification).id
			)
		) {
			this.map.removeLayer(
				(this.measureOptions.routingLineLayerNodeSpec as CircleLayerSpecification).id
			);
		}
		if (this.map.getLayer((this.measureOptions.polygonLayerSpec as SymbolLayerSpecification).id)) {
			this.map.removeLayer((this.measureOptions.polygonLayerSpec as SymbolLayerSpecification).id);
		}
		if (
			this.map.getSource(
				(this.measureOptions.pointLayerLabelSpec as SymbolLayerSpecification).source
			)
		) {
			this.map.removeSource(
				(this.measureOptions.pointLayerLabelSpec as SymbolLayerSpecification).source
			);
		}
		if (
			this.map.getSource(
				(this.measureOptions.lineLayerLabelSpec as SymbolLayerSpecification).source
			)
		) {
			this.map.removeSource(
				(this.measureOptions.lineLayerLabelSpec as SymbolLayerSpecification).source
			);
		}
		if (
			this.map.getSource((this.measureOptions.polygonLayerSpec as SymbolLayerSpecification).source)
		) {
			this.map.removeSource(
				(this.measureOptions.polygonLayerSpec as SymbolLayerSpecification).source
			);
		}
	}

	/**
	 * Replace GeoJSON source with updated features for a given source ID
	 * @param updatedFeatures Updated GeoJSON features
	 * @param sourceId Source ID to update
	 * @param type either 'linestring' or 'point'
	 */
	private replaceGeoJSONSource(
		updatedFeatures: GeoJSONStoreFeatures[],
		sourceId: string,
		type: 'linestring' | 'point'
	) {
		if (!this.map) return;
		const newGeoJsonSource: GeoJSONSourceSpecification = this.map.getStyle().sources[
			sourceId
		] as GeoJSONSourceSpecification;
		if (newGeoJsonSource) {
			if (
				typeof newGeoJsonSource.data !== 'string' &&
				newGeoJsonSource.data.type === 'FeatureCollection'
			) {
				// check if feature id still exist in terradraw
				// in some conditions, features might already be deleted from terradraw
				const updatedExistingFeatures: GeoJSONStoreFeatures[] = [];
				for (const f of updatedFeatures) {
					if (
						this.terradraw?.getSnapshotFeature(f.id as TerraDrawExtend.FeatureId) ||
						this.terradraw?.getSnapshotFeature(f.properties.originalId as TerraDrawExtend.FeatureId)
					) {
						updatedExistingFeatures.push(f);
					}
				}

				const ids = updatedExistingFeatures.map((f) => f.id);
				if (
					typeof newGeoJsonSource.data !== 'string' &&
					newGeoJsonSource.data.type === 'FeatureCollection'
				) {
					if (type === 'linestring') {
						newGeoJsonSource.data.features = [
							...(newGeoJsonSource.data.features = newGeoJsonSource.data.features.filter(
								(f) => !(ids.includes(f.properties?.originalId) && f.geometry.type === 'Point')
							)),
							...updatedExistingFeatures
						];
					} else if (type === 'point') {
						newGeoJsonSource.data.features = [
							...(newGeoJsonSource.data.features = newGeoJsonSource.data.features.filter(
								(f) => !(ids.includes(f.id) && f.geometry.type === 'Point')
							)),
							...updatedExistingFeatures
						];
					}

					// delete duplicate points
					const featureMap: { [key: TerraDrawExtend.FeatureId]: GeoJSONStoreFeatures } = {};
					newGeoJsonSource.data.features.forEach((feature) => {
						const id = feature.id as TerraDrawExtend.FeatureId;

						if (!featureMap[id]) {
							featureMap[id] = feature as GeoJSONStoreFeatures;
						} else {
							const existingFeature = featureMap[id];
							if (!existingFeature.properties.elevation && feature.properties?.elevation) {
								featureMap[id] = feature as GeoJSONStoreFeatures;
							}
						}
					});
					newGeoJsonSource.data.features = Array.from(Object.values(featureMap));

					// update features
					(this.map.getSource(sourceId) as GeoJSONSource)?.setData(newGeoJsonSource.data);
				}
			}
		}
	}

	/**
	 * Compute elevation by a LineString feature ID
	 * @param id FeatureID
	 */
	private computeElevationByLineFeatureID = async (id: TerraDrawExtend.FeatureId) => {
		if (!this.map) return;
		if (this.computeElevation === true) {
			const geojsonSource: GeoJSONSourceSpecification = this.map.getStyle().sources[
				(this.measureOptions.lineLayerLabelSpec as SymbolLayerSpecification).source
			] as GeoJSONSourceSpecification;
			if (geojsonSource) {
				if (
					typeof geojsonSource.data !== 'string' &&
					geojsonSource.data.type === 'FeatureCollection'
				) {
					const points: GeoJSONStoreFeatures[] = geojsonSource.data.features.filter(
						(f) => f.properties?.originalId === id && f.geometry.type === 'Point'
					) as unknown as GeoJSONStoreFeatures[];
					if (points && points.length > 0) {
						const updatedFeatures = await queryElevationFromRasterDEM(
							points as GeoJSONStoreFeatures[],
							this.measureOptions.terrainSource,
							this.measureOptions.elevationCacheConfig,
							this.elevationCache,
							this.measureUnitType,
							this.measureUnitSymbols
						);

						this.replaceGeoJSONSource(
							updatedFeatures,
							(this.measureOptions.lineLayerLabelSpec as SymbolLayerSpecification).source,
							'linestring'
						);
					}
				}
			}
		}
	};

	/**
	 * Compute elevation by a Point feature ID
	 * @param id FeatureID
	 */
	private computeElevationByPointFeatureID = async (id: TerraDrawExtend.FeatureId) => {
		if (!this.map) return;
		if (this.computeElevation === true) {
			const geojsonSource: GeoJSONSourceSpecification = this.map.getStyle().sources[
				(this.measureOptions.pointLayerLabelSpec as SymbolLayerSpecification).source
			] as GeoJSONSourceSpecification;
			if (geojsonSource) {
				if (
					typeof geojsonSource.data !== 'string' &&
					geojsonSource.data.type === 'FeatureCollection'
				) {
					const points: GeoJSONStoreFeatures[] = geojsonSource.data.features.filter(
						(f) => f.id === id && f.geometry.type === 'Point' && f.properties?.mode === 'point'
					) as unknown as GeoJSONStoreFeatures[];
					if (points && points.length > 0) {
						const updatedFeatures = await queryElevationFromRasterDEM(
							points as GeoJSONStoreFeatures[],
							this.measureOptions.terrainSource,
							this.measureOptions.elevationCacheConfig,
							this.elevationCache,
							this.measureUnitType,
							this.measureUnitSymbols
						);
						this.replaceGeoJSONSource(
							updatedFeatures,
							(this.measureOptions.pointLayerLabelSpec as SymbolLayerSpecification).source,
							'point'
						);
					}
				}
			}
		}
	};

	/**
	 * Recalculate elevation units for existing features without re-querying elevation data
	 * This is called when measureUnitType changes to convert elevation values between metric and imperial
	 */
	private recalculateElevationUnits() {
		if (!this.map) return;

		// Update point elevation units
		const pointSource = (this.measureOptions.pointLayerLabelSpec as SymbolLayerSpecification)
			.source;
		this.updateElevationUnitsInSource(pointSource);

		// Update line elevation units
		const lineSource = (this.measureOptions.lineLayerLabelSpec as SymbolLayerSpecification).source;
		this.updateElevationUnitsInSource(lineSource);
	}

	/**
	 * Update elevation units in a specific GeoJSON source
	 */
	private updateElevationUnitsInSource(sourceName: string) {
		if (!this.map) return;

		const geojsonSource: GeoJSONSourceSpecification = this.map.getStyle().sources[
			sourceName
		] as GeoJSONSourceSpecification;
		if (
			geojsonSource &&
			typeof geojsonSource.data !== 'string' &&
			geojsonSource.data.type === 'FeatureCollection'
		) {
			let updated = false;

			for (const feature of geojsonSource.data.features) {
				if (feature.properties?.elevation !== undefined) {
					// Convert the elevation from current display value back to meters, then to new unit
					const currentUnit = feature.properties.elevationUnit;
					let elevationInMeters = feature.properties.elevation;

					// Convert to meters if currently in feet
					if (currentUnit === 'ft' || currentUnit === 'foot') {
						elevationInMeters = elevationInMeters / 3.28084;
					}

					// Convert to new unit
					const { elevation, unit } = convertElevation(
						elevationInMeters,
						this.measureUnitType,
						this.measureUnitSymbols
					);
					feature.properties.elevation = elevation;
					feature.properties.elevationUnit = unit;
					updated = true;
				}
			}

			if (updated) {
				(this.map.getSource(sourceName) as GeoJSONSource).setData(geojsonSource.data);
			}
		}
	}

	/**
	 * measure polygon area for given feature ID
	 * @param id terradraw feature id
	 */
	private measurePolygon(id: TerraDrawExtend.FeatureId) {
		if (!this.map) return;
		const drawInstance = this.getTerraDrawInstance();
		if (!drawInstance) return;

		const snapshot = drawInstance.getSnapshot();
		let feature = snapshot?.find((f) => f.id === id && f.geometry.type === 'Polygon');
		if (feature) {
			const geojsonSource: GeoJSONSourceSpecification = this.map.getStyle().sources[
				(this.measureOptions.polygonLayerSpec as SymbolLayerSpecification).source
			] as GeoJSONSourceSpecification;
			if (geojsonSource) {
				// delete old nodes
				if (
					typeof geojsonSource.data !== 'string' &&
					geojsonSource.data.type === 'FeatureCollection'
				) {
					geojsonSource.data.features = geojsonSource.data.features.filter(
						(f) => f.properties?.originalId !== id
					);
				}

				const point = JSON.parse(JSON.stringify(feature));
				point.id = point.id + '-area-label';
				point.geometry = centroid(feature.geometry).geometry;
				point.properties.originalId = feature.id;

				feature = calcArea(
					feature,
					this.measureUnitType,
					this.areaPrecision,
					this.forceAreaUnit,
					this.measureUnitSymbols
				);
				point.properties.area = feature.properties.area;
				point.properties.unit = feature.properties.unit;

				if (
					typeof geojsonSource.data !== 'string' &&
					geojsonSource.data.type === 'FeatureCollection'
				) {
					geojsonSource.data.features.push(point);
				}
				// update GeoJSON source with new data
				(
					this.map.getSource(
						(this.measureOptions.polygonLayerSpec as SymbolLayerSpecification).source
					) as GeoJSONSource
				)?.setData(geojsonSource.data);

				this.map.moveLayer((this.measureOptions.polygonLayerSpec as SymbolLayerSpecification).id);

				if (
					this.map.getLayer((this.measureOptions.lineLayerLabelSpec as SymbolLayerSpecification).id)
				) {
					this.map.moveLayer(
						(this.measureOptions.lineLayerLabelSpec as SymbolLayerSpecification).id
					);
				}
				if (
					this.map.getLayer(
						(this.measureOptions.routingLineLayerNodeSpec as CircleLayerSpecification).id
					)
				) {
					this.map.moveLayer(
						(this.measureOptions.routingLineLayerNodeSpec as CircleLayerSpecification).id
					);
				}

				if (
					this.map.getLayer(
						(this.measureOptions.pointLayerLabelSpec as SymbolLayerSpecification).id
					)
				) {
					this.map.moveLayer(
						(this.measureOptions.pointLayerLabelSpec as SymbolLayerSpecification).id
					);
				}
			}
		}
	}

	/**
	 * measure line distance for given feature ID
	 * @param id terradraw feature id
	 */
	private measureLine(id: TerraDrawExtend.FeatureId) {
		if (!this.map) return;
		const drawInstance = this.getTerraDrawInstance();
		if (!drawInstance) return;

		const snapshot = drawInstance.getSnapshot();
		let feature = snapshot?.find((f) => f.id === id && f.geometry.type === 'LineString');
		if (feature) {
			const geojsonSource: GeoJSONSourceSpecification = this.map.getStyle().sources[
				(this.measureOptions.lineLayerLabelSpec as SymbolLayerSpecification).source
			] as GeoJSONSourceSpecification;
			if (geojsonSource) {
				// delete old nodes
				if (
					typeof geojsonSource.data !== 'string' &&
					geojsonSource.data.type === 'FeatureCollection'
				) {
					geojsonSource.data.features = geojsonSource.data.features.filter(
						(f) => f.properties?.originalId !== id
					);
				}

				feature = calcDistance(
					feature,
					this.measureUnitType,
					this.distancePrecision,
					this.forceDistanceUnit,
					this.measureUnitSymbols,
					this.map,
					this.computeElevation,
					this.measureOptions.terrainSource
				);
				const segments = feature.properties.segments as unknown as GeoJSONStoreFeatures[];
				for (let i = 0; i < segments.length; i++) {
					const segment = segments[i];
					const coordinates: number[][] = segment.geometry.coordinates as number[][];
					const start = coordinates[0];
					const end = coordinates[1];

					// node
					if (i === 0) {
						const startNode = JSON.parse(JSON.stringify(segment));
						startNode.id = `${segment.id}-node-${i}`;
						startNode.geometry = {
							type: 'Point',
							coordinates: start
						};
						startNode.properties.distance = 0;
						startNode.properties.total = 0;

						if (segment.properties.elevation_start) {
							startNode.properties.elevation = segment.properties.elevation_start;
						}

						if (
							typeof geojsonSource.data !== 'string' &&
							geojsonSource.data.type === 'FeatureCollection'
						) {
							geojsonSource.data.features.push(startNode);
						}
					}
					const endNode = JSON.parse(JSON.stringify(segment));
					endNode.id = `${segment.id}-node-${i + 1}`;
					endNode.geometry = {
						type: 'Point',
						coordinates: end
					};

					if (segment.properties.elevation_end) {
						endNode.properties.elevation = segment.properties.elevation_end;
					}

					if (
						typeof geojsonSource.data !== 'string' &&
						geojsonSource.data.type === 'FeatureCollection'
					) {
						geojsonSource.data.features.push(endNode);
					}
				}

				// update GeoJSON source with new data
				(
					this.map.getSource(
						(this.measureOptions.lineLayerLabelSpec as SymbolLayerSpecification).source
					) as GeoJSONSource
				)?.setData(geojsonSource.data);

				if (
					this.map.getLayer((this.measureOptions.polygonLayerSpec as SymbolLayerSpecification).id)
				) {
					this.map.moveLayer((this.measureOptions.polygonLayerSpec as SymbolLayerSpecification).id);
				}

				this.map.moveLayer((this.measureOptions.lineLayerLabelSpec as SymbolLayerSpecification).id);
				this.map.moveLayer(
					(this.measureOptions.routingLineLayerNodeSpec as CircleLayerSpecification).id
				);

				if (
					this.map.getLayer(
						(this.measureOptions.pointLayerLabelSpec as SymbolLayerSpecification).id
					)
				) {
					this.map.moveLayer(
						(this.measureOptions.pointLayerLabelSpec as SymbolLayerSpecification).id
					);
				}
			}
		}
	}

	/**
	 * measure point elevation for given feature ID
	 * @param id terradraw feature id
	 */
	private measurePoint(id: TerraDrawExtend.FeatureId) {
		if (!this.map) return;
		const drawInstance = this.getTerraDrawInstance();
		if (!drawInstance) return;

		const snapshot = drawInstance.getSnapshot();
		let feature = snapshot?.find((f) => f.id === id && f.geometry.type === 'Point');
		if (feature) {
			const geojsonSource: GeoJSONSourceSpecification = this.map.getStyle().sources[
				(this.measureOptions.pointLayerLabelSpec as SymbolLayerSpecification).source
			] as GeoJSONSourceSpecification;
			if (geojsonSource) {
				// delete old nodes
				if (
					typeof geojsonSource.data !== 'string' &&
					geojsonSource.data.type === 'FeatureCollection'
				) {
					geojsonSource.data.features = geojsonSource.data.features.filter((f) => f.id !== id);
				}

				feature = queryElevationByPoint(
					feature,
					this.map,
					this.computeElevation,
					this.measureOptions.terrainSource,
					this.measureUnitType,
					this.measureUnitSymbols
				);

				// add elevation label feature if computeElevation is only enabled.
				if (this.computeElevation === true) {
					if (
						typeof geojsonSource.data !== 'string' &&
						geojsonSource.data.type === 'FeatureCollection'
					) {
						geojsonSource.data.features.push(feature);
					}
				}

				// update GeoJSON source with new data
				(
					this.map.getSource(
						(this.measureOptions.pointLayerLabelSpec as SymbolLayerSpecification).source
					) as GeoJSONSource
				)?.setData(geojsonSource.data);

				if (
					this.map.getLayer((this.measureOptions.polygonLayerSpec as SymbolLayerSpecification).id)
				) {
					this.map.moveLayer((this.measureOptions.polygonLayerSpec as SymbolLayerSpecification).id);
				}
				if (
					this.map.getLayer((this.measureOptions.lineLayerLabelSpec as SymbolLayerSpecification).id)
				) {
					this.map.moveLayer(
						(this.measureOptions.lineLayerLabelSpec as SymbolLayerSpecification).id
					);
					this.map.moveLayer(
						(this.measureOptions.routingLineLayerNodeSpec as CircleLayerSpecification).id
					);
				}

				this.map.moveLayer(
					(this.measureOptions.pointLayerLabelSpec as SymbolLayerSpecification).id
				);
			}
		}
	}

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

			const sources = [
				this.measureOptions.pointLayerLabelSpec as SymbolLayerSpecification,
				this.measureOptions.lineLayerLabelSpec as SymbolLayerSpecification,
				this.measureOptions.routingLineLayerNodeSpec as CircleLayerSpecification,
				this.measureOptions.polygonLayerSpec as SymbolLayerSpecification
			];
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

	/**
	 * get GeoJSON features
	 * @param onlySelected If true, returns only selected features. Default is false.
	 * @returns FeatureCollection in GeoJSON format
	 */
	public getFeatures(onlySelected = false) {
		const fc = super.getFeatures(onlySelected);
		if (!fc) return fc;
		if (!this.terradraw) return fc;

		for (let i = 0; i < fc.features.length; i++) {
			const feature = fc.features[i];
			if (!this.map) continue;
			if (!this.map.loaded()) continue;
			const geomType = feature.geometry.type;
			if (geomType === 'LineString') {
				fc.features[i] = calcDistance(
					feature,
					this.measureUnitType,
					this.distancePrecision,
					this.forceDistanceUnit,
					this.measureUnitSymbols,
					this.map,
					this.computeElevation,
					this.measureOptions.terrainSource
				);
			} else if (geomType === 'Polygon') {
				fc.features[i] = calcArea(
					feature,
					this.measureUnitType,
					this.areaPrecision,
					this.forceAreaUnit,
					this.measureUnitSymbols
				);
			} else if (geomType === 'Point') {
				fc.features[i] = queryElevationByPoint(
					feature,
					this.map,
					this.computeElevation,
					this.measureOptions.terrainSource,
					this.measureUnitType,
					this.measureUnitSymbols
				);
			}
		}
		return fc;
	}
}
