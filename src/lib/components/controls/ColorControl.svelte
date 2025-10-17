<script lang="ts">
	import { Popover, PopoverContent, PopoverTrigger } from '$lib/components/ui/popover';
	import { Label } from '$lib/components/ui/label';
	import { Input } from '$lib/components/ui/input';
	import ColorPicker from '$lib/components/ui/ColorPicker.svelte';
	import { Button } from '$lib/components/ui/button';
	import { ChevronDown } from 'lucide-svelte';

	interface Props {
		label: string;
		value: string | null;
		enabled?: boolean; // Whether the color is active
		onchange?: (color: string | null) => void;
		onEnabledChange?: (enabled: boolean) => void; // Callback for toggle changes
		allowNone?: boolean;
	}

	let {
		label,
		value = '#3b82f6',
		enabled = true,
		onchange,
		onEnabledChange,
		allowNone = false
	}: Props = $props();

	function handleColorChange(newColor: string) {
		onchange?.(newColor);
	}

	function handleHexInput(e: Event) {
		const target = e.target as HTMLInputElement;
		let hex = target.value.trim();

		// Add # if missing
		if (!hex.startsWith('#')) {
			hex = '#' + hex;
		}

		// Validate hex format (3 or 6 digits)
		if (/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(hex)) {
			onchange?.(hex);
		}
	}

	function handleHexFocus(e: Event) {
		const target = e.target as HTMLInputElement;
		target.select();
	}

	function handleToggleEnabled(e: Event) {
		const checked = (e.target as HTMLInputElement).checked;
		onEnabledChange?.(checked);
	}
</script>

<div class="space-y-2">
	<Label>{label}</Label>
	<div class="flex gap-2 items-center">
		{#if allowNone}
			<input type="checkbox" checked={enabled} onchange={handleToggleEnabled} class="w-4 h-4" />
		{/if}

		{#if value}
			<div
				class="w-10 h-10 rounded border-2 border-gray-200 flex-shrink-0"
				style="background-color: {value}"
				title={value}
			></div>
		{:else}
			<div
				class="w-10 h-10 rounded border-2 border-dashed border-gray-300 flex items-center justify-center flex-shrink-0"
			>
				<span class="text-xs text-gray-400">None</span>
			</div>
		{/if}

		<Input
			type="text"
			value={value ?? ''}
			onchange={handleHexInput}
			onfocus={handleHexFocus}
			class="text-sm font-mono flex-1"
			disabled={allowNone && !enabled}
		/>

		<Popover>
			<PopoverTrigger>
				{#snippet child({ props })}
					<Button {...props} variant="outline" size="sm" class="w-10 h-10 p-0">
						<ChevronDown class="w-4 h-4" />
					</Button>
				{/snippet}
			</PopoverTrigger>
			<PopoverContent class="w-80 p-0">
				<ColorPicker value={value ?? '#3b82f6'} onchange={handleColorChange} />
			</PopoverContent>
		</Popover>
	</div>
</div>
