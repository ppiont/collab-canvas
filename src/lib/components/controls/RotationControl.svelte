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

	// Handle slider changes - call onchange immediately with new value
	function handleSliderChange() {
		// Ensure value is within bounds
		const constrained = Math.max(-180, Math.min(180, rotationValue));
		rotationValue = constrained;
		
		// Call callback immediately with the new value
		onchange?.(constrained);
	}
</script>

<div class="space-y-2">
	<div class="flex justify-between items-center">
		<Label class="text-xs">Rotation</Label>
		<span class="text-xs font-mono bg-gray-100 px-2 py-1 rounded">{Math.round(rotationValue)}°</span>
	</div>
	<Slider
		type="single"
		bind:value={rotationValue}
		onchange={handleSliderChange}
		min={-180}
		max={180}
		step={1}
	/>
</div>
