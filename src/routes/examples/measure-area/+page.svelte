<script lang="ts">
	import MaplibreTerradrawControl from '$lib/index.js';
	import { CodeBlock } from '@skeletonlabs/skeleton';
	import MapTemplate from '../MapTemplate.svelte';
	import type { PageData } from './$types.js';
	import {
		GeoJSONSource,
		Map,
		type GeoJSONSourceSpecification,
		type SymbolLayerSpecification
	} from 'maplibre-gl';
	import { area } from '@turf/area';
	import { centroid } from '@turf/centroid';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();

	let style = data.style;

	let selectedFeature = $state('');

	const code = `
const drawControl = new MaplibreTerradrawControl({
	modes: ['polygon', 'circle', 'delete'],
	open: true
});
map.addControl(drawControl, 'top-left');

map.once('load', () => {
	const source: GeoJSONSourceSpecification = {
		type: 'geojson',
		data: { type: 'FeatureCollection', features: [] }
	};

	// add GeoJSON source for distance label
	if (!map.getSource(sourceId)) {
		map.addSource(sourceId, source);
	}

	// add GeoJSON layer for distance label appearance
	const layer: SymbolLayerSpecification = {
		id: layerId,
		type: 'symbol',
		source: sourceId,
		filter: ['match', ['geometry-type'], ['Point'], true, false],
		layout: {
			'text-field': ['concat', ['to-string', ['get', 'area']], ' ', ['get', 'unit']],
			'symbol-placement': 'point',
			'text-font': ['Open Sans Semibold'],
			'text-size': 12,
			'text-overlap': 'always'
		},
		paint: {
			'text-halo-color': '#ffffff',
			'text-halo-width': 1,
			'text-color': '#ff0000'
		}
	};
	if (!map.getLayer(layer.id)) {
		map.addLayer(layer);
	}

	const drawInstance = drawControl.getTerraDrawInstance();
	if (drawInstance) {
		// subscribe finish event of TerraDraw to calc distance
		drawInstance.on('finish', (id) => {
			const snapshot = drawInstance.getSnapshot();
			const feature = snapshot?.find((f) => f.id === id && f.geometry.type === 'Polygon');
			if (feature) {
				const geojsonSource: GeoJSONSourceSpecification = map.getStyle().sources[
					sourceId
				] as GeoJSONSourceSpecification;
				if (geojsonSource) {
					// caculate area in m2 by using turf/area
					const result = area(feature.geometry);
					const point = JSON.parse(JSON.stringify(feature));
					point.id = point.id + "-area-label";
					point.geometry = centroid(feature.geometry).geometry;
					point.properties.originalId = feature.id;

					// convert unit to ha or km2 if value is larger
					let outputArea = result;
					let outputUnit = 'm2'
					if (result > 10000) {
						outputArea = result / 10000
						outputUnit = 'ha'
					} else if (result > 1000) {
						outputArea = result / 1000
						outputUnit = 'km2'
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
					(map.getSource(sourceId) as GeoJSONSource)?.setData(geojsonSource.data);
					map.moveLayer(layerId);
				}
			}
		});

		// subscribe feature-deleted event for the plugin control
		drawControl.on('feature-deleted', () => {
			const geojsonSource: GeoJSONSourceSpecification = map.getStyle().sources[
				sourceId
			] as GeoJSONSourceSpecification;
			if (geojsonSource) {
				// get IDs in current TerraDraw snapshot
				const snapshot = drawInstance.getSnapshot();
				const features = snapshot?.filter((feature) => feature.geometry.type === 'Polygon');
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
				(map.getSource(sourceId) as GeoJSONSource)?.setData(geojsonSource.data);
				map.moveLayer(layerId);
			}
		});
	}
});
	`;

	const sourceId = 'terradraw-measure-source';
	const layerId = 'terradraw-measure-polygon-label';

	const setTerradraw = (map: Map) => {
		const drawControl = new MaplibreTerradrawControl({
			modes: ['polygon', 'circle', 'delete'],
			open: true
		});
		map.addControl(drawControl, 'top-left');

		map.once('load', () => {
			const source: GeoJSONSourceSpecification = {
				type: 'geojson',
				data: { type: 'FeatureCollection', features: [] }
			};

			// add GeoJSON source for distance label
			if (!map.getSource(sourceId)) {
				map.addSource(sourceId, source);
			}

			// add GeoJSON layer for distance label appearance
			const layer: SymbolLayerSpecification = {
				id: layerId,
				type: 'symbol',
				source: sourceId,
				filter: ['match', ['geometry-type'], ['Point'], true, false],
				layout: {
					'text-field': ['concat', ['to-string', ['get', 'area']], ' ', ['get', 'unit']],
					'symbol-placement': 'point',
					'text-font': ['Open Sans Semibold'],
					'text-size': 12,
					'text-overlap': 'always'
				},
				paint: {
					'text-halo-color': '#ffffff',
					'text-halo-width': 1,
					'text-color': '#ff0000'
				}
			};
			if (!map.getLayer(layer.id)) {
				map.addLayer(layer);
			}

			const drawInstance = drawControl.getTerraDrawInstance();
			if (drawInstance) {
				// subscribe finish event of TerraDraw to calc distance
				drawInstance.on('finish', (id) => {
					const snapshot = drawInstance.getSnapshot();
					const feature = snapshot?.find((f) => f.id === id && f.geometry.type === 'Polygon');
					if (feature) {
						const geojsonSource: GeoJSONSourceSpecification = map.getStyle().sources[
							sourceId
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
							(map.getSource(sourceId) as GeoJSONSource)?.setData(geojsonSource.data);
							map.moveLayer(layerId);
						}
					}
				});

				// subscribe feature-deleted event for the plugin control
				drawControl.on('feature-deleted', () => {
					const geojsonSource: GeoJSONSourceSpecification = map.getStyle().sources[
						sourceId
					] as GeoJSONSourceSpecification;
					if (geojsonSource) {
						// get IDs in current TerraDraw snapshot
						const snapshot = drawInstance.getSnapshot();
						const features = snapshot?.filter((feature) => feature.geometry.type === 'Polygon');
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
						(map.getSource(sourceId) as GeoJSONSource)?.setData(geojsonSource.data);
						map.moveLayer(layerId);
					}
				});
			}
		});
	};
</script>

<MapTemplate {style} {setTerradraw} {code}>
	{#snippet title()}
		Measure area of polygon feature
	{/snippet}

	{#snippet description()}
		<p>
			This example shows how you can calculate area by using
			<a
				href="https://turfjs.org/docs/api/area"
				target="_blank"
				class="text-blue-600 visited:text-purple-600">turf/area</a
			> when you input a polygon by TerraDraw line mode.
		</p>

		{#if selectedFeature}
			<label class="label">
				<span class="font-bold">Selected feature</span>
				<CodeBlock language="json" lineNumbers code={selectedFeature} />
			</label>
		{/if}
	{/snippet}
</MapTemplate>
