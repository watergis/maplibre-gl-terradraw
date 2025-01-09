import { test, expect } from '@playwright/test';

test.describe('examples page test', () => {
	test('examples page has expected title', async ({ page }) => {
		await page.goto('/examples');
		await expect(page).toHaveTitle(/Examples/);
	});
});

test.describe('each examples page test', () => {
	for (const option of [
		'add-geojson',
		'drawing-option',
		'measure-control',
		'select-event',
		'coordinate-precision'
	]) {
		test(`${option} example page has expected to have title`, async ({ page }) => {
			await page.goto(`/examples/${option}`);
			await expect(page).toBeDefined();
		});
	}
});
