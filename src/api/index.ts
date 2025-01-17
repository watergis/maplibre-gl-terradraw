import { API } from 'sveltekit-api';
import packageJson from '../../package.json' assert { type: 'json' };
const { version } = packageJson;

const api = new API(
	import.meta.glob('./**/*.ts'),
	{
		openapi: '3.0.0',
		info: {
			title: 'MaplibreGL Export Docs API',
			version: version,
			description: 'MaplibreGL Export Docs API',
			license: {
				name: 'MIT',
				url: 'https://github.com/watergis/maplibre-gl-terradraw/blob/main/LICENSE'
			},
			contact: { name: 'Jin Igarashi', email: 'info@water-gis.com' }
		}
	},
	'/api'
);

export default api;
