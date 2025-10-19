/**
 * Shape Renderer - Konva Shape Rendering and Event Handling
 * Extracted from canvas/+page.svelte (200+ lines)
 *
 * Handles:
 * - Generic shape rendering (rectangles, circles, ellipses, etc.)
 * - Drag and drop with real-time sync
 * - Transform (resize/rotate) handling
 * - Selection and hover effects
 * - Z-index management
 */

import Konva from 'konva';
import type { Shape } from '$lib/types/shapes';
import type { CanvasViewport } from '$lib/types/canvas';
import { SHAPES } from '$lib/constants';
import { filterVisibleShapes, getCullingStats } from '$lib/utils/viewport-culling';

/** Event callbacks for shape interactions */
export interface ShapeEventCallbacks {
	onShapeUpdate: (id: string, changes: Partial<Shape>) => void;
	onShapeSelect: (id: string) => void;
	onBroadcastCursor: () => void;
	onBroadcastShapeDrag: (id: string, position: { x: number; y: number }) => void; // NEW: Live shape drag broadcast
	getMaxZIndex: () => number;
	getSelectedIds: () => string[]; // NEW: Get currently selected shape IDs
	getShapeById: (id: string) => Shape | undefined; // NEW: Get shape by ID
}

/**
 * ShapeRenderer handles rendering shapes to Konva layer
 * Supports all shape types: rectangles, circles, lines, text, polygons, stars, triangles, and images
 */
export class ShapeRenderer {
	private shapesLayer: Konva.Layer;
	private stage: Konva.Stage | null = null;
	private callbacks: ShapeEventCallbacks | null = null;

	// Track locally dragging/editing shape to prevent render interruption
	private locallyDraggingId: string | null = null;
	private locallyEditingId: string | null = null;
	private localUserId: string | null = null;
	private isCreateMode = false;

	// Transformer reference to ensure it stays on top
	private transformer: Konva.Transformer | null = null;

	// Viewport culling settings
	private enableCulling = true; // Enable by default
	private cullingPadding = 100; // Pixels of padding around viewport

	// Performance stats (for debugging)
	private lastCullingStats: ReturnType<typeof getCullingStats> | null = null;

	constructor(shapesLayer: Konva.Layer, stage: Konva.Stage) {
		this.shapesLayer = shapesLayer;
		this.stage = stage;
	}

	/**
	 * Set event callbacks
	 */
	setCallbacks(callbacks: ShapeEventCallbacks): void {
		this.callbacks = callbacks;
	}

	/**
	 * Set transformer reference to ensure it stays on top during renders
	 */
	setTransformer(transformer: Konva.Transformer): void {
		this.transformer = transformer;
	}

	/**
	 * Set local user ID
	 */
	setLocalUserId(userId: string): void {
		this.localUserId = userId;
	}

	/**
	 * Set create mode (disables selection on click)
	 */
	setCreateMode(enabled: boolean): void {
		this.isCreateMode = enabled;
	}

	/**
	 * Enable or disable viewport culling
	 */
	setViewportCulling(enabled: boolean): void {
		this.enableCulling = enabled;
	}

	/**
	 * Set culling padding (extra pixels rendered off-screen)
	 */
	setCullingPadding(padding: number): void {
		this.cullingPadding = padding;
	}

	/**
	 * Get last culling statistics (for debugging)
	 */
	getCullingStats(): ReturnType<typeof getCullingStats> | null {
		return this.lastCullingStats;
	}

	/**
	 * Set currently dragging shape ID
	 */
	setDraggingShape(shapeId: string | null): void {
		this.locallyDraggingId = shapeId;
	}

