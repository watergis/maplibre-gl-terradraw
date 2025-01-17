import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types.js';
import { getDescription, getTitle } from '$api/helpers.js';

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
		socialImage: `/assets/images/${slug}.png`,
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
