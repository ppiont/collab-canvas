<script lang="ts">
	import { onMount } from 'svelte';
	import Toolbar from '$lib/components/Toolbar.svelte';
	import ConnectionStatus from '$lib/components/ConnectionStatus.svelte';
	import PropertiesPanel from '$lib/components/PropertiesPanel.svelte';
	import CommandPalette from '$lib/components/CommandPalette.svelte';

	// Import managers
	import { CanvasEngine } from '$lib/canvas/core/CanvasEngine';
	import { ViewportManager } from '$lib/canvas/core/ViewportManager';
	import { SelectionManager } from '$lib/canvas/core/SelectionManager';
	import { CursorManager } from '$lib/canvas/collaboration/CursorManager';
	import { ShapeRenderer } from '$lib/canvas/shapes/ShapeRenderer';
	import { ShapeFactory } from '$lib/canvas/shapes/ShapeFactory';
	import { CanvasEventHandlers } from '$lib/canvas/core/EventHandlers';

	// Import stores and collaboration
	import { shapes, shapeOperations, initializeShapesSync } from '$lib/stores/shapes';
	import { initializeProvider, disconnectProvider, provider, shapesMap } from '$lib/collaboration';
	import { CANVAS } from '$lib/constants';
	import type { Shape } from '$lib/types/shapes';
	import { activeTool, isCreateToolActive } from '$lib/stores/tool';

	let { data } = $props();

	// Manager instances
	let canvasEngine: CanvasEngine;
	let viewportManager: ViewportManager;
	let selectionManager: SelectionManager;
	let cursorManager: CursorManager;
	let shapeRenderer: ShapeRenderer;
	let eventHandlers: CanvasEventHandlers;

	// Component state
	let containerDiv: HTMLDivElement;
	let isCreateMode = $derived($isCreateToolActive);
	let stageScale = $state(1);
	let maxZIndex = $state(0);
	let selectedShapeId = $state<string | null>(null);
	let commandPaletteOpen = $state(false);

	// Helper function to create shapes based on active tool
	function createShapeAtPosition(x: number, y: number): Shape | null {
		const tool = $activeTool;

		// Use ShapeFactory for all shape creation
		if (tool === 'select' || tool === 'pan') {
			return null;
		}

		try {
			return ShapeFactory.create(
				tool,
				{
					x,
					y,
					fill: '#3b82f6',
					stroke: '#1e3a8a',
					strokeWidth: 2,
					zIndex: maxZIndex + 1
				},
				data.user.id
			);
		} catch (error) {
			console.error('Failed to create shape:', error);
			return null;
		}
	}

	// Render shapes when they change
	$effect(() => {
		if (shapeRenderer && $shapes) {
			shapeRenderer.renderShapes($shapes);
			// Update maxZIndex
			if ($shapes.length > 0) {
				maxZIndex = Math.max(...$shapes.map((s) => s.zIndex || 0), maxZIndex);
			}

			// Update transformer after shapes are rendered
			if (selectionManager) {
				selectionManager.updateTransformerAttachment();
			}
		}
	});

	onMount(() => {
		// Initialize canvas dimensions
		const width = window.innerWidth;
		const height = window.innerHeight;

		// Initialize canvas engine
		canvasEngine = new CanvasEngine(containerDiv, {
			width,
			height,
			gridSize: CANVAS.GRID_SIZE,
			gridColor: CANVAS.GRID_COLOR,
			backgroundColor: CANVAS.BACKGROUND_COLOR
		});

		const { stage, layers } = canvasEngine.initialize();

		// Initialize viewport manager
		viewportManager = new ViewportManager(stage);
		viewportManager.setOnViewportChange((viewport) => {
			stageScale = viewport.scale;
			// Update cursor positions when viewport changes
			if (cursorManager) {
				cursorManager.broadcastCurrentPosition();
			}
		});

		// Initialize selection manager
		selectionManager = new SelectionManager(stage, layers.shapes);
		selectionManager.setOnSelectionChange((selectedIds) => {
			selectedShapeId = selectedIds.length > 0 ? selectedIds[0] : null;
		});
		selectionManager.setOnDelete((ids) => {
			ids.forEach((id) => shapeOperations.delete(id));
		});

		// Initialize shape renderer
		shapeRenderer = new ShapeRenderer(layers.shapes, stage);
		shapeRenderer.setLocalUserId(data.user.id);
		shapeRenderer.setCreateMode(isCreateMode);
		shapeRenderer.setCallbacks({
			onShapeUpdate: (id, changes) => {
				shapeOperations.update(id, changes);
			},
			onShapeSelect: (id) => {
				selectionManager.select(id);
			},
			onBroadcastCursor: () => {
				cursorManager?.broadcastCursorImmediate();
			},
			getMaxZIndex: () => maxZIndex
		});

		// Initialize cursor manager
		cursorManager = new CursorManager(stage, layers.cursors);

		// Initialize Yjs sync
		initializeShapesSync(shapesMap);

		// Initialize provider
		initializeProvider(data.user.id, data.userProfile.displayName, data.userProfile.color);

		// Wait for provider to be ready, then initialize cursor manager
		const unsubscribeProvider = provider.subscribe((providerValue) => {
			if (providerValue?.awareness && cursorManager) {
				cursorManager.initialize(providerValue.awareness, data.user.id, width, height);
			}
		});

		// Initialize event handlers
		eventHandlers = new CanvasEventHandlers(
			stage,
			viewportManager,
			selectionManager,
			cursorManager,
			() => {
				// Must get fresh value from store, not from closure
				return $isCreateToolActive;
			},
			(x, y) => {
				const newShape = createShapeAtPosition(x, y);
				if (newShape) {
					shapeOperations.add(newShape);
					maxZIndex++;
					// Switch back to select mode and select the new shape
					activeTool.set('select');
					selectionManager.select(newShape.id);
				}
			}
		);

		eventHandlers.setupWheelHandler();
		eventHandlers.setupMouseMoveHandler();
		eventHandlers.setupClickHandler();
		eventHandlers.setupDragHandlers();
		eventHandlers.setupKeyboardHandlers();

		// Window resize
		const handleResize = () => {
			const newWidth = window.innerWidth;
			const newHeight = window.innerHeight;
			canvasEngine.updateSize(newWidth, newHeight);
			cursorManager?.updateDimensions(newWidth, newHeight);
		};
		window.addEventListener('resize', handleResize);

		// Cleanup
		return () => {
			canvasEngine?.destroy();
			viewportManager?.destroy();
			selectionManager?.destroy();
			cursorManager?.destroy();
			shapeRenderer?.destroy();
			eventHandlers?.destroy();
			disconnectProvider();
			unsubscribeProvider();
			window.removeEventListener('resize', handleResize);
		};
	});

	// Update shape renderer when create mode changes
	$effect(() => {
		if (shapeRenderer) {
			shapeRenderer.setCreateMode(isCreateMode);
		}
		// Update canvas cursor based on create mode
		if (canvasEngine) {
			const stage = canvasEngine.getStage();
			stage.container().style.cursor = isCreateMode ? 'crosshair' : 'grab';
		}
	});

	// Handle user click from ConnectionStatus
	function handleUserClick(userId: string) {
		cursorManager?.centerOnUser(userId, true);
	}

	// Handle command palette open
	function openCommandPalette() {
		commandPaletteOpen = true;
	}