	/**
	 * Render all shapes to the Konva layer
	 *
	 * @param shapes - All shapes to potentially render
	 * @param viewport - Current viewport (for culling). If not provided, culling is disabled.
	 */
	renderShapes(shapes: Shape[], viewport?: CanvasViewport): void {
		if (!this.shapesLayer || !this.stage) {
			return;
		}

		// Apply viewport culling if enabled and viewport provided
		let shapesToRender = shapes;
		if (this.enableCulling && viewport) {
			const stageWidth = this.stage.width();
			const stageHeight = this.stage.height();

			shapesToRender = filterVisibleShapes(
				shapes,
				viewport,
				stageWidth,
				stageHeight,
				this.cullingPadding
			);

			// Update statistics
			this.lastCullingStats = getCullingStats(shapes.length, shapesToRender.length);

			// Stats available for debugging if needed
		}

		// Get currently selected shape IDs for styling
		const selectedIds = this.callbacks?.getSelectedIds?.() || [];

		// Create map of shapes to render for quick lookup
		const shapeMap = new Map(shapesToRender.map((s) => [s.id, s]));

		// First pass: Remove shapes that no longer exist in shapesToRender
		// BUT preserve shapes we're currently dragging locally
		const existingShapes = this.shapesLayer.find('.shape');
		existingShapes.forEach((node) => {
			const shapeId = node.id();
			const isLocallyDragging = shapeId === this.locallyDraggingId;

			// Only preserve shapes being dragged by this user
			if (!isLocallyDragging && !shapeMap.has(shapeId)) {
				node.destroy();
			}
		});

		// Shapes already sorted by zIndex in store (no need to sort again)
		shapesToRender.forEach((shape) => {
			const existingNode = this.shapesLayer.findOne(`#${shape.id}`);
			const isLocallyDragging = shape.id === this.locallyDraggingId;
			const isDraggedByOther = !!(shape.draggedBy && shape.draggedBy !== this.localUserId);
			const isSelected = selectedIds.includes(shape.id);

			// ✅ PHASE 7: Skip rendering shapes being dragged by other users (check FIRST)
			// This prevents duplicate shapes: remote user sees only the drag ghost from LiveShapeRenderer
			if (isDraggedByOther) {
				// Remove the existing shape if it was rendered before draggedBy arrived
				if (existingNode) {
					existingNode.destroy();
				}
				// The drag ghost from LiveShapeRenderer handles all visual feedback
				// When drag ends (draggedBy cleared), shape will be recreated with final position
				return;
			}

			// CRITICAL FIX: If node exists AND we're not currently dragging it,
			// UPDATE its properties from Yjs instead of skipping it
			if (existingNode && !isLocallyDragging) {
				// Sync Konva node properties from Yjs shape data
				this.updateKonvaNodeProperties(existingNode, shape);
				this.applySelectionStyling(existingNode, isSelected, shape);
				// CRITICAL: Ensure node is visible after update
				// (fixes text disappearing after editing - node was hidden but never shown again)
				existingNode.show();
				return;
			}

			// If we're dragging this shape locally, don't recreate it
			if (existingNode && isLocallyDragging) {
				this.applySelectionStyling(existingNode, isSelected, shape);
				return;
			}

			// Shape doesn't exist, create it
			const konvaShape = this.createKonvaShape(shape, isDraggedByOther);
			if (!konvaShape) {
				return;
			}

			// Attach event handlers
			this.attachEventHandlers(konvaShape, shape, isDraggedByOther);

			// Apply selection styling
			this.applySelectionStyling(konvaShape, isSelected, shape);

			this.shapesLayer.add(konvaShape);
		});

		// Reorder shapes in layer based on zIndex
		// This ensures visual stacking matches data (bottom to top order)
		// CRITICAL: Use ALL shapes, not just visible ones, for correct z-order
		// Shapes already sorted by zIndex in store (no need to sort again)
		this.reorderShapesByZIndex(shapes);

		// CRITICAL: Move transformer to top after rendering shapes
		// This ensures the transformer is always visible above shapes
		if (this.transformer) {
			this.transformer.moveToTop();
		}

		this.shapesLayer.batchDraw();
	}

	/**
	 * Reorder shapes in layer based on their zIndex values
	 * In Konva, visual stacking order = children array order
	 */
	private reorderShapesByZIndex(sortedShapes: Shape[]): void {
		// Get all current layer children (including non-shape nodes like transformer)
		const currentChildren = this.shapesLayer.getChildren();

		// Create map of shape nodes for quick lookup
		const shapeNodeMap = new Map<string, Konva.Node>();
		const nonShapeNodes: Konva.Node[] = [];

		currentChildren.forEach((node) => {
			const id = node.id();
			if (id) {
				// Has an ID - it's a shape node
				shapeNodeMap.set(id, node);
			} else {
				// No ID - it's a non-shape node (e.g., transformer, selection net)
				nonShapeNodes.push(node);
			}
		});

		// Build new children array in correct order: shapes by zIndex, then non-shapes
		const reorderedChildren: Konva.Node[] = [];

		// Add shapes in zIndex order
		sortedShapes.forEach((shape) => {
			const node = shapeNodeMap.get(shape.id);
			if (node) {
				reorderedChildren.push(node);
			}
		});

		// Add non-shape nodes at the end (they should be on top)
		reorderedChildren.push(...nonShapeNodes);

		// Apply new order in one operation (O(n) instead of O(n²))
		this.shapesLayer.setChildren(reorderedChildren);
	}

