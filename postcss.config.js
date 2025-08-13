import postcssUrl from 'postcss-url';
import cssnano from 'cssnano';

export default {
	plugins: [
		postcssUrl({
			url: 'inline',
			filter: '**/*.svg',
			optimizeSvgEncode: true,
			maxSize: 14
		}),
		cssnano({
			preset: 'default'
		})
	]
};
