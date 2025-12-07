import { exampleIds, getDescription, getPackageInfo, getTitle, getTags } from './helpers';
import type { LayoutServerLoad } from './$types';
import { env } from '$env/dynamic/private';

export const load: LayoutServerLoad = async ({ fetch }) => {
	const packageInfo = await getPackageInfo();

	const examples = [];
	for (const item of exampleIds) {
		const res = await fetch(`/api/examples/${item}`);
		if (!res.ok) continue;
		const html = await res.text();

		const title = getTitle(html);
		const tags = getTags(html);
		const description = getDescription(html);

		examples.push({
			href: `/examples/${item}`,
			title: title,
			tags: tags,
			image: `/assets/images/${item}.webp`,
			description: description
		});
	}

	examples.sort((a, b) => {
		return a.title.localeCompare(b.title);
	});

	const styles = [
		{
			title: 'Light',
			uri: `https://api.protomaps.com/styles/v5/light/en.json?key=${env.PROTOMAP_KEY}`,
			image: '/assets/style-switcher/light.webp'
		},
		{
			title: 'Dark',
			uri: `https://api.protomaps.com/styles/v5/dark/en.json?key=${env.PROTOMAP_KEY}`,
			image: '/assets/style-switcher/dark.webp'
		},
		{
			title: 'White',
			uri: `https://api.protomaps.com/styles/v5/white/en.json?key=${env.PROTOMAP_KEY}`,
			image: '/assets/style-switcher/white.webp'
		},
		{
			title: 'Grayscale',
			uri: `https://api.protomaps.com/styles/v5/grayscale/en.json?key=${env.PROTOMAP_KEY}`,
			image: '/assets/style-switcher/grayscale.webp'
		},
		{
			title: 'Black',
			uri: `https://api.protomaps.com/styles/v5/black/en.json?key=${env.PROTOMAP_KEY}`,
			image: '/assets/style-switcher/black.webp'
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
