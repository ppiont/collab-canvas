<script lang="ts">
	/**
	 * Effects Section Component
	 *
	 * Controls for opacity (slider + input) and blend mode (select dropdown).
	 * Handles mixed values across multiple selections.
	 *
	 * Spacing: 12px between related fields (space-y-3)
	 * Features:
	 * - Opacity slider (0-100%) with synchronized input
	 * - Blend mode dropdown with all CSS blend modes
	 * - Mixed value handling with em dash
	 * - Arrow key support for opacity input
	 */

	import type { Shape, BlendMode } from '$lib/types/shapes';
	import { Input } from '$lib/components/ui/input';
	import { Slider } from '$lib/components/ui/slider';
	import { Select, SelectContent, SelectItem, SelectTrigger } from '$lib/components/ui/select';
	import FormField from '../FormField.svelte';

	// Props
	let {
		items = [],
		onUpdate = (items: Shape[]) => {}
	}: {
		items: Shape[];
		onUpdate: (items: Shape[]) => void;
	} = $props();

	// Available blend modes
	const blendModes: BlendMode[] = [
		'normal',
		'multiply',
		'screen',
		'overlay',
		'darken',
		'lighten'
	];

	// Compute mixed states for effects properties
	const effects = $derived.by(() => {
		if (items.length === 0) {
			return {
				opacity: 100,
				blendMode: 'normal' as BlendMode,
				hasMixedOpacity: false,
				hasMixedBlendMode: false
			};
		}

		const first = items[0];
		const opacity = (first.opacity || 1) * 100; // Convert 0-1 to 0-100
		const blendMode = (first.blendMode || 'normal') as BlendMode;

		return {
			opacity,
			blendMode,
			hasMixedOpacity: items.some((item) => ((item.opacity || 1) * 100) !== opacity),
			hasMixedBlendMode: items.some((item) => (item.blendMode || 'normal') !== blendMode)
		};
	});

	// Update functions
	function updateOpacity(value: number) {
		// Clamp value between 0-100
		const clampedValue = Math.max(0, Math.min(100, value));
		onUpdate(items.map((item) => ({ ...item, opacity: clampedValue / 100 })));
	}

	function updateOpacityFromInput(value: string) {
		const num = parseFloat(value);
		if (isNaN(num)) return;
		updateOpacity(num);
	}

	function updateBlendMode(value: string) {
		onUpdate(items.map((item) => ({ ...item, blendMode: value as BlendMode })));
	}

	// Auto-select input text on focus
	function handleFocus(e: FocusEvent) {
		(e.target as HTMLInputElement).select();
	}

	// Arrow key increment/decrement for opacity
	function handleKeyDown(e: KeyboardEvent) {
		const input = e.currentTarget as HTMLInputElement;
		const currentValue = parseFloat(input.value) || 0;

		if (e.key === 'ArrowUp') {
			e.preventDefault();
			const increment = e.shiftKey ? 10 : 1;
			const newValue = Math.min(100, currentValue + increment);
			input.value = String(newValue);
			updateOpacity(newValue);
		} else if (e.key === 'ArrowDown') {
			e.preventDefault();
			const decrement = e.shiftKey ? 10 : 1;
			const newValue = Math.max(0, currentValue - decrement);
			input.value = String(newValue);
			updateOpacity(newValue);
		}
	}
</script>

<div class="space-y-3">
	<!-- Opacity -->
	<FormField id="opacity" label="Opacity" isMixed={effects.hasMixedOpacity}>
		<div class="space-y-2">
			<!-- Slider -->
			<Slider
				type="multiple"
				value={[effects.hasMixedOpacity ? 100 : effects.opacity]}
				onValueChange={(values: number[]) => updateOpacity(values[0])}
				min={0}
				max={100}
				step={1}
				class="w-full"
				aria-label="Opacity percentage"
			/>

			<!-- Input with % unit -->
			<div class="relative">
				<Input
					id="opacity"
					type="number"
					value={effects.hasMixedOpacity ? '' : Math.round(effects.opacity)}
					placeholder={effects.hasMixedOpacity ? '—' : ''}
					onchange={(e) => updateOpacityFromInput(e.currentTarget.value)}
					onfocus={handleFocus}
					onkeydown={handleKeyDown}
					class="text-sm pr-8"
					min={0}
					max={100}
					aria-label="Opacity percentage"
				/>
				<span
					class="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none"
				>
					%
				</span>
			</div>
		</div>
	</FormField>

	<!-- Blend Mode -->
	<FormField id="blend-mode" label="Blend Mode" isMixed={effects.hasMixedBlendMode}>
		<Select
			type="single"
			value={effects.blendMode}
			onValueChange={(value: string) => updateBlendMode(value)}
		>
			<SelectTrigger id="blend-mode" aria-label="Blend mode" class="capitalize">
				{#if effects.hasMixedBlendMode}
					<span class="text-muted-foreground">—</span>
				{:else}
					<span>{effects.blendMode}</span>
				{/if}
			</SelectTrigger>
			<SelectContent>
				{#each blendModes as mode}
					<SelectItem value={mode} class="capitalize">{mode}</SelectItem>
				{/each}
			</SelectContent>
		</Select>
	</FormField>
</div>

<!--
USAGE EXAMPLES:

1. Basic usage:
<EffectsSection 
  items={selectedShapes}
  onUpdate={(updated) => updateShapes(updated)}
/>

2. With mixed selection:
<EffectsSection 
  items={[...rectangles, ...circles]}
  onUpdate={(updated) => updateShapes(updated)}
/>
// Shows mixed indicators for differing values

Features:
- Opacity slider (0-100%) with synchronized input
- Blend mode dropdown with CSS blend modes
- Mixed value handling with em dash (—)
- Arrow keys: ↑/↓ to increment/decrement opacity by 1 (Shift for +10/-10)
- Auto-select text on focus for quick editing
- Slider and input stay synchronized
- Values clamped to 0-100% range
- FormField integration for consistent styling

Opacity Control:
- Slider for visual adjustment (0-100%)
- Input for precise numeric entry
- % unit label positioned in input
- Converts between UI (0-100) and internal (0-1) values
- Rounded to integers for cleaner display

Blend Mode Control:
- Dropdown select with available CSS blend modes
- Capitalized display for better readability
- Mixed state shows em dash placeholder
- Options: normal, multiply, screen, overlay, darken, lighten

Layout:
- 12px spacing between opacity and blend mode (space-y-3)
- 8px spacing between slider and input (space-y-2)
- Consistent with 8pt grid system

Interaction:
- Drag slider for opacity adjustment
- Type in input for precise values
- Use arrow keys for keyboard control
- Select blend mode from dropdown
- All controls support keyboard navigation
-->

