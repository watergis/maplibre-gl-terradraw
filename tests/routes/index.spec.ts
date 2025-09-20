import { AvailableModes, AvailableValhallaModes } from '../../src/lib/constants/AvailableModes';
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
		await page.waitForSelector('.map', { state: 'visible' });

		const mapContainer = page.locator('.map');
		await expect(mapContainer).toHaveCount(2);
	});

	test('demo page has expected to have mode buttons', async ({ page }) => {
		await page.goto('/');
		await page.waitForSelector('.map', { state: 'visible' });

		for (const mode of AvailableModes) {
			let className = `.maplibregl-terradraw-add-${mode}-button`;
			if (mode === 'render') {
				className = '.maplibregl-terradraw-render-button';
			} else if (mode === 'delete-selection') {
				className = '.maplibregl-terradraw-delete-selection-button';
			} else if (mode === 'delete') {
				className = '.maplibregl-terradraw-delete-button';
			} else if (mode === 'download') {
				className = '.maplibregl-terradraw-download-button';
			}

			const modeButoton = page.locator(className);
			await expect(modeButoton).toHaveCount(1);
		}
	});

	test('demo page has expected to have mode buttons for measure control', async ({ page }) => {
		await page.goto('/?controlType=measure');
		await page.waitForSelector('.map', { state: 'visible' });

		for (const mode of AvailableModes) {
			let className = `.maplibregl-terradraw-measure-add-${mode}-button`;
			if (mode === 'render') {
				className = '.maplibregl-terradraw-measure-render-button';
			} else if (mode === 'delete-selection') {
				className = '.maplibregl-terradraw-measure-delete-selection-button';
			} else if (mode === 'delete') {
				className = '.maplibregl-terradraw-measure-delete-button';
			} else if (mode === 'download') {
				className = '.maplibregl-terradraw-measure-download-button';
			}

			const modeButoton = page.locator(className);
			await expect(modeButoton).toHaveCount(1);
		}
	});

	test('demo page has expected to have mode buttons for valhalla control', async ({ page }) => {
		await page.goto(`/?controlType=valhalla&modes=${AvailableValhallaModes.join(',')}`);
		await page.waitForSelector('.map', { state: 'visible' });

		for (const mode of AvailableValhallaModes) {
			let className = `.maplibregl-terradraw-valhalla-add-${mode}-button`;
			if (mode === 'render') {
				className = '.maplibregl-terradraw-valhalla-render-button';
			} else if (mode === 'delete-selection') {
				className = '.maplibregl-terradraw-valhalla-delete-selection-button';
			} else if (mode === 'delete') {
				className = '.maplibregl-terradraw-valhalla-delete-button';
			} else if (mode === 'download') {
				className = '.maplibregl-terradraw-valhalla-download-button';
			} else if (mode === 'settings') {
				className = '.maplibregl-terradraw-valhalla-settings-button';
			}

			const modeButoton = page.locator(className);
			await expect(modeButoton).toHaveCount(1);
		}
	});
});