	/**
	 * Simple array equality check
	 */
	private arraysEqual(a: string[], b: string[]): boolean {
		if (a.length !== b.length) return false;
		return a.every((val, idx) => val === b[idx]);
	}

	/**
	 * Update existing Konva node properties from shape data
	 * This is CRITICAL for undo/redo to work on selected shapes
	 */
	private updateKonvaNodeProperties(node: Konva.Node, shape: Shape): void {
		// Update common properties
		node.x(shape.x);
		node.y(shape.y);
		node.rotation(shape.rotation || 0);
		// NOTE: zIndex is NOT used for visual stacking in Konva
		// Visual stacking is determined by order in layer children array
		// This is handled separately in renderShapes() by reordering nodes

		const konvaShape = node as Konva.Shape;
		// Only apply fill if it's enabled (default true if not specified)
		if (shape.fillEnabled !== false) {
			konvaShape.fill(shape.fill || (shape.type === 'text' ? '#000000' : undefined));
		} else {
			konvaShape.fill(undefined);
		}

		// CRITICAL: Never apply stroke to text shapes
		// Konva.Text doesn't support stroke rendering properly - it creates visual artifacts
		if (shape.type !== 'text') {
			// Only apply stroke if it's enabled (default true if not specified)
			if (shape.strokeEnabled !== false) {
				konvaShape.stroke(shape.stroke);
				konvaShape.strokeWidth(shape.strokeWidth);
			} else {
				konvaShape.stroke(undefined);
				konvaShape.strokeWidth(0);
			}
		}

		konvaShape.opacity(shape.opacity ?? 1);

		// Apply shadow if configured
		if (shape.shadow) {
			konvaShape.shadowColor(shape.shadow.color);
			konvaShape.shadowBlur(shape.shadow.blur);
			konvaShape.shadowOffset({ x: shape.shadow.offsetX, y: shape.shadow.offsetY });
			konvaShape.shadowOpacity(0.5); // Default shadow opacity
		} else {
			// Clear shadow if not configured
			konvaShape.shadowColor('');
			konvaShape.shadowBlur(0);
			konvaShape.shadowOpacity(0);
		}

		// Update shape-specific properties based on type
		switch (shape.type) {
			case 'rectangle':
				(node as Konva.Rect).width(shape.width);
				(node as Konva.Rect).height(shape.height);
				break;

			case 'circle':
				(node as Konva.Circle).radius(shape.radius);
				// Apply scale for resizing (ellipse effect)
				(node as Konva.Circle).scaleX(shape.scaleX || 1);
				(node as Konva.Circle).scaleY(shape.scaleY || 1);
				break;

			case 'polygon': {
				const polygon = node as Konva.RegularPolygon;
				polygon.sides(shape.sides);
				polygon.radius(shape.radius);
				// Apply scale for resizing
				polygon.scaleX(shape.scaleX || 1);
				polygon.scaleY(shape.scaleY || 1);
				break;
			}

			case 'line':
				(node as Konva.Line).points(shape.points);
				break;

			case 'star': {
				const star = node as Konva.Star;
				star.numPoints(shape.numPoints);
				star.innerRadius(shape.innerRadius);
				star.outerRadius(shape.outerRadius);
				// Apply scale for resizing
				star.scaleX(shape.scaleX || 1);
				star.scaleY(shape.scaleY || 1);
				break;
			}

			case 'triangle': {
				const triangle = node as Konva.RegularPolygon;
				triangle.sides(3);
				triangle.radius(Math.max(shape.width, shape.height) / 2);
				// Apply scale for resizing
				triangle.scaleX(shape.scaleX || 1);
				triangle.scaleY(shape.scaleY || 1);
				break;
			}

			case 'text': {
				const text = node as Konva.Text;
				text.text(shape.text);
				text.fontSize(shape.fontSize);
				text.fontFamily(shape.fontFamily || 'system-ui');
				text.setAttr('fontWeight', shape.fontWeight || 'normal');
				text.setAttr('fontStyle', shape.fontStyle || 'normal');
				text.setAttr('textDecoration', shape.textDecoration || '');
				text.setAttr('align', shape.align || 'left');
				if (shape.width) text.width(shape.width);
				break;
			}
		}
	}

