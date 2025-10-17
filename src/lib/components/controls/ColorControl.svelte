<script lang="ts">
	import { Popover, PopoverContent, PopoverTrigger } from '$lib/components/ui/popover';
	import { Label } from '$lib/components/ui/label';
	import ColorPicker from '$lib/components/ui/ColorPicker.svelte';
	import { Button } from '$lib/components/ui/button';
	import { ChevronDown } from 'lucide-svelte';

	interface Props {
		label: string;
		value: string | null;
		onchange?: (color: string | null) => void;
		allowNone?: boolean;
	}

	let { label, value = '#3b82f6', onchange, allowNone = false }: Props = $props();

	function handleColorChange(newColor: string) {
		onchange?.(newColor);
	}

	function handleClear() {
		onchange?.(null);
	}
</script>

<div class="space-y-2">
	<Label>{label}</Label>
	<div class="flex gap-2 items-center">
		{#if value}
			<div
				class="w-10 h-10 rounded border-2 border-gray-200 flex-shrink-0"
				style="background-color: {value}"
				title={value}
			></div>
			<div class="flex-1 text-sm font-mono text-gray-600">{value.toUpperCase()}</div>
		{:else}
			<div
				class="w-10 h-10 rounded border-2 border-dashed border-gray-300 flex items-center justify-center flex-shrink-0"
			>
				<span class="text-xs text-gray-400">None</span>
			</div>
			<div class="flex-1 text-sm text-gray-500">No fill</div>
		{/if}

		<Popover>
			<PopoverTrigger asChild let:builder>
				<!-- @ts-ignore asChild and builders are valid shadcn-svelte patterns -->
				<Button builders={[builder]} variant="outline" size="sm" class="w-10 h-10 p-0">
					<ChevronDown class="w-4 h-4" />
				</Button>
			</PopoverTrigger>
			<PopoverContent class="w-80 p-0">
				<ColorPicker value={value ?? '#3b82f6'} onchange={handleColorChange} />
			</PopoverContent>
		</Popover>

		{#if allowNone && value}
			<Button variant="ghost" size="sm" onclick={handleClear} class="text-xs">Clear</Button>
		{/if}
	</div>
</div>
