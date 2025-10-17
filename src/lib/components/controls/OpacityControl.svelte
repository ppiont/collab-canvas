<script lang="ts">
	import { Label } from '$lib/components/ui/label';
	import { Slider } from '$lib/components/ui/slider';
	import { Input } from '$lib/components/ui/input';

	interface Props {
		value: number; // 0-1
		onchange?: (opacity: number) => void;
	}

	let { value = 1, onchange }: Props = $props();

	// Local state for percent value (0-100)
	let percentValue = $state(Math.round(value * 100));

	// Sync prop changes to local state
	$effect(() => {
		percentValue = Math.round(value * 100);
	});

	function handleSliderChange(e: Event) {
		const event = e as CustomEvent<{ value: number[] }>;
		const newPercent = event.detail.value[0];
		percentValue = newPercent;
		onchange?.(newPercent / 100);
	}

	function handleInputChange(e: Event) {
		const target = e.target as HTMLInputElement;
		const num = parseInt(target.value) || 0;
		const clamped = Math.max(0, Math.min(100, num));
		percentValue = clamped;
		onchange?.(clamped / 100);
	}

	function handleInputFocus(e: Event) {
		const target = e.target as HTMLInputElement;
		target.select();
	}
</script>

<div class="space-y-2">
	<div class="flex justify-between items-center">
		<Label>Opacity</Label>
		<span class="text-sm font-mono bg-gray-100 px-2 py-1 rounded">{percentValue}%</span>
	</div>

	<Slider
		type="single"
		value={[percentValue]}
		onchange={handleSliderChange}
		min={0}
		max={100}
		step={1}
	/>

	<Input
		type="number"
		value={percentValue}
		onchange={handleInputChange}
		onfocus={handleInputFocus}
		min="0"
		max="100"
		step="1"
		class="text-sm font-mono"
	/>
</div>