	/**
	 * Apply selection styling to a shape
	 * Matches the transformer border color for visual consistency
	 */
	private applySelectionStyling(node: Konva.Node, isSelected: boolean, shapeData: Shape): void {
		const konvaShape = node as Konva.Shape;

		if (isSelected) {
			// Apply selection outline matching transformer border
			// EXCEPTION: Text shapes should never have stroke - Konva.Text doesn't render it properly
			if (shapeData.type !== 'text') {
				konvaShape.stroke('#667eea'); // Same color as transformer
				konvaShape.strokeWidth(2);
			}
			konvaShape.dash([]); // Solid line
			// No shadow - just clean outline
			konvaShape.shadowColor('');
			konvaShape.shadowBlur(0);
			konvaShape.shadowOpacity(0);
		} else {
			// Restore original values from shape data
			// EXCEPTION: Text shapes should never have stroke
			if (shapeData.type !== 'text') {
				konvaShape.stroke(shapeData.stroke);
				konvaShape.strokeWidth(shapeData.strokeWidth);
			}
			konvaShape.dash([]);
			konvaShape.shadowColor('');
			konvaShape.shadowBlur(0);
			konvaShape.shadowOpacity(0);
		}
	}

	/**
	 * Update selection styling for all shapes based on current selection
	 */
	updateSelectionStyling(selectedIds: string[], shapes: Shape[]): void {
		if (!this.shapesLayer) return;

		// Create a map for quick lookup
		const shapeDataMap = new Map(shapes.map((s) => [s.id, s]));

		// Update all shape nodes in the layer
		const shapeNodes = this.shapesLayer.find('.shape');
		shapeNodes.forEach((node) => {
			const shapeId = node.id();
			const shapeData = shapeDataMap.get(shapeId);
			if (shapeData) {
				const isSelected = selectedIds.includes(shapeId);
				this.applySelectionStyling(node, isSelected, shapeData);
			}
		});

		this.shapesLayer.batchDraw();
	}

