import {
	Map,
	type CircleLayerSpecification,
	type GeoJSONSource,
	type GeoJSONSourceSpecification,
	type LngLatLike,
	type StyleSpecification,
	type SymbolLayerSpecification
} from 'maplibre-gl';
import { MaplibreTerradrawControl } from './MaplibreTerradrawControl';
import { distance } from '@turf/distance';
import { area } from '@turf/area';
import { centroid } from '@turf/centroid';
import { defaultMeasureControlOptions } from '../constants';
import type { AreaUnit, DistanceUnit, MeasureControlOptions, TerradrawMode } from '../interfaces';
import type { GeoJSONStoreFeatures } from 'terra-draw';
import { TerrainRGB, Terrarium } from '@watergis/terrain-rgb';
import { cleanMaplibreStyle, debounce, TERRADRAW_SOURCE_IDS } from '../helpers';

/**
 * Maplibre GL Terra Draw Measure Control
 */
export class MaplibreMeasureControl extends MaplibreTerradrawControl {
	private measureOptions: MeasureControlOptions;

	/**
	 * The unit of distance can be degrees, radians, miles, or kilometers (default 'kilometers')
	 * The measuring result will be recalculated once new value is set
	 */
	get distanceUnit() {
		return this.measureOptions.distanceUnit ?? 'kilometers';
	}
	set distanceUnit(value: DistanceUnit) {
		const isSame = this.measureOptions.distanceUnit === value;
		this.measureOptions.distanceUnit = value;

		if (this.measureOptions.distanceUnit === 'degrees') {
			this.distancePrecision = 6;
		} else {
			this.distancePrecision = 2;
		}

		if (!isSame) this.recalc();
	}

	/**
	 * The precision of distance value. It will be set different value dwhen distance unit is changed. Using setter to override the value if you want.
	 */
	get distancePrecision() {
		return this.measureOptions.distancePrecision ?? 2;
	}
	set distancePrecision(value: number) {
		const isSame = this.measureOptions.distancePrecision === value;
		this.measureOptions.distancePrecision = value;
		if (!isSame) this.recalc();
	}

