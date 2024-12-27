import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types.js';
const base = '/assets/examples';

const getTitle = (body: string) => {
	const match = body.match(/<title>([^<]*)<\/title>/);
	if (!match || typeof match[1] !== 'string') error(400, 'Unable to parse the title tag');
	return match[1];
};

const getDescription = (body: string) => {
	const match = body.match(/<meta\s+property="og:description"\s+content="([^"]+)"\s*\/?>/);
	if (!match || typeof match[1] !== 'string') error(400, 'Unable to parse the title tag');
	return match[1];
};

export const load: PageServerLoad = async ({ params, fetch }) => {
	const slug = params.slug;

	const filePath = `${base}/${slug}.html`;

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