	/**
	 * Create Konva shape based on shape type
	 */
	private createKonvaShape(shape: Shape, isDraggedByOther: boolean): Konva.Shape | null {
		// Validate shape coordinates - skip corrupted shapes
		if (!isFinite(shape.x) || !isFinite(shape.y)) {
			console.error(`Skipping shape ${shape.id} with invalid coordinates:`, {
				x: shape.x,
				y: shape.y,
				type: shape.type
			});
			return null;
		}

		const baseConfig = {
			id: shape.id,
			name: 'shape',
			x: shape.x,
			y: shape.y,
			rotation: shape.rotation || 0, // Apply stored rotation
			fill: shape.fillEnabled !== false ? shape.fill : undefined,
			stroke: shape.strokeEnabled !== false ? shape.stroke : undefined,
			strokeWidth: shape.strokeEnabled !== false ? shape.strokeWidth : 0,
			strokeScaleEnabled: false, // Keep stroke width constant when scaling
			draggable: (('draggable' in shape ? shape.draggable : true) ?? true) && !isDraggedByOther,
			opacity: isDraggedByOther ? 0.5 : shape.opacity || 1, // Use stored opacity
			shadowColor: isDraggedByOther ? '#667eea' : shape.shadow?.color || '',
			shadowBlur: isDraggedByOther ? 8 : shape.shadow?.blur || 0,
			shadowOpacity: isDraggedByOther ? 0.6 : shape.shadow ? 0.5 : 0,
			shadowOffset: shape.shadow
				? { x: shape.shadow.offsetX, y: shape.shadow.offsetY }
				: { x: 0, y: 0 }
		};

		switch (shape.type) {
			case 'rectangle':
				return new Konva.Rect({
					...baseConfig,
					width: shape.width,
					height: shape.height
				});

			case 'circle':
				return new Konva.Circle({
					...baseConfig,
					radius: shape.radius,
					scaleX: shape.scaleX || 1,
					scaleY: shape.scaleY || 1
				});

			case 'line':
				return new Konva.Line({
					...baseConfig,
					points: shape.points,
					fill: undefined // Lines don't have fill
				});

			case 'polygon': {
				const polygonShape = shape as Extract<Shape, { type: 'polygon' }>;
				return new Konva.RegularPolygon({
					...baseConfig,
					sides: polygonShape.sides,
					radius: polygonShape.radius,
					scaleX: polygonShape.scaleX || 1,
					scaleY: polygonShape.scaleY || 1,
					fill: polygonShape.fill || undefined,
					stroke: polygonShape.stroke || undefined,
					strokeWidth: polygonShape.strokeWidth || 0,
					strokeEnabled: polygonShape.strokeEnabled !== false,
					shadowColor: polygonShape.shadow?.color || undefined,
					shadowBlur: polygonShape.shadow?.blur || 0,
					shadowOpacity: polygonShape.shadow ? 0.5 : 0,
					shadowOffset: polygonShape.shadow
						? { x: polygonShape.shadow.offsetX, y: polygonShape.shadow.offsetY }
						: { x: 0, y: 0 }
				});
			}

			case 'star': {
				const starShape = shape as Extract<Shape, { type: 'star' }>;
				return new Konva.Star({
					...baseConfig,
					numPoints: starShape.numPoints,
					innerRadius: starShape.innerRadius,
					outerRadius: starShape.outerRadius,
					scaleX: starShape.scaleX || 1,
					scaleY: starShape.scaleY || 1
				});
			}

			case 'triangle': {
				const triangleShape = shape as Extract<Shape, { type: 'triangle' }>;
				return new Konva.RegularPolygon({
					...baseConfig,
					sides: 3,
					radius: Math.max(triangleShape.width, triangleShape.height) / 2,
					scaleX: triangleShape.scaleX || 1,
					scaleY: triangleShape.scaleY || 1,
					fill: triangleShape.fill || undefined,
					stroke: triangleShape.stroke || undefined,
					strokeWidth: triangleShape.strokeWidth || 0,
					strokeEnabled: triangleShape.strokeEnabled !== false,
					shadowColor: triangleShape.shadow?.color || undefined,
					shadowBlur: triangleShape.shadow?.blur || 0,
					shadowOpacity: triangleShape.shadow ? 0.5 : 0,
					shadowOffset: triangleShape.shadow
						? { x: triangleShape.shadow.offsetX, y: triangleShape.shadow.offsetY }
						: { x: 0, y: 0 }
				});
			}

			case 'text':
				// Text shapes need special config: exclude stroke properties entirely
				// Konva.Text doesn't support stroke rendering properly - it creates artifacts
				return new Konva.Text({
					// Common properties that text supports
					id: shape.id,
					name: 'shape',
					x: shape.x,
					y: shape.y,
					rotation: shape.rotation || 0,
					opacity: isDraggedByOther ? 0.5 : shape.opacity || 1,
					fill: shape.fill || '#000000',
					shadowColor: isDraggedByOther ? '#667eea' : '',
					shadowBlur: isDraggedByOther ? 8 : 0,
					shadowOpacity: isDraggedByOther ? 0.6 : 0,
					draggable: (('draggable' in shape ? shape.draggable : true) ?? true) && !isDraggedByOther,
					// Text-specific properties
					text: shape.text,
					fontSize: shape.fontSize,
					fontFamily: shape.fontFamily || SHAPES.DEFAULT_FONT_FAMILY,
					fontWeight: shape.fontWeight || 'normal',
					fontStyle: shape.fontStyle || 'normal',
					textDecoration: shape.textDecoration || '',
					align: shape.align || 'left',
					width: shape.width || undefined,
					height: shape.height || undefined
					// NOTE: Intentionally NOT including stroke or strokeWidth
					// Konva.Text stroke rendering creates visual artifacts
				});

			default:
				return null;
		}
	}

