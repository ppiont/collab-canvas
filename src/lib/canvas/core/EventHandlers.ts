/**
 * Canvas Event Handlers
 * Extracted from canvas/+page.svelte
 *
 * Handles:
 * - Mouse wheel (zoom)
 * - Mouse move (cursor tracking)
 * - Click (shape creation, selection, deselection)
 * - Stage drag (pan)
 * - Keyboard shortcuts
 */

import Konva from 'konva';
import { get } from 'svelte/store';
import type { ViewportManager } from './ViewportManager';
import type { SelectionManager } from './SelectionManager';
import type { CursorManager } from '../collaboration/CursorManager';
import { SelectionNet } from './SelectionNet';
import type { Shape } from '$lib/types/shapes';
import { activeTool } from '$lib/stores/tool';
import { CANVAS } from '$lib/constants';
import { shapeOperations } from '$lib/stores/shapes';

/** Callback for shape creation */
export type ShapeCreateCallback = (x: number, y: number) => void;

/** Callback for line shape creation with points */
export type LineCreateCallback = (points: number[]) => void;

/** Callback to get all shapes for selection net */
export type GetShapesCallback = () => Shape[];

/**
 * CanvasEventHandlers manages all stage and canvas interactions
 */
export class CanvasEventHandlers {
	private stage: Konva.Stage;
	private shapesLayer: Konva.Layer;
	private viewportManager: ViewportManager;
	private selectionManager: SelectionManager;
	private cursorManager: CursorManager;
	private selectionNet: SelectionNet;
	private isCreateMode: () => boolean;
	private onShapeCreate: ShapeCreateCallback;
	private onLineCreate: LineCreateCallback;
	private getShapes: GetShapesCallback;
	private isDraggingStage = false;
	private isDrawingNet = false;
	private netStartPos: { x: number; y: number } | null = null;
	private isSpacePressed = false; // Track spacebar for pan mode
	private justCompletedDragNet = false; // Prevent click from clearing drag-net selection
	private isDrawingLine = false; // Track if currently drawing a line
	private currentLinePoints: number[] = []; // Points for current line being drawn
	private linePreviewLayer: Konva.Layer | null = null; // Layer for line preview
	private linePreviewGroup: Konva.Group | null = null; // Group for preview line and points

	constructor(
		stage: Konva.Stage,
		shapesLayer: Konva.Layer,
		viewportManager: ViewportManager,
		selectionManager: SelectionManager,
		cursorManager: CursorManager,
		isCreateMode: () => boolean,
		onShapeCreate: ShapeCreateCallback,
		onLineCreate: LineCreateCallback,
		getShapes: GetShapesCallback
	) {
		this.stage = stage;
		this.shapesLayer = shapesLayer;
		this.viewportManager = viewportManager;
		this.selectionManager = selectionManager;
		this.cursorManager = cursorManager;
		this.isCreateMode = isCreateMode;
		this.onShapeCreate = onShapeCreate;
		this.onLineCreate = onLineCreate;
		this.getShapes = getShapes;
		this.selectionNet = new SelectionNet(stage, shapesLayer);

		// Create preview layer for line drawing UI
		this.linePreviewLayer = new Konva.Layer();
		this.stage.add(this.linePreviewLayer);
		this.linePreviewGroup = new Konva.Group();
		this.linePreviewLayer.add(this.linePreviewGroup);
	}

	/**
	 * Set up mouse wheel handler for zoom
	 */
	setupWheelHandler(): void {
		this.stage.on('wheel', (e) => {
			this.viewportManager.handleWheel(e.evt);
			// Trigger cursor re-render on zoom
			setTimeout(() => {
				this.cursorManager?.broadcastCurrentPosition();
			}, 100);
		});
	}

	/**
	 * Set up mouse move handler for cursor tracking
	 */
	setupMouseMoveHandler(): void {
		this.stage.on('mousemove', (e) => {
			this.cursorManager?.broadcastCursor();

			// Update line preview if drawing
			if (this.isDrawingLine) {
				this.updateLinePreview();
			}

			// Update cursor based on what we're hovering over
			// Don't change cursor if we're actively dragging the stage
			if (e.target === this.stage && !this.isDraggingStage) {
				// Hovering over empty canvas - show grab cursor for pan
				this.stage.container().style.cursor = this.isCreateMode() ? 'crosshair' : 'grab';
			}
		});

		this.stage.on('mouseenter', () => {
			// Set cursor when mouse enters canvas
			this.stage.container().style.cursor = this.isCreateMode() ? 'crosshair' : 'grab';
		});
	}

