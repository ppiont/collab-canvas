<script lang="ts">
	import { Label } from '$lib/components/ui/label';
	import { Slider } from '$lib/components/ui/slider';
	import { Input } from '$lib/components/ui/input';

	interface Props {
		value: number; // 0-1
		onchange?: (opacity: number) => void;
	}

	let { value = 1, onchange }: Props = $props();

	// eslint-disable-next-line svelte/prefer-writable-derived
	let percentValue = $state(Math.round(value * 100));

	$effect(() => {
		// Sync prop changes but don't override local changes in progress
		percentValue = Math.round(value * 100);
	});

	function handleSliderChange() {
		// Immediately update local state for visual feedback
		const opacity = percentValue / 100;
		onchange?.(opacity);
	}

	function handleInputChange(e: Event) {
		const target = e.target as HTMLInputElement;
		const num = parseInt(target.value) || 0;
		const clamped = Math.max(0, Math.min(100, num));
		percentValue = clamped;
		onchange?.(clamped / 100);
	}
</script>

<div class="space-y-2">
	<div class="flex justify-between items-center">
		<Label>Opacity</Label>
		<span class="text-sm font-mono bg-gray-100 px-2 py-1 rounded">{percentValue}%</span>
	</div>

	<Slider
		type="single"
		bind:value={percentValue}
		onchange={handleSliderChange}
		min={0}
		max={100}
		step={1}
	/>

	<Input
		type="number"
		value={percentValue}
		onchange={handleInputChange}
		min="0"
		max="100"
		step="1"
		class="text-sm font-mono"
	/>
</div>
