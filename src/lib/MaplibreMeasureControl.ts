import type {
	GeoJSONSource,
	GeoJSONSourceSpecification,
	Map,
	SymbolLayerSpecification
} from 'maplibre-gl';
import { MaplibreTerradrawControl } from './MaplibreTerradrawControl.js';
import { distance } from '@turf/distance';
import { area } from '@turf/area';
import { centroid } from '@turf/centroid';
import { defaultMeasureControlOptions } from './constants/defaultControlOptions.js';
import type { MeasureControlOptions } from './interfaces/MeasureControlOptions.js';

/**
 * Maplibre GL Terra Draw Measure Control
 */
export class MaplibreMeasureControl extends MaplibreTerradrawControl {
	private linelayerSpec: SymbolLayerSpecification;
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
			open: measureOptions.open
		});
		this.linelayerSpec = measureOptions.linelayerSpec as SymbolLayerSpecification;
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

		// add GeoJSON source for distance label
		if (!this.map.getSource(this.linelayerSpec.source)) {
			this.map.addSource(this.linelayerSpec.source, {
				type: 'geojson',
				data: { type: 'FeatureCollection', features: [] }
			});
		}

		// add GeoJSON layer for distance label appearance
		if (!this.map.getLayer(this.linelayerSpec.id)) {
			this.map.addLayer(this.linelayerSpec);
		}

		// add GeoJSON source for distance label
		if (!this.map.getSource(this.polygonLayerSpec.source)) {
			this.map.addSource(this.polygonLayerSpec.source, {
				type: 'geojson',
				data: { type: 'FeatureCollection', features: [] }
			});
		}

		// add GeoJSON layer for polygon area label appearance
		if (!this.map.getLayer(this.polygonLayerSpec.id)) {
			this.map.addLayer(this.polygonLayerSpec);
		}

		const drawInstance = this.getTerraDrawInstance();
		if (drawInstance) {
			// subscribe finish event of TerraDraw to calc distance
			drawInstance.on('finish', (id) => {
				if (!this.map) return;
				const drawInstance = this.getTerraDrawInstance();
				if (!drawInstance) return;
				const snapshot = drawInstance.getSnapshot();
				const feature = snapshot?.find((f) => f.id === id);
				const geometryType = feature.geometry.type;
				if (geometryType === 'LineString') {
					this.measureLine(id);
				} else if (geometryType === 'Polygon') {
					this.measurePolygon(id);
				}
			});

			// subscribe feature-deleted event for the plugin control
			this.on('feature-deleted', this.onFeatureDeleted.bind(this));
		}
	}

	/**
	 * Unregister measure control related maplibre sources and layers
	 */
	private unregisterMesureControl() {
		this.off('feature-deleted', this.onFeatureDeleted.bind(this));
		if (!this.map) return;
		if (this.map.getLayer(this.linelayerSpec.id)) {
			this.map.removeLayer(this.linelayerSpec.id);
		}
		if (this.map.getLayer(this.polygonLayerSpec.id)) {
			this.map.removeLayer(this.polygonLayerSpec.id);
		}
		if (this.map.getSource(this.linelayerSpec.source)) {
			this.map.removeSource(this.linelayerSpec.source);
		}
		if (this.map.getSource(this.polygonLayerSpec.source)) {
			this.map.removeSource(this.polygonLayerSpec.source);
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
				this.linelayerSpec.source
			] as GeoJSONSourceSpecification;
			if (geojsonSource) {
				const coordinates: number[][] = feature.geometry.coordinates;

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
				(this.map.getSource(this.linelayerSpec.source) as GeoJSONSource)?.setData(
					geojsonSource.data
				);
				this.map.moveLayer(this.linelayerSpec.id);
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
			const geojsonSource: GeoJSONSourceSpecification = this.map.getStyle().sources[
				(this.linelayerSpec.source, this.polygonLayerSpec.source)
			] as GeoJSONSourceSpecification;
			if (geojsonSource) {
				// get IDs in current TerraDraw snapshot
				const snapshot = drawInstance.getSnapshot();
				const features = snapshot?.filter((feature) =>
					['LineString', 'Polygon'].includes(feature.geometry.type)
				);
				const ids: string[] = features.map((f) => f.id);
				if (
					typeof geojsonSource.data !== 'string' &&
					geojsonSource.data.type === 'FeatureCollection'
				) {
					// Delete label features if originalId does not exist anymore.
					geojsonSource.data.features = geojsonSource.data.features.filter((f) =>
						ids.includes(f.properties?.originalId)
					);
				}
				(this.map.getSource(this.linelayerSpec.source) as GeoJSONSource)?.setData(
					geojsonSource.data
				);
				(this.map.getSource(this.polygonLayerSpec.source) as GeoJSONSource)?.setData(
					geojsonSource.data
				);
				this.map.moveLayer(this.linelayerSpec.id);
				this.map.moveLayer(this.polygonLayerSpec.id);
			}
		}
	}
}
