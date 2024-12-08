<script lang="ts">
	import { MaplibreMeasureControl } from '$lib/index.js';
	import MapTemplate from '../MapTemplate.svelte';
	import type { PageData } from './$types.js';
	import { Map } from 'maplibre-gl';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();

	let style = data.style;

	const code = `
// select TerraDraw modes you want to add. All TerraDraw modes except point are supported. select and delete-selection are not supported by MeasureControl
const drawControl = new MaplibreMeasureControl({
	modes: [
		'linestring',
		'polygon',
		'rectangle',
		'angled-rectangle',
		'circle',
		'sector',
		'sensor',
		'freehand',
		'delete'
	],
	open: true
});
map.addControl(drawControl, 'top-left');
	`;

	const setTerradraw = (map: Map) => {
		const drawControl = new MaplibreMeasureControl({
			modes: [
				'linestring',
				'polygon',
				'rectangle',
				'angled-rectangle',
				'circle',
				'sector',
				'sensor',
				'freehand',
				'delete'
			],
			open: true
		});
		map.addControl(drawControl, 'top-left');
	};
</script>

<MapTemplate {style} {setTerradraw} {code}>
	{#snippet title()}
		Measure area of polygon feature
	{/snippet}

	{#snippet description()}
		<p>
			This example shows how you can calculate length of line and area of polygon by using <b
				>MaplibreMeasureControl</b
			> when you input a line or a polygon.
		</p>
	{/snippet}
</MapTemplate>
