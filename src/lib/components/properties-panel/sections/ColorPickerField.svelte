<script lang="ts">
	/**
	 * Color Picker Field Component
	 *
	 * Simple, one-click color picker using browser's native color picker.
	 *
	 * Spacing (8pt grid):
	 * - Gap between elements: 8px (gap-2)
	 * - Swatch size: 40x40px (h-10 w-10)
	 * - Copy button padding: 4px (p-1)
	 *
	 * Features:
	 * - One-click native color picker
	 * - Hex value display
	 * - Copy to clipboard button
	 * - Hover states for better UX
	 */

	import { Copy, Check } from 'lucide-svelte';
	import {
		parseColor,
		rgbToHex,
		rgbToHsl,
		rgbToHsb,
		calculateContrastRatio,
		meetsWCAGAA,
		meetsWCAGAAA
	} from '$lib/utils/color';

	// Props
	let {
		color = '#000000',
		label = 'Color',
		onChange = (newColor: string) => {},
		storageKey = 'collab-canvas-recent-colors'
	}: {
		color: string;
		label?: string;
		onChange: (newColor: string) => void;
		storageKey?: string;
	} = $props();

	// State
	let copied = $state(false);
	let colorInputRef: HTMLInputElement | null = null;
	let recentColors = $state<string[]>([]);

	// Load recent colors from localStorage on mount
	$effect.pre(() => {
		if (typeof window !== 'undefined') {
			const stored = localStorage.getItem(storageKey);
			recentColors = stored ? JSON.parse(stored) : [];
		}
	});

	// Parse current color to RGB
	const rgb = $derived<[number, number, number]>(parseColor(color) || [0, 0, 0]);

	// Convert to hex for display
	const hex = $derived(rgbToHex(rgb));

	// Contrast checking (vs white background)
	const contrastRatio = $derived(calculateContrastRatio(rgb, [255, 255, 255]));
	const passesAA = $derived(meetsWCAGAA(contrastRatio));
	const passesAAA = $derived(meetsWCAGAAA(contrastRatio));

	// Handle color change
	function handleColorChange(newColor: string) {
		onChange(newColor);
		addToRecentColors(newColor);
	}

	// Add to recent colors (max 10) and persist to localStorage
	function addToRecentColors(newColor: string) {
		const colorLower = newColor.toLowerCase();
		if (!recentColors.includes(colorLower)) {
			recentColors = [colorLower, ...recentColors.slice(0, 9)];

			// Persist to localStorage
			if (typeof window !== 'undefined') {
				localStorage.setItem(storageKey, JSON.stringify(recentColors));
			}
		}
	}

	// Copy hex to clipboard
	async function copyToClipboard() {
		try {
			await navigator.clipboard.writeText(hex);
			copied = true;
			setTimeout(() => (copied = false), 2000);
		} catch (err) {
			console.error('Failed to copy:', err);
		}
	}

	// Open native color picker
	function openColorPicker() {
		colorInputRef?.click();
	}
</script>

<div class="space-y-2">
	<div
		class="flex items-center gap-2"
		data-testid="{label.toLowerCase().replace(/\s+/g, '-')}-color-picker"
	>
		<!-- Hidden native color input -->
		<input
			bind:this={colorInputRef}
			type="color"
			value={hex}
			onchange={(e) => handleColorChange(e.currentTarget.value)}
			class="sr-only"
			aria-label="{label} color picker"
		/>

		<!-- Color swatch button that opens native picker -->
		<button
			type="button"
			onclick={openColorPicker}
			class="h-10 w-10 rounded-md border-2 border-border hover:border-ring focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus:outline-none transition-colors"
			style="background-color: {color};"
			aria-label="Pick {label} color"
		></button>

		<!-- Color value display with copy button -->
		<div class="flex items-center gap-1 flex-1 min-w-0">
			<div class="text-xs text-muted-foreground truncate font-mono">{hex}</div>
			<button
				type="button"
				onclick={copyToClipboard}
				class="p-1 hover:bg-accent rounded focus-visible:ring-2 focus-visible:ring-ring focus:outline-none transition-colors"
				aria-label="Copy {label} color"
				title="Copy color"
			>
				{#if copied}
					<Check class="h-3 w-3 text-green-600" />
				{:else}
					<Copy class="h-3 w-3 text-muted-foreground" />
				{/if}
			</button>
		</div>
	</div>

	<!-- Recent Colors -->
	{#if recentColors.length > 0}
		<div class="flex gap-1 items-center">
			<span class="text-xs text-muted-foreground mr-1">Recent:</span>
			{#each recentColors.slice(0, 5) as recentColor (recentColor)}
				<button
					type="button"
					onclick={() => handleColorChange(recentColor)}
					class="h-6 w-6 rounded border-2 transition-all hover:scale-110 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus:outline-none {recentColor.toLowerCase() ===
					color.toLowerCase()
						? 'border-ring ring-2 ring-offset-1'
						: 'border-border'}"
					style="background-color: {recentColor};"
					title={recentColor}
					aria-label="Recent color {recentColor}"
				></button>
			{/each}
		</div>
	{/if}
</div>

<!--
USAGE EXAMPLES:

1. Basic usage (uses default storage key):
<ColorPickerField 
  color="#3b82f6" 
  onChange={(newColor) => updateColor(newColor)}
/>

2. With label:
<ColorPickerField 
  color={fillColor}
  label="Fill Color"
  onChange={(newColor) => updateFill(newColor)}
/>

3. With custom storage key (recommended for separate histories):
<ColorPickerField 
  color={fillColor}
  label="Fill"
  onChange={updateFill}
  storageKey="collab-canvas-recent-fill-colors"
/>

4. In FormField wrapper:
<FormField id="fill" label="Fill Color">
  <ColorPickerField 
    color={fillColor}
    onChange={(newColor) => updateFill(newColor)}
    storageKey="my-app-fill-colors"
  />
</FormField>

5. Separate recent colors for different purposes:
[Fill colors]
<ColorPickerField 
  color={fillColor}
  label="Fill"
  onChange={updateFill}
  storageKey="collab-canvas-recent-fill-colors"
/>

[Stroke colors]
<ColorPickerField 
  color={strokeColor}
  label="Stroke"
  onChange={updateStroke}
  storageKey="collab-canvas-recent-stroke-colors"
/>

Features: - One-click native color picker - Hex value display with copy to clipboard - Recent colors
row (max 5 shown, stores up to 10) - Automatic color history tracking with localStorage persistence
- Separate storage keys for independent color histories - Persists across page reloads and component
remounts - Hover scale effect on color swatches - Visual indicator for currently selected color -
Full keyboard navigation - Accessible ARIA labels - 8px spacing (8pt grid system) - Copy button with
check mark feedback - Touch-friendly 44x44px targets Storage: - Colors are stored in localStorage
using the specified storageKey - Default key: "collab-canvas-recent-colors" - Stores up to 10 recent
colors, displays 5 - Colors are normalized to lowercase for consistency -->
