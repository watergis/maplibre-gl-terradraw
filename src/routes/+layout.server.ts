import { exampleIds, getDescription, getPackageInfo, getTitle, getTags } from './helpers';
import type { LayoutServerLoad } from './$types';
import { env } from '$env/dynamic/private';
import authorsJson from './authors.json';

export type AuthorsMap = Record<string, string>;

export const load: LayoutServerLoad = async ({ fetch }) => {
	const authors = authorsJson as AuthorsMap;

	const packageInfo = await getPackageInfo();

	const examples = [];
	for (const item of exampleIds) {
		const res = await fetch(`/api/examples/${item}`);
		if (!res.ok) continue;
		const html = await res.text();

		const title = getTitle(html);
		const tags = getTags(html);
		const description = getDescription(html);
		const author = authors[item] ?? packageInfo.author.name;

		examples.push({
			href: `/examples/${item}`,
			title: title,
			tags: tags,
			image: `/assets/images/${item}.webp`,
			description: description,
			author: author
		});
	}

	examples.sort((a, b) => {
		return a.title.localeCompare(b.title);
	});

	const PROTOMAP_KEY = env.PROTOMAP_KEY ? `?key=${env.PROTOMAP_KEY}` : '';

	const styles = [
		{
			title: 'Light',
			uri: `https://api.protomaps.com/styles/v5/light/en.json${PROTOMAP_KEY}`,
			image: '/assets/style-switcher/light.webp'
		},
		{
			title: 'Dark',
			uri: `https://api.protomaps.com/styles/v5/dark/en.json${PROTOMAP_KEY}`,
			image: '/assets/style-switcher/dark.webp'
		},
		{
			title: 'White',
			uri: `https://api.protomaps.com/styles/v5/white/en.json${PROTOMAP_KEY}`,
			image: '/assets/style-switcher/white.webp'
		},
		{
			title: 'Grayscale',
			uri: `https://api.protomaps.com/styles/v5/grayscale/en.json${PROTOMAP_KEY}`,
			image: '/assets/style-switcher/grayscale.webp'
		},
		{
			title: 'Black',
			uri: `https://api.protomaps.com/styles/v5/black/en.json${PROTOMAP_KEY}`,
			image: '/assets/style-switcher/black.webp'
		}
	];

	return {
		metadata: {
			packageName: packageInfo.packageName,
			version: packageInfo.version,
			title: packageInfo.displayName,
			description: packageInfo.description,
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
