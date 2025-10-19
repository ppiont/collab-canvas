<script lang="ts">
	import { Label } from '$lib/components/ui/label';
	import type { BlendMode } from '$lib/types/shapes';

	interface Props {
		value: BlendMode | undefined;
		onchange?: (mode: BlendMode) => void;
	}

	let { value = 'normal', onchange }: Props = $props();

	const blendModes = [
		{ id: 'normal', label: 'Normal' },
		{ id: 'multiply', label: 'Multiply' },
		{ id: 'screen', label: 'Screen' },
		{ id: 'overlay', label: 'Overlay' },
		{ id: 'darken', label: 'Darken' },
		{ id: 'lighten', label: 'Lighten' }
	] as const;

	function handleChange(e: Event) {
		const newMode = (e.target as HTMLSelectElement).value as BlendMode;
		onchange?.(newMode);
	}
</script>

<div class="space-y-2">
	<Label for="blend-mode-select">Blend Mode</Label>
	<select {value} onchange={handleChange} class="w-full px-2 py-1 border rounded text-sm bg-white">
		{#each blendModes as mode (mode.id)}
			<option value={mode.id}>{mode.label}</option>
		{/each}
	</select>
</div>
