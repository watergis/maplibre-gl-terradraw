import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch, parent }) => {
	const { metadata, style } = await parent();

	const getExample = async (type: 'cdn' | 'npm') => {
		if (type === 'cdn') {
			const res = await fetch(`/assets/maplibre-cdn-example.txt`);
			const text = await res.text();
			return text.replace(
				/..\/..\//g,
				`https://cdn.jsdelivr.net/npm/${metadata.packageName}@${metadata.version}/`
			);
		} else {
			const res = await fetch(`/assets/maplibre-npm-example.txt`);
			const text = await res.text();
			return text.replace(/{style}/g, style);
		}
	};

	return {
		title: 'Maplibre GL Terra Draw',
		description:
			'This plugin is to add controls to your MapLibre for sketching powered by Terra Draw library.',
		socialImage: '/assets/plugin-overview.png',
		codes: {
			cdn: await getExample('cdn'),
			npm: await getExample('npm')
		}
	};
};
