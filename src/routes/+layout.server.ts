import { exampleIds, getDescription, getPackageInfo, getTitle } from './helpers';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ fetch }) => {
	const packageInfo = await getPackageInfo();

	const examples = [];
	for (const item of exampleIds) {
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
			packageName: packageInfo.packageName,
			version: packageInfo.version,
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
