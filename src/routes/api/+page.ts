import type { PageLoad } from './$types.js';

export const load: PageLoad = async () => {
	return {
		title: 'MaplibreGL TerraDraw docs API',
		description: 'Playground maplibre-gl-terradraw',
		socialImage: 'API documentation for MaplibreGL TerraDraw website',
		openapiJson: '/api/openapi.json'
	};
};
