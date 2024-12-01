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
			}
		],
		examples: [
			{
				href: '/examples/drawing-option',
				title: 'Customise drawing options',
				image: '/assets/images/customise-draw-option.webp',
				description:
					'Change default drawing options to disable some editing functionalities of polygon mode.'
			},
			{
				href: '/examples/select-event',
				title: 'Subscribe select event of TerraDraw',
				image: '/assets/images/subscribe-selectevent.webp',
				description: 'Use TerraDraw API to subscribe an event.'
			},
			{
				href: '/examples/add-geojson',
				title: 'Adding default GeoJSON feature to TerraDraw',
				image: '/assets/images/add-geojson.webp',
				description: 'Add GeoJSON features to TerraDraw as default by using addFeatures function.'
			},
			{
				href: '/examples/measure-distance',
				title: 'Measure the distance of line',
				image: '/assets/images/measure-distance.webp',
				description: 'Measure the distance of line feature added by terradraw.'
			}
		]
	};
};
