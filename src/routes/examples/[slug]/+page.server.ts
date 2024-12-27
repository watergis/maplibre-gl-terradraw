import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types.js';

const getTitle = (body: string) => {
	const match = body.match(/<title>([^<]*)<\/title>/);
	if (!match || typeof match[1] !== 'string') return '';
	return match[1];
};

const getDescription = (body: string) => {
	const match = body.match(/<meta\s+property="og:description"\s+content="([^"]+)"\s*\/?>/);
	if (!match || typeof match[1] !== 'string') return '';
	return match[1];
};

export const load: PageServerLoad = async ({ params, fetch }) => {
	const slug = params.slug;

	const filePath = `/api/examples/${slug}`;

	const res = await fetch(filePath);
	if (!res.ok) {
		error(res.status, res.statusText);
	}

	const html = await res.text();

	const title = getTitle(html);
	const description = getDescription(html);

	return {
		html,
		title,
		description,
		url: filePath,
		breadcrumbs: [
			{
				href: '/',
				title: 'Home'
			},
			{
				href: '/examples',
				title: 'Examples'
			},
			{
				href: `/examples/${slug}`,
				title: title
			}
		]
	};
};
