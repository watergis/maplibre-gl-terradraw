import { error, z, type RouteModifier } from 'sveltekit-api';
import { type RequestEvent } from '@sveltejs/kit';
import { ExampleIds, getPackageInfo } from '../../../routes/helpers.js';

export const Output = z.string().describe('HTML documentation for an example');

export const Param = z.object({
	slug: z.enum(ExampleIds as [string, ...string[]]).describe('Example ID')
});

export const Error = {
	404: error(404, 'Example ID is not found')
};

export const Modifier: RouteModifier = (c) => {
	c.summary = 'This endpoint returns HTML document for corresponding example ID.';
	c.description = `This endpoint returns HTML document for corresponding example ID. Slug must be one of ${ExampleIds.map((id) => `\`${id}\``).join(', ')}.`;
	c.tags = ['examples'];
	c.responses = {
		200: {
			description: 'HTML documentation for an example',
			content: {
				'text/html': {
					schema: z.string().describe('HTML documentation for an example')
				}
			}
		},
		404: {
			description: 'Example ID is not found'
		}
	};
	return c;
};

export default async function (
	param: z.infer<typeof Param>,
	{ fetch, url }: RequestEvent
): Promise<Response> {
	const slug = param.slug;

	if (!ExampleIds.includes(slug)) {
		throw Error[404];
	}

	const filePath = `/assets/examples/${slug}.txt`;

	const res = await fetch(filePath);

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
}
