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

	// eslint-disable-next-line svelte/prefer-writable-derived
	let sliderValue = $state(value);

	$effect(() => {
		sliderValue = value;
	});

	function handleSliderChange() {
		onchange?.(sliderValue);
	}

	function handleInputChange(e: Event) {
		const target = e.target as HTMLInputElement;
		const num = parseInt(target.value) || 0;
		const clamped = Math.max(min, Math.min(max, num));
		onchange?.(clamped);
	}
</script>

<div class="space-y-2">
	<div class="flex justify-between items-center">
		<Label>Stroke Width</Label>
		<span class="text-sm font-mono bg-gray-100 px-2 py-1 rounded">{sliderValue}px</span>
	</div>

	<Slider
		type="single"
		bind:value={sliderValue}
		onchange={handleSliderChange}
		{min}
		{max}
		step={0.5}
	/>

	<Input
		type="number"
		value={sliderValue}
		onchange={handleInputChange}
		{min}
		{max}
		step="0.5"
		class="text-sm font-mono"
	/>
</div>
