import type { PageServerLoad } from './$types.js';

export const load: PageServerLoad = async () => {
	return {
		title: 'Examples',
		description: 'Show cases how to use maplibre-gl-terradraw plugin.',
		socialImage: '/assets/plugin-overview.png',
		breadcrumbs: [
			{
				href: '/',
				title: 'Home'
			},
			{
				href: '/examples',
				title: 'Examples'
			}
		]
	};
};
