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
	getMaxZIndex: () => number;
	getSelectedIds: () => string[]; // NEW: Get currently selected shape IDs
	getShapeById: (id: string) => Shape | undefined; // NEW: Get shape by ID
}

/**
 * ShapeRenderer handles rendering shapes to Konva layer
 * Supports all shape types and manages event handlers
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

		// Sort by zIndex before rendering (lower zIndex = bottom)
		const sortedShapes = [...shapesToRender].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));

		sortedShapes.forEach((shape) => {
			const existingNode = this.shapesLayer.findOne(`#${shape.id}`);
			const isLocallyDragging = shape.id === this.locallyDraggingId;
			const isSelected = selectedIds.includes(shape.id);

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
			const isDraggedByOther = !!(shape.draggedBy && shape.draggedBy !== this.localUserId);
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
		this.reorderShapesByZIndex(sortedShapes);

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
		const allShapeNodes = this.shapesLayer.find('.shape');
		if (allShapeNodes.length <= 1) return;

		// Get current order from layer
		const currentOrder = allShapeNodes.map((node) => node.id());
		const desiredOrder = sortedShapes.map((shape) => shape.id);

		// Check if reordering is needed
		const needsReordering = !this.arraysEqual(currentOrder, desiredOrder);
		if (!needsReordering) {
			return;
		}

		// Create map of nodes for quick lookup
		const nodeMap = new Map<string, Konva.Node>();
		allShapeNodes.forEach((node) => {
			nodeMap.set(node.id(), node);
		});

		// Move each shape to its correct position
		sortedShapes.forEach((shape, targetIndex) => {
			const node = nodeMap.get(shape.id);
			if (!node) return;

			const currentIndex = node.getZIndex();
			if (currentIndex === targetIndex) return; // Already in correct position

			// Move to bottom first, then up to target position
			node.moveToBottom();
			for (let i = 0; i < targetIndex; i++) {
				node.moveUp();
			}
		});
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
				break;

			case 'line':
				(node as Konva.Line).points(shape.points);
				break;

			case 'star': {
				const star = node as Konva.Star;
				star.numPoints(shape.numPoints);
				star.innerRadius(shape.innerRadius);
				star.outerRadius(shape.outerRadius);
				break;
			}

			case 'triangle': {
				const triangle = node as Konva.RegularPolygon;
				triangle.sides(3);
				triangle.radius(Math.max(shape.width, shape.height) / 2);
				break;
			}

			case 'text': {
				const text = node as Konva.Text;
				text.text(shape.text);
				text.fontSize(shape.fontSize);
				text.fontFamily(shape.fontFamily || 'system-ui');
				text.fontStyle(shape.fontStyle);
				text.align(shape.align || 'left');
				break;
			}

			case 'image':
				(node as Konva.Rect).width(shape.width);
				(node as Konva.Rect).height(shape.height);
				break;
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
			shadowColor: isDraggedByOther ? '#667eea' : (shape.shadow?.color || ''),
			shadowBlur: isDraggedByOther ? 8 : (shape.shadow?.blur || 0),
			shadowOpacity: isDraggedByOther ? 0.6 : (shape.shadow ? 0.5 : 0),
			shadowOffset: shape.shadow ? { x: shape.shadow.offsetX, y: shape.shadow.offsetY } : { x: 0, y: 0 }
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
					radius: shape.radius
				});

			case 'line':
				return new Konva.Line({
					...baseConfig,
					points: shape.points,
					fill: undefined // Lines don't have fill
				});

			case 'polygon': {
				const polygonShape = shape as Extract<Shape, { type: 'polygon' }>;
				// Generate points for polygon from sides and radius
				const points: number[] = [];
				for (let i = 0; i < polygonShape.sides; i++) {
					const angle = (i / polygonShape.sides) * Math.PI * 2 - Math.PI / 2;
					points.push(Math.cos(angle) * polygonShape.radius, Math.sin(angle) * polygonShape.radius);
				}
				return new Konva.Line({
					...baseConfig,
					points: points,
					closed: true
				});
			}

			case 'star': {
				const starShape = shape as Extract<Shape, { type: 'star' }>;
				return new Konva.Star({
					...baseConfig,
					numPoints: starShape.numPoints,
					innerRadius: starShape.innerRadius,
					outerRadius: starShape.outerRadius
				});
			}

			case 'triangle': {
				const triangleShape = shape as Extract<Shape, { type: 'triangle' }>;
				return new Konva.RegularPolygon({
					...baseConfig,
					sides: 3,
					radius: Math.max(triangleShape.width, triangleShape.height) / 2,
					fill: triangleShape.fill || undefined,
					stroke: triangleShape.stroke || undefined,
					strokeWidth: triangleShape.strokeWidth || 0,
					strokeEnabled: triangleShape.strokeEnabled !== false,
					shadowColor: triangleShape.shadow?.color || undefined,
					shadowBlur: triangleShape.shadow?.blur || 0,
					shadowOpacity: triangleShape.shadow ? 0.5 : 0,
					shadowOffset: triangleShape.shadow ? { x: triangleShape.shadow.offsetX, y: triangleShape.shadow.offsetY } : { x: 0, y: 0 }
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
					fontStyle: shape.fontStyle,
					align: shape.align || 'left'
					// NOTE: Intentionally NOT including stroke or strokeWidth
					// Konva.Text stroke rendering creates visual artifacts
				});

			case 'image':
				// Image shapes need special handling with Image objects
				// For now, return a placeholder rect (will be implemented in image support phase)
				return new Konva.Rect({
					...baseConfig,
					width: shape.width,
					height: shape.height,
					fill: '#e2e8f0',
					stroke: '#94a3b8'
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
			// Broadcast cursor position
			// DO NOT write to Yjs on every dragmove - causes too many undo steps
			// Only write final position on dragend
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

			// Update final position and clear drag state
			this.callbacks!.onShapeUpdate(shapeId, {
				x: e.target.x(),
				y: e.target.y(),
				draggedBy: undefined
			});

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
				this.enableTextEditing(konvaShape as Konva.Text, shape);
			});
		}

		// NOTE: Click handling is done in EventHandlers.ts on the stage level
		// to support multi-select with Shift/Cmd modifiers. Don't add click
		// handlers here as they would prevent event bubbling.
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

		const textarea = document.createElement('textarea');
		document.body.appendChild(textarea);

		// Position textarea
		textarea.value = shape.text;
		textarea.style.position = 'absolute';
		textarea.style.top = `${stageBox.top + textPosition.y * scale}px`;
		textarea.style.left = `${stageBox.left + textPosition.x * scale}px`;
		textarea.style.width = `${textNode.width() * scale}px`;
		textarea.style.fontSize = `${shape.fontSize * scale}px`;
		textarea.style.fontFamily = shape.fontFamily || 'system-ui';
		textarea.style.border = '2px solid #667eea';
		textarea.style.padding = '4px';
		textarea.style.margin = '0';
		textarea.style.overflow = 'hidden';
		textarea.style.background = 'white';
		textarea.style.outline = 'none';
		textarea.style.resize = 'none';
		textarea.style.lineHeight = '1.2';
		textarea.style.transformOrigin = 'left top';
		textarea.style.textAlign = shape.align || 'left';
		textarea.style.color = shape.fill || '#000000';

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
		});

		textarea.addEventListener('blur', () => {
			// Small delay to allow click events to process first
			setTimeout(removeTextarea, 10);
		});
	}

	/**
	 * Clean up resources
	 */
	destroy(): void {
		this.callbacks = null;
		this.stage = null;
	}
}
