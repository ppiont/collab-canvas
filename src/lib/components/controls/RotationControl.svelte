<script lang="ts">
	import { Label } from '$lib/components/ui/label';
	import { Slider } from '$lib/components/ui/slider';

	interface Props {
		value: number; // -180 to 180
		onchange?: (rotation: number) => void;
	}

	let { value = 0, onchange }: Props = $props();

	// Local state for rotation
	let rotationValue = $state(value);

	// Sync prop changes to local state (one-way: prop -> state)
	$effect(() => {
		rotationValue = Math.round(value);
	});

	// Watch for changes to rotationValue (from slider) and call onchange
	$effect(() => {
		onchange?.(Math.round(rotationValue));
	});
</script>

<div class="space-y-2">
	<div class="flex justify-between items-center">
		<Label class="text-xs">Rotation</Label>
		<span class="text-xs font-mono bg-gray-100 px-2 py-1 rounded">{Math.round(rotationValue)}°</span
		>
	</div>
	<Slider type="single" bind:value={rotationValue} min={-180} max={180} step={1} />
</div>
