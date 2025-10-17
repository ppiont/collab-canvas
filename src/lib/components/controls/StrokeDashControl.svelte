<script lang="ts">
	import { Label } from '$lib/components/ui/label';

	interface Props {
		value: number[] | undefined;
		onchange?: (dash: number[]) => void;
	}

	let { value, onchange }: Props = $props();

	const dashStyles = [
		{ id: 'solid', label: 'Solid', dash: [] },
		{ id: 'dashed', label: 'Dashed', dash: [10, 5] },
		{ id: 'dotted', label: 'Dotted', dash: [2, 4] }
	];

	const currentStyle = $derived(
		dashStyles.find(
			(s) =>
				(s.dash.length === 0 && (!value || value.length === 0)) ||
				(s.dash.length > 0 && JSON.stringify(s.dash) === JSON.stringify(value))
		)?.id ?? 'solid'
	);

	function handleChange(e: Event) {
		const styleId = (e.target as HTMLSelectElement).value;
		const style = dashStyles.find((s) => s.id === styleId);
		if (style) {
			onchange?.(style.dash);
		}
	}
</script>

<div class="space-y-2">
	<Label for="stroke-style-select">Stroke Style</Label>
	<select
		id="stroke-style-select"
		value={currentStyle}
		onchange={handleChange}
		class="w-full px-2 py-1 border rounded text-sm bg-white"
	>
		{#each dashStyles as style (style.id)}
			<option value={style.id}>{style.label}</option>
		{/each}
	</select>
</div>
