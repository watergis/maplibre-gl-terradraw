import pkg from '../../package.json' with { type: 'json' };

export const exampleIds = [
	'measure-control',
	'measure-control-custom-font',
	'add-geojson',
	'add-geojson-customstyle',
	'select-event',
	'drawing-option',
	'coordinate-precision',
	'custom-icon',
	'query-elevation-terrain',
	'query-elevation-terrainrgb',
	'change-style',
	'use-both-control',
	'programmatic-mode-control',
	'glass-theme-control',
	'selected-feature-per-mode-style',
	'custom-undo-redo-config'
];

export const getTitle = (body: string) => {
	const match = body.match(/<title>([^<]*)<\/title>/);
	if (!match || typeof match[1] !== 'string') return '';
	return match[1];
};

export const getTags = (body: string) => {
	const match = body.match(/<meta\s+property="tag"\s+content="([^"]+)"\s*\/?>/);
	if (!match || typeof match[1] !== 'string') return '';
	return match[1];
};

export const getDescription = (body: string) => {
	const match = body.match(/<meta\s+property="og:description"\s+content="([^"]+)"\s*\/?>/);
	if (!match || typeof match[1] !== 'string') return '';
	return match[1];
};

export const getPackageInfo = async () => {
	const packageName = pkg.name;

	try {
		const res = await fetch(`https://registry.npmjs.org/${packageName}/latest`);
		const json = res.ok ? await res.json() : null;

		return {
			packageName: packageName,
			version: json?.version ?? pkg.version ?? 'latest',
			author: json?.author ?? pkg.author,
			displayName: pkg.displayName,
			description: pkg.description
		};
	} catch {
		return {
			packageName: packageName,
			version: pkg.version ?? 'latest',
			author: pkg.author,
			displayName: pkg.displayName,
			description: pkg.description
		};
	}
};
