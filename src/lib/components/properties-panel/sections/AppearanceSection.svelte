<script lang="ts">
	/**
	 * Appearance Section Component
	 *
	 * Controls for fill color, stroke color, and stroke width.
	 * Handles mixed values across multiple selections.
	 *
	 * Spacing: 12px between related fields (space-y-3)
	 * Features:
	 * - Fill color picker with enable/disable toggle
	 * - Stroke color picker with enable/disable toggle
	 * - Stroke width input with unit label
	 * - Shared recent colors for fill and stroke
	 * - Mixed value handling with em dash
	 */

	import type { Shape } from '$lib/types/shapes';
	import { Input } from '$lib/components/ui/input';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import FormField from '../FormField.svelte';
	import ColorPickerField from './ColorPickerField.svelte';

	// Props
	let {
		items = [],
		onUpdate = (items: Shape[]) => {}
	}: {
		items: Shape[];
		onUpdate: (items: Shape[]) => void;
	} = $props();

	// Recent colors shared between fill and stroke
	let recentColors = $state<string[]>([]);

	// Compute mixed states for appearance properties
	const appearance = $derived.by(() => {
		if (items.length === 0) {
			return {
				fill: '#000000',
				fillEnabled: true,
				stroke: '#000000',
				strokeEnabled: false,
				strokeWidth: 1,
				hasMixedFill: false,
				hasMixedFillEnabled: false,
				hasMixedStroke: false,
				hasMixedStrokeEnabled: false,
				hasMixedStrokeWidth: false
			};
		}

		const first = items[0];
		const fill = first.fill || '#000000';
		const fillEnabled = first.fillEnabled !== false; // Default true
		const stroke = first.stroke || '#000000';
		const strokeEnabled = first.strokeEnabled !== false; // Default true if stroke exists
		const strokeWidth = first.strokeWidth || 1;

		return {
			fill,
			fillEnabled,
			stroke,
			strokeEnabled,
			strokeWidth,
			hasMixedFill: items.some((item) => (item.fill || '#000000') !== fill),
			hasMixedFillEnabled: items.some((item) => (item.fillEnabled !== false) !== fillEnabled),
			hasMixedStroke: items.some((item) => (item.stroke || '#000000') !== stroke),
			hasMixedStrokeEnabled: items.some((item) => (item.strokeEnabled !== false) !== strokeEnabled),
			hasMixedStrokeWidth: items.some((item) => (item.strokeWidth || 1) !== strokeWidth)
		};
	});

	// Update functions
	function updateFill(color: string) {
		onUpdate(items.map((item) => ({ ...item, fill: color })));
	}

	function updateFillEnabled(enabled: boolean) {
		onUpdate(items.map((item) => ({ ...item, fillEnabled: enabled })));
	}

	function updateStroke(color: string) {
		onUpdate(items.map((item) => ({ ...item, stroke: color })));
	}

	function updateStrokeEnabled(enabled: boolean) {
		onUpdate(items.map((item) => ({ ...item, strokeEnabled: enabled })));
	}

	function updateStrokeWidth(value: string) {
		const num = parseFloat(value);
		if (isNaN(num) || num < 0) return;
		onUpdate(items.map((item) => ({ ...item, strokeWidth: num })));
	}

	// Auto-select input text on focus
	function handleFocus(e: FocusEvent) {
		(e.target as HTMLInputElement).select();
	}

	// Arrow key increment/decrement for stroke width
	function handleKeyDown(e: KeyboardEvent) {
		const input = e.currentTarget as HTMLInputElement;
		const currentValue = parseFloat(input.value) || 0;

		if (e.key === 'ArrowUp') {
			e.preventDefault();
			const increment = e.shiftKey ? 10 : 1;
			input.value = String(Math.max(0, currentValue + increment));
			updateStrokeWidth(input.value);
		} else if (e.key === 'ArrowDown') {
			e.preventDefault();
			const decrement = e.shiftKey ? 10 : 1;
			input.value = String(Math.max(0, currentValue - decrement));
			updateStrokeWidth(input.value);
		}
	}
</script>

