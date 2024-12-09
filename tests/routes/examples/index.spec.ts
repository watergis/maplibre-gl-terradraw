import { test, expect } from '@playwright/test';

test.describe('examples page test', () => {
	test('examples page has expected title', async ({ page }) => {
		await page.goto('/examples');
		await expect(page).toHaveTitle(/Maplibre GL Terra Draw/);
	});
});

test.describe('each examples page test', () => {
	for (const option of [
		'add-geojson',
		'drawing-option',
		'measure-area',
		'measure-control',
		'measure-distance',
		'select-event'
	]) {
		test(`${option} example page has expected to have title`, async ({ page }) => {
			await page.goto(`/examples/${option}`);
			await expect(page).toHaveTitle(/Maplibre GL Terra Draw/);
		});

		test(`${option} example page has expected to have map class`, async ({ page }) => {
			await page.goto(`/examples/${option}`);
			const mapContainer = page.locator('.map');
			await expect(mapContainer).toBeTruthy();
			await expect(mapContainer).toHaveCount(1);
		});
	}
});
