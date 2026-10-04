// Minimal typing for the bindings this app reads from the Cloudflare Workers runtime.
declare module 'cloudflare:workers' {
	export const env: {
		ASSETS?: {
			fetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
		};
	};
}
