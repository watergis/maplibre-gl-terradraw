import type { LayoutLoad } from './$types.js';

export const load: LayoutLoad = async () => {
	const packageName = '@watergis/maplibre-gl-terradraw';
	const title = 'Maplibre GL Terra Draw';
	const style = 'https://demotiles.maplibre.org/style.json';
	return {
		packageName,
		title,
		style
	};
};

export const prerender = true;
export const ssr = false;