	/**
	 * Attach event handlers to a Konva shape
	 * CRITICAL: Do NOT close over shape data - look it up fresh from the callbacks
	 * This ensures hover effects, drag handling, etc. always use current Yjs state
	 */
	private attachEventHandlers(
		konvaShape: Konva.Shape,
		shape: Shape,
		isDraggedByOther: boolean
	): void {
		if (!this.callbacks || !this.stage) return;

		const shapeId = shape.id;

		// Hover effects - lookup current shape from callbacks to get fresh data
		konvaShape.on('mouseenter', () => {
			if (!this.stage) return;
			this.stage.container().style.cursor = isDraggedByOther ? 'not-allowed' : 'move';

			if (!isDraggedByOther) {
				// Hover outline: same color as transformer
				konvaShape.strokeEnabled(true);
				konvaShape.stroke('#667eea');
				konvaShape.strokeWidth(2);
				this.shapesLayer.batchDraw();
			}
		});

		konvaShape.on('mouseleave', () => {
			if (!this.stage) return;
			this.stage.container().style.cursor = 'default';

			if (!isDraggedByOther) {
				// Get current shape data instead of using closure
				const currentShape = this.callbacks!.getShapeById?.(shapeId) || shape;
				// Restore actual stroke configuration
				if (currentShape.strokeEnabled !== false) {
					konvaShape.stroke(currentShape.stroke);
					konvaShape.strokeWidth(currentShape.strokeWidth || 0);
				} else {
					konvaShape.stroke(undefined);
					konvaShape.strokeWidth(0);
				}
				this.shapesLayer.batchDraw();
			}
		});

		// Drag events
		konvaShape.on('dragstart', () => {
			if (!this.stage) return;

			// Visual feedback
			konvaShape.opacity(0.7);
			konvaShape.shadowColor('black');
			konvaShape.shadowBlur(10);
			konvaShape.shadowOffset({ x: 5, y: 5 });
			konvaShape.shadowOpacity(0.3);
			this.stage.container().style.cursor = 'grabbing';

			// Broadcast cursor
			this.callbacks!.onBroadcastCursor();

			// Track local drag
			this.locallyDraggingId = shapeId;

			// Update drag state (but don't change zIndex)
			this.callbacks!.onShapeUpdate(shapeId, {
				draggedBy: this.localUserId || undefined
			});
		});

		konvaShape.on('dragmove', () => {
			// PHASE 2: Broadcast live shape position via Awareness (no throttle)
			// Send every dragmove for smooth real-time movement
			this.callbacks!.onBroadcastShapeDrag(shapeId, {
				x: konvaShape.x(),
				y: konvaShape.y()
			});

			// Broadcast cursor position
			this.callbacks!.onBroadcastCursor();
		});

		konvaShape.on('dragend', (e) => {
			if (!this.stage) return;

			// Get current shape data for accurate reset
			const currentShape = this.callbacks!.getShapeById?.(shapeId) || shape;

			// Reset visual feedback to original shape properties (from current state)
			konvaShape.opacity(currentShape.opacity ?? 1);
			konvaShape.shadowColor('');
			konvaShape.shadowBlur(0);
			konvaShape.shadowOpacity(0);
			konvaShape.shadowOffset({ x: 0, y: 0 });
			this.stage.container().style.cursor = 'move';

			// Get final position and validate
			const finalX = e.target.x();
			const finalY = e.target.y();

			// Only save if coordinates are valid
			if (!isFinite(finalX) || !isFinite(finalY)) {
				console.error(`Prevented saving invalid drag position for shape ${shapeId}:`, { finalX, finalY });
				// Reset to last known good position
				konvaShape.x(currentShape.x);
				konvaShape.y(currentShape.y);
				this.shapesLayer.batchDraw();
				return;
			}

			// PHASE 5: Persist final position to Yjs (creates ONE undo entry)
			this.callbacks!.onShapeUpdate(shapeId, {
				x: finalX,
				y: finalY,
				draggedBy: undefined
			});

			// PHASE 6: Clear from Awareness so other users stop seeing the drag ghost
			this.callbacks!.onBroadcastShapeDrag(shapeId, {
				x: finalX,
				y: finalY,
				endDrag: true // Signal to clear from Awareness
			} as { x: number; y: number; endDrag: boolean });

			// Broadcast final cursor position
			this.callbacks!.onBroadcastCursor();

			// Clear drag tracking
			requestAnimationFrame(() => {
				this.locallyDraggingId = null;
			});
		});

		// Double-click to edit text
		if (shape.type === 'text') {
			konvaShape.on('dblclick dbltap', () => {
				// Get current shape data instead of using closure to get latest text content
				const currentShape = this.callbacks!.getShapeById?.(shapeId) || shape;
				if (currentShape.type === 'text') {
					this.enableTextEditing(konvaShape as Konva.Text, currentShape);
				}
			});
		}

		// NOTE: Click handling is done in EventHandlers.ts on the stage level
		// to support multi-select with Shift/Cmd modifiers. Don't add click
		// handlers here as they would prevent event bubbling.
	}

