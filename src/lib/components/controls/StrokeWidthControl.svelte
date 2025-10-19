<script lang="ts">
	import { Label } from '$lib/components/ui/label';
	import { Slider } from '$lib/components/ui/slider';
	import { Input } from '$lib/components/ui/input';

	interface Props {
		value: number;
		onchange?: (width: number) => void;
		min?: number;
		max?: number;
	}

	let { value = 2, onchange, min = 0, max = 20 }: Props = $props();

	// Derive display value from prop - no need for state/effects
	let displayValue = $derived(Math.round(value));

	function handleSliderChange(newValue: number) {
		const rounded = Math.round(newValue);
		onchange?.(rounded);
	}

	function handleInputChange(e: Event) {
		const target = e.target as HTMLInputElement;
		const num = parseInt(target.value, 10) || 0;
		const clamped = Math.max(min, Math.min(max, num));
		onchange?.(clamped);
	}

	function handleInputFocus(e: Event) {
		// Auto-select all text when input is focused
		const target = e.target as HTMLInputElement;
		target.select();
	}
</script>

<div class="space-y-2">
	<div class="flex justify-between items-center">
		<Label>Stroke Width</Label>
		<span class="text-sm font-mono bg-gray-100 px-2 py-1 rounded">{displayValue}px</span>
	</div>

	<Slider type="single" value={displayValue} {min} {max} step={1} onchange={handleSliderChange} />

	<Input
		type="number"
		value={displayValue}
		onchange={handleInputChange}
		onfocus={handleInputFocus}
		{min}
		{max}
		step="1"
		class="text-sm font-mono"
	/>
</div>
