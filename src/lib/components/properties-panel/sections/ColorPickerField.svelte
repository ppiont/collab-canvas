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
		recentColors = $bindable<string[]>([])
	}: { 
		color: string;
		label?: string;
		onChange: (newColor: string) => void;
		recentColors?: string[];
	} = $props();
	
	// State
	let copied = $state(false);
	let colorInputRef: HTMLInputElement | null = null;
	
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
	
	// Add to recent colors (max 10)
	function addToRecentColors(newColor: string) {
		const colorLower = newColor.toLowerCase();
		if (!recentColors.includes(colorLower)) {
			recentColors = [colorLower, ...recentColors.slice(0, 9)];
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

<div class="flex items-center gap-2" data-testid="{label.toLowerCase().replace(/\s+/g, '-')}-color-picker">
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

<!--
USAGE EXAMPLES:

1. Basic usage:
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

3. With recent colors:
<script>
  let recentColors = $state(['#ff0000', '#00ff00', '#0000ff']);
</script>

<ColorPickerField 
  color={strokeColor}
  label="Stroke"
  onChange={(newColor) => updateStroke(newColor)}
  bind:recentColors
/>

4. In FormField wrapper:
<FormField id="fill" label="Fill Color">
  <ColorPickerField 
    color={fillColor}
    onChange={(newColor) => updateFill(newColor)}
    bind:recentColors
  />
</FormField>

Features:
- Native color picker for main selection
- Format tabs: HEX, RGB, HSL, HSB
- Copy to clipboard with visual feedback
- WCAG contrast checker (vs white)
- Recent colors with hover scale effect
- 44x44px touch targets
- Full keyboard navigation
- Dark mode support
-->

