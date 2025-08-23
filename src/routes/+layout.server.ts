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

	const styles = [
		{
			title: 'Voyager',
			uri: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
			image: '/assets/style-switcher/voyager.webp'
		},
		{
			title: 'Positron',
			uri: 'https://tiles.basemaps.cartocdn.com/gl/positron-gl-style/style.json',
			image: '/assets/style-switcher/positron.webp'
		},
		{
			title: 'Dark',
			uri: 'https://tiles.basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
			image: '/assets/style-switcher/dark.webp'
		},
		{
			title: 'Maplibre',
			uri: 'https://demotiles.maplibre.org/style.json',
			image: '/assets/style-switcher/maplibre.webp'
		}
	];

	return {
		metadata: {
			packageName: packageInfo.packageName,
			version: packageInfo.version,
			title: 'Maplibre GL Terra Draw',
			description:
				'This plugin is to add controls to your Maplibre for drawing powered by Terra Draw library.',
			author: 'Jin Igarashi',
			contact: 'https://jin-igarashi.me'
		},
		styles: styles,
		nav: [
			{ href: 'https://twitter.com/j_igarashi', icon: 'twitter' },
			{
				href: 'https://github.com/watergis/maplibre-gl-terradraw',
				icon: 'github'
			}
		],
		examples: examples
	};
};
