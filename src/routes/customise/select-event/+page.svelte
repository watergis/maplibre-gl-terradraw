<script lang="ts">
	import MaplibreTerradrawControl from '$lib/index.js';
	import { CodeBlock } from '@skeletonlabs/skeleton';
	import MapTemplate from '../MapTemplate.svelte';
	import type { PageData } from './$types.js';
	import { Map } from 'maplibre-gl';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();

	let style = data.style;

	let selectedFeature = $state('');

	const code = `
const drawControl = new MaplibreTerradrawControl({
	modes: ['polygon', 'select', 'delete'],
	open: true
});
map.addControl(drawControl, 'top-left');

// You can get Terra Draw instance by the following function.
const drawInstance = drawControl.getTerraDrawInstance();
if (drawInstance) {
	// You can add event listener to subscribe Terra Draw event as you wish.
	// The below example is to subscribe 'select' event of Terra Draw.
	drawInstance.on('select', (id: string) => {
		const snapshot = drawInstance.getSnapshot();
		const features = snapshot?.find((feature) => feature.id === id);
		console.log(features)
	});
}
	`;

	const setTerradraw = (map: Map) => {
		const drawControl = new MaplibreTerradrawControl({
			modes: ['polygon', 'select', 'delete'],
			open: true
		});
		map.addControl(drawControl, 'top-left');

		const drawInstance = drawControl.getTerraDrawInstance();
		if (drawInstance) {
			drawInstance.on('select', (id: string) => {
				const snapshot = drawInstance.getSnapshot();
				const features = snapshot?.find((feature) => feature.id === id);
				selectedFeature = JSON.stringify(features);
			});
		}
	};
</script>

<MapTemplate {style} {setTerradraw} {code}>
	{#snippet title()}
		Subscribe select event of TerraDraw
	{/snippet}

	{#snippet description()}
		<p>
			This plugin provides a function <b>getTerraDrawInstance</b> to fetch the instance of TerraDraw
			itself. Using this instance, you can use all APIs supported by TerraDaraw.
		</p>
		<p>
			For example, the below code is to subscribe TerraDraw's select event to show selected feature
			as GeoJSON string.
		</p>

		{#if selectedFeature}
			<label class="label">
				<span class="font-bold">Selected feature</span>
				<CodeBlock language="json" lineNumbers code={selectedFeature} />
			</label>
		{/if}
	{/snippet}
</MapTemplate>
