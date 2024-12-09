import type { LayoutServerLoad } from './$types.js';

export const load: LayoutServerLoad = async () => {
	const packageName = '@watergis/maplibre-gl-terradraw';

	const getVersion = async () => {
		const res = await fetch(`https://registry.npmjs.org/${packageName}/latest`);
		if (!res.ok) {
			return;
		}
		const json = await res.json();
		return json.version;
	};

	const version = await getVersion();

	return {
		metadata: {
			packageName: packageName,
			version,
			title: 'Maplibre GL Terra Draw',
			description:
				'This plugin is to add controls to your Maplibre for drawing powered by Terra Draw library.',
			author: 'JinIgarashi',
			licenses: [
				'The source code is licensed MIT',
				'The website content is licensed CC BY NC SA 4.0.'
			]
		},
		style: 'https://demotiles.maplibre.org/style.json',
		nav: [
			{ href: 'https://twitter.com/j_igarashi', icon: 'fa-brands fa-x-twitter' },
			{
				href: 'https://github.com/watergis/maplibre-gl-terradraw',
				icon: 'fa-brands fa-github'
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
				description: 'Measure line and polygon with MeasureControl'
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

export const prerender = true;
export const ssr = false;
