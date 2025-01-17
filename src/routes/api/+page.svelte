<script lang="ts">
	import { browser } from '$app/environment';
	import 'swagger-ui-dist/swagger-ui.css';
	import type { PageData } from './$types.js';
	import { onMount } from 'svelte';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();

	let swaggerDiv: HTMLDivElement | undefined = $state();

	onMount(async () => {
		if (swaggerDiv) {
			const { SwaggerUIBundle } = await import('swagger-ui-dist');
			SwaggerUIBundle({
				url: data.openapiJson,
				domNode: swaggerDiv,
				presets: [SwaggerUIBundle.presets.apis, SwaggerUIBundle.SwaggerUIStandalonePreset]
			});
		}
	});
</script>

{#if browser}
	<div bind:this={swaggerDiv}></div>
{/if}

<style global lang="scss">
	:global(.version) {
		background-color: hsla(0, 0%, 96%, 0) !important;
	}
</style>
