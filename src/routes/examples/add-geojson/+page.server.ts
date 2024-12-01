import type { PageServerLoad } from './$types.js';

export const load: PageServerLoad = async () => {
	return {
		breadcrumbs: [
			{
				href: '/',
				title: 'Home'
			},
			{
				href: '/examples',
				title: 'Examples'
			},
			{
				href: '/examples/add-geojson',
				title: 'Add GeoJSON'
			}
		]
	};
};
