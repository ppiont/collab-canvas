import { test, expect } from '@playwright/test';

/**
 * Visual Regression Tests for Properties Panel
 * 
 * These tests capture screenshots of the properties panel in various states
 * and compare them against baseline images to detect unintended visual changes.
 * 
 * To update baselines: npm run test:visual:update
 * To run tests: npm run test:visual
 */

test.describe('Properties Panel Visual Regression', () => {
	test.beforeEach(async ({ page }) => {
		// Navigate to test page
		await page.goto('/test-properties');
		
		// Wait for components to be fully loaded
		await page.waitForSelector('[data-testid="properties-panel"]', { timeout: 5000 });
	});

	test('empty selection state', async ({ page }) => {
		// Click "None Selected" button
		await page.click('button:has-text("None Selected")');
		
		// Wait for update
		await page.waitForTimeout(100);
		
		// Capture screenshot of properties panel only
		const panel = page.locator('[data-testid="properties-panel"]');
		await expect(panel).toHaveScreenshot('properties-panel-empty.png', {
			maxDiffPixelRatio: 0.01
		});
	});

	test('single rectangle selection', async ({ page }) => {
		// Click "Select Rectangle" button
		await page.click('button:has-text("Select Rectangle")');
		
		// Wait for update
		await page.waitForTimeout(100);
		
		// Capture screenshot
		const panel = page.locator('[data-testid="properties-panel"]');
		await expect(panel).toHaveScreenshot('properties-panel-single-rectangle.png', {
			maxDiffPixelRatio: 0.01
		});
	});

	test('single circle selection', async ({ page }) => {
		// Click "Select Circle" button
		await page.click('button:has-text("Select Circle")');
		
		// Wait for update
		await page.waitForTimeout(100);
		
		// Capture screenshot (should show radius instead of width/height)
		const panel = page.locator('[data-testid="properties-panel"]');
		await expect(panel).toHaveScreenshot('properties-panel-single-circle.png', {
			maxDiffPixelRatio: 0.01
		});
	});

	test('multiple selection with mixed values', async ({ page }) => {
		// Click "Select Multiple" button
		await page.click('button:has-text("Select Multiple")');
		
		// Wait for update
		await page.waitForTimeout(100);
		
		// Capture screenshot (should show em dashes for mixed values)
		const panel = page.locator('[data-testid="properties-panel"]');
		await expect(panel).toHaveScreenshot('properties-panel-multiple-mixed.png', {
			maxDiffPixelRatio: 0.01
		});
	});

	test('dimensions section expanded', async ({ page }) => {
		// Select a shape
		await page.click('button:has-text("Select Rectangle")');
		await page.waitForTimeout(100);
		
		// Dimensions section should be expanded by default
		const dimensionsSection = page.locator('[data-accordion-item="dimensions"]');
		await expect(dimensionsSection).toHaveScreenshot('dimensions-section-expanded.png', {
			maxDiffPixelRatio: 0.01
		});
	});

	test('appearance section with colors', async ({ page }) => {
		// Select a shape
		await page.click('button:has-text("Select Rectangle")');
		await page.waitForTimeout(100);
		
		// Capture appearance section
		const appearanceSection = page.locator('[data-accordion-item="appearance"]');
		await expect(appearanceSection).toHaveScreenshot('appearance-section.png', {
			maxDiffPixelRatio: 0.01
		});
	});

	test('effects section with slider', async ({ page }) => {
		// Select a shape
		await page.click('button:has-text("Select Rectangle")');
		await page.waitForTimeout(100);
		
		// Capture effects section
		const effectsSection = page.locator('[data-accordion-item="effects"]');
		await expect(effectsSection).toHaveScreenshot('effects-section.png', {
			maxDiffPixelRatio: 0.01
		});
	});

	test('panel header with selection count', async ({ page }) => {
		// Select multiple shapes
		await page.click('button:has-text("Select Multiple")');
		await page.waitForTimeout(100);
		
		// Capture panel header
		const header = page.locator('[data-testid="panel-header"]');
		await expect(header).toHaveScreenshot('panel-header-multiple.png', {
			maxDiffPixelRatio: 0.01
		});
	});

	test('clear button hover state', async ({ page }) => {
		// Select a shape
		await page.click('button:has-text("Select Rectangle")');
		await page.waitForTimeout(100);
		
		// Hover over clear button
		const clearButton = page.locator('button[aria-label="Clear selection"]');
		await clearButton.hover();
		
		// Wait for hover animation
		await page.waitForTimeout(200);
		
		// Capture screenshot
		await expect(clearButton).toHaveScreenshot('clear-button-hover.png', {
			maxDiffPixelRatio: 0.01
		});
	});

	test('input focus state', async ({ page }) => {
		// Select a shape
		await page.click('button:has-text("Select Rectangle")');
		await page.waitForTimeout(100);
		
		// Focus on width input
		const widthInput = page.locator('input[aria-label="Width"]');
		await widthInput.focus();
		
		// Wait for focus animation
		await page.waitForTimeout(100);
		
		// Capture screenshot showing focus ring
		const dimensionsSection = page.locator('[data-accordion-item="dimensions"]');
		await expect(dimensionsSection).toHaveScreenshot('input-focus-state.png', {
			maxDiffPixelRatio: 0.01
		});
	});

	test('color swatch display', async ({ page }) => {
		// Select a shape
		await page.click('button:has-text("Select Rectangle")');
		await page.waitForTimeout(100);
		
		// Capture color picker field
		const fillControl = page.locator('[data-testid="fill-color-picker"]').first();
		await expect(fillControl).toHaveScreenshot('color-picker-field.png', {
			maxDiffPixelRatio: 0.01
		});
	});

	test('mixed value indicator', async ({ page }) => {
		// Select multiple shapes with different values
		await page.click('button:has-text("Select Multiple")');
		await page.waitForTimeout(100);
		
		// Capture a form field showing "Mixed" indicator
		const widthField = page.locator('[data-form-field="width"]');
		await expect(widthField).toHaveScreenshot('mixed-value-indicator.png', {
			maxDiffPixelRatio: 0.01
		});
	});

	test('responsive layout at 320px width', async ({ page }) => {
		// Set viewport to narrow width
		await page.setViewportSize({ width: 320, height: 800 });
		
		// Select a shape
		await page.click('button:has-text("Select Rectangle")');
		await page.waitForTimeout(100);
		
		// Capture panel at narrow width
		const panel = page.locator('[data-testid="properties-panel"]');
		await expect(panel).toHaveScreenshot('properties-panel-narrow.png', {
			maxDiffPixelRatio: 0.01
		});
	});

	test('dark mode appearance', async ({ page }) => {
		// Enable dark mode (if your app supports it via class or data attribute)
		await page.addStyleTag({
			content: 'html { color-scheme: dark; }'
		});
		
		// Select a shape
		await page.click('button:has-text("Select Rectangle")');
		await page.waitForTimeout(100);
		
		// Capture panel in dark mode
		const panel = page.locator('[data-testid="properties-panel"]');
		await expect(panel).toHaveScreenshot('properties-panel-dark.png', {
			maxDiffPixelRatio: 0.01
		});
	});

	test('all sections collapsed', async ({ page }) => {
		// Select a shape
		await page.click('button:has-text("Select Rectangle")');
		await page.waitForTimeout(100);
		
		// Collapse all sections by clicking their triggers
		await page.click('button[aria-controls*="dimensions"]');
		await page.click('button[aria-controls*="appearance"]');
		await page.click('button[aria-controls*="effects"]');
		
		// Wait for collapse animations
		await page.waitForTimeout(500);
		
		// Capture collapsed state
		const panel = page.locator('[data-testid="properties-panel"]');
		await expect(panel).toHaveScreenshot('properties-panel-collapsed.png', {
			maxDiffPixelRatio: 0.01
		});
	});

	test('text selection showing different controls', async ({ page }) => {
		// Select text shape (when implemented)
		await page.click('button:has-text("Select Text")');
		await page.waitForTimeout(100);
		
		// Capture panel (should show text-specific controls if implemented)
		const panel = page.locator('[data-testid="properties-panel"]');
		await expect(panel).toHaveScreenshot('properties-panel-text.png', {
			maxDiffPixelRatio: 0.01
		});
	});
});

