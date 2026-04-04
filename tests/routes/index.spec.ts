import { expect } from '@playwright/test';
import { test } from '../setup';

test.describe('landing page test', () => {
	test('landing page has expected title', async ({ page }) => {
		await page.goto('/');
		await expect(page).toHaveTitle(/Maplibre GL Terra Draw/);
	});

	test('demo page has expected to have map class', async ({ page }) => {
		await page.goto('/');
		await page.waitForSelector('.map', { state: 'visible' });

		const mapContainer = page.locator('.map');
		await expect(mapContainer).toHaveCount(2);
	});
});
