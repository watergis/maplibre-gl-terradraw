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

test.describe('demo page - default control type', () => {
	test('default control type is selected by default', async ({ page }) => {
		await page.goto('/');
		await page.waitForSelector('.map', { state: 'visible' });

		const defaultTab = page.locator('[data-scope="tabs"][data-value="default"]');
		await expect(defaultTab).toHaveAttribute('data-selected', '');
	});

	test('terradraw control buttons are visible when open', async ({ page }) => {
		await page.goto('/?controlType=default&isOpen=open');
		await page.waitForSelector('.map', { state: 'visible' });

		const controlGroup = page.locator('.maplibregl-ctrl-group').first();
		await expect(controlGroup).toBeVisible();
	});

	test('terradraw control is collapsed when isOpen=close', async ({ page }) => {
		await page.goto('/?controlType=default&isOpen=close');
		await page.waitForSelector('.map', { state: 'visible' });

		const modeButtons = page.locator('.maplibregl-terradraw-add-control');
		const count = await modeButtons.count();
		for (let i = 0; i < count; i++) {
			await expect(modeButtons.nth(i)).toBeHidden();
		}
	});
});

test.describe('demo page - query parameter: controlType', () => {
	test('measure control type is selected via query parameter', async ({ page }) => {
		await page.goto('/?controlType=measure');
		await page.waitForSelector('.map', { state: 'visible' });

		const measureTab = page.locator('[data-scope="tabs"][data-value="measure"]');
		await expect(measureTab).toHaveAttribute('data-selected', '');

		const measureOptionHeading = page.getByText('Measure control options');
		await expect(measureOptionHeading).toBeVisible();
	});

	test('valhalla control type is selected via query parameter', async ({ page }) => {
		await page.goto('/?controlType=valhalla');
		await page.waitForSelector('.map', { state: 'visible' });

		const valhallaTab = page.locator('[data-scope="tabs"][data-value="valhalla"]');
		await expect(valhallaTab).toHaveAttribute('data-selected', '');

		const valhallaOptionHeading = page.getByText('Valhalla control options');
		await expect(valhallaOptionHeading).toBeVisible();
	});
});
