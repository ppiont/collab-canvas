<script lang="ts">
	import { shapes, shapeOperations } from '$lib/stores/shapes';
	import { selectedShapeIds } from '$lib/stores/selection';
	import type { Shape, BlendMode } from '$lib/types/shapes';
	import ControlSection from './controls/ControlSection.svelte';
	import ColorControl from './controls/ColorControl.svelte';
	import StrokeWidthControl from './controls/StrokeWidthControl.svelte';
	import OpacityControl from './controls/OpacityControl.svelte';
	import BlendModeControl from './controls/BlendModeControl.svelte';
	import ShadowControl from './controls/ShadowControl.svelte';
	import { Input } from './ui/input';
	import { Label } from './ui/label';
	import { Slider } from './ui/slider';

	// Subscribe to stores
	let allShapes = $state<Shape[]>([]);
	let selectedIds = $state<Set<string>>(new Set());

	// Subscribe to store changes
	$effect(() => {
		const unsubscribeShapes = shapes.subscribe((s) => {
			allShapes = s;
		});
		const unsubscribeSelection = selectedShapeIds.subscribe((ids) => {
			selectedIds = ids;
		});
		return () => {
			unsubscribeShapes();
			unsubscribeSelection();
		};
	});

	// Get selected shapes
	const selectedShapes = $derived(allShapes.filter((s) => selectedIds.has(s.id)));

	// Check if property values are uniform across selected shapes
	function getUniformValue<K extends keyof Shape>(key: K): Shape[K] | 'mixed' | undefined {
		if (selectedShapes.length === 0) return undefined;
		if (selectedShapes.length === 1) return selectedShapes[0][key];

		const firstValue = selectedShapes[0][key];
		const allSame = selectedShapes.every((s) => s[key] === firstValue);
		return allSame ? firstValue : 'mixed';
	}

	// Update multiple shapes with new value
	function updateSelected<K extends keyof Shape>(key: K, value: Shape[K]) {
		selectedIds.forEach((id) => {
			shapeOperations.update(id, { [key]: value });
		});
	}

	const firstShape = $derived(selectedShapes[0]);
	const fill = $derived(getUniformValue('fill'));
	const stroke = $derived(getUniformValue('stroke'));
	const strokeWidth = $derived(getUniformValue('strokeWidth'));
	const opacity = $derived(getUniformValue('opacity'));
	const blendMode = $derived(getUniformValue('blendMode'));
	const shadow = $derived(getUniformValue('shadow'));
	const rotation = $derived(getUniformValue('rotation'));
	const x = $derived(getUniformValue('x'));
	const y = $derived(getUniformValue('y'));

	let rotationValue = $state(0);
	let fontSizeValue = $state(16);

	$effect(() => {
		if (rotation !== 'mixed') {
			rotationValue = (rotation as number) ?? 0;
		}
		if (firstShape && firstShape.type === 'text' && 'fontSize' in firstShape) {
			fontSizeValue = (firstShape as { fontSize: number }).fontSize || 16;
		}
	});
</script>

