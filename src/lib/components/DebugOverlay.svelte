<script lang="ts">
	/**
	 * Debug Overlay - Performance Statistics
	 * Shows viewport culling stats and other debug info
	 *
	 * Usage: Press '~' key to toggle
	 */

	import { onMount } from 'svelte';
	import type { ShapeRenderer } from '$lib/canvas/shapes/ShapeRenderer';

	let { shapeRenderer, shapesCount } = $props<{
		shapeRenderer: ShapeRenderer | null;
		shapesCount: number;
	}>();

	let visible = $state(false);
	let cullingStats = $state<ReturnType<NonNullable<typeof shapeRenderer>['getCullingStats']>>(null);

	// Toggle with ~ key
	onMount(() => {
		function handleKeydown(e: KeyboardEvent) {
			if (e.key === '`' || e.key === '~') {
				visible = !visible;
			}
		}

		window.addEventListener('keydown', handleKeydown);
		return () => window.removeEventListener('keydown', handleKeydown);
	});

	// Update stats periodically
	$effect(() => {
		if (visible && shapeRenderer) {
			const interval = setInterval(() => {
				cullingStats = shapeRenderer.getCullingStats();
			}, 100); // Update every 100ms

			return () => clearInterval(interval);
		}
	});
</script>

{#if visible}
	<div class="debug-overlay">
		<div class="debug-header">
			<span class="debug-title">Debug Info</span>
			<span class="debug-hint">Press ~ to hide</span>
		</div>

		<div class="debug-section">
			<div class="debug-label">Total Shapes:</div>
			<div class="debug-value">{shapesCount}</div>
		</div>

		{#if cullingStats}
			<div class="debug-section">
				<div class="debug-label">Visible Shapes:</div>
				<div class="debug-value">{cullingStats.visibleShapes}</div>
			</div>

			<div class="debug-section">
				<div class="debug-label">Culled Shapes:</div>
				<div class="debug-value">{cullingStats.culledShapes}</div>
			</div>

			<div class="debug-section">
				<div class="debug-label">Culling Ratio:</div>
				<div class="debug-value">{Math.round(cullingStats.cullingRatio * 100)}%</div>
			</div>

			{#if cullingStats.cullingRatio > 0}
				<div class="debug-performance">
					<div class="debug-label">Performance Gain:</div>
					<div class="debug-value performance-good">
						~{Math.round(cullingStats.cullingRatio * 100)}% fewer renders
					</div>
				</div>
			{/if}
		{:else}
			<div class="debug-section">
				<div class="debug-label">Viewport Culling:</div>
				<div class="debug-value">Inactive ({shapesCount} shapes)</div>
			</div>
		{/if}
	</div>
{/if}

<style>
	.debug-overlay {
		position: fixed;
		top: 80px;
		right: 20px;
		z-index: 9999;
		background: rgba(0, 0, 0, 0.9);
		color: #00ff00;
		padding: 12px 16px;
		border-radius: 8px;
		font-family: 'Courier New', monospace;
		font-size: 12px;
		min-width: 240px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
		backdrop-filter: blur(4px);
	}

	.debug-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 12px;
		padding-bottom: 8px;
		border-bottom: 1px solid rgba(0, 255, 0, 0.3);
	}

	.debug-title {
		font-weight: bold;
		font-size: 14px;
		color: #00ff00;
	}

	.debug-hint {
		font-size: 10px;
		color: rgba(0, 255, 0, 0.6);
	}

	.debug-section {
		display: flex;
		justify-content: space-between;
		margin-bottom: 6px;
	}

	.debug-performance {
		display: flex;
		justify-content: space-between;
		margin-top: 8px;
		padding-top: 8px;
		border-top: 1px solid rgba(0, 255, 0, 0.2);
	}

	.debug-label {
		color: rgba(0, 255, 0, 0.8);
	}

	.debug-value {
		color: #00ff00;
		font-weight: bold;
	}

	.performance-good {
		color: #00ff00;
		text-shadow: 0 0 4px rgba(0, 255, 0, 0.5);
	}
</style>