	/**
	 * The unit of area can be metric (m², ha, km²) or imperial (yd², acre, mi²). Default is metric.
	 * The measuring result will be recalculated once new value is set
	 */
	get areaUnit() {
		return this.measureOptions.areaUnit ?? 'metric';
	}
	set areaUnit(value: AreaUnit) {
		const isSame = this.measureOptions.areaUnit === value;
		this.measureOptions.areaUnit = value;
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
	 * Constructor
	 * @param options Plugin control options
	 */
	constructor(options?: MeasureControlOptions) {
		let measureOptions: MeasureControlOptions = defaultMeasureControlOptions;
		if (options) {
			measureOptions = Object.assign(measureOptions, options);
		}
		super({
			modes: measureOptions.modes,
			open: measureOptions.open,
			modeOptions: measureOptions.modeOptions
		});
		this.measureOptions = measureOptions;
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
				if (mode === 'linestring' && geometryType === 'LineString') {
					this.measureLine(id);
					this.computeElevationByLineFeatureID(id);
				} else if (mode === 'point' && geometryType === 'Point') {
					this.measurePoint(id);
					this.computeElevationByPointFeatureID(id);
				} else if (
					!['point', 'linestring', 'select', 'render'].includes(mode) &&
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

		return cleanMaplibreStyle(style, options, sourceIds);
	}

	/**
	 * Register  measure control related maplibre sources and layers
	 */
	private registerMesureControl() {
		if (!this.map) return;

		const lineModes = this.options.modes?.filter((m) => ['linestring'].includes(m));
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
				!this.map.getLayer((this.measureOptions.lineLayerNodeSpec as CircleLayerSpecification).id)
			) {
				this.map.addLayer(this.measureOptions.lineLayerNodeSpec as CircleLayerSpecification);
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
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
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
				(f) => f.properties.mode === 'linestring' && f.geometry.type === 'LineString'
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
	private handleTerradrawFeatureReady = debounce((id: string | number) => {
		if (!this.map) return;
		this.computeElevationByLineFeatureID(id);
		this.computeElevationByPointFeatureID(id);
	}, 300);

	/**
	 * Handle change event of TerraDraw
	 * @param ids Feature IDs
	 */
	private handleTerradrawFeatureChanged(ids: [string | number]) {
		if (!this.map) return;
		const drawInstance = this.getTerraDrawInstance();
		if (!drawInstance) return;
		const snapshot = drawInstance.getSnapshot();
		for (const id of ids) {
			const feature = snapshot.find((f) => f.id === id);
			if (feature) {
				const geometryType = feature.geometry.type;
				const mode = feature.properties.mode as TerradrawMode;
				if (mode === 'linestring' && geometryType === 'LineString') {
					this.measureLine(id);
				} else if (mode === 'point' && geometryType === 'Point') {
					this.measurePoint(id);
				} else if (
					!['point', 'linestring', 'select', 'render'].includes(mode) &&
					geometryType === 'Polygon'
				) {
					this.measurePolygon(id);
				}
			} else {
				// if editing ID does not exist, delete all related features from measure layers
				this.clearMeasureFeatures(
					id,
					(this.measureOptions.lineLayerNodeSpec as CircleLayerSpecification).source
				);
				this.clearMeasureFeatures(
					id,
					(this.measureOptions.lineLayerLabelSpec as SymbolLayerSpecification).source
				);
				this.clearMeasureFeatures(
					id,
					(this.measureOptions.polygonLayerSpec as SymbolLayerSpecification).source
				);
				this.clearMeasureFeatures(
					id,
					(this.measureOptions.pointLayerLabelSpec as SymbolLayerSpecification).source
				);
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
		if (this.map.getLayer((this.measureOptions.lineLayerNodeSpec as CircleLayerSpecification).id)) {
			this.map.removeLayer((this.measureOptions.lineLayerNodeSpec as CircleLayerSpecification).id);
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
	 * Clear GeoJSON feature related to measure control by TerraDraw feature ID
	 * @param id feature ID
	 * @param sourceId source ID to delete
	 * @returns void
	 */
	private clearMeasureFeatures(id: string | number, sourceId: string) {
		if (!this.map) return;
		const geojsonSource: GeoJSONSourceSpecification = this.map.getStyle().sources[
			sourceId
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

				// update GeoJSON source with new data
				(this.map.getSource(sourceId) as GeoJSONSource)?.setData(geojsonSource.data);
			}
		}
	}

	/**
	 * Calculate area from polygon feature
	 * @param feature Polygon GeoJSON feature
	 * @returns  The returning feature will contain `area`,`unit` properties.
	 */
	private calcArea(feature: GeoJSONStoreFeatures) {
		if (feature.geometry.type !== 'Polygon') return feature;
		// caculate area in m2 by using turf/area
		const result = area(feature.geometry);

		// convert unit to ha or km2 if value is larger
		let outputArea = result;
		let outputUnit = 'm²';

		if (this.areaUnit === 'metric') {
			if (result >= 1000000) {
				// 1 km² = 1,000,000 m²
				outputArea = result / 1000000;
				outputUnit = 'km²';
			} else if (result >= 10000) {
				// 1 ha = 10,000 m²
				outputArea = result / 10000;
				outputUnit = 'ha';
			}
		} else {
			if (result >= 2589988.11) {
				// 1 mi² = 2,589,988.11 m²
				outputArea = result / 2589988.11;
				outputUnit = 'mi²';
			} else if (result >= 4046.856) {
				// 1 acre = 4,046.856 m²
				outputArea = result / 4046.856;
				outputUnit = 'acre';
			} else if (result >= 0.83612736) {
				// 1 yd² = 0.83612736 m²
				outputArea = result / 0.83612736;
				outputUnit = 'yd²';
			}
		}

		outputArea = parseFloat(outputArea.toFixed(this.areaPrecision));

		feature.properties.area = outputArea;
		feature.properties.unit = outputUnit;

		return feature;
	}

	/**
	 * Get the equivalent unit name for displaying
	 * @param distanceUnit distance unit
	 * @returns Unit name for displaying
	 */
	private getDistanceUnitName(distanceUnit: DistanceUnit) {
		if (distanceUnit === 'degrees') {
			return '°';
		} else if (distanceUnit === 'miles') {
			return 'mi';
		} else if (distanceUnit === 'radians') {
			return 'rad';
		} else {
			return 'km';
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
				const ids = updatedFeatures.map((f) => f.id);
				if (
					typeof newGeoJsonSource.data !== 'string' &&
					newGeoJsonSource.data.type === 'FeatureCollection'
				) {
					if (type === 'linestring') {
						newGeoJsonSource.data.features = [
							...(newGeoJsonSource.data.features = newGeoJsonSource.data.features.filter(
								(f) => !(ids.includes(f.properties?.originalId) && f.geometry.type === 'Point')
							)),
							...updatedFeatures
						];
					} else if (type === 'point') {
						newGeoJsonSource.data.features = [
							...(newGeoJsonSource.data.features = newGeoJsonSource.data.features.filter(
								(f) => !(ids.includes(f.id) && f.geometry.type === 'Point')
							)),
							...updatedFeatures
						];
					}

					// delete duplicate points
					const featureMap: { [key: string | number]: GeoJSONStoreFeatures } = {};
					newGeoJsonSource.data.features.forEach((feature) => {
						const id = feature.id as string | number;

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
	private computeElevationByLineFeatureID = async (id: string | number) => {
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
						const updatedFeatures = await this.queryTerrainElevation(
							points as GeoJSONStoreFeatures[]
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
	private computeElevationByPointFeatureID = async (id: string | number) => {
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
						const updatedFeatures = await this.queryTerrainElevation(
							points as GeoJSONStoreFeatures[]
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
	 * Query terrain elvation for point features
	 * @param point Point GeoJSON features
	 * @returns point features after adding elevation property
	 */
	private async queryTerrainElevation(points: GeoJSONStoreFeatures[]) {
		if (!this.map) return points;

		const promises: Promise<GeoJSONStoreFeatures>[] = [];
		for (const point of points) {
			promises.push(
				new Promise((resolve: (feature: GeoJSONStoreFeatures) => void) => {
					if (point.geometry.type !== 'Point') resolve(point);
					const options = this.measureOptions.terrainSource;
					if (options) {
						const url = options.url;
						const encoding = options.encoding ?? 'mapbox';
						const tileSize = options.tileSize ?? 512;
						const minzoom = options.minzoom ?? 5;
						const maxzoom = options.maxzoom ?? 15;
						const tms = options.tms ?? false;

						(encoding === 'mapbox'
							? new TerrainRGB(url, tileSize, minzoom, maxzoom, tms)
							: new Terrarium(url, tileSize, minzoom, maxzoom, tms)
						)
							.getElevation(point.geometry.coordinates as number[], maxzoom)
							.then((elevation) => {
								if (elevation) point.properties.elevation = elevation;
								resolve(point);
							})
							.catch(() => resolve(point));
					} else {
						resolve(point);
					}
				})
			);
		}
		return await Promise.all(promises);
	}

	private queryElevationByPoint(feature: GeoJSONStoreFeatures) {
		if (feature.geometry.type !== 'Point') return feature;

		const coordinates: number[] = (feature as GeoJSONStoreFeatures).geometry
			.coordinates as number[];

		if (this.computeElevation === true && this.measureOptions.terrainSource === undefined) {
			const elevation = this.map?.queryTerrainElevation(coordinates as LngLatLike);
			if (elevation) {
				feature.properties.elevation = elevation;
			}
		}
		return feature;
	}

	/**
	 * Caclulate distance for each segment on a given feature
	 * @param feature LineString GeoJSON feature
	 * @returns The returning feature will contain `segments`, `distance`, `unit` properties. `segments` will have multiple point features.
	 */
	private calcDistance(feature: GeoJSONStoreFeatures) {
		if (feature.geometry.type !== 'LineString') return feature;
		const coordinates: number[][] = (feature as GeoJSONStoreFeatures).geometry
			.coordinates as number[][];

		// calculate distance for each segment of LineString feature
		let totalDistance = 0;
		const segments: GeoJSONStoreFeatures[] = [];
		for (let i = 0; i < coordinates.length - 1; i++) {
			const start = coordinates[i];
			const end = coordinates[i + 1];
			const result = distance(start, end, { units: this.distanceUnit });
			totalDistance += result;

			// segment
			const segment = JSON.parse(JSON.stringify(feature));
			segment.id = `${segment.id}-${i}`;
			segment.geometry.coordinates = [start, end];
			segment.properties.originalId = feature.id;
			segment.properties.distance = parseFloat(result.toFixed(this.distancePrecision));
			segment.properties.total = parseFloat(totalDistance.toFixed(this.distancePrecision));
			segment.properties.unit = this.getDistanceUnitName(this.distanceUnit);

			if (this.computeElevation === true && this.measureOptions.terrainSource === undefined) {
				const elevation_start = this.map?.queryTerrainElevation(start as LngLatLike);
				if (elevation_start) {
					segment.properties.elevation_start = elevation_start;
				}

				const elevation_end = this.map?.queryTerrainElevation(end as LngLatLike);
				if (elevation_end) {
					segment.properties.elevation_end = elevation_end;
				}
			}

			segments.push(segment);
		}

		feature.properties.distance = segments[segments.length - 1].properties.total;
		feature.properties.unit = segments[segments.length - 1].properties.unit;
		feature.properties.segments = JSON.parse(JSON.stringify(segments));

		return feature;
	}

	/**
	 * measure polygon area for given feature ID
	 * @param id terradraw feature id
	 */
	private measurePolygon(id: string | number) {
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

				feature = this.calcArea(feature);
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
					this.map.getLayer((this.measureOptions.lineLayerNodeSpec as CircleLayerSpecification).id)
				) {
					this.map.moveLayer(
						(this.measureOptions.lineLayerNodeSpec as CircleLayerSpecification).id
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
	private measureLine(id: string | number) {
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

				feature = this.calcDistance(feature);
				const segments = feature.properties.segments as unknown as GeoJSONStoreFeatures[];
				for (let i = 0; i < segments.length; i++) {
					const segment = segments[i];

					if (
						typeof geojsonSource.data !== 'string' &&
						geojsonSource.data.type === 'FeatureCollection'
					) {
						geojsonSource.data.features.push(segment);
					}

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
				this.map.moveLayer((this.measureOptions.lineLayerNodeSpec as CircleLayerSpecification).id);

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
	private measurePoint(id: string | number) {
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

				feature = this.queryElevationByPoint(feature);

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
						(this.measureOptions.lineLayerNodeSpec as CircleLayerSpecification).id
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
				this.measureOptions.polygonLayerSpec as SymbolLayerSpecification
			];

			if (deletedIds && deletedIds.length > 0) {
				// delete only features by IDs
				for (const src of sources) {
					const geojsonSource: GeoJSONSourceSpecification = this.map.getStyle().sources[
						src.source
					] as GeoJSONSourceSpecification;
					if (geojsonSource) {
						if (
							typeof geojsonSource.data !== 'string' &&
							geojsonSource.data.type === 'FeatureCollection'
						) {
							// Delete label features if originalId does not exist anymore.
							geojsonSource.data.features = geojsonSource.data.features.filter((f) => {
								if (f.properties?.originalId) {
									return !deletedIds.includes(f.properties.originalId);
								} else {
									return !deletedIds.includes(f.id as string);
								}
							});
						}
						(this.map.getSource(src.source) as GeoJSONSource)?.setData(geojsonSource.data);
					}
				}
			} else {
				// delete all features
				for (const src of sources) {
					const geojsonSource: GeoJSONSourceSpecification = this.map.getStyle().sources[
						src.source
					] as GeoJSONSourceSpecification;
					if (geojsonSource) {
						if (
							typeof geojsonSource.data !== 'string' &&
							geojsonSource.data.type === 'FeatureCollection'
						) {
							// Delete label features if originalId does not exist anymore.
							geojsonSource.data.features = [];
						}
						(this.map.getSource(src.source) as GeoJSONSource)?.setData(geojsonSource.data);
					}
				}
			}
		}
	}

	/**
	 * Calculate area / distance and update a feature properties
	 * @param feature GeoJSON feature
	 * @returns updated GeoJSON feature
	 */
	private updateFeatureProperties = (feature: GeoJSONStoreFeatures) => {
		if (!this.map) return feature;
		if (!this.map.loaded()) return feature;
		const geomType = feature.geometry.type;
		if (geomType === 'LineString') {
			feature = this.calcDistance(feature);
		} else if (geomType === 'Polygon') {
			feature = this.calcArea(feature);
		} else if (geomType === 'Point') {
			feature = this.queryElevationByPoint(feature);
		}

		return feature;
	};

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
			fc.features[i] = this.updateFeatureProperties(fc.features[i]);
		}
		return fc;
	}
}