	// Callback for text editing integration
	private textEditingCallback:
		| ((
			textId: string,
			toolbarPosition: { x: number; y: number },
			format: {
				fontWeight: 'normal' | 'bold';
				fontStyle: 'normal' | 'italic';
				textDecoration: string;
				align: 'left' | 'center' | 'right';
				fontSize: number;
				fontFamily: string;
			}
		) => void)
		| null = null;

	private toolbarWidth = 0;

	private textEditingEndCallback: (() => void) | null = null;

	// Store reference to active textarea for live updates
	private activeTextarea: HTMLTextAreaElement | null = null;

	/**
	 * Set callback for text editing
	 */
	setTextEditingCallback(
		onStart: (
			textId: string,
			toolbarPosition: { x: number; y: number },
			format: {
				fontWeight: 'normal' | 'bold';
				fontStyle: 'normal' | 'italic';
				textDecoration: string;
				align: 'left' | 'center' | 'right';
				fontSize: number;
				fontFamily: string;
			}
		) => void,
		onEnd: () => void
	): void {
		this.textEditingCallback = onStart;
		this.textEditingEndCallback = onEnd;
	}

	/**
	 * Set the toolbar width to size the textarea accordingly
	 */
	setToolbarWidth(width: number): void {
		this.toolbarWidth = width;
	}

	/**
	 * Update the active textarea styling when shape properties change
	 */
	updateTextareaFormatting(shape: Extract<Shape, { type: 'text' }>): void {
		if (!this.activeTextarea || !this.stage) return;

		const scale = this.stage.scaleX();
		this.activeTextarea.style.fontSize = `${shape.fontSize * scale}px`;
		this.activeTextarea.style.fontFamily = shape.fontFamily || 'system-ui';
		this.activeTextarea.style.fontWeight = String(shape.fontWeight || 'normal');
		this.activeTextarea.style.fontStyle = shape.fontStyle || 'normal';
		this.activeTextarea.style.textDecoration = shape.textDecoration || 'none';
		this.activeTextarea.style.textAlign = shape.align || 'left';
		this.activeTextarea.style.color = shape.fill || '#000000';
	}