	/**
	 * Set up click handler for shape creation and selection
	 */
	setupClickHandler(): void {
		this.stage.on('click', (e) => {
			// Skip click handler if we just completed a drag-net selection
			// (prevents click from clearing the selection)
			if (this.justCompletedDragNet) {
				this.justCompletedDragNet = false;
				return;
			}

			// Stop following mode on any click
			this.cursorManager?.stopFollowing();

			// Get keyboard modifiers
			const isShift = e.evt.shiftKey;
			const isCmd = e.evt.metaKey || e.evt.ctrlKey;
			const activeToolValue = get(activeTool);

			// Handle line drawing mode
			if (activeToolValue === 'line') {
				const pos = this.stage.getPointerPosition();
				if (pos) {
					const transform = this.stage.getAbsoluteTransform().copy().invert();
					const canvasPos = transform.point(pos);

					this.currentLinePoints.push(canvasPos.x, canvasPos.y);
					this.isDrawingLine = true;

					// Finish drawing after 2 points (4 coordinate values)
					if (this.currentLinePoints.length >= 4) {
						this.finishLineDrawing();
					}
				}
				return;
			}

			// If clicked on empty canvas
			if (e.target === this.stage) {
				if (this.isCreateMode()) {
					// Create shape at click position
					const pos = this.stage.getPointerPosition();
					if (pos) {
						const transform = this.stage.getAbsoluteTransform().copy().invert();
						const canvasPos = transform.point(pos);
						this.onShapeCreate(canvasPos.x, canvasPos.y);
					}
				} else {
					// Only deselect if no modifiers held
					if (!isShift && !isCmd) {
						this.selectionManager.deselect();
					}
				}
			} else if (e.target.hasName('shape')) {
				// Clicked on a shape
				const shapeId = e.target.id();

				if (isCmd) {
					// Cmd/Ctrl+Click: Toggle selection
					this.selectionManager.toggleSelection(shapeId);
				} else if (isShift) {
					// Shift+Click: Add to or remove from selection
					if (this.selectionManager.isSelected(shapeId)) {
						this.selectionManager.removeFromSelection(shapeId);
					} else {
						this.selectionManager.addToSelection(shapeId);
					}
				} else {
					// Normal click: Single select
					this.selectionManager.select(shapeId);
				}
			}
		});
	}

	/**
	 * Set up stage drag handlers for pan and drag-net selection
	 */
	setupDragHandlers(): void {
		// Stage is NOT draggable by default in select mode
		// Only draggable when spacebar is held
		this.stage.draggable(false);
		this.stage.container().style.cursor = 'default';

		this.stage.on('mousedown', (e) => {
			if (e.target === this.stage) {
				// In select mode, record position for potential drag-net
				if (!this.isCreateMode() && !this.isSpacePressed) {
					const pos = this.stage.getPointerPosition();
					if (pos) {
						this.netStartPos = pos;
					}
				}

				// Only enable stage dragging if spacebar is held
				if (this.isSpacePressed) {
					this.stage.draggable(true);
					this.stage.container().style.cursor = 'grabbing';
				}
			} else {
				// Clicked on a shape - disable stage drag
				this.stage.draggable(false);
			}
		});

		this.stage.on('dragstart', (e) => {
			if (e.target === this.stage) {
				this.isDraggingStage = true;
				this.stage.container().style.cursor = 'grabbing';
			}
		});

		this.stage.on('dragmove', (e) => {
			if (e.target === this.stage) {
				// Ensure cursor stays grabbing during drag
				this.stage.container().style.cursor = 'grabbing';
				setTimeout(() => this.cursorManager?.broadcastCurrentPosition(), 0);
			}
		});

		this.stage.on('dragend', () => {
			this.isDraggingStage = false;

			// Sync viewport store with final stage position
			this.viewportManager.syncStore();

			// Reset cursor based on spacebar state
			if (this.isSpacePressed) {
				this.stage.container().style.cursor = 'grab';
			} else {
				this.stage.container().style.cursor = this.isCreateMode() ? 'crosshair' : 'default';
			}
		});

		// Handle mouseup to reset drag state (in case drag didn't complete)
		this.stage.on('mouseup', () => {
			if (this.isDraggingStage) {
				this.isDraggingStage = false;

				// Reset cursor based on spacebar state
				if (this.isSpacePressed) {
					this.stage.container().style.cursor = 'grab';
				} else {
					this.stage.container().style.cursor = this.isCreateMode() ? 'crosshair' : 'default';
				}
			}
		});
	}

