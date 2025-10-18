<script lang="ts">
	import { onMount } from 'svelte';
	import Toolbar from '$lib/components/Toolbar.svelte';
	import ConnectionStatus from '$lib/components/ConnectionStatus.svelte';
	import CommandPalette from '$lib/components/CommandPalette.svelte';
	import KeyboardShortcuts from '$lib/components/KeyboardShortcuts.svelte';
	import DebugOverlay from '$lib/components/DebugOverlay.svelte';
	import Toast from '$lib/components/Toast.svelte';
	import PropertiesPanel from '$lib/components/PropertiesPanel.svelte';
	import { lineManager } from '$lib/canvas/line/LineManager.svelte';

	// Import managers
	import { CanvasEngine } from '$lib/canvas/core/CanvasEngine';
	import { ViewportManager } from '$lib/canvas/core/ViewportManager';
	import { SelectionManager } from '$lib/canvas/core/SelectionManager';
	import { CursorManager } from '$lib/canvas/collaboration/CursorManager';
	import { ShapeRenderer } from '$lib/canvas/shapes/ShapeRenderer';
	import { ShapeFactory } from '$lib/canvas/shapes/ShapeFactory';
	import { CanvasEventHandlers } from '$lib/canvas/core/EventHandlers';
	import { LiveShapeRenderer } from '$lib/canvas/collaboration/LiveShapeRenderer';

	// Import stores and collaboration
	import { shapes, shapeOperations, initializeShapesSync } from '$lib/stores/shapes';
	import {
		initializeProvider,
		disconnectProvider,
		provider,
		shapesMap,
		updateDraggedShape,
		clearDraggedShape
	} from '$lib/collaboration';
	import { viewport } from '$lib/stores/canvas';
	import { CANVAS } from '$lib/constants';
	import type { Shape } from '$lib/types/shapes';
	import { activeTool, isCreateToolActive } from '$lib/stores/tool';
	import { clipboardOperations } from '$lib/stores/clipboard';
	import { initializeUndoManager, history } from '$lib/stores/history';
	import { darkenColor } from '$lib/user-utils';
	import { selectedShapeIds } from '$lib/stores/selection';

	let { data } = $props();

	// Manager instances
	let canvasEngine: CanvasEngine;
	let viewportManager: ViewportManager;
	let selectionManager: SelectionManager;
	let cursorManager: CursorManager;
	let shapeRenderer = $state<ShapeRenderer | null>(null);
	let liveShapeRenderer = $state<LiveShapeRenderer | null>(null);
	let eventHandlers: CanvasEventHandlers;

	// Component state
	let containerDiv: HTMLDivElement;
	let isCreateMode = $derived($isCreateToolActive);
	let maxZIndex = $state(0);
	let commandPaletteOpen = $state(false);

	// Toast notification state
	let toastVisible = $state(false);
	let toastMessage = $state('');
	let toastTimeout: ReturnType<typeof setTimeout> | null = null;

	// Derive reactive values from stores (modern Svelte 5 pattern)
	let stageScale = $derived($viewport.scale);

	// State for shortcuts hint visibility
	let showShortcutsHint = $state(true);

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
					fill: data.userProfile.color, // Use user's color instead of hardcoded blue
					stroke: darkenColor(data.userProfile.color, 20), // Use a darker version of the user's color for the stroke outline
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

	// Helper function to create a line with accumulated points
	function createLineWithPoints(points: number[]): void {
		try {
			const newLine = ShapeFactory.create(
				'line',
				{
					x: 0,
					y: 0,
					points,
					fill: undefined,
					stroke: darkenColor(data.userProfile.color, 20),
					strokeWidth: 2,
					zIndex: maxZIndex + 1
				},
				data.user.id
			);
			shapeOperations.add(newLine);
			maxZIndex++;
			// Switch back to select mode and select the new line
			activeTool.set('select');
			selectionManager.select(newLine.id);
		} catch (error) {
			console.error('Failed to create line:', error);
		}
	}

	// Track last paste position for cumulative offsets
	let lastPasteOffset = { x: 0, y: 0 };

	// Copy selected shapes to clipboard
	// Show toast notification
	function showToast(message: string) {
		// Clear any existing timeout
		if (toastTimeout) {
			clearTimeout(toastTimeout);
		}

		// Show the toast
		toastMessage = message;
		toastVisible = true;

		// Auto-hide after 2 seconds
		toastTimeout = setTimeout(() => {
			toastVisible = false;
		}, 2000);
	}

	function copySelectedShapes() {
		if (!selectionManager) return;

		const selectedIds = selectionManager.getSelectedIds();
		if (selectedIds.length === 0) return;

		// Get the actual shape objects
		const selectedShapes = selectedIds
			.map((id) => $shapes.find((s) => s.id === id))
			.filter((s): s is Shape => s !== undefined);

		clipboardOperations.copy(selectedShapes);

		// Reset paste offset for new copy
		lastPasteOffset = { x: 0, y: 0 };
	}

	// Paste shapes from clipboard
	function pasteShapes() {
		const clipboardContent = clipboardOperations.getContents();
		if (clipboardContent.length === 0) return;

		const PASTE_OFFSET = 20; // Offset for pasted shapes
		const pastedIds: string[] = [];

		// Calculate cumulative offset
		lastPasteOffset.x += PASTE_OFFSET;
		lastPasteOffset.y += PASTE_OFFSET;

		clipboardContent.forEach((shape) => {
			// Create new shape with cumulative offset position
			const newShape: Shape = {
				...shape,
				id: crypto.randomUUID(), // New ID
				x: shape.x + lastPasteOffset.x,
				y: shape.y + lastPasteOffset.y,
				zIndex: maxZIndex + 1,
				createdBy: data.user.id,
				createdAt: Date.now(),
				modifiedAt: Date.now(),
				draggedBy: undefined // Clear drag state
			};

			shapeOperations.add(newShape);
			pastedIds.push(newShape.id);
			maxZIndex++;
		});

		// Select the newly pasted shapes
		if (selectionManager && pastedIds.length > 0) {
			setTimeout(() => {
				selectionManager.selectMultiple(pastedIds);
			}, 50);
		}
	}

	// Broadcast cursor when viewport changes (modern Svelte 5 reactivity)
	$effect(() => {
		// Track viewport changes to broadcast cursor
		void $viewport;

		// Broadcast cursor position when viewport changes
		if (cursorManager) {
			cursorManager.broadcastCurrentPosition();
		}
	});

	// Render shapes when they change or viewport changes
	$effect(() => {
		// Access $shapes at top level to ensure Svelte tracks the dependency
		const currentShapes = $shapes;
		const viewportState = $viewport; // Track viewport changes too

		if (shapeRenderer && selectionManager && currentShapes) {
			// Pass viewport for culling optimization (use reactive value, not store)
			shapeRenderer.renderShapes(currentShapes, viewportState);

			// Update maxZIndex
			if (currentShapes.length > 0) {
				maxZIndex = Math.max(...currentShapes.map((s) => s.zIndex || 0), maxZIndex);
			}

			// Check if selected shapes still exist after render (e.g., after undo delete)
			// If any selected shape was deleted, clear that selection
			const selectedIds = selectionManager.getSelectedIds();
			const shapeIdSet = new Set(currentShapes.map((s) => s.id));
			const deletedSelectedIds = selectedIds.filter((id) => !shapeIdSet.has(id));

			if (deletedSelectedIds.length > 0) {
				// Some selected shapes were deleted, remove them from selection
				deletedSelectedIds.forEach((id) => {
					selectionManager.removeFromSelection(id);
				});
			}

			// CRITICAL: Sync transformer after rendering to ensure it follows Yjs updates
			// This makes undo/redo work correctly on selected shapes
			selectionManager.syncTransformerFromYjs();
		}
	});

	onMount(() => {
		// Initialize canvas dimensions
		const width = window.innerWidth;
		const height = window.innerHeight;

		// Hide shortcuts hint after 10 seconds
		const hintTimeout = setTimeout(() => {
			showShortcutsHint = false;
		}, 10000);

		// Initialize canvas engine
		canvasEngine = new CanvasEngine(containerDiv, {
			width,
			height,
			gridSize: CANVAS.GRID_SIZE,
			gridColor: CANVAS.GRID_COLOR,
			backgroundColor: CANVAS.BACKGROUND_COLOR
		});

		const { stage, layers } = canvasEngine.initialize();

		// Initialize viewport manager (writes to store automatically)
		viewportManager = new ViewportManager(stage);

		// Initialize selection manager
		selectionManager = new SelectionManager(stage, layers.shapes);
		selectionManager.setOnSelectionChange((selectedIds) => {
			// Sync with the selectedShapeIds store for UI components like PropertiesPanel
			selectedShapeIds.set(new Set(selectedIds));
			// Update selection styling immediately
			if (shapeRenderer) {
				shapeRenderer.updateSelectionStyling(selectedIds, $shapes);
			}
		});
		selectionManager.setOnDelete((ids) => {
			ids.forEach((id) => shapeOperations.delete(id));
		});
		selectionManager.setOnShapeUpdate((id, changes) => {
			shapeOperations.update(id, changes);
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
			getSelectedIds: () => {
				return selectionManager.getSelectedIds();
			},
			getShapeById: (id: string) => {
				// Look up current shape from store to ensure fresh data in event handlers
				return $shapes.find((s) => s.id === id);
			},
			onBroadcastCursor: () => {
				cursorManager?.broadcastCursorImmediate();
			},
			// PHASE 7: Live shape drag broadcast
			onBroadcastShapeDrag: (id: string, position: { x: number; y: number; endDrag?: boolean }) => {
				if ((position as any).endDrag) {
					// dragend signal - clear from Awareness
					clearDraggedShape(id);
				} else {
					// dragmove - update live position in Awareness
					updateDraggedShape(id, position.x, position.y, data.user.id);
				}
			},
			getMaxZIndex: () => maxZIndex
		});

		// Wire transformer to shapeRenderer so it stays on top during renders
		const transformer = selectionManager.getTransformer();
		if (transformer) {
			shapeRenderer.setTransformer(transformer);
		}

		// Initialize cursor manager
		cursorManager = new CursorManager(stage, layers.cursors);

		// Initialize Yjs sync
		initializeShapesSync(shapesMap);

		// Initialize undo/redo (captures ALL shapesMap modifications)
		initializeUndoManager(shapesMap);

		// Initialize provider
		initializeProvider(data.user.id, data.userProfile.displayName, data.userProfile.color);

		// Wait for provider to be ready, then initialize cursor manager
		const unsubscribeProvider = provider.subscribe((providerValue) => {
			if (providerValue?.awareness && cursorManager) {
				cursorManager.initialize(providerValue.awareness, data.user.id, width, height);

				// PHASE 7, 3: Initialize live shape renderer for real-time drag feedback
				if (!liveShapeRenderer) {
					liveShapeRenderer = new LiveShapeRenderer(
						layers.shapes,
						stage,
						providerValue.awareness,
						shapesMap
					);
				}
			}
		});

		// Initialize event handlers
		eventHandlers = new CanvasEventHandlers(
			stage,
			layers.shapes,
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
			},
			(points) => {
				createLineWithPoints(points);
			},
			() => $shapes // Get all shapes for drag-net selection
		);

		eventHandlers.setupWheelHandler();
		eventHandlers.setupMouseMoveHandler();
		eventHandlers.setupClickHandler();
		eventHandlers.setupDragHandlers();
		eventHandlers.setupDragNetHandlers(); // Drag-net (marquee) selection
		eventHandlers.setupKeyboardHandlers();

		// Initialize LineManager with Yjs integration
		lineManager.setCallbacks(
			(points) => {
				// When line points change, sync to Yjs
				const lineId = lineManager.getSelectedLineId();
				if (lineId) {
					shapeOperations.update(lineId, { points });
				}
			},
			(id) => {
				// Get line shape from store for LineManager
				return $shapes.find((s) => s.id === id) as any;
			}
		);

		// Window resize
		const handleResize = () => {
			const newWidth = window.innerWidth;
			const newHeight = window.innerHeight;
			canvasEngine.updateSize(newWidth, newHeight);
			cursorManager?.updateDimensions(newWidth, newHeight);
		};
		window.addEventListener('resize', handleResize);

		// Copy/Paste keyboard shortcuts
		const handleCopyPaste = (e: KeyboardEvent) => {
			// Check if user is typing in an input field
			const target = e.target as HTMLElement;
			if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
				return;
			}

			// Cmd/Ctrl+C - Copy
			if ((e.metaKey || e.ctrlKey) && e.key === 'c') {
				e.preventDefault();
				copySelectedShapes();
			}

			// Cmd/Ctrl+V - Paste
			if ((e.metaKey || e.ctrlKey) && e.key === 'v') {
				e.preventDefault();
				pasteShapes();
			}
		};
		window.addEventListener('keydown', handleCopyPaste);

		// Undo/Redo keyboard shortcuts
		const handleUndoRedo = (e: KeyboardEvent) => {
			// Skip if typing in an input or textarea
			const target = e.target as HTMLElement;
			if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
				return;
			}

			const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
			const isCtrlOrCmd = isMac ? e.metaKey : e.ctrlKey;

			// Cmd/Ctrl+Z - Undo
			if (isCtrlOrCmd && e.key === 'z' && !e.shiftKey) {
				e.preventDefault();
				history.undo();
				showToast('Undid');
			}
			// Cmd/Ctrl+Shift+Z or Cmd/Ctrl+Y - Redo
			else if (isCtrlOrCmd && ((e.key === 'z' && e.shiftKey) || e.key === 'y')) {
				e.preventDefault();
				history.redo();
				showToast('Redid');
			}
		};
		window.addEventListener('keydown', handleUndoRedo);

		// Cleanup
		return () => {
			canvasEngine?.destroy();
			viewportManager?.destroy();
			selectionManager?.destroy();
			cursorManager?.destroy();
			shapeRenderer?.destroy();
			liveShapeRenderer?.destroy();
			eventHandlers?.destroy();
			disconnectProvider();
			unsubscribeProvider();
			window.removeEventListener('resize', handleResize);
			window.removeEventListener('keydown', handleCopyPaste);
			window.removeEventListener('keydown', handleUndoRedo);
			if (toastTimeout) {
				clearTimeout(toastTimeout);
			}
			clearTimeout(hintTimeout);
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
	<Toolbar
		onCommandPaletteOpen={openCommandPalette}
		onUndo={() => showToast('Undid')}
		onRedo={() => showToast('Redid')}
	/>

	<!-- Connection Status -->
	<ConnectionStatus currentUserId={data.user.id} onUserClick={handleUserClick} />

	<!-- Properties Panel -->
	<PropertiesPanel />

	<!-- Command Palette -->
	<CommandPalette bind:open={commandPaletteOpen} userId={data.user.id} viewport={$viewport} />

	<!-- Keyboard Shortcuts (hold TAB) -->
	<KeyboardShortcuts />

	<!-- Debug Overlay (press ~ to toggle) -->
	<DebugOverlay {shapeRenderer} shapesCount={$shapes.length} />

	<!-- Toast Notification -->
	<Toast message={toastMessage} visible={toastVisible} />

	<!-- Zoom indicator -->
	<div class="zoom-indicator">
		{Math.round(stageScale * 100)}%
	</div>

	<!-- Keyboard shortcuts hint -->
	<div class="shortcuts-hint" class:hidden={!showShortcutsHint}>
		Press <kbd>TAB</kbd> for shortcuts
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

	.shortcuts-hint {
		position: fixed;
		top: 20px; /* Changed from bottom to top */
		left: 50%; /* Center horizontally */
		transform: translateX(-50%); /* Adjust for centering */
		background: rgba(0, 0, 0, 0.5);
		color: rgba(255, 255, 255, 0.8);
		padding: 6px 12px;
		border-radius: 6px;
		font-size: 12px;
		z-index: 999;
		pointer-events: none;
		font-family:
			system-ui,
			-apple-system,
			sans-serif;
		transition: opacity 0.3s ease;
		opacity: 1;
	}

	.shortcuts-hint.hidden {
		opacity: 0;
		pointer-events: none;
	}

	.shortcuts-hint kbd {
		background: rgba(255, 255, 255, 0.15);
		padding: 2px 6px;
		border-radius: 3px;
		font-family: ui-monospace, 'Courier New', monospace;
		font-weight: 500;
	}
</style>
