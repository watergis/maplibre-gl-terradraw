import { test as base } from '@playwright/test';
import type { StyleSpecification } from 'maplibre-gl';

const MOCK_STYLE: StyleSpecification = {
	version: 8,
	name: 'mock-style',
	sources: {},
	layers: [
		{
			id: 'background',
			type: 'background',
			paint: {
				'background-color': '#ffffff'
			}
		}
	],
	glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf'
};

export const test = base.extend({
	page: async ({ page }, use) => {
		await page.route('**/api.protomaps.com/**', (route) => {
			return route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify(MOCK_STYLE)
			});
		});
		await use(page);
	}
});
