<script lang="ts">
	import MaplibreTerradrawControl from '$lib/index.js';
	import MapTemplate from '../MapTemplate.svelte';
	import type { PageData } from './$types.js';
	import { Map } from 'maplibre-gl';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();

	let style = data.style;

	const code = `
const drawControl = new MaplibreTerradrawControl({
	modes: ['polygon', 'select'],
	open: true
});
map.addControl(drawControl, 'top-left');

// geojson features should be added after style is being loaded.
map.once('load', () => {
	const drawInstance = drawControl.getTerraDrawInstance();
	if (drawInstance) {
		// geojson data to be added
		const geojson = {
			// id must be unique (uuid is recommended)
			id: '23d1a5b7-fb80-4310-befc-d48af8d42007',
			type: 'Feature',
			geometry: {
				type: 'Polygon',
				coordinates: [
					[
						[9.095279849, 31.437112592],
						[40.664336241, 31.437112592],
						[40.664336241, 13.509421612],
						[9.095279849, 13.509421612],
						[9.095279849, 31.437112592]
					]
				]
			},
			properties: {
				mode: 'polygon' // set mode option for this feature
			}
		};
		drawInstance.addFeatures([geojson]);
	}
});
	`;

	const setTerradraw = (map: Map) => {
		const drawControl = new MaplibreTerradrawControl({
			modes: ['polygon', 'select'],
			open: true
		});
		map.addControl(drawControl, 'top-left');

		map.once('load', () => {
			const drawInstance = drawControl.getTerraDrawInstance();
			if (drawInstance) {
				const geojson = {
					id: '23d1a5b7-fb80-4310-befc-d48af8d42007',
					type: 'Feature',
					geometry: {
						type: 'Polygon',
						coordinates: [
							[
								[9.095279849, 31.437112592],
								[40.664336241, 31.437112592],
								[40.664336241, 13.509421612],
								[9.095279849, 13.509421612],
								[9.095279849, 31.437112592]
							]
						]
					},
					properties: {
						mode: 'polygon'
					}
				};

				drawInstance.addFeatures([geojson]);
			}
		});
	};
</script>

<MapTemplate {style} {setTerradraw} {code}>
	{#snippet title()}
		Adding default GeoJSON feature to TerraDraw
	{/snippet}

	{#snippet description()}
		<p>
			You can add GeoJSON features by using addFeatures() function in the TerraDraw instance which
			can be retrieved through getTerraDrawInstance() function.
		</p>
	{/snippet}
</MapTemplate>
