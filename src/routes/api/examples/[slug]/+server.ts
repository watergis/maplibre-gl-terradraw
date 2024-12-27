import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';

export const GET: RequestHandler = async ({ params, fetch }) => {
	const slug = params.slug;

	const filePath = `/assets/examples/${slug}.html`;

	const res = await fetch(filePath);
	if (!res.ok) {
		error(res.status, res.statusText);
	}

	const html = await res.text();
	return new Response(html, {
		headers: {
			'Content-Type': 'text/html'
		}
	});
};
