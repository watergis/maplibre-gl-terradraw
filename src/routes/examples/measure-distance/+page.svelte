<script lang="ts">
	import { getDefaultModeOptions, MaplibreTerradrawControl } from '$lib/index.js';
	import { CodeBlock } from '@skeletonlabs/skeleton';
	import MapTemplate from '../MapTemplate.svelte';
	import type { PageData } from './$types.js';
	import {
		GeoJSONSource,
		Map,
		type GeoJSONSourceSpecification,
		type SymbolLayerSpecification
	} from 'maplibre-gl';
	import { distance } from '@turf/distance';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();

	let style = data.style;

	let selectedFeature = $state('');

	const code = `
const drawControl = new MaplibreTerradrawControl({
	modes: ['linestring',  'delete'],
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
		filter: ['match', ['geometry-type'], ['LineString'], true, false],
		layout: {
			'text-field': ['concat', ['to-string', ['get', 'distance']], ' ', ['get', 'unit']],
			'symbol-placement': 'line',
			'text-font': ['Open Sans Semibold'],
			'text-size': 12,
			'text-overlap': 'always',
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
			const feature = snapshot?.find((f) => f.id === id && f.properties.mode === 'linestring');
			if (feature) {
				const geojsonSource: GeoJSONSourceSpecification = map.getStyle().sources[
					sourceId
				] as GeoJSONSourceSpecification;
				if (geojsonSource) {
					const coordinates: number[][] = feature.geometry.coordinates;

					// calculate distance for each segment of LineString feature
					for (let i = 0; i < coordinates.length - 1; i++) {
						const start = coordinates[i];
						const end = coordinates[i + 1];
						const result = distance(start, end, { units: 'kilometers' });

						const segment = JSON.parse(JSON.stringify(feature));
						segment.id = segment.id + i.toString();
						segment.geometry.coordinates = [start, end];
						segment.properties.originalId = feature.id;
						segment.properties.distance = result.toFixed(2);
						segment.properties.unit = 'km';

						if (
							typeof geojsonSource.data !== 'string' &&
							geojsonSource.data.type === 'FeatureCollection'
						) {
							geojsonSource.data.features.push(segment);
						}
					}

					// update GeoJSON source with new data
					(map.getSource(sourceId) as GeoJSONSource)?.setData(geojsonSource.data);
					map.moveLayer(layerId);
				}
			}
		});

		// subscribe delete event for the plugin control
		drawControl.on('delete', () => {
			const geojsonSource: GeoJSONSourceSpecification = map.getStyle().sources[
				sourceId
			] as GeoJSONSourceSpecification;
			if (geojsonSource) {
				// get IDs in current TerraDraw snapshot
				const snapshot = drawInstance.getSnapshot();
				const features = snapshot?.filter(
					(feature) => feature.properties.mode === 'linestring'
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
				(map.getSource(sourceId) as GeoJSONSource)?.setData(geojsonSource.data);
				map.moveLayer(layerId);
			}
		});
	}
});
	`;

	const sourceId = 'terradraw-measure-source';
	const layerId = 'terradraw-measure-line-label';

	const setTerradraw = (map: Map) => {
		const drawControl = new MaplibreTerradrawControl({
			modes: ['linestring', 'delete'],
			open: true,
			modeOptions: getDefaultModeOptions()
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
				filter: ['match', ['geometry-type'], ['LineString'], true, false],
				layout: {
					'text-field': ['concat', ['to-string', ['get', 'distance']], ' ', ['get', 'unit']],
					'symbol-placement': 'line',
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
					const feature = snapshot?.find((f) => f.id === id && f.properties.mode === 'linestring');
					if (feature) {
						const geojsonSource: GeoJSONSourceSpecification = map.getStyle().sources[
							sourceId
						] as GeoJSONSourceSpecification;
						if (geojsonSource) {
							const coordinates: number[][] = feature.geometry.coordinates;

							// calculate distance for each segment of LineString feature
							for (let i = 0; i < coordinates.length - 1; i++) {
								const start = coordinates[i];
								const end = coordinates[i + 1];
								const result = distance(start, end, { units: 'kilometers' });

								const segment = JSON.parse(JSON.stringify(feature));
								segment.id = `${segment.id}-${i}`;
								segment.geometry.coordinates = [start, end];
								segment.properties.originalId = feature.id;
								segment.properties.distance = result.toFixed(2);
								segment.properties.unit = 'km';

								if (
									typeof geojsonSource.data !== 'string' &&
									geojsonSource.data.type === 'FeatureCollection'
								) {
									geojsonSource.data.features.push(segment);
								}
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
						const features = snapshot?.filter(
							(feature) => feature.properties.mode === 'linestring'
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
		Measure distance of line feature
	{/snippet}

	{#snippet description()}
		<p>
			This example shows how you can calculate distance by using
			<a
				href="https://turfjs.org/docs/api/distance"
				target="_blank"
				class="text-blue-600 visited:text-purple-600">turf/distance</a
			> when you input a linestring by TerraDraw line mode.
		</p>

		{#if selectedFeature}
			<label class="label">
				<span class="font-bold">Selected feature</span>
				<CodeBlock language="json" lineNumbers code={selectedFeature} />
			</label>
		{/if}
	{/snippet}
</MapTemplate>
