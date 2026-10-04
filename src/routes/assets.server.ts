import { env } from 'cloudflare:workers';

// Kept out of helpers.ts, which the Playwright tests import under plain Node
// where `cloudflare:workers` cannot be resolved.
export const fetchStaticAsset = async ({
	fetch,
	url,
	path
}: {
	fetch: typeof globalThis.fetch;
	url: URL;
	path: string;
}) => {
	const assetUrl = new URL(path, url).toString();
	// adapter-cloudflare v8 no longer passes bindings through `platform.env`
	const assets = env.ASSETS;

	if (assets) {
		return assets.fetch(assetUrl);
	}

	return fetch(assetUrl);
};