test.describe('Properties Panel Interactive States', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/test-properties');
		await page.waitForSelector('[data-testid="properties-panel"]');
	});

	test('typing in numeric input', async ({ page }) => {
		// Select a shape
		await page.click('button:has-text("Select Rectangle")');
		await page.waitForTimeout(100);
		
		// Click width input and type
		const widthInput = page.locator('input[aria-label="Width"]');
		await widthInput.click();
		await widthInput.fill('250');
		
		// Wait for update
		await page.waitForTimeout(100);
		
		// Capture state
		const dimensionsSection = page.locator('[data-accordion-item="dimensions"]');
		await expect(dimensionsSection).toHaveScreenshot('width-input-typed.png', {
			maxDiffPixelRatio: 0.01
		});
	});

	test('slider being dragged', async ({ page }) => {
		// Select a shape
		await page.click('button:has-text("Select Rectangle")');
		await page.waitForTimeout(100);
		
		// Find opacity slider
		const slider = page.locator('input[type="range"][aria-label*="opacity"]').first();
		
		// Set slider to 50%
		await slider.fill('50');
		await page.waitForTimeout(100);
		
		// Capture state
		const effectsSection = page.locator('[data-accordion-item="effects"]');
		await expect(effectsSection).toHaveScreenshot('opacity-slider-50.png', {
			maxDiffPixelRatio: 0.01
		});
	});

	test('blend mode dropdown opened', async ({ page }) => {
		// Select a shape
		await page.click('button:has-text("Select Rectangle")');
		await page.waitForTimeout(100);
		
		// Click blend mode trigger
		const blendTrigger = page.locator('button[aria-label="Blend mode"]');
		await blendTrigger.click();
		
		// Wait for dropdown animation
		await page.waitForTimeout(300);
		
		// Capture with dropdown open
		const panel = page.locator('[data-testid="properties-panel"]');
		await expect(panel).toHaveScreenshot('blend-mode-dropdown.png', {
			maxDiffPixelRatio: 0.02 // Allow slightly more diff due to animation timing
		});
	});
});

