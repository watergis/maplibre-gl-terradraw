<script lang="ts">
	import { getDefaultModeOptions, MaplibreTerradrawControl } from '$lib/index.js';
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
	modes: ['rectangle', 'select'],
	open: true
});
map.addControl(drawControl, 'top-left');

// geojson features should be added after style is being loaded.
map.once('load', () => {
	const drawInstance = drawControl.getTerraDrawInstance();
	if (drawInstance) {
		// geojson data to be added
		const geojson = [
			{
				id: '6b438f48-f6da-4649-9212-76f5a1506296',
				type: 'Feature',
				geometry: {
					type: 'Polygon',
					coordinates: [
						[
							[26.938972246, 25.217617825],
							[-4.045232861, 25.217617825],
							[-4.045232861, -7.839055615],
							[26.938972246, -7.839055615],
							[26.938972246, 25.217617825]
						]
					]
				},
				properties: {
					mode: 'rectangle',
					selected: true
				}
			}
		];
		drawInstance?.addFeatures(geojson);
	}
});
	`;

	const setTerradraw = (map: Map) => {
		const drawControl = new MaplibreTerradrawControl({
			modes: ['rectangle', 'select'],
			open: true,
			modeOptions: getDefaultModeOptions()
		});
		map.addControl(drawControl, 'top-left');

		const drawInstance = drawControl.getTerraDrawInstance();

		map.once('load', () => {
			const geojson = [
				{
					id: '6b438f48-f6da-4649-9212-76f5a1506296',
					type: 'Feature',
					geometry: {
						type: 'Polygon',
						coordinates: [
							[
								[26.938972246, 25.217617825],
								[-4.045232861, 25.217617825],
								[-4.045232861, -7.839055615],
								[26.938972246, -7.839055615],
								[26.938972246, 25.217617825]
							]
						]
					},
					properties: {
						mode: 'rectangle',
						selected: true
					}
				}
			];
			drawInstance?.addFeatures(geojson);
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