	/**
	 * Set up drag-net selection handlers
	 */
	setupDragNetHandlers(): void {
		this.stage.on('mousemove', () => {
			// Check if we should start drag-net
			// Don't start if spacebar is pressed (pan mode) or if stage is dragging
			if (
				this.netStartPos &&
				!this.isDrawingNet &&
				!this.isCreateMode() &&
				!this.isSpacePressed &&
				!this.isDraggingStage
			) {
				const pos = this.stage.getPointerPosition();
				if (pos) {
				// Calculate drag distance
				const dx = pos.x - this.netStartPos.x;
				const dy = pos.y - this.netStartPos.y;
				const distance = Math.sqrt(dx * dx + dy * dy);

				// Start net if dragged more than threshold
				if (distance > CANVAS.DRAG_NET_THRESHOLD) {
						this.isDrawingNet = true;
						this.stage.draggable(false); // Ensure stage drag is disabled
						this.stage.container().style.cursor = 'crosshair'; // Crosshair during selection
						this.selectionNet.start(this.netStartPos.x, this.netStartPos.y);
					}
				}
			}

			// Update net if drawing
			if (this.isDrawingNet) {
				const pos = this.stage.getPointerPosition();
				if (pos) {
					this.selectionNet.update(pos.x, pos.y);
				}
			}
		});

		this.stage.on('mouseup', (e) => {
			if (this.isDrawingNet) {
				// Finalize selection
				const bounds = this.selectionNet.end();

				if (bounds && (bounds.width > 0 || bounds.height > 0)) {
					const allShapes = this.getShapes();

					const intersectingIds = this.selectionNet.getIntersectingShapes(bounds, allShapes);

					// Get keyboard modifiers
					const isShift = e.evt.shiftKey;
					const isCmd = e.evt.metaKey || e.evt.ctrlKey;

					if (isShift) {
						// Shift: Add to selection
						const current = this.selectionManager.getSelectedIds();
						const combined = [...new Set([...current, ...intersectingIds])];
						this.selectionManager.selectMultiple(combined);
					} else if (isCmd) {
						// Cmd: Toggle selection
						const current = new Set(this.selectionManager.getSelectedIds());
						intersectingIds.forEach((id) => {
							if (current.has(id)) {
								current.delete(id);
							} else {
								current.add(id);
							}
						});
						const toggled = Array.from(current);
						this.selectionManager.selectMultiple(toggled);
					} else {
						// Default: Replace selection
						this.selectionManager.selectMultiple(intersectingIds);
					}

					// Mark that we just completed drag-net to prevent click handler from clearing selection
					this.justCompletedDragNet = true;
				}

				this.isDrawingNet = false;

				// Only enable stage drag if spacebar is held
				this.stage.draggable(this.isSpacePressed);

				// Restore cursor based on spacebar state
				if (this.isSpacePressed) {
					this.stage.container().style.cursor = 'grab';
				} else {
					const cursor = this.isCreateMode() ? 'crosshair' : 'default';
					this.stage.container().style.cursor = cursor;
				}
			}

			this.netStartPos = null;
		});
	}

