<script lang="ts">
	import { Label } from '$lib/components/ui/label';
	import { Slider } from '$lib/components/ui/slider';

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

	// Watch for changes to percentValue (from slider) and call onchange
	$effect(() => {
		onchange?.(percentValue / 100);
	});
</script>

<div class="space-y-2">
	<div class="flex justify-between items-center">
		<Label>Opacity</Label>
		<span class="text-sm font-mono bg-gray-100 px-2 py-1 rounded">{percentValue}%</span>
	</div>

	<Slider
		type="single"
		bind:value={percentValue}
		min={0}
		max={100}
		step={1}
	/>
</div>
