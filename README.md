# maplibre-gl-terradraw

![License](https://img.shields.io/github/license/watergis/maplibre-gl-terradraw)
[![version](https://img.shields.io/npm/v/@watergis/maplibre-gl-terradraw.svg)](https://www.npmjs.com/package/@watergis/maplibre-gl-terradraw)
[![CI](https://github.com/watergis/maplibre-gl-terradraw/actions/workflows/ci.yml/badge.svg)](https://github.com/watergis/maplibre-gl-terradraw/actions/workflows/ci.yml)
[![Netlify Status](https://api.netlify.com/api/v1/badges/3486d35f-7a74-4c1c-a94a-6db0f7250583/deploy-status)](https://app.netlify.com/sites/maplibre-gl-terradraw/deploys)

This plugin is to add controls to your MapLibre for sketching powered by [Terra Draw](https://github.com/JamesLMilner/terra-draw) library.

## Usage

### NPM

- install

```shell
npm i -D @watergis/maplibre-gl-terradraw
```

Then,

```ts
import { MaplibreTerradrawControl } from '@watergis/maplibre-gl-terradraw';
import '@watergis/maplibre-gl-terradraw/dist/maplibre-gl-terradraw.css';

map.addControl(
	new MaplibreTerradrawControl({
		point: true,
		line: true,
		polygon: true,
		rectangle: true,
		circle: true,
		freehand: true,
		angledRectangle: true,
		select: true
	}),
	'top-left'
);
```

As default, all Terra Draw modes are enabled, you can disable options if you don't want to use them.

You can get Terra Draw instance by the following function.

```ts
const drawControl = new MaplibreTerradrawControl();
const drawInstance = drawControl.getTerraDrawInstance();
```

You can add event listener to subscribe Terra Draw event as you wish. The below example is to subscribe `select` event of Terra Draw.

```ts
drawInstance.on('select', (id: string) => {
	const snapshot = drawInstance.getSnapshot();
	const polygon = snapshot?.find((feature) => feature.id === id);
	console.log(polygon);
});
```

### CDN

Include CSS and umd.js from CDN as follows.

```html
<script src="https://cdn.jsdelivr.net/npm/@watergis/maplibre-gl-terradraw@latest/dist/maplibre-gl-terradraw.umd.js"></script>
<link
	rel="stylesheet"
	href="https://cdn.jsdelivr.net/npm/@watergis/maplibre-gl-terradraw@latest/dist/maplibre-gl-terradraw.css"
/>
```

For CDN example, please refer to [index_cdn.html](./static/index_cdn.html).

## Contribution

See [CONTRIBUTING](./CONTRIBUTING.md)

## Lisence

This plugin is licensed under [MIT License](./LICENSE).