	/**
	 * Set up keyboard shortcuts
	 */
	setupKeyboardHandlers(): void {
		const handleKeyDown = (e: KeyboardEvent) => {
			// Check if user is typing in an input field
			const target = e.target as HTMLElement;
			const isTyping = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';

			// Spacebar - Enable pan mode (ONLY if not typing in input)
			if (e.code === 'Space' && !this.isSpacePressed && !isTyping) {
				// Prevent space from scrolling the page
				e.preventDefault();
				this.isSpacePressed = true;

				// Change cursor to indicate pan mode
				if (!this.isCreateMode()) {
					this.stage.container().style.cursor = 'grab';
				}

				// Cancel drag-net if it was being drawn
				if (this.isDrawingNet) {
					this.selectionNet.cancel();
					this.isDrawingNet = false;
					this.netStartPos = null;
				}

				// Enable stage dragging (for pan mode)
				if (!this.isDraggingStage) {
					this.stage.draggable(true);
				}
			}

			// Tool selection shortcuts (only when not typing)
			if (!isTyping && !e.metaKey && !e.ctrlKey && !e.altKey) {
				if (e.key === 'r') {
					e.preventDefault();
					activeTool.set('rectangle');
					return;
				}
				if (e.key === 'c') {
					e.preventDefault();
					activeTool.set('circle');
					return;
				}
				if (e.key === 'g') {
					e.preventDefault();
					activeTool.set('triangle');
					return;
				}
				if (e.key === 'l') {
					e.preventDefault();
					// If already drawing a line, finish it; otherwise start drawing
					if (this.isDrawingLine) {
						if (this.currentLinePoints.length >= 4) {
							this.finishLineDrawing();
						}
					} else {
						activeTool.set('line');
					}
					return;
				}
				if (e.key === 't') {
					e.preventDefault();
					activeTool.set('text');
					return;
				}
				if (e.key === 'p') {
					e.preventDefault();
					activeTool.set('polygon');
					return;
				}
				if (e.key === 's') {
					e.preventDefault();
					activeTool.set('star');
					return;
				}
			}

			// Escape key - deselect and cancel
			if (e.key === 'Escape') {
				// Cancel line drawing if in progress
				if (this.isDrawingLine) {
					this.currentLinePoints = [];
					this.isDrawingLine = false;
					this.clearLinePreview();
					return;
				}

				// Cancel drag-net if active
				if (this.isDrawingNet) {
					this.selectionNet.cancel();
					this.isDrawingNet = false;
					this.netStartPos = null;

					// Restore draggable state based on spacebar
					this.stage.draggable(this.isSpacePressed);

					// Restore cursor
					if (this.isSpacePressed) {
						this.stage.container().style.cursor = 'grab';
					} else {
						const cursor = this.isCreateMode() ? 'crosshair' : 'default';
						this.stage.container().style.cursor = cursor;
					}
				}

				this.selectionManager.deselect();
				if (this.isCreateMode()) {
					activeTool.set('select');
				}
			}

			// Delete/Backspace - delete selected shapes or undo last point when drawing line
			if (e.key === 'Delete' || e.key === 'Backspace') {
				if (!isTyping) {
					// If drawing a line, remove the last point
					if (this.isDrawingLine) {
						e.preventDefault();
						if (this.currentLinePoints.length >= 2) {
							this.currentLinePoints.pop();
							this.currentLinePoints.pop();
							this.updateLinePreview();
						}
						return;
					}

					// Otherwise delete selected shapes
					e.preventDefault();
					this.selectionManager.delete();
				}
			}

			// Duplicate (Cmd+D)
			if ((e.metaKey || e.ctrlKey) && e.key === 'd' && !isTyping) {
				e.preventDefault();
				const selectedIds = this.selectionManager.getSelectedIds();
				if (selectedIds.length > 0) {
					const allShapes = this.getShapes();
					const maxZ = Math.max(...allShapes.map((s) => s.zIndex || 0), 0);

					selectedIds.forEach((id) => {
						const shape = allShapes.find((s) => s.id === id);
						if (shape) {
							const duplicate = {
								...shape,
								id: crypto.randomUUID(),
								x: shape.x + 20,
								y: shape.y + 20,
								zIndex: maxZ + 1
							};
							shapeOperations.add(duplicate);
						}
					});
				}
			}

			// Layer management shortcuts
			const isModifierKey = e.metaKey || e.ctrlKey;

			// Cmd+Shift+Up - Bring to front (top z-order)
			if (
				isModifierKey &&
				e.shiftKey &&
				e.key === 'ArrowUp' &&
				!isTyping
			) {
				e.preventDefault();
				e.stopPropagation();
				const selectedIds = this.selectionManager.getSelectedIds();

				if (selectedIds.length > 0) {
					const allShapes = this.getShapes();
					const maxZ = Math.max(...allShapes.map((s) => s.zIndex || 0), 0);
					selectedIds.forEach((id) => {
						shapeOperations.update(id, { zIndex: maxZ + 1 });
					});
				}
				return;
			}

			// Cmd+Shift+Down - Send to back (bottom z-order)
			if (
				isModifierKey &&
				e.shiftKey &&
				e.key === 'ArrowDown' &&
				!isTyping
			) {
				e.preventDefault();
				e.stopPropagation();
				const selectedIds = this.selectionManager.getSelectedIds();

				if (selectedIds.length > 0) {
					const allShapes = this.getShapes();
					const minZ = Math.min(...allShapes.map((s) => s.zIndex || 0), 0);
					selectedIds.forEach((id) => {
						shapeOperations.update(id, { zIndex: minZ - 1 });
					});
				}
				return;
			}

			// Text formatting shortcuts (when editing text)
			if (isTyping && (e.metaKey || e.ctrlKey)) {
				const selectedIds = Array.from(this.selectionManager.getSelectedIds());

				// Get first selected shape to check if it's text
				const allShapes = this.getShapes();
				const shape = selectedIds.length === 1 ? allShapes.find(s => s.id === selectedIds[0]) : null;

				if (shape && shape.type === 'text') {
					// Cmd+B - Bold
					if (e.key === 'b') {
						e.preventDefault();
						const currentWeight = shape.fontWeight || 'normal';
						shapeOperations.update(shape.id, {
							fontWeight: currentWeight === 'bold' ? 'normal' : 'bold'
						});
						return;
					}

					// Cmd+I - Italic
					if (e.key === 'i') {
						e.preventDefault();
						const currentStyle = shape.fontStyle || 'normal';
						shapeOperations.update(shape.id, {
							fontStyle: currentStyle === 'italic' ? 'normal' : 'italic'
						});
						return;
					}

					// Cmd+U - Underline
					if (e.key === 'u') {
						e.preventDefault();
						const currentDecoration = shape.textDecoration || 'none';
						shapeOperations.update(shape.id, {
							textDecoration: currentDecoration === 'underline' ? 'none' : 'underline'
						});
						return;
					}

					// Cmd+Shift+L - Align Left
					if (e.shiftKey && e.key === 'L') {
						e.preventDefault();
						shapeOperations.update(shape.id, { align: 'left' });
						return;
					}

					// Cmd+Shift+E - Align Center
					if (e.shiftKey && e.key === 'E') {
						e.preventDefault();
						shapeOperations.update(shape.id, { align: 'center' });
						return;
					}

					// Cmd+Shift+R - Align Right
					if (e.shiftKey && e.key === 'R') {
						e.preventDefault();
						shapeOperations.update(shape.id, { align: 'right' });
						return;
					}
				}
			}

			// Arrow keys - nudge selected shapes (only when not typing)
			if (!isTyping && !isModifierKey) {
				const nudgeAmount = 1; // pixels to move
				const selectedIds = this.selectionManager.getSelectedIds();

				if (selectedIds.length > 0) {
					if (e.key === 'ArrowUp') {
						e.preventDefault();
						selectedIds.forEach((id) => {
							const shape = shapeOperations.get(id);
							if (shape) {
								shapeOperations.update(id, { y: shape.y - nudgeAmount });
							}
						});
					}
					if (e.key === 'ArrowDown') {
						e.preventDefault();
						selectedIds.forEach((id) => {
							const shape = shapeOperations.get(id);
							if (shape) {
								shapeOperations.update(id, { y: shape.y + nudgeAmount });
							}
						});
					}
					if (e.key === 'ArrowLeft') {
						e.preventDefault();
						selectedIds.forEach((id) => {
							const shape = shapeOperations.get(id);
							if (shape) {
								shapeOperations.update(id, { x: shape.x - nudgeAmount });
							}
						});
					}
					if (e.key === 'ArrowRight') {
						e.preventDefault();
						selectedIds.forEach((id) => {
							const shape = shapeOperations.get(id);
							if (shape) {
								shapeOperations.update(id, { x: shape.x + nudgeAmount });
							}
						});
					}
				}
			}
		};

		const handleKeyUp = (e: KeyboardEvent) => {
			// Spacebar released - Disable pan mode
			if (e.code === 'Space') {
				this.isSpacePressed = false;

				// Disable stage dragging (no longer in pan mode)
				this.stage.draggable(false);

				// Restore cursor
				const cursor = this.isCreateMode() ? 'crosshair' : 'default';
				this.stage.container().style.cursor = cursor;
			}
		};

		window.addEventListener('keydown', handleKeyDown);
		window.addEventListener('keyup', handleKeyUp);

		// Store for cleanup
		this.keydownHandler = handleKeyDown;
		this.keyupHandler = handleKeyUp;
	}

