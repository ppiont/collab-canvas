<script lang="ts">
	import { Input } from './input';
	import { Label } from './label';
	import { Slider } from './slider';
	import { hexToRgb, rgbToHex, isValidHex } from '$lib/user-utils';
	import { X } from 'lucide-svelte';

	interface Props {
		value: string | null; // hex color
		onchange?: (color: string) => void;
	}

	let { value = '#3b82f6', onchange }: Props = $props();

	// Recent colors stored in localStorage
	const RECENT_COLORS_KEY = 'collab-canvas-recent-colors';
	const MAX_RECENT = 5;

	// Preset colors for quick access
	const PRESET_COLORS = [
		'#000000',
		'#FFFFFF',
		'#ef4444',
		'#f97316',
		'#eab308',
		'#22c55e',
		'#06b6d4',
		'#3b82f6',
		'#8b5cf6',
		'#ec4899',
		'#64748b',
		'#d1d5db'
	];

	// Derive RGB values from prop
	let rgb = $derived(hexToRgb(value || '') || { r: 0, g: 0, b: 0 });
	let rValue = $derived(rgb.r);
	let gValue = $derived(rgb.g);
	let bValue = $derived(rgb.b);
	
	// Derive hex input display from prop
	let hexInput = $derived(value?.toUpperCase().replace('#', '') || '');
	
	// Component state
	let recentColors = $state<string[]>([]);

	// Load recent colors from localStorage
	$effect.pre(() => {
		if (typeof window !== 'undefined') {
			const stored = localStorage.getItem(RECENT_COLORS_KEY);
			recentColors = stored ? JSON.parse(stored) : [];
		}
	});

	// Handle hex input change
	function handleHexChange(e: Event) {
		const target = e.target as HTMLInputElement;
		let input = target.value.toUpperCase().replace('#', '');

		// Only update if valid hex (allow partial input while typing)
		if (isValidHex(input)) {
			updateColor('#' + input);
		}
	}

	// Handle RGB slider changes
	function handleRgbChange(r: number, g: number, b: number) {
		const newHex = rgbToHex(r, g, b);
		updateColor(newHex);
	}

	// Update color and save to recent colors
	function updateColor(newColor: string) {
		if (!isValidHex(newColor)) return;

		onchange?.(newColor);

		// Add to recent colors
		const cleanColor = newColor.toUpperCase();
		const filtered = recentColors.filter((c) => c !== cleanColor);
		const updated = [cleanColor, ...filtered].slice(0, MAX_RECENT);
		recentColors = updated;

		if (typeof window !== 'undefined') {
			localStorage.setItem(RECENT_COLORS_KEY, JSON.stringify(updated));
		}
	}

	// Apply preset color
	function applyPreset(color: string) {
		updateColor(color);
	}

	// Apply recent color
	function applyRecent(color: string) {
		updateColor(color);
	}

	// Remove from recent colors
	function removeRecent(color: string) {
		recentColors = recentColors.filter((c) => c !== color);
		if (typeof window !== 'undefined') {
			localStorage.setItem(RECENT_COLORS_KEY, JSON.stringify(recentColors));
		}
	}
</script>

<div class="w-full space-y-4 p-4">
	<!-- Live Preview Swatch -->
	<div class="space-y-2">
		<Label>Color</Label>
		<div class="flex gap-2 items-center">
			<div
				class="w-16 h-16 rounded border-2 border-gray-200"
				style="background-color: {value}"
				title={value}
			></div>
			<div class="flex-1 space-y-1">
				<div class="text-sm font-mono text-gray-600">{value?.toUpperCase()}</div>
			</div>
		</div>
	</div>

	<!-- Hex Input -->
	<div class="space-y-2">
		<Label for="hex-input">Hex Code</Label>
		<div class="flex gap-2">
			<span class="text-sm text-gray-500 font-mono pt-2">#</span>
			<Input
				type="text"
				value={hexInput}
				onchange={handleHexChange}
				placeholder="3b82f6"
				class="font-mono text-sm"
			/>
		</div>
	</div>

	<!-- RGB Sliders -->
	<div class="space-y-3">
		<Label>RGB</Label>

		<!-- Red Slider -->
		<div class="space-y-1">
			<div class="flex justify-between items-center">
				<label for="slider-r" class="text-sm text-gray-600">R</label>
				<span class="text-sm font-mono bg-gray-100 px-2 py-1 rounded">{rValue}</span>
			</div>
			<Slider
				value={rValue}
				type="single"
				onchange={(r) => handleRgbChange(r, gValue, bValue)}
				min={0}
				max={255}
				step={1}
			/>
		</div>

		<!-- Green Slider -->
		<div class="space-y-1">
			<div class="flex justify-between items-center">
				<label for="slider-g" class="text-sm text-gray-600">G</label>
				<span class="text-sm font-mono bg-gray-100 px-2 py-1 rounded">{gValue}</span>
			</div>
			<Slider
				value={gValue}
				type="single"
				onchange={(g) => handleRgbChange(rValue, g, bValue)}
				min={0}
				max={255}
				step={1}
			/>
		</div>

		<!-- Blue Slider -->
		<div class="space-y-1">
			<div class="flex justify-between items-center">
				<label for="slider-b" class="text-sm text-gray-600">B</label>
				<span class="text-sm font-mono bg-gray-100 px-2 py-1 rounded">{bValue}</span>
			</div>
			<Slider
				value={bValue}
				type="single"
				onchange={(b) => handleRgbChange(rValue, gValue, b)}
				min={0}
				max={255}
				step={1}
			/>
		</div>
	</div>

	<!-- Preset Colors -->
	<div class="space-y-2">
		<Label>Presets</Label>
		<div class="grid grid-cols-6 gap-2">
			{#each PRESET_COLORS as color (color)}
				<button
					onclick={() => applyPreset(color)}
					class="w-8 h-8 rounded border-2 transition-all hover:scale-110 {color === value
						? 'border-gray-900 ring-2 ring-offset-2'
						: 'border-gray-200'}"
					style="background-color: {color}"
					title={color}
					aria-label="Color {color}"
				></button>
			{/each}
		</div>
	</div>

	<!-- Recent Colors -->
	{#if recentColors.length > 0}
		<div class="space-y-2">
			<Label>Recent</Label>
			<div class="flex flex-wrap gap-2">
				{#each recentColors as color (color)}
					<div class="relative group">
						<button
							onclick={() => applyRecent(color)}
							class="w-8 h-8 rounded border-2 transition-all hover:scale-110 {color === value
								? 'border-gray-900 ring-2 ring-offset-2'
								: 'border-gray-200'}"
							style="background-color: {color}"
							title={color}
							aria-label="Color {color}"
						></button>
						<button
							onclick={() => removeRecent(color)}
							class="absolute -top-2 -right-2 bg-red-500 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
							aria-label="Remove {color}"
						>
							<X class="w-3 h-3 text-white" />
						</button>
					</div>
				{/each}
			</div>
		</div>
	{/if}
</div>

<style>
	:global(.color-picker-popover) {
		max-width: 320px;
	}
</style>
