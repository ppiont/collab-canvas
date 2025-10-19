<script lang="ts">
	/**
	 * Dimensions Section Component
	 *
	 * Controls for width, height, position (x, y), and rotation.
	 * Handles mixed values across multiple selections.
	 *
	 * Spacing (8pt grid):
	 * - Between fields: 12px (space-y-3)
	 * - Grid gap: 8px (gap-2) between X/Y and W/H columns
	 *
	 * Features:
	 * - Mixed value handling with em dash
	 * - Arrow key increment/decrement
	 * - Auto-select on focus
	 * - Proper type checking for shape properties
	 */

	import type { Shape, RectangleShape, CircleShape } from '$lib/types/shapes';
	import { Input } from '$lib/components/ui/input';
	import { Slider } from '$lib/components/ui/slider';
	import FormField from '../FormField.svelte';

	// Props
	let {
		items = [],
		onUpdate = (items: Shape[]) => {}
	}: {
		items: Shape[];
		onUpdate: (items: Shape[]) => void;
	} = $props();

	// Local slider state for rotation (prevents bind issues with derived values)
	let rotationSliderValue = $state(0);

	// Cleanup on destroy
	let rotationTimeout: NodeJS.Timeout | null = null;

	$effect.pre(() => {
		return () => {
			if (rotationTimeout) {
				clearTimeout(rotationTimeout);
				rotationTimeout = null;
			}
		};
	});

	// Sync rotation slider when items change
	$effect(() => {
		// Force re-evaluation of dimensions
		void dimensions;
		// Update slider to reflect current rotation
		const currentRotation = dimensions.hasMixedRotation ? 0 : dimensions.rotation;
		rotationSliderValue = currentRotation;
	});

	// Helper to check if shape has width/height (rectangles, triangles, etc.)
	function hasWidthHeight(
		shape: Shape
	): shape is RectangleShape & { width: number; height: number } {
		return (
			'width' in shape &&
			'height' in shape &&
			typeof shape.width === 'number' &&
			typeof shape.height === 'number'
		);
	}

	// Helper to check if shape has radius (circles, polygons, stars)
	function hasRadius(shape: Shape): shape is CircleShape {
		return 'radius' in shape;
	}

	// Compute mixed states for each property
	const dimensions = $derived.by(() => {
		if (items.length === 0) {
			return {
				x: 0,
				y: 0,
				width: 0,
				height: 0,
				radius: 0,
				rotation: 0,
				hasMixedX: false,
				hasMixedY: false,
				hasMixedWidth: false,
				hasMixedHeight: false,
				hasMixedRadius: false,
				hasMixedRotation: false,
				hasWidth: false,
				hasRadius: false
			};
		}

		const first = items[0];
		const x = first.x;
		const y = first.y;
		const rotation = first.rotation || 0;

		// Check if any items have width/height or radius
		const hasWidth = items.some(hasWidthHeight);
		const hasRad = items.some(hasRadius);

		const width = hasWidthHeight(first) ? first.width : 0;
		const height = hasWidthHeight(first) ? first.height : 0;
		const radius = hasRadius(first) ? first.radius : 0;

		return {
			x,
			y,
			width,
			height,
			radius,
			rotation,
			hasMixedX: items.some((item) => item.x !== x),
			hasMixedY: items.some((item) => item.y !== y),
			hasMixedWidth: hasWidth && items.some((item) => hasWidthHeight(item) && item.width !== width),
			hasMixedHeight:
				hasWidth && items.some((item) => hasWidthHeight(item) && item.height !== height),
			hasMixedRadius: hasRad && items.some((item) => hasRadius(item) && item.radius !== radius),
			hasMixedRotation: items.some((item) => (item.rotation || 0) !== rotation),
			hasWidth,
			hasRadius: hasRad
		};
	});

	// Update functions
	function updateX(value: string) {
		const num = parseFloat(value);
		if (isNaN(num)) return;
		onUpdate(items.map((item) => ({ ...item, x: num })));
	}

	function updateY(value: string) {
		const num = parseFloat(value);
		if (isNaN(num)) return;
		onUpdate(items.map((item) => ({ ...item, y: num })));
	}

	function updateWidth(value: string) {
		const num = parseFloat(value);
		if (isNaN(num) || num <= 0) return;
		onUpdate(items.map((item) => (hasWidthHeight(item) ? { ...item, width: num } : item)));
	}

	function updateHeight(value: string) {
		const num = parseFloat(value);
		if (isNaN(num) || num <= 0) return;
		onUpdate(items.map((item) => (hasWidthHeight(item) ? { ...item, height: num } : item)));
	}

	function updateRadius(value: string) {
		const num = parseFloat(value);
		if (isNaN(num) || num <= 0) return;
		onUpdate(items.map((item) => (hasRadius(item) ? { ...item, radius: num } : item)));
	}

	function updateRotation(value: string) {
		const num = parseFloat(value);
		if (isNaN(num)) return;
		onUpdate(items.map((item) => ({ ...item, rotation: num })));
	}

	// Auto-select input text on focus
	function handleFocus(e: FocusEvent) {
		(e.target as HTMLInputElement).select();
	}

	// Arrow key increment/decrement
	function handleKeyDown(e: KeyboardEvent, updateFn: (value: string) => void) {
		const input = e.currentTarget as HTMLInputElement;
		const currentValue = parseFloat(input.value) || 0;

		if (e.key === 'ArrowUp') {
			e.preventDefault();
			const increment = e.shiftKey ? 10 : 1;
			input.value = String(currentValue + increment);
			updateFn(input.value);
		} else if (e.key === 'ArrowDown') {
			e.preventDefault();
			const decrement = e.shiftKey ? 10 : 1;
			input.value = String(currentValue - decrement);
			updateFn(input.value);
		}
	}

	// Safe rotation slider change handler with debouncing
	function handleRotationSliderChange(value: number) {
		if (typeof value !== 'number' || isNaN(value)) {
			return;
		}
		
		// Clear any pending updates
		if (rotationTimeout) {
			clearTimeout(rotationTimeout);
		}
		
		// Debounce slider updates to avoid multiple rapid updates
		rotationTimeout = setTimeout(() => {
			updateRotation(String(value));
			rotationTimeout = null;
		}, 0);
	}

	// Watch rotation slider changes with change detection
	let prevRotationSliderValue = $state(0);
	$effect(() => {
		// If the slider value changed AND it's different from the computed rotation
		if (rotationSliderValue !== prevRotationSliderValue && rotationSliderValue !== dimensions.rotation) {
			prevRotationSliderValue = rotationSliderValue;
			handleRotationSliderChange(rotationSliderValue);
		}
	});

