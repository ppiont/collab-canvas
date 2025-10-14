<script lang="ts">
	/**
	 * Canvas Toolbar
	 * Provides UI controls for canvas operations
	 */

	let { isCreateMode = $bindable(false) } = $props();

	function toggleCreateMode() {
		isCreateMode = !isCreateMode;
	}
</script>

<div class="toolbar">
	<button
		class="toolbar-btn"
		class:active={isCreateMode}
		onclick={toggleCreateMode}
		title="Create Rectangle (click canvas to place)"
	>
		<svg
			width="20"
			height="20"
			viewBox="0 0 20 20"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
		>
			<rect x="3" y="3" width="14" height="14" rx="2" />
		</svg>
		<span>Create Rectangle</span>
	</button>
</div>

<style>
	.toolbar {
		position: fixed;
		top: 20px;
		left: 20px;
		z-index: 10;
		display: flex;
		gap: 0.5rem;
		background: rgba(255, 255, 255, 0.95);
		padding: 0.75rem;
		border-radius: 12px;
		box-shadow:
			0 4px 12px rgba(0, 0, 0, 0.1),
			0 0 0 1px rgba(0, 0, 0, 0.05);
		backdrop-filter: blur(8px);
	}

	.toolbar-btn {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.625rem 1rem;
		background: white;
		border: 2px solid #e2e8f0;
		border-radius: 8px;
		font-size: 0.875rem;
		font-weight: 600;
		color: #334155;
		cursor: pointer;
		transition: all 0.2s ease;
		font-family:
			system-ui,
			-apple-system,
			sans-serif;
	}

	.toolbar-btn:hover {
		background: #f8fafc;
		border-color: #cbd5e1;
		transform: translateY(-1px);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
	}

	.toolbar-btn.active {
		background: #667eea;
		color: white;
		border-color: #667eea;
		box-shadow:
			0 2px 8px rgba(102, 126, 234, 0.3),
			inset 0 1px 0 rgba(255, 255, 255, 0.2);
	}

	.toolbar-btn.active:hover {
		background: #5568d3;
		border-color: #5568d3;
	}

	.toolbar-btn svg {
		flex-shrink: 0;
	}
</style>
