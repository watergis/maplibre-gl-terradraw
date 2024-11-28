<script lang="ts">
	import MaplibreTerradrawControl from '$lib/index.js';
	import { TerraDrawSelectMode } from 'terra-draw';
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
	// only show polgyon, select, delete mode.
	modes: ['polygon', 'select', 'delete'],
	open: true,
	modeOptions: {
		select: new TerraDrawSelectMode({
			flags: {
				// only update polygon settings for select mode.
				// default settings will be used for other geometry types
				// in this case, line uses default options of the plugin.
				polygon: {
					feature: {
						draggable: false, // users cannot drag to move polygon
						rotateable: true,
						scaleable: true,
						coordinates: {
							midpoints: false, // users cannot add a node on the middle of edge.
							draggable: true,
							deletable: false // users cannot delete a node.
						}
					}
				}
			}
		})
	}
});
map.addControl(drawControl, 'top-left');
	`;

	const setTerradraw = (map: Map) => {
		const drawControl = new MaplibreTerradrawControl({
			modes: ['polygon', 'select', 'delete'],
			open: true,
			modeOptions: {
				select: new TerraDrawSelectMode({
					flags: {
						polygon: {
							feature: {
								draggable: false,
								rotateable: true,
								scaleable: true,
								coordinates: {
									midpoints: false,
									draggable: true,
									deletable: false
								}
							}
						}
					}
				})
			}
		});
		map.addControl(drawControl, 'top-left');
	};
</script>

<MapTemplate {style} {setTerradraw} {code}>
	{#snippet title()}
		Customising drawing options
	{/snippet}

	{#snippet description()}
		<p>
			This plugin tries to optimise the better drawing options for each Terra Draw mode. However,
			preconfigured drawing options might not be desired for your app.
		</p>
		<p>
			For example, if you only want to use polygon control,but you don't want users to drag a
			polygon or adding/deleting a node on an edge of a polygon, the following setting can be done.
		</p>
	{/snippet}
</MapTemplate>