</script>

<!-- 
  Spacing reference (8pt grid):
  - 12px = space-y-3 (between related fields)
  - 8px = gap-2 (between columns in grid)
-->
<div class="space-y-3">
	<!-- Position (X, Y) -->
	<div class="grid grid-cols-2 gap-2">
		<FormField id="pos-x" label="X" isMixed={dimensions.hasMixedX}>
			<div class="relative">
				<Input
					id="pos-x"
					type="number"
					value={dimensions.hasMixedX ? '' : Math.round(dimensions.x)}
					placeholder={dimensions.hasMixedX ? '—' : ''}
					onchange={(e) => updateX(e.currentTarget.value)}
					onfocus={handleFocus}
					onkeydown={(e) => handleKeyDown(e, updateX)}
					class="text-sm pr-8"
					aria-label="X position in pixels"
				/>
				<span
					class="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none"
				>
					px
				</span>
			</div>
		</FormField>

		<FormField id="pos-y" label="Y" isMixed={dimensions.hasMixedY}>
			<div class="relative">
				<Input
					id="pos-y"
					type="number"
					value={dimensions.hasMixedY ? '' : Math.round(dimensions.y)}
					placeholder={dimensions.hasMixedY ? '—' : ''}
					onchange={(e) => updateY(e.currentTarget.value)}
					onfocus={handleFocus}
					onkeydown={(e) => handleKeyDown(e, updateY)}
					class="text-sm pr-8"
					aria-label="Y position in pixels"
				/>
				<span
					class="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none"
				>
					px
				</span>
			</div>
		</FormField>
	</div>

	<!-- Size (Width/Height or Radius) -->
	{#if dimensions.hasWidth}
		<div class="grid grid-cols-2 gap-2">
			<FormField id="width" label="W" isMixed={dimensions.hasMixedWidth}>
				<div class="relative">
					<Input
						id="width"
						type="number"
						value={dimensions.hasMixedWidth ? '' : Math.round(dimensions.width)}
						placeholder={dimensions.hasMixedWidth ? '—' : ''}
						onchange={(e) => updateWidth(e.currentTarget.value)}
						onfocus={handleFocus}
						onkeydown={(e) => handleKeyDown(e, updateWidth)}
						class="text-sm pr-8"
						min={1}
						aria-label="Width in pixels"
					/>
					<span
						class="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none"
					>
						px
					</span>
				</div>
			</FormField>

			<FormField id="height" label="H" isMixed={dimensions.hasMixedHeight}>
				<div class="relative">
					<Input
						id="height"
						type="number"
						value={dimensions.hasMixedHeight ? '' : Math.round(dimensions.height)}
						placeholder={dimensions.hasMixedHeight ? '—' : ''}
						onchange={(e) => updateHeight(e.currentTarget.value)}
						onfocus={handleFocus}
						onkeydown={(e) => handleKeyDown(e, updateHeight)}
						class="text-sm pr-8"
						min={1}
						aria-label="Height in pixels"
					/>
					<span
						class="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none"
					>
						px
					</span>
				</div>
			</FormField>
		</div>
	{/if}

	{#if dimensions.hasRadius}
		<FormField id="radius" label="Radius" isMixed={dimensions.hasMixedRadius}>
			<div class="relative">
				<Input
					id="radius"
					type="number"
					value={dimensions.hasMixedRadius ? '' : Math.round(dimensions.radius)}
					placeholder={dimensions.hasMixedRadius ? '—' : ''}
					onchange={(e) => updateRadius(e.currentTarget.value)}
					onfocus={handleFocus}
					onkeydown={(e) => handleKeyDown(e, updateRadius)}
					class="text-sm pr-8"
					min={1}
					aria-label="Radius in pixels"
				/>
				<span
					class="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none"
				>
					px
				</span>
			</div>
		</FormField>
	{/if}

	<!-- Rotation -->
	<FormField id="rotation" label="Rotation" isMixed={dimensions.hasMixedRotation}>
		<div class="space-y-2">
			<!-- Slider -->
			<Slider
				type="single"
				bind:value={rotationSliderValue}
				min={-180}
				max={180}
				step={1}
				class="w-full"
				aria-label="Rotation in degrees"
			/>

			<!-- Input with ° unit -->
			<div class="relative">
				<Input
					id="rotation"
					type="number"
					value={dimensions.hasMixedRotation ? '' : Math.round(dimensions.rotation)}
					placeholder={dimensions.hasMixedRotation ? '—' : ''}
					onchange={(e) => updateRotation(e.currentTarget.value)}
					onfocus={handleFocus}
					onkeydown={(e) => handleKeyDown(e, updateRotation)}
					class="text-sm pr-8"
					min={-180}
					max={180}
					aria-label="Rotation in degrees"
				/>
				<span
					class="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none"
				>
					°
				</span>
			</div>
		</div>
	</FormField>
</div>

<!--
USAGE EXAMPLES:

1. Basic usage with rectangles:
<DimensionsSection 
  items={selectedRectangles}
  onUpdate={(updated) => updateShapes(updated)}
/>
// Shows: X, Y, Width, Height, Rotation

2. With circles:
<DimensionsSection 
  items={selectedCircles}
  onUpdate={(updated) => updateShapes(updated)}
/>
// Shows: X, Y, Radius, Rotation

3. Mixed selection (rectangles + circles):
<DimensionsSection 
  items={[...rectangles, ...circles]}
  onUpdate={(updated) => updateShapes(updated)}
/>
// Shows: X, Y (common), Width/Height/Radius (based on shapes), Rotation
// Mixed values show "—" placeholder

Features:
- Smart detection of width/height vs radius
- Mixed value handling with em dash (—)
- Arrow keys: ↑/↓ to increment/decrement (Shift for +10/-10)
- Auto-select text on focus for quick editing
- Unit labels (px, °) positioned in inputs
- Type-safe shape property checking
- Grid layout for space efficiency (2 columns)
- Min value validation (1px minimum for sizes)
- Rotation range: -180° to 180°
- Values rounded to integers for cleaner display
- ARIA labels for screen readers
-->
