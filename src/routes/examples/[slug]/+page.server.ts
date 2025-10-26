import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { exampleIds, getDescription, getTitle } from '../../helpers';

export const load: PageServerLoad = async ({ params, fetch }) => {
	const slug = params.slug;

	if (!exampleIds.includes(slug)) {
		error(404, `Page not found`);
	}

	const filePath = `/api/examples/${slug}`;

	const res = await fetch(filePath);
	if (!res.ok) {
		error(res.status, res.statusText);
	}

	const html = await res.text();

	const title = getTitle(html);
	const description = getDescription(html);

	return {
		title,
		description,
		url: filePath,
		socialImage: `/assets/images/${slug}.png`,
		html: html
	};
};
