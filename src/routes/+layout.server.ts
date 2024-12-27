import type { LayoutServerLoad } from './$types.js';

const getTitle = (body: string) => {
	const match = body.match(/<title>([^<]*)<\/title>/);
	if (!match || typeof match[1] !== 'string') return '';
	return match[1];
};

const getDescription = (body: string) => {
	const match = body.match(/<meta\s+property="og:description"\s+content="([^"]+)"\s*\/?>/);
	if (!match || typeof match[1] !== 'string') return '';
	return match[1];
};

export const load: LayoutServerLoad = async ({ fetch }) => {
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

	const items = ['measure-control', 'add-geojson', 'select-event', 'drawing-option'];
	const examples = [];
	for (const item of items) {
		const res = await fetch(`/api/examples/${item}`);
		if (!res.ok) continue;
		const html = await res.text();

		const title = getTitle(html);
		const description = getDescription(html);

		examples.push({
			href: `/examples/${item}`,
			title: title,
			image: `/assets/images/${item}.webp`,
			description: description
		});
	}

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
		examples: examples
	};
};
