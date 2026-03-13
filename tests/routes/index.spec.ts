import { AvailableModes, AvailableValhallaModes } from '../../src/lib/constants/AvailableModes';
import { test, expect, type Page } from '@playwright/test';

// Minimal valid MapLibre style JSON to avoid external network requests
const MOCK_STYLE = JSON.stringify({
	version: 8,
	name: 'Empty',
	sources: {},
	layers: []
});

/**
 * Intercept external network requests (map styles, tiles, terrain)
 * so MapLibre's `load` event fires immediately without real network I/O.
 */
async function mockMapRequests(page: Page) {
	// Mock Protomaps style JSON
	await page.route('**/api.protomaps.com/**', (route) =>
		route.fulfill({
			status: 200,
			contentType: 'application/json',
			body: MOCK_STYLE
		})
	);

	// Mock Mapterhorn terrain / TileJSON
	await page.route('**/tiles.mapterhorn.com/**', (route) =>
		route.fulfill({
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify({
				tilejson: '2.2.0',
				tiles: [],
				minzoom: 0,
				maxzoom: 14
			})
		})
	);
}

/**
 * Wait for MapLibre controls to appear on the page.
 * Returns true if controls loaded, false if WebGL is unavailable (headless GPU issue).
 */
async function waitForMapControls(page: Page, selector: string): Promise<boolean> {
	try {
		await page.waitForSelector(selector, { state: 'attached', timeout: 15000 });
		return true;
	} catch {
		// Check if WebGL context creation failed (common in headless environments without GPU)
		const hasWebGLError = await page.evaluate(() => {
			const canvas = document.createElement('canvas');
			const gl = canvas.getContext('webgl') || canvas.getContext('webgl2');
			return !gl;
		});
		if (hasWebGLError) {
			test.skip(true, 'WebGL is not available in this headless environment');
		}
		return false;
	}
}

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
		await mockMapRequests(page);
		await page.goto('/');
		await waitForMapControls(page, '.maplibregl-terradraw-render-button');

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
			// Only check for existence, not visibility, as some buttons are conditionally hidden
			await expect(modeButoton).toHaveCount(1);
		}
	});

	test('demo page has expected to have mode buttons for measure control', async ({ page }) => {
		await mockMapRequests(page);
		await page.goto('/?controlType=measure');
		await waitForMapControls(page, '.maplibregl-terradraw-measure-render-button');

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
			// Only check for existence, not visibility, as some buttons are conditionally hidden
			await expect(modeButoton).toHaveCount(1);
		}
	});

	test('demo page has expected to have mode buttons for valhalla control', async ({ page }) => {
		await mockMapRequests(page);
		await page.goto(`/?controlType=valhalla&modes=${AvailableValhallaModes.join(',')}`);
		await waitForMapControls(page, '.maplibregl-terradraw-valhalla-render-button');

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
			// Only check for existence, not visibility, as some buttons are conditionally hidden
			await expect(modeButoton).toHaveCount(1);
		}
	});
});
