import type { PageServerLoad } from './$types.js';

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
		examples: {
			cdn: await getExample('cdn'),
			npm: await getExample('npm')
		}
	};
};
