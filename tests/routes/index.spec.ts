import { expect } from '@playwright/test';
import { AvailableModes, AvailableValhallaModes } from '../../src/lib/constants/AvailableModes';
import { test } from '../setup';

/**
 * Get the CSS class selector for a mode button on the map.
 *
 * Button class naming convention in MaplibreTerradrawControl:
 * - render: `.maplibregl-terradraw-{prefix}render-button`
 * - delete, delete-selection, download, undo, redo, settings: `.maplibregl-terradraw-{prefix}{mode}-button`
 * - drawing modes (point, linestring, etc.): `.maplibregl-terradraw-{prefix}add-{mode}-button`
 */
function getModeButtonSelector(
	controlType: 'default' | 'measure' | 'valhalla',
	mode: string
): string {
	const prefix =
		controlType === 'measure' ? 'measure-' : controlType === 'valhalla' ? 'valhalla-' : '';
	const specialModes = ['render', 'delete', 'delete-selection', 'download', 'undo', 'redo'];
	if (controlType === 'valhalla') specialModes.push('settings');

	if (specialModes.includes(mode)) {
		return `.maplibregl-terradraw-${prefix}${mode}-button`;
	}
	return `.maplibregl-terradraw-${prefix}add-${mode}-button`;
}

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

test.describe('demo page - query parameter: modes', () => {
	test('only specified modes are shown when modes query parameter is set', async ({ page }) => {
		await page.goto('/?controlType=default&modes=point,linestring,polygon');
		await page.waitForSelector('.map', { state: 'visible' });

		const modeBadges = page.locator('[data-testid="mode-badges"] .badge');
		await expect(modeBadges).toHaveCount(3);
		await expect(modeBadges.nth(0)).toContainText('point');
		await expect(modeBadges.nth(1)).toContainText('linestring');
		await expect(modeBadges.nth(2)).toContainText('polygon');
	});
});

test.describe('demo page - sidebar UI elements', () => {
	test('control type tabs are visible', async ({ page }) => {
		await page.goto('/');
		await page.waitForSelector('.map', { state: 'visible' });

		await expect(page.locator('[data-scope="tabs"][data-value="default"]')).toBeVisible();
		await expect(page.locator('[data-scope="tabs"][data-value="measure"]')).toBeVisible();
		await expect(page.locator('[data-scope="tabs"][data-value="valhalla"]')).toBeVisible();
	});

	test('sidebar and map are visible', async ({ page }) => {
		await page.goto('/');
		await page.waitForSelector('.map', { state: 'visible' });

		await expect(page.locator('[data-testid="demo-sidebar"]')).toBeVisible();
		await expect(page.locator('[data-testid="demo-map"]')).toBeVisible();
	});

	test('Getting started button is visible', async ({ page }) => {
		await page.goto('/');
		await page.waitForSelector('.map', { state: 'visible' });

		await expect(page.locator('[data-testid="btn-getting-started"]')).toBeVisible();
	});

	test('accordion sections are present in sidebar', async ({ page }) => {
		await page.goto('/');
		await page.waitForSelector('.map', { state: 'visible' });

		await expect(page.locator('[data-testid="accordion-mode-selection"]')).toBeVisible();
	});

	test('Add all and Delete all buttons are visible in mode selection', async ({ page }) => {
		await page.goto('/?controlType=default&isOpen=open');
		await page.waitForSelector('.map', { state: 'visible' });
		await page.waitForLoadState('networkidle');

		const trigger = page.locator('[data-testid="accordion-mode-selection"]');
		await trigger.scrollIntoViewIfNeeded();
		await trigger.click();
		await expect(trigger).toHaveAttribute('aria-expanded', 'true');

		await expect(page.locator('[data-testid="btn-add-all-modes"]')).toBeVisible();
		await expect(page.locator('[data-testid="btn-delete-all-modes"]')).toBeVisible();
	});
});

test.describe('demo page - default control: mode buttons on map', () => {
	for (const mode of AvailableModes) {
		test(`"${mode}" button exists on map`, async ({ page }) => {
			await page.goto('/?controlType=default&isOpen=open&modes=' + AvailableModes.join(','));
			await page.waitForSelector('.map', { state: 'visible' });

			const selector = getModeButtonSelector('default', mode);
			await expect(page.locator(selector)).toBeAttached();
		});
	}
});

test.describe('demo page - measure control: mode buttons on map', () => {
	for (const mode of AvailableModes) {
		test(`"${mode}" button exists on map`, async ({ page }) => {
			await page.goto('/?controlType=measure&isOpen=open&modes=' + AvailableModes.join(','));
			await page.waitForSelector('.map', { state: 'visible' });

			const selector = getModeButtonSelector('measure', mode);
			await expect(page.locator(selector)).toBeAttached();
		});
	}
});

test.describe('demo page - valhalla control: mode buttons on map', () => {
	for (const mode of AvailableValhallaModes) {
		test(`"${mode}" button exists on map`, async ({ page }) => {
			await page.goto(
				'/?controlType=valhalla&isOpen=open&modes=' + AvailableValhallaModes.join(',')
			);
			await page.waitForSelector('.map', { state: 'visible' });

			const selector = getModeButtonSelector('valhalla', mode);
			await expect(page.locator(selector)).toBeAttached();
		});
	}
});
