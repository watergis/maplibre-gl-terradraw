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
		customization: [
			{
				href: '/customise/drawing-option',
				title: 'Customise drawing options',
				description:
					'Change default drawing options to disable some editing functionalities of polygon mode.'
			},
			{
				href: '/customise/select-event',
				title: 'Subscribe select event of TerraDraw',
				description: 'Use TerraDraw API to subscribe an event.'
			},
			{
				href: '/customise/add-geojson',
				title: 'Adding default GeoJSON feature to TerraDraw',
				description: 'Add GeoJSON features to TerraDraw as default by using addFeatures function.'
			}
		],
		nav: [
			{ href: 'https://twitter.com/j_igarashi', icon: 'fa-brands fa-x-twitter' },
			{
				href: 'https://github.com/watergis/maplibre-gl-terradraw',
				icon: 'fa-brands fa-github'
			}
		]
	};
};

export const prerender = true;
export const ssr = false;
