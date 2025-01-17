import type { PageServerLoad } from './$types.js';

export const load: PageServerLoad = async () => {
	return {
		title: 'MaplibreGL TerraDraw docs API',
		description: 'Playground maplibre-gl-terradraw',
		socialImage: 'API documentation for MaplibreGL TerraDraw website',
		openapiJson: '/api/openapi.json'
	};
};
