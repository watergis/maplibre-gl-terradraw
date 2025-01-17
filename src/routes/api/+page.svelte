<script lang="ts">
	import { browser } from '$app/environment';
	import { SwaggerUIBundle } from 'swagger-ui-dist';
	import 'swagger-ui-dist/swagger-ui.css';
	import type { PageData } from './$types.js';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();

	let swaggerDiv: HTMLDivElement | undefined = $state();

	$effect(() => {
		if (swaggerDiv) {
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
