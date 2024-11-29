import type { PageServerLoad } from './$types.js';

export const load: PageServerLoad = async () => {
	return {
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
			}
		]
	};
};
