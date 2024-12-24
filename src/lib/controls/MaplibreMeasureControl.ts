import type {
	CircleLayerSpecification,
	GeoJSONSource,
	GeoJSONSourceSpecification,
	Map,
	SymbolLayerSpecification
} from 'maplibre-gl';
import { MaplibreTerradrawControl } from './MaplibreTerradrawControl.js';
import { distance } from '@turf/distance';
import { area } from '@turf/area';
import { centroid } from '@turf/centroid';
import { defaultMeasureControlOptions } from '../constants/index.js';
import type { MeasureControlOptions, TerradrawMode } from '../interfaces/index.js';

/**
 * Maplibre GL Terra Draw Measure Control
 */
export class MaplibreMeasureControl extends MaplibreTerradrawControl {
	private lineLayerLabelSpec: SymbolLayerSpecification;
	private lineLayerNodeSpec: CircleLayerSpecification;
	private polygonLayerSpec: SymbolLayerSpecification;

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
		this.lineLayerLabelSpec = measureOptions.lineLayerLabelSpec as SymbolLayerSpecification;
		this.lineLayerNodeSpec = measureOptions.lineLayerNodeSpec as CircleLayerSpecification;
		this.polygonLayerSpec = measureOptions.polygonLayerSpec as SymbolLayerSpecification;
	}

	/**
	 * add the plugin control to maplibre
	 * @param map Maplibre Map object
	 * @returns HTML Element
	 */
	public onAdd(map: Map): HTMLElement {
		this.controlContainer = super.onAdd(map);
		map.once('load', this.registerMesureControl.bind(this));
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
	 * Register  measure control related maplibre sources and layers
	 */
	private registerMesureControl() {
		if (!this.map) return;

		const lineModes = this.options.modes?.filter((m) => ['linestring'].includes(m));

		if (lineModes && lineModes.length > 0) {
			// add GeoJSON source for distance label
			if (!this.map.getSource(this.lineLayerLabelSpec.source)) {
				this.map.addSource(this.lineLayerLabelSpec.source, {
					type: 'geojson',
					data: { type: 'FeatureCollection', features: [] }
				});
			}

			// add GeoJSON layer for distance label node appearance
			if (!this.map.getLayer(this.lineLayerNodeSpec.id)) {
				this.map.addLayer(this.lineLayerNodeSpec);
			}

			// add GeoJSON layer for distance label appearance
			if (!this.map.getLayer(this.lineLayerLabelSpec.id)) {
				this.map.addLayer(this.lineLayerLabelSpec);
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
			if (!this.map.getSource(this.polygonLayerSpec.source)) {
				this.map.addSource(this.polygonLayerSpec.source, {
					type: 'geojson',
					data: { type: 'FeatureCollection', features: [] }
				});
			} // add GeoJSON layer for polygon area label appearance
			if (!this.map.getLayer(this.polygonLayerSpec.id)) {
				this.map.addLayer(this.polygonLayerSpec);
			}
		}

		if ((lineModes && lineModes.length > 0) || (polygonModes && polygonModes.length > 0)) {
			const drawInstance = this.getTerraDrawInstance();
			if (drawInstance) {
				// subscribe change event of TerraDraw to calc distance
				drawInstance.on('change', (ids: string[]) => {
					if (!this.map) return;
					const drawInstance = this.getTerraDrawInstance();
					if (!drawInstance) return;
					const snapshot = drawInstance.getSnapshot();
					for (const id of ids) {
						const feature = snapshot?.find((f) => f.id === id);
						if (feature) {
							const geometryType = feature.geometry.type;
							const mode = feature.properties.mode as TerradrawMode;
							if (mode === 'linestring' && geometryType === 'LineString') {
								this.measureLine(id);
							} else if (
								!['point', 'linestring', 'select', 'render'].includes(mode) &&
								geometryType === 'Polygon'
							) {
								this.measurePolygon(id);
							}
						} else {
							// if editing ID does not exist, delete all related features from measure layers
							this.clearMeasureFeatures(id, this.lineLayerNodeSpec.source);
							this.clearMeasureFeatures(id, this.lineLayerLabelSpec.source);
							this.clearMeasureFeatures(id, this.polygonLayerSpec.source);
						}
					}
				});

				// subscribe feature-deleted event for the plugin control
				this.on('feature-deleted', this.onFeatureDeleted.bind(this));
			}
		}
	}

	/**
	 * Unregister measure control related maplibre sources and layers
	 */
	private unregisterMesureControl() {
		this.off('feature-deleted', this.onFeatureDeleted.bind(this));
		if (!this.map) return;
		if (this.map.getLayer(this.lineLayerLabelSpec.id)) {
			this.map.removeLayer(this.lineLayerLabelSpec.id);
		}
		if (this.map.getLayer(this.lineLayerNodeSpec.id)) {
			this.map.removeLayer(this.lineLayerNodeSpec.id);
		}
		if (this.map.getLayer(this.polygonLayerSpec.id)) {
			this.map.removeLayer(this.polygonLayerSpec.id);
		}
		if (this.map.getSource(this.lineLayerLabelSpec.source)) {
			this.map.removeSource(this.lineLayerLabelSpec.source);
		}
		if (this.map.getSource(this.polygonLayerSpec.source)) {
			this.map.removeSource(this.polygonLayerSpec.source);
		}
	}

	/**
	 * Clear GeoJSON feature related to measure control by TerraDraw feature ID
	 * @param id feature ID
	 * @param sourceId source ID to delete
	 * @returns void
	 */
	private clearMeasureFeatures(id: string, sourceId: string) {
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
	 * measure polygon area for given feature ID
	 * @param id terradraw feature id
	 */
	private measurePolygon(id: string) {
		if (!this.map) return;
		const drawInstance = this.getTerraDrawInstance();
		if (!drawInstance) return;

		const snapshot = drawInstance.getSnapshot();
		const feature = snapshot?.find((f) => f.id === id && f.geometry.type === 'Polygon');
		if (feature) {
			const geojsonSource: GeoJSONSourceSpecification = this.map.getStyle().sources[
				this.polygonLayerSpec.source
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

				// caculate area in m2 by using turf/area
				const result = area(feature.geometry);
				const point = JSON.parse(JSON.stringify(feature));
				point.id = point.id + '-area-label';
				point.geometry = centroid(feature.geometry).geometry;
				point.properties.originalId = feature.id;

				// convert unit to ha or km2 if value is larger
				let outputArea = result;
				let outputUnit = 'm2';
				if (result > 10000) {
					outputArea = result / 10000;
					outputUnit = 'ha';
				} else if (result > 1000) {
					outputArea = result / 1000;
					outputUnit = 'km2';
				}

				point.properties.area = outputArea.toFixed(2);
				point.properties.unit = outputUnit;

				if (
					typeof geojsonSource.data !== 'string' &&
					geojsonSource.data.type === 'FeatureCollection'
				) {
					geojsonSource.data.features.push(point);
				}
				// update GeoJSON source with new data
				(this.map.getSource(this.polygonLayerSpec.source) as GeoJSONSource)?.setData(
					geojsonSource.data
				);
				this.map.moveLayer(this.polygonLayerSpec.id);
			}
		}
	}

	/**
	 * measure line distance for given feature ID
	 * @param id terradraw feature id
	 */
	private measureLine(id: string) {
		if (!this.map) return;
		const drawInstance = this.getTerraDrawInstance();
		if (!drawInstance) return;
		const snapshot = drawInstance.getSnapshot();
		const feature = snapshot?.find((f) => f.id === id && f.geometry.type === 'LineString');
		if (feature) {
			const geojsonSource: GeoJSONSourceSpecification = this.map.getStyle().sources[
				this.lineLayerLabelSpec.source
			] as GeoJSONSourceSpecification;
			if (geojsonSource) {
				const coordinates: number[][] = feature.geometry.coordinates as number[][];

				// delete old nodes
				if (
					typeof geojsonSource.data !== 'string' &&
					geojsonSource.data.type === 'FeatureCollection'
				) {
					geojsonSource.data.features = geojsonSource.data.features.filter(
						(f) => f.properties?.originalId !== id
					);
				}

				// calculate distance for each segment of LineString feature
				let totalDistance = 0;
				for (let i = 0; i < coordinates.length - 1; i++) {
					const start = coordinates[i];
					const end = coordinates[i + 1];
					const result = distance(start, end, { units: 'kilometers' });
					totalDistance += result;

					// segment
					const segment = JSON.parse(JSON.stringify(feature));
					segment.id = `${segment.id}-${i}`;
					segment.geometry.coordinates = [start, end];
					segment.properties.originalId = feature.id;
					segment.properties.distance = result.toFixed(2);
					segment.properties.total = totalDistance.toFixed(2);
					segment.properties.unit = 'km';

					if (
						typeof geojsonSource.data !== 'string' &&
						geojsonSource.data.type === 'FeatureCollection'
					) {
						geojsonSource.data.features.push(segment);
					}

					// node
					if (i === 0) {
						const startNode = JSON.parse(JSON.stringify(feature));
						startNode.id = `${segment.id}-node-${i}`;
						startNode.geometry = {
							type: 'Point',
							coordinates: start
						};
						startNode.properties.originalId = feature.id;
						startNode.properties.distance = 0;
						startNode.properties.total = 0;
						startNode.properties.unit = 'km';

						if (
							typeof geojsonSource.data !== 'string' &&
							geojsonSource.data.type === 'FeatureCollection'
						) {
							geojsonSource.data.features.push(startNode);
						}
					}
					const endNode = JSON.parse(JSON.stringify(feature));
					endNode.id = `${segment.id}-node-${i + 1}`;
					endNode.geometry = {
						type: 'Point',
						coordinates: end
					};
					endNode.properties.originalId = feature.id;
					endNode.properties.distance = result.toFixed(2);
					endNode.properties.total = totalDistance.toFixed(2);
					endNode.properties.unit = 'km';
					if (
						typeof geojsonSource.data !== 'string' &&
						geojsonSource.data.type === 'FeatureCollection'
					) {
						geojsonSource.data.features.push(endNode);
					}
				}

				// update GeoJSON source with new data
				(this.map.getSource(this.lineLayerLabelSpec.source) as GeoJSONSource)?.setData(
					geojsonSource.data
				);
				this.map.moveLayer(this.lineLayerLabelSpec.id);
				this.map.moveLayer(this.lineLayerNodeSpec.id);
			}
		}
	}

	/**
	 * Event definition when feature is deleted by terradraw
	 */
	private onFeatureDeleted() {
		if (!this.map) return;
		const drawInstance = this.getTerraDrawInstance();
		if (drawInstance) {
			const sourceIds = [this.lineLayerLabelSpec.source, this.polygonLayerSpec.source];
			for (const src of sourceIds) {
				const geojsonSource: GeoJSONSourceSpecification = this.map.getStyle().sources[
					src
				] as GeoJSONSourceSpecification;
				if (geojsonSource) {
					// get IDs in current TerraDraw snapshot
					const snapshot = drawInstance.getSnapshot();
					const features = snapshot?.filter((feature) =>
						['LineString', 'Polygon'].includes(feature.geometry.type)
					);
					const ids: string[] = features.map((f) => f.id as string);
					if (
						typeof geojsonSource.data !== 'string' &&
						geojsonSource.data.type === 'FeatureCollection'
					) {
						// Delete label features if originalId does not exist anymore.
						geojsonSource.data.features = geojsonSource.data.features.filter((f) =>
							ids.includes(f.properties?.originalId)
						);
					}
					if (src === this.lineLayerLabelSpec.source) {
						(this.map.getSource(this.lineLayerLabelSpec.source) as GeoJSONSource)?.setData(
							geojsonSource.data
						);
						if (this.map.getLayer(this.lineLayerNodeSpec.id)) {
							this.map.moveLayer(this.lineLayerNodeSpec.id);
						}
						if (this.map.getLayer(this.lineLayerLabelSpec.id)) {
							this.map.moveLayer(this.lineLayerLabelSpec.id);
						}
					} else if (src === this.polygonLayerSpec.source) {
						(this.map.getSource(this.polygonLayerSpec.source) as GeoJSONSource)?.setData(
							geojsonSource.data
						);
						if (this.map.getLayer(this.polygonLayerSpec.id)) {
							this.map.moveLayer(this.polygonLayerSpec.id);
						}
					}
				}
			}
		}
	}
}
