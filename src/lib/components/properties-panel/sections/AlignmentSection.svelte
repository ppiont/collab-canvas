<script lang="ts">
	/**
	 * Alignment Section Component
	 *
	 * Provides alignment and distribution tools for multiple selected shapes.
	 * Only visible when 2 or more shapes are selected.
	 *
	 * Features:
	 * - 6 alignment buttons (left, center, right, top, middle, bottom)
	 * - 2 distribution buttons (horizontal, vertical)
	 * - Grid layout matching Properties Panel design
	 * - Tooltips for each operation
	 * - Disabled state when insufficient shapes selected
	 */

	import type { Shape } from '$lib/types/shapes';
	import {
		AlignLeft,
		AlignCenter,
		AlignRight,
		AlignStartHorizontal,
		AlignCenterHorizontal,
		AlignEndHorizontal,
		AlignHorizontalSpaceAround,
		AlignVerticalSpaceAround
	} from 'lucide-svelte';

	// Props
	let {
		items = [],
		onAlign
	}: {
		items: Shape[];
		onAlign: (operation: string, shapeIds: string[]) => void;
	} = $props();

	// Reactive derived state
	const canAlign = $derived(items.length >= 2);
	const canDistribute = $derived(items.length >= 3);

	// Alignment operation handler
	function handleAlign(operation: string) {
		if (!canAlign) return;
		const shapeIds = items.map((item) => item.id);
		onAlign(operation, shapeIds);
	}
</script>

<div class="space-y-2">
	<!-- Alignment Grid -->
	<div>
		<p class="text-xs font-medium text-slate-700 mb-2">Align</p>
		<div class="grid grid-cols-3 gap-2">
			<!-- Align Left -->
			<button
				type="button"
				class="alignment-button"
				disabled={!canAlign}
				onclick={() => handleAlign('alignLeft')}
				title="Align Left"
				aria-label="Align Left"
			>
				<AlignLeft size={18} />
			</button>

			<!-- Align Center (Horizontal) -->
			<button
				type="button"
				class="alignment-button"
				disabled={!canAlign}
				onclick={() => handleAlign('alignCenter')}
				title="Align Center"
				aria-label="Align Center Horizontally"
			>
				<AlignCenter size={18} />
			</button>

			<!-- Align Right -->
			<button
				type="button"
				class="alignment-button"
				disabled={!canAlign}
				onclick={() => handleAlign('alignRight')}
				title="Align Right"
				aria-label="Align Right"
			>
				<AlignRight size={18} />
			</button>

			<!-- Align Top -->
			<button
				type="button"
				class="alignment-button"
				disabled={!canAlign}
				onclick={() => handleAlign('alignTop')}
				title="Align Top"
				aria-label="Align Top"
			>
				<AlignStartHorizontal size={18} />
			</button>

			<!-- Align Middle (Vertical) -->
			<button
				type="button"
				class="alignment-button"
				disabled={!canAlign}
				onclick={() => handleAlign('alignMiddle')}
				title="Align Middle"
				aria-label="Align Middle Vertically"
			>
				<AlignCenterHorizontal size={18} />
			</button>

			<!-- Align Bottom -->
			<button
				type="button"
				class="alignment-button"
				disabled={!canAlign}
				onclick={() => handleAlign('alignBottom')}
				title="Align Bottom"
				aria-label="Align Bottom"
			>
				<AlignEndHorizontal size={18} />
			</button>
		</div>
	</div>

	<!-- Distribution Grid -->
	<div>
		<p class="text-xs font-medium text-slate-700 mb-2">Distribute</p>
		<div class="grid grid-cols-2 gap-2">
			<!-- Distribute Horizontally -->
			<button
				type="button"
				class="alignment-button"
				disabled={!canDistribute}
				onclick={() => handleAlign('distributeHorizontally')}
				title="Distribute Horizontally"
				aria-label="Distribute Horizontally"
			>
				<AlignHorizontalSpaceAround size={18} />
			</button>

			<!-- Distribute Vertically -->
			<button
				type="button"
				class="alignment-button"
				disabled={!canDistribute}
				onclick={() => handleAlign('distributeVertically')}
				title="Distribute Vertically"
				aria-label="Distribute Vertically"
			>
				<AlignVerticalSpaceAround size={18} />
			</button>
		</div>
	</div>
</div>

<style>
	.alignment-button {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 8px;
		border-radius: 6px;
		background: white;
		border: 1px solid rgb(203 213 225); /* slate-300 */
		color: rgb(51 65 85); /* slate-700 */
		transition: all 0.15s ease-in-out;
		cursor: pointer;
	}

	.alignment-button:hover:not(:disabled) {
		background: rgb(248 250 252); /* slate-50 */
		border-color: rgb(148 163 184); /* slate-400 */
		color: rgb(30 41 59); /* slate-800 */
		transform: translateY(-1px);
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
	}

	.alignment-button:active:not(:disabled) {
		transform: translateY(0);
		box-shadow: none;
	}

	.alignment-button:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}
</style>
