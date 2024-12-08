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
				href: '/examples/measure-control',
				title: 'Measure line and polygon with measure control',
				image: '/assets/images/measure-control.webp',
				description: 'Measure line and polygon with MaplibreMeasureControl'
			},
			{
				href: '/examples/measure-distance',
				title: 'Measure distance of line with default control',
				image: '/assets/images/measure-distance.webp',
				description: 'Measure distance of line feature added by terradraw.'
			},
			{
				href: '/examples/measure-area',
				title: 'Measure area of polygon with default control',
				image: '/assets/images/measure-area.webp',
				description: 'Measure area of polygon feature added by terradraw.'
			}
		]
	};
};
