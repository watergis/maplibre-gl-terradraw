import { AvailableModes } from '../../src/lib/constants/AvailableModes';
import { test, expect } from '@playwright/test';

test.describe('landing page test', () => {
	test('landing page has expected title', async ({ page }) => {
		await page.goto('/');
		await expect(page).toHaveTitle(/Maplibre GL Terra Draw/);
	});
});

test.describe('demo page test', () => {
	test('demo page has expected to have map class', async ({ page }) => {
		await page.goto('/');
		const mapContainer = page.locator('.map');
		await expect(mapContainer).toBeTruthy();
		await expect(mapContainer).toHaveCount(2);
	});

	test('demo page has expected to have mode buttons', async ({ page }) => {
		await page.goto('/');

		for (const mode of AvailableModes) {
			let className = `.maplibregl-terradraw-add-${mode}-button`;
			if (mode === 'render') {
				className = '.maplibregl-terradraw-render-button';
			} else if (mode === 'delete-selection') {
				className = '.maplibregl-terradraw-delete-selection-button';
			} else if (mode === 'delete') {
				className = '.maplibregl-terradraw-delete-button';
			}

			const modeButoton = page.locator(className);
			await expect(modeButoton).toBeTruthy();
		}
	});
});