	/**
	 * Enable text editing for a text shape
	 */
	private enableTextEditing(textNode: Konva.Text, shape: Extract<Shape, { type: 'text' }>): void {
		if (!this.stage) return;

		// Track that we're editing this shape
		this.locallyEditingId = shape.id;

		// Hide text node
		textNode.hide();

		// Create textarea
		const textPosition = textNode.absolutePosition();
		const stageBox = this.stage.container().getBoundingClientRect();
		const scale = this.stage.scaleX();

		// Calculate toolbar position (above the text)
		const toolbarX = stageBox.left + textPosition.x * scale;
		const toolbarY = stageBox.top + textPosition.y * scale - 60; // 60px above text

		// Notify about text editing start with formatting toolbar info
		if (this.textEditingCallback) {
			const fontWeight = shape.fontWeight;
			const fontStyle = shape.fontStyle;
			this.textEditingCallback(shape.id, { x: toolbarX, y: toolbarY }, {
				fontWeight: (fontWeight === 'bold' || fontWeight === 'normal') ? fontWeight : 'normal',
				fontStyle: (fontStyle === 'italic' || fontStyle === 'normal') ? fontStyle : 'normal',
				textDecoration: shape.textDecoration || 'none',
				align: shape.align || 'left',
				fontSize: shape.fontSize,
				fontFamily: shape.fontFamily || 'system-ui'
			});
		}

		const textarea = document.createElement('textarea');
		document.body.appendChild(textarea);

		// Store reference for live updates
		this.activeTextarea = textarea;

		// Function to update textarea styling based on shape properties
		const updateTextareaStyle = (currentShape: Extract<Shape, { type: 'text' }>) => {
			textarea.style.fontSize = `${currentShape.fontSize * scale}px`;
			textarea.style.fontFamily = currentShape.fontFamily || 'system-ui';
			textarea.style.fontWeight = String(currentShape.fontWeight || 'normal');
			textarea.style.fontStyle = currentShape.fontStyle || 'normal';
			textarea.style.textDecoration = currentShape.textDecoration || 'none';
			textarea.style.textAlign = currentShape.align || 'left';
			textarea.style.color = currentShape.fill || '#000000';
		};

		// Enhanced textarea styling with resize capability
		textarea.value = shape.text;
		textarea.style.position = 'absolute';
		textarea.style.top = `${stageBox.top + textPosition.y * scale}px`;
		textarea.style.left = `${stageBox.left + textPosition.x * scale}px`;
		// Set width to match toolbar width, fallback to textNode width or minimum
		const defaultWidth = this.toolbarWidth > 0 ? this.toolbarWidth : Math.max(400, textNode.width() * scale);
		textarea.style.width = `${defaultWidth}px`;
		textarea.style.minHeight = '60px';
		textarea.style.border = '2px solid #a78bfa';
		textarea.style.borderRadius = '8px';
		textarea.style.padding = '8px';
		textarea.style.margin = '0';
		textarea.style.overflow = 'auto';
		textarea.style.background = 'rgba(255, 255, 255, 0.95)';
		textarea.style.backdropFilter = 'blur(8px)';
		textarea.style.outline = 'none';
		textarea.style.resize = 'both';
		textarea.style.lineHeight = '1.2';
		textarea.style.transformOrigin = 'left top';
		textarea.style.boxShadow = '0 4px 12px rgba(139, 92, 246, 0.2)';
		textarea.style.zIndex = '1000';

		// Apply initial formatting
		updateTextareaStyle(shape);

		// Auto-grow textarea
		const adjustHeight = () => {
			textarea.style.height = 'auto';
			textarea.style.height = `${Math.max(60, textarea.scrollHeight)}px`;
		};
		textarea.addEventListener('input', adjustHeight);
		adjustHeight();

		textarea.focus();
		textarea.select();

		let removed = false;
		const removeTextarea = () => {
			if (removed) return;
			removed = true;

			const newText = textarea.value.trim() || shape.text;

			// Remove textarea
			textarea.remove();

			// Clear editing state
			this.locallyEditingId = null;
			this.activeTextarea = null;

			// Notify text editing end
			if (this.textEditingEndCallback) {
				this.textEditingEndCallback();
			}

			// Update text if changed
			if (newText !== shape.text) {
				this.callbacks!.onShapeUpdate(shape.id, { text: newText });
				// Re-render will happen automatically with new text
			} else {
				// No change, just show the existing node
				textNode.show();
				this.shapesLayer.batchDraw();
			}
		};

		textarea.addEventListener('keydown', (e) => {
			if (e.key === 'Escape') {
				e.preventDefault();
				removeTextarea();
			}
			// Don't close on Enter - allow multi-line text
		});

		textarea.addEventListener('blur', (e) => {
			// Check if blur is happening because of clicking on formatting toolbar
			setTimeout(() => {
				const activeElement = document.activeElement;
				const clickedElement = e.relatedTarget as HTMLElement | null;

				// Don't close if focus moved to toolbar or dropdown
				if (
					activeElement?.closest('[role="toolbar"]') ||
					clickedElement?.closest('[role="toolbar"]') ||
					activeElement?.closest('[role="listbox"]') ||
					clickedElement?.closest('[role="listbox"]') ||
					activeElement?.closest('[data-bits-menu-content]') ||
					clickedElement?.closest('[data-bits-menu-content]')
				) {
					// Re-focus the textarea to keep editing mode active
					textarea.focus();
					return;
				}

				removeTextarea();
			}, 100);
		});
	}

	/**
	 * Clean up resources
	 */
	destroy(): void {
		// Clean up active textarea if exists
		if (this.activeTextarea) {
			this.activeTextarea.remove();
			this.activeTextarea = null;
		}

		// Call text editing end callback if exists
		if (this.textEditingEndCallback) {
			this.textEditingEndCallback();
			this.textEditingEndCallback = null;
		}

		this.callbacks = null;
		this.stage = null;
	}
}
