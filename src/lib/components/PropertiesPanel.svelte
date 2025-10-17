<script lang="ts">
	/**
	 * Properties Panel
	 * Right sidebar showing editable properties for selected shapes
	 */

	import { selectedShapes } from '$lib/stores/selection';
	import { shapeOperations } from '$lib/stores/shapes';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Slider } from '$lib/components/ui/slider';
	import { Separator } from '$lib/components/ui/separator';
	import { Button } from '$lib/components/ui/button';
	import { isRectangle, isCircle, isText } from '$lib/types/shapes';
	import type { Shape } from '$lib/types/shapes';

	let selected = $derived($selectedShapes);
	let shape = $derived<Shape | null>(selected.length === 1 ? selected[0] : null);

	function updateShape(updates: Partial<Shape>) {
		if (shape) {
			shapeOperations.update(shape.id, updates);
		}
	}
</script>

{#if shape}
	<div class="fixed right-0 top-0 z-10 h-screen w-80 overflow-y-auto border-l bg-white shadow-lg">
		<div class="space-y-6 p-4">
			<!-- Header -->
			<div>
				<h2 class="text-lg font-semibold">Properties</h2>
				<p class="text-sm text-muted-foreground">{shape.type}</p>
			</div>

			<Separator />

			<!-- Transform section -->
			<section class="space-y-3">
				<h3 class="text-sm font-semibold">Transform</h3>
				<div class="grid grid-cols-2 gap-3">
					<div class="space-y-2">
						<Label for="x">X</Label>
						<Input
							id="x"
							type="number"
							value={Math.round(shape.x)}
							onchange={(e: Event) =>
								updateShape({ x: Number((e.target as HTMLInputElement).value) })}
						/>
					</div>
					<div class="space-y-2">
						<Label for="y">Y</Label>
						<Input
							id="y"
							type="number"
							value={Math.round(shape.y)}
							onchange={(e: Event) =>
								updateShape({ y: Number((e.target as HTMLInputElement).value) })}
						/>
					</div>
				</div>

				<!-- Shape-specific dimensions -->
				{#if isRectangle(shape)}
					<div class="grid grid-cols-2 gap-3">
						<div class="space-y-2">
							<Label for="width">Width</Label>
							<Input
								id="width"
								type="number"
								value={Math.round(shape.width)}
								onchange={(e: Event) =>
									updateShape({ width: Number((e.target as HTMLInputElement).value) })}
							/>
						</div>
						<div class="space-y-2">
							<Label for="height">Height</Label>
							<Input
								id="height"
								type="number"
								value={Math.round(shape.height)}
								onchange={(e: Event) =>
									updateShape({ height: Number((e.target as HTMLInputElement).value) })}
							/>
						</div>
					</div>
				{/if}

				{#if isCircle(shape)}
					<div class="space-y-2">
						<Label for="radius">Radius</Label>
						<Input
							id="radius"
							type="number"
							value={Math.round(shape.radius)}
							onchange={(e: Event) =>
								updateShape({ radius: Number((e.target as HTMLInputElement).value) })}
						/>
					</div>
				{/if}

				<!-- Rotation -->
				<div class="space-y-2">
					<Label for="rotation">Rotation ({Math.round(shape.rotation || 0)}°)</Label>
					<Slider
						type="single"
						min={0}
						max={360}
						step={1}
						value={[shape.rotation || 0]}
						onValueChange={(values: number[]) => updateShape({ rotation: values[0] })}
					/>
				</div>
			</section>

			<Separator />

			<!-- Appearance section -->
			<section class="space-y-3">
				<h3 class="text-sm font-semibold">Appearance</h3>

				<!-- Fill Color -->
				<div class="space-y-2">
					<Label for="fill">Fill Color</Label>
					<Input
						id="fill"
						type="color"
						value={shape.fill || '#3b82f6'}
						onchange={(e: Event) => updateShape({ fill: (e.target as HTMLInputElement).value })}
					/>
				</div>

				<!-- Stroke -->
				<div class="space-y-2">
					<Label for="stroke">Stroke Color</Label>
					<Input
						id="stroke"
						type="color"
						value={shape.stroke || '#1e40af'}
						onchange={(e: Event) => updateShape({ stroke: (e.target as HTMLInputElement).value })}
					/>
				</div>

				<div class="space-y-2">
					<Label for="strokeWidth">Stroke Width ({shape.strokeWidth || 2}px)</Label>
					<Slider
						type="single"
						min={0}
						max={20}
						step={1}
						value={[shape.strokeWidth || 2]}
						onValueChange={(values: number[]) => updateShape({ strokeWidth: values[0] })}
					/>
				</div>

				<!-- Opacity -->
				<div class="space-y-2">
					<Label for="opacity">Opacity ({Math.round((shape.opacity || 1) * 100)}%)</Label>
					<Slider
						type="single"
						min={0}
						max={100}
						step={1}
						value={[(shape.opacity || 1) * 100]}
						onValueChange={(values: number[]) => updateShape({ opacity: values[0] / 100 })}
					/>
				</div>
			</section>

			<!-- Text-specific properties -->
			{#if isText(shape)}
				<Separator />
				<section class="space-y-3">
					<h3 class="text-sm font-semibold">Text</h3>
					<div class="space-y-2">
						<Label for="text">Content</Label>
						<Input
							id="text"
							type="text"
							value={shape.text}
							onchange={(e: Event) => updateShape({ text: (e.target as HTMLInputElement).value })}
						/>
					</div>
					<div class="space-y-2">
						<Label for="fontSize">Font Size ({shape.fontSize}px)</Label>
						<Slider
							type="single"
							min={8}
							max={144}
							step={1}
							value={[shape.fontSize]}
							onValueChange={(values: number[]) => updateShape({ fontSize: values[0] })}
						/>
					</div>

					<!-- Font Family -->
					<div class="space-y-2">
						<Label for="fontFamily">Font</Label>
						<select
							id="fontFamily"
							class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
							value={shape.fontFamily || 'system-ui'}
							onchange={(e: Event) =>
								updateShape({ fontFamily: (e.target as HTMLSelectElement).value })}
						>
							<option value="system-ui">System UI</option>
							<option value="Arial">Arial</option>
							<option value="Helvetica">Helvetica</option>
							<option value="Times New Roman">Times New Roman</option>
							<option value="Georgia">Georgia</option>
							<option value="Courier New">Courier New</option>
							<option value="monospace">Monospace</option>
							<option value="serif">Serif</option>
							<option value="sans-serif">Sans Serif</option>
						</select>
					</div>

					<!-- Text Style (Bold/Italic) -->
					<div class="space-y-2">
						<Label>Style</Label>
						<div class="flex gap-2">
							<Button
								variant={shape.fontStyle === 'bold' ? 'default' : 'outline'}
								size="sm"
								onclick={() => {
									const newStyle = shape.fontStyle === 'bold' ? 'normal' : 'bold';
									updateShape({ fontStyle: newStyle });
								}}
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="16"
									height="16"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
									stroke-linecap="round"
									stroke-linejoin="round"
									><path
										d="M6 12h9a4 4 0 0 1 0 8H7a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h7a4 4 0 0 1 0 8"
									/></svg
								>
							</Button>
							<Button
								variant={shape.fontStyle === 'italic' ? 'default' : 'outline'}
								size="sm"
								onclick={() => {
									const newStyle = shape.fontStyle === 'italic' ? 'normal' : 'italic';
									updateShape({ fontStyle: newStyle });
								}}
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="16"
									height="16"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
									stroke-linecap="round"
									stroke-linejoin="round"
									><line x1="19" x2="10" y1="4" y2="4" /><line
										x1="14"
										x2="5"
										y1="20"
										y2="20"
									/><line x1="15" x2="9" y1="4" y2="20" /></svg
								>
							</Button>
						</div>
					</div>

					<!-- Text Alignment -->
					<div class="space-y-2">
						<Label>Alignment</Label>
						<div class="flex gap-2">
							<Button
								variant={shape.align === 'left' ? 'default' : 'outline'}
								size="sm"
								onclick={() => updateShape({ align: 'left' })}
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="16"
									height="16"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
									stroke-linecap="round"
									stroke-linejoin="round"
									><line x1="21" x2="3" y1="6" y2="6" /><line x1="15" x2="3" y1="12" y2="12" /><line
										x1="17"
										x2="3"
										y1="18"
										y2="18"
									/></svg
								>
							</Button>
							<Button
								variant={shape.align === 'center' ? 'default' : 'outline'}
								size="sm"
								onclick={() => updateShape({ align: 'center' })}
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="16"
									height="16"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
									stroke-linecap="round"
									stroke-linejoin="round"
									><line x1="21" x2="3" y1="6" y2="6" /><line x1="17" x2="7" y1="12" y2="12" /><line
										x1="19"
										x2="5"
										y1="18"
										y2="18"
									/></svg
								>
							</Button>
							<Button
								variant={shape.align === 'right' ? 'default' : 'outline'}
								size="sm"
								onclick={() => updateShape({ align: 'right' })}
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="16"
									height="16"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
									stroke-linecap="round"
									stroke-linejoin="round"
									><line x1="21" x2="3" y1="6" y2="6" /><line x1="21" x2="9" y1="12" y2="12" /><line
										x1="21"
										x2="7"
										y1="18"
										y2="18"
									/></svg
								>
							</Button>
						</div>
					</div>
				</section>
			{/if}
		</div>
	</div>
{/if}
