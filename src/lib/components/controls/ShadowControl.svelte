<script lang="ts">
	import { Label } from '$lib/components/ui/label';
	import { Button } from '$lib/components/ui/button';
	import { Slider } from '$lib/components/ui/slider';
	import ColorPicker from '$lib/components/ui/ColorPicker.svelte';
	import { Popover, PopoverContent, PopoverTrigger } from '$lib/components/ui/popover';
	import { ChevronDown } from 'lucide-svelte';
	import type { ShadowConfig } from '$lib/types/shapes';

	interface Props {
		value: ShadowConfig | undefined;
		onchange?: (shadow: ShadowConfig | undefined) => void;
	}

	let { value, onchange }: Props = $props();

	const isEnabled = $derived(value !== undefined);
	const shadowValue = $derived(value ?? { color: '#000000', blur: 5, offsetX: 0, offsetY: 2 });

	let blurValue = $state(5);
	let offsetXValue = $state(0);
	let offsetYValue = $state(2);

	$effect(() => {
		if (isEnabled) {
			blurValue = shadowValue.blur;
			offsetXValue = shadowValue.offsetX;
			offsetYValue = shadowValue.offsetY;
		}
	});

	function toggleShadow(e: Event) {
		const checked = (e.target as HTMLInputElement).checked;
		if (checked) {
			onchange?.({ color: '#000000', blur: 5, offsetX: 0, offsetY: 2 });
		} else {
			onchange?.(undefined);
		}
	}

	function updateShadow(updates: Partial<ShadowConfig>) {
		if (!isEnabled) return;
		const newShadow = { ...shadowValue, ...updates };
		onchange?.(newShadow);
	}

	const presets = [
		{ name: 'Subtle', blur: 5, offsetX: 2, offsetY: 2 },
		{ name: 'Medium', blur: 10, offsetX: 4, offsetY: 4 },
		{ name: 'Heavy', blur: 20, offsetX: 8, offsetY: 8 }
	];

	function applyPreset(preset: (typeof presets)[0]) {
		updateShadow({
			blur: preset.blur,
			offsetX: preset.offsetX,
			offsetY: preset.offsetY
		});
	}
</script>

<div class="space-y-3 border rounded-lg p-3">
	<div class="flex items-center gap-2">
		<input
			type="checkbox"
			id="shadow-toggle"
			checked={isEnabled}
			onchange={toggleShadow}
			class="w-4 h-4"
		/>
		<Label for="shadow-toggle" class="mb-0 cursor-pointer">Shadow</Label>
	</div>

	{#if isEnabled}
		<div class="space-y-3 ml-6">
			<!-- Shadow Color -->
			<div class="space-y-2">
				<Label class="text-sm">Color</Label>
				<div class="flex gap-2 items-center">
					<div
						class="w-8 h-8 rounded border-2 border-gray-200"
						style="background-color: {shadowValue.color}"
					></div>
					<div class="text-sm font-mono text-gray-600 flex-1">
						{shadowValue.color.toUpperCase()}
					</div>

					<Popover>
						<PopoverTrigger asChild>
							<Button variant="outline" size="sm" class="w-8 h-8 p-0">
								<ChevronDown class="w-4 h-4" />
							</Button>
						</PopoverTrigger>
						<PopoverContent class="w-80 p-0">
							<ColorPicker
								value={shadowValue.color}
								onchange={(c) => updateShadow({ color: c })}
							/>
						</PopoverContent>
					</Popover>
				</div>
			</div>

			<!-- Blur -->
			<div class="space-y-1">
				<div class="flex justify-between items-center">
					<label for="shadow-blur" class="text-sm text-gray-600">Blur</label>
					<span class="text-sm font-mono bg-gray-100 px-2 py-1 rounded">{blurValue}px</span>
				</div>
				<Slider
					type="single"
					bind:value={blurValue}
					onchange={() => updateShadow({ blur: blurValue })}
					min={0}
					max={50}
					step={1}
				/>
			</div>

			<!-- Offset X -->
			<div class="space-y-1">
				<div class="flex justify-between items-center">
					<label for="shadow-offset-x" class="text-sm text-gray-600">Offset X</label>
					<span class="text-sm font-mono bg-gray-100 px-2 py-1 rounded">{offsetXValue}px</span>
				</div>
				<Slider
					type="single"
					bind:value={offsetXValue}
					onchange={() => updateShadow({ offsetX: offsetXValue })}
					min={-50}
					max={50}
					step={1}
				/>
			</div>

			<!-- Offset Y -->
			<div class="space-y-1">
				<div class="flex justify-between items-center">
					<label for="shadow-offset-y" class="text-sm text-gray-600">Offset Y</label>
					<span class="text-sm font-mono bg-gray-100 px-2 py-1 rounded">{offsetYValue}px</span>
				</div>
				<Slider
					type="single"
					bind:value={offsetYValue}
					onchange={() => updateShadow({ offsetY: offsetYValue })}
					min={-50}
					max={50}
					step={1}
				/>
			</div>

			<!-- Presets -->
			<div class="pt-2 border-t">
				<label class="text-sm text-gray-600 mb-2 block">Presets</label>
				<div class="flex gap-2 flex-wrap">
					{#each presets as preset (preset.name)}
						<Button variant="outline" size="sm" onclick={() => applyPreset(preset)} class="text-xs">
							{preset.name}
						</Button>
					{/each}
				</div>
			</div>
		</div>
	{/if}
</div>