	private keydownHandler: ((e: KeyboardEvent) => void) | null = null;
	private keyupHandler: ((e: KeyboardEvent) => void) | null = null;

	/**
	 * Update line preview visualization as user moves mouse while drawing
	 */
	private updateLinePreview(): void {
		if (!this.linePreviewGroup) return;

		const pos = this.stage.getPointerPosition();
		if (!pos) return;

		const transform = this.stage.getAbsoluteTransform().copy().invert();
		const canvasPos = transform.point(pos);

		// Clear previous preview
		this.linePreviewGroup.destroyChildren();

		// Draw the preview line from all placed points to current position
		if (this.currentLinePoints.length >= 2) {
			const previewPoints = [...this.currentLinePoints, canvasPos.x, canvasPos.y];

			const previewLine = new Konva.Line({
				points: previewPoints,
				stroke: '#667eea',
				strokeWidth: 2,
				lineCap: 'round',
				lineJoin: 'round',
				dash: [5, 5], // Dashed line to show it's temporary
				listening: false
			});

			this.linePreviewGroup.add(previewLine);
		}

		// Draw circles at each placed point
		for (let i = 0; i < this.currentLinePoints.length; i += 2) {
			const x = this.currentLinePoints[i];
			const y = this.currentLinePoints[i + 1];

			const circle = new Konva.Circle({
				x,
				y,
				radius: 4,
				fill: '#667eea',
				stroke: '#ffffff',
				strokeWidth: 1,
				listening: false
			});

			this.linePreviewGroup.add(circle);
		}

		// Draw a circle at current mouse position
		const currentCircle = new Konva.Circle({
			x: canvasPos.x,
			y: canvasPos.y,
			radius: 3,
			fill: '#667eea',
			stroke: '#ffffff',
			strokeWidth: 1,
			opacity: 0.6,
			listening: false
		});

		this.linePreviewGroup.add(currentCircle);

		this.linePreviewLayer?.batchDraw();
	}

	/**
	 * Clear line preview
	 */
	private clearLinePreview(): void {
		if (this.linePreviewGroup) {
			this.linePreviewGroup.destroyChildren();
			this.linePreviewLayer?.batchDraw();
		}
	}

	/**
	 * Finish drawing a line and create the shape
	 */
	private finishLineDrawing(): void {
		if (this.currentLinePoints.length < 4) {
			// Not enough points for a line
			this.currentLinePoints = [];
			this.isDrawingLine = false;
			this.clearLinePreview();
			return;
		}

		// Call the line creation callback
		this.onLineCreate(this.currentLinePoints);

		this.currentLinePoints = [];
		this.isDrawingLine = false;
		this.clearLinePreview();
	}

	/**
	 * Clean up all event handlers
	 */
	destroy(): void {
		if (this.keydownHandler) {
			window.removeEventListener('keydown', this.keydownHandler);
			this.keydownHandler = null;
		}

		if (this.keyupHandler) {
			window.removeEventListener('keyup', this.keyupHandler);
			this.keyupHandler = null;
		}

		// Clean up selection net
		this.selectionNet.destroy();

		// Stage event handlers are automatically cleaned up when stage is destroyed
	}
}