<div class="space-y-3">
	<!-- Fill Color -->
	<div class="space-y-2">
		<div class="flex items-center justify-between">
			<label class="text-xs font-medium text-muted-foreground" for="fill-enabled"> Fill </label>
			<div class="flex items-center gap-2">
				{#if appearance.hasMixedFillEnabled}
					<span class="text-xs text-muted-foreground italic">Mixed</span>
				{/if}
				<Checkbox
					id="fill-enabled"
					checked={appearance.fillEnabled}
					onCheckedChange={(checked) => updateFillEnabled(checked === true)}
					aria-label="Enable fill"
				/>
			</div>
		</div>

		{#if appearance.fillEnabled || appearance.hasMixedFillEnabled}
			<FormField id="fill-color" label="" isMixed={appearance.hasMixedFill}>
				<ColorPickerField
					color={appearance.fill}
					label="Fill"
					onChange={updateFill}
					bind:recentColors
				/>
			</FormField>
		{/if}
	</div>

	<!-- Stroke Color -->
	<div class="space-y-2">
		<div class="flex items-center justify-between">
			<label class="text-xs font-medium text-muted-foreground" for="stroke-enabled"> Stroke </label>
			<div class="flex items-center gap-2">
				{#if appearance.hasMixedStrokeEnabled}
					<span class="text-xs text-muted-foreground italic">Mixed</span>
				{/if}
				<Checkbox
					id="stroke-enabled"
					checked={appearance.strokeEnabled}
					onCheckedChange={(checked) => updateStrokeEnabled(checked === true)}
					aria-label="Enable stroke"
				/>
			</div>
		</div>

		{#if appearance.strokeEnabled || appearance.hasMixedStrokeEnabled}
			<FormField id="stroke-color" label="" isMixed={appearance.hasMixedStroke}>
				<ColorPickerField
					color={appearance.stroke}
					label="Stroke"
					onChange={updateStroke}
					bind:recentColors
				/>
			</FormField>
		{/if}
	</div>

	<!-- Stroke Width -->
	{#if appearance.strokeEnabled || appearance.hasMixedStrokeEnabled}
		<FormField id="stroke-width" label="Stroke Width" isMixed={appearance.hasMixedStrokeWidth}>
			<div class="relative">
				<Input
					id="stroke-width"
					type="number"
					value={appearance.hasMixedStrokeWidth ? '' : appearance.strokeWidth}
					placeholder={appearance.hasMixedStrokeWidth ? '—' : ''}
					onchange={(e) => updateStrokeWidth(e.currentTarget.value)}
					onfocus={handleFocus}
					onkeydown={handleKeyDown}
					class="text-sm pr-8"
					min={0}
					step={0.5}
					aria-label="Stroke width in pixels"
				/>
				<span
					class="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none"
				>
					px
				</span>
			</div>
		</FormField>
	{/if}
</div>

<!--
USAGE EXAMPLES:

1. Basic usage:
<AppearanceSection 
  items={selectedShapes}
  onUpdate={(updated) => updateShapes(updated)}
/>

2. With mixed selection:
<AppearanceSection 
  items={[...rectangles, ...circles]}
  onUpdate={(updated) => updateShapes(updated)}
/>
// Shows mixed indicators for differing values

Features:
- Fill color picker with enable/disable checkbox
- Stroke color picker with enable/disable checkbox
- Stroke width input with arrow key support
- Shared recent colors between fill and stroke
- Conditional rendering (stroke width only when stroke enabled)
- Mixed value handling with em dash (—)
- Auto-select text on focus for quick editing
- Arrow keys: ↑/↓ to increment/decrement by 1 (Shift for +10/-10)
- Unit labels (px) positioned in inputs
- 0.5px step for precise stroke width control
- FormField integration for consistent styling
- Checkbox toggle for fill/stroke visibility

Layout:
- 12px spacing between sections (space-y-3)
- 8px spacing within sections (space-y-2)
- Checkbox aligned right with label
- "Mixed" indicator shown next to checkbox when applicable
- Color pickers only shown when enabled (or mixed state)
- Stroke width only shown when stroke enabled (or mixed state)

Interaction:
- Toggle checkboxes to enable/disable fill/stroke
- Click color swatch to open picker
- Choose colors from native picker
- Copy colors in multiple formats
- See contrast ratios and WCAG compliance
- Use recent colors for quick reuse
- Edit stroke width with keyboard or mouse
-->
