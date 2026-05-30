import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { fetchStaticAsset, getPackageInfo } from '../../../helpers';

export const GET: RequestHandler = async ({ params, fetch, platform, url }) => {
	const slug = params.slug;

	const filePath = `/assets/examples/${slug}.htm`;

	const res = await fetchStaticAsset({
		fetch,
		url,
		platform,
		path: filePath
	});
	if (!res.ok) {
		error(res.status, res.statusText);
	}

	let html = await res.text();

	if (url.hostname === 'localhost') {
		// if localhost, use CDN file from local, otherwise use from jsdelivr
		html = html.replace(
			/https:\/\/cdn\.jsdelivr\.net\/npm\/@watergis\/maplibre-gl-terradraw@latest\//g,
			'../../../'
		);
	} else {
		const packageInfo = await getPackageInfo();
		html = html.replace(/@latest/g, `@${packageInfo.version}`);
	}

	return new Response(html, {
		headers: {
			'Content-Type': 'text/html'
		}
	});
};
