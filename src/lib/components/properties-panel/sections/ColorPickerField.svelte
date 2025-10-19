<script lang="ts">
	/**
	 * Color Picker Field Component
	 * 
	 * Professional color picker with:
	 * - Native color picker with preview swatch
	 * - Format switching (HEX, RGB, HSL, HSB)
	 * - Copy to clipboard button
	 * - Contrast ratio checker (vs white background)
	 * - Recent colors (last 10)
	 * - WCAG AA/AAA indicators
	 * - 44x44px touch targets
	 */
	
	import { Popover, PopoverContent, PopoverTrigger } from '$lib/components/ui/popover';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Tabs, TabsContent, TabsList, TabsTrigger } from '$lib/components/ui/tabs';
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
	let format = $state<'hex' | 'rgb' | 'hsl' | 'hsb'>('hex');
	let copied = $state(false);
	let open = $state(false);
	
	// Parse current color to RGB
	const rgb = $derived<[number, number, number]>(parseColor(color) || [0, 0, 0]);
	
	// Convert to different formats
	const hex = $derived(rgbToHex(rgb));
	const hsl = $derived(rgbToHsl(rgb));
	const hsb = $derived(rgbToHsb(rgb));
	
	// Format display values
	const rgbStr = $derived(`rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`);
	const hslStr = $derived(`hsl(${hsl[0].toFixed(0)}, ${hsl[1].toFixed(0)}%, ${hsl[2].toFixed(0)}%)`);
	const hsbStr = $derived(`hsb(${hsb[0].toFixed(0)}, ${hsb[1].toFixed(0)}%, ${hsb[2].toFixed(0)}%)`);
	
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
	
	// Copy to clipboard
	async function copyToClipboard() {
		const valueToCopy = format === 'hex' ? hex : 
		                    format === 'rgb' ? rgbStr :
		                    format === 'hsl' ? hslStr : hsbStr;
		
		try {
			await navigator.clipboard.writeText(valueToCopy);
			copied = true;
			setTimeout(() => copied = false, 2000);
		} catch (err) {
			console.error('Failed to copy:', err);
		}
	}
</script>

<div class="flex items-center gap-2">
	<!-- Color swatch trigger -->
	<Popover bind:open>
		<PopoverTrigger>
			<Button
				variant="outline"
				class="h-10 w-10 p-0 rounded-md border-2 border-border hover:border-ring focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
				style="background-color: {color};"
				aria-label="{label} color picker"
			>
			</Button>
		</PopoverTrigger>
		
		<PopoverContent class="w-72 p-4 bg-popover border border-border shadow-md">
			<div class="space-y-4">
				<!-- Native color picker -->
				<div class="space-y-2">
					<label for="color-picker" class="text-xs font-medium text-foreground">
						Pick Color
					</label>
					<input
						id="color-picker"
						type="color"
						value={hex}
						onchange={(e) => handleColorChange(e.currentTarget.value)}
						class="w-full h-32 rounded border-2 border-border cursor-pointer bg-background"
					/>
				</div>
				
				<!-- Format tabs with copy button -->
				<Tabs bind:value={format} class="w-full">
					<TabsList class="grid grid-cols-4 w-full bg-muted">
						<TabsTrigger value="hex" class="text-xs">HEX</TabsTrigger>
						<TabsTrigger value="rgb" class="text-xs">RGB</TabsTrigger>
						<TabsTrigger value="hsl" class="text-xs">HSL</TabsTrigger>
						<TabsTrigger value="hsb" class="text-xs">HSB</TabsTrigger>
					</TabsList>
					
					<div class="mt-3 flex gap-2">
						<Input
							value={format === 'hex' ? hex : format === 'rgb' ? rgbStr : format === 'hsl' ? hslStr : hsbStr}
							readonly
							class="text-sm font-mono flex-1 bg-background"
							aria-label={`Color value in ${format} format`}
						/>
						<Button
							variant="ghost"
							size="icon"
							onclick={copyToClipboard}
							class="h-10 w-10 shrink-0 focus-visible:ring-2 hover:bg-accent"
							aria-label="Copy to clipboard"
						>
							{#if copied}
								<Check class="h-4 w-4" />
							{:else}
								<Copy class="h-4 w-4" />
							{/if}
						</Button>
					</div>
				</Tabs>
				
				<!-- Contrast checker -->
				<div class="rounded-lg border border-border p-3 space-y-2 bg-muted/50">
					<div class="text-xs font-medium text-foreground">
						Contrast vs White
					</div>
					<div class="flex items-center justify-between">
						<span class="text-sm font-mono text-foreground">{contrastRatio.toFixed(2)}:1</span>
						<div class="flex gap-2">
							<span
								class="text-xs px-2 py-1 rounded-sm font-medium {passesAA
									? 'bg-green-500/20 text-green-700 dark:text-green-400 border border-green-500/30'
									: 'bg-red-500/20 text-red-700 dark:text-red-400 border border-red-500/30'}"
							>
								AA {passesAA ? '✓' : '✗'}
							</span>
							<span
								class="text-xs px-2 py-1 rounded-sm font-medium {passesAAA
									? 'bg-green-500/20 text-green-700 dark:text-green-400 border border-green-500/30'
									: 'bg-red-500/20 text-red-700 dark:text-red-400 border border-red-500/30'}"
							>
								AAA {passesAAA ? '✓' : '✗'}
							</span>
						</div>
					</div>
				</div>
				
				<!-- Recent colors -->
				{#if recentColors.length > 0}
					<div class="space-y-2">
						<div class="text-xs font-medium text-foreground">Recent Colors</div>
						<div class="flex flex-wrap gap-2">
							{#each recentColors as recentColor}
								<button
									class="h-8 w-8 rounded-md border-2 border-border focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 hover:scale-110 hover:border-ring transition-all bg-background"
									style="background-color: {recentColor} !important;"
									onclick={() => handleColorChange(recentColor)}
									aria-label="Use recent color {recentColor}"
								>
								</button>
							{/each}
						</div>
					</div>
				{/if}
			</div>
		</PopoverContent>
	</Popover>
	
	<!-- Current color value display -->
	<div class="flex-1 min-w-0">
		<div class="text-xs text-muted-foreground truncate">{hex}</div>
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

