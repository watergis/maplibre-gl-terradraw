export const exampleIds = [
	'measure-control',
	'add-geojson',
	'select-event',
	'drawing-option',
	'coordinate-precision',
	'custom-icon',
	'query-elevation-terrain',
	'query-elevation-terrainrgb',
	'change-style'
];

export const getTitle = (body: string) => {
	const match = body.match(/<title>([^<]*)<\/title>/);
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