</script>

<div class="canvas-container">
	<!-- Toolbar -->
	<Toolbar onCommandPaletteOpen={openCommandPalette} />

	<!-- Connection Status -->
	<ConnectionStatus currentUserId={data.user.id} onUserClick={handleUserClick} />

	<!-- Properties Panel -->
	<PropertiesPanel />

	<!-- Command Palette -->
	<CommandPalette bind:open={commandPaletteOpen} />

	<!-- Zoom indicator -->
	<div class="zoom-indicator">
		{Math.round(stageScale * 100)}%
	</div>

	<!-- Konva container -->
	<div bind:this={containerDiv}></div>
</div>

<style>
	.canvas-container {
		position: fixed;
		top: 0;
		left: 0;
		width: 100vw;
		height: 100vh;
		overflow: hidden;
		background: #ffffff;
	}

	:global(body) {
		margin: 0;
		padding: 0;
		overflow: hidden;
	}

	.zoom-indicator {
		position: fixed;
		bottom: 20px;
		right: 20px;
		background: rgba(0, 0, 0, 0.7);
		color: white;
		padding: 8px 16px;
		border-radius: 8px;
		font-size: 14px;
		font-weight: 600;
		z-index: 1000;
		pointer-events: none;
		font-family:
			system-ui,
			-apple-system,
			sans-serif;
	}
</style>