<!-- Floating Properties Panel -->
{#if selectedShapes.length > 0}
	<div
		class="fixed right-4 top-20 w-80 max-h-[calc(100vh-120px)] overflow-y-auto bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-40"
	>
		<!-- Header -->
		<div class="flex items-center justify-between mb-4">
			<h2 class="font-bold text-sm">
				{selectedShapes.length === 1 ? 'Properties' : `${selectedShapes.length} Objects`}
			</h2>
			<span class="text-xs text-gray-500">
				{selectedShapes.map((s) => s.type).join(', ')}
			</span>
		</div>

		<div class="space-y-3">
			<!-- Transform Section -->
			<ControlSection title="Transform" sectionId="transform">
				<!-- Position -->
				<div class="grid grid-cols-2 gap-2">
					<div class="space-y-1">
						<Label class="text-xs">X</Label>
						{#if x !== 'mixed'}
							<Input
								type="number"
								value={x ?? ''}
								onchange={(e) => {
									const val = parseInt((e.target as HTMLInputElement).value) || 0;
									updateSelected('x', val);
								}}
								class="text-sm"
							/>
						{:else}
							<Input disabled placeholder="mixed" class="text-sm" />
						{/if}
					</div>
					<div class="space-y-1">
						<Label class="text-xs">Y</Label>
						{#if y !== 'mixed'}
							<Input
								type="number"
								value={y ?? ''}
								onchange={(e) => {
									const val = parseInt((e.target as HTMLInputElement).value) || 0;
									updateSelected('y', val);
								}}
								class="text-sm"
							/>
						{:else}
							<Input disabled placeholder="mixed" class="text-sm" />
						{/if}
					</div>
				</div>

				<!-- Rotation -->
				{#if rotation !== 'mixed'}
					<div class="space-y-2">
						<div class="flex justify-between items-center">
							<Label class="text-xs">Rotation</Label>
							<span class="text-xs font-mono bg-gray-100 px-2 py-1 rounded">{rotation ?? 0}°</span>
						</div>
						<Slider
							type="multiple"
							value={[rotationValue]}
							onchange={() => updateSelected('rotation', rotationValue)}
							min={0}
							max={360}
							step={1}
						/>
					</div>
				{/if}
			</ControlSection>

			<!-- Fill Section -->
			<ControlSection title="Fill" sectionId="fill">
				{#if fill !== 'mixed'}
					<ColorControl
						label="Color"
						value={fill as string | null}
						onchange={(color: string | null) => updateSelected('fill', color ?? '')}
						allowNone={true}
					/>
				{:else}
					<div class="text-sm text-gray-500 py-2">Multiple colors</div>
				{/if}
			</ControlSection>

			<!-- Stroke Section -->
			<ControlSection title="Stroke" sectionId="stroke">
				{#if stroke !== 'mixed' || strokeWidth !== 'mixed'}
					{#if stroke !== 'mixed'}
						<ColorControl
							label="Color"
							value={stroke as string | null}
							onchange={(color: string | null) => updateSelected('stroke', color ?? '')}
							allowNone={true}
						/>
					{/if}

					{#if strokeWidth !== 'mixed'}
						<StrokeWidthControl
							value={(strokeWidth as number) ?? 2}
							onchange={(width) => updateSelected('strokeWidth', width)}
						/>
					{/if}
				{:else}
					<div class="text-sm text-gray-500 py-2">Mixed stroke properties</div>
				{/if}
			</ControlSection>

			<!-- Effects Section -->
			<ControlSection title="Effects" sectionId="effects">
				{#if opacity !== 'mixed'}
					<OpacityControl
						value={(opacity as number) ?? 1}
						onchange={(op) => updateSelected('opacity', op)}
					/>
				{/if}

				{#if blendMode !== 'mixed'}
					<BlendModeControl
						value={(blendMode as BlendMode | undefined) ?? 'normal'}
						onchange={(mode: string) => {
							selectedIds.forEach((id) => {
								shapeOperations.update(id, { blendMode: mode as BlendMode });
							});
						}}
					/>
				{/if}

				{#if shadow !== 'mixed'}
					<ShadowControl
						value={shadow as
							| { color: string; blur: number; offsetX: number; offsetY: number }
							| undefined}
						onchange={(s) => updateSelected('shadow', s)}
					/>
				{/if}
			</ControlSection>

			<!-- Shape-Specific Controls -->
			{#if selectedShapes.length === 1 && firstShape.type === 'text'}
				<ControlSection title="Text" sectionId="text-props">
					<div class="space-y-3">
						<div class="space-y-1">
							<Label class="text-xs" for="font-family">Font Family</Label>
							<select
								id="font-family"
								value={('fontFamily' in firstShape ? (firstShape.fontFamily as string) : 'Arial') ||
									'Arial'}
								onchange={(e) => {
									updateSelected(
										'fontFamily' as unknown as keyof Shape,
										e.currentTarget.value as unknown as Shape[keyof Shape]
									);
								}}
								class="w-full px-2 py-1 border rounded text-sm bg-white"
							>
								<option value="Arial">Arial</option>
								<option value="Times New Roman">Times New Roman</option>
								<option value="Courier New">Courier New</option>
								<option value="Georgia">Georgia</option>
								<option value="Verdana">Verdana</option>
							</select>
						</div>

						<div class="space-y-2">
							<div class="flex justify-between items-center">
								<Label class="text-xs">Font Size</Label>
								<span class="text-xs font-mono bg-gray-100 px-2 py-1 rounded">
									{fontSizeValue}px
								</span>
							</div>
							<Slider
								type="multiple"
								value={[fontSizeValue]}
								onchange={() => {
									updateSelected(
										'fontSize' as unknown as keyof Shape,
										fontSizeValue as unknown as Shape[keyof Shape]
									);
								}}
								min={8}
								max={144}
								step={1}
							/>
						</div>

						<div class="space-y-1">
							<Label class="text-xs" for="text-align">Alignment</Label>
							<select
								id="text-align"
								value={('align' in firstShape ? (firstShape.align as string) : 'left') || 'left'}
								onchange={(e) => {
									updateSelected(
										'align' as unknown as keyof Shape,
										e.currentTarget.value as unknown as Shape[keyof Shape]
									);
								}}
								class="w-full px-2 py-1 border rounded text-sm bg-white"
							>
								<option value="left">Left</option>
								<option value="center">Center</option>
								<option value="right">Right</option>
							</select>
						</div>
					</div>
				</ControlSection>
			{/if}
		</div>
	</div>
{/if}
