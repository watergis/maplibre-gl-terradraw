import type { LayoutLoad } from './$types.js';

export const load: LayoutLoad = async () => {
	const data = {
		metadata: {
			packageName: '@watergis/maplibre-gl-terradraw',
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
			{ href: 'https://twitter.com/j_igarashi', title: 'Twitter' },
			{ href: 'https://github.com/watergis/maplibre-gl-terradraw', title: 'GitHub' }
		]
	};
	return data;
};

export const prerender = true;
export const ssr = false;
