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
	'programmatic-mode-control'
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
	const packageName = '@watergis/maplibre-gl-terradraw';

	const res = await fetch(`https://registry.npmjs.org/${packageName}/latest`);
	if (!res.ok) {
		return {
			packageName: packageName,
			version: 'latest'
		};
	}
	const json = await res.json();
	return {
		packageName: packageName,
		version: json.version as string
	};
};
