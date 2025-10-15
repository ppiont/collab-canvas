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
import { SHAPES } from '$lib/constants';

/** Event callbacks for shape interactions */
export interface ShapeEventCallbacks {
    onShapeUpdate: (id: string, changes: Partial<Shape>) => void;
    onShapeSelect: (id: string) => void;
    onBroadcastCursor: () => void;
    getMaxZIndex: () => number;
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
     * Set currently dragging shape ID
     */
    setDraggingShape(shapeId: string | null): void {
        this.locallyDraggingId = shapeId;
    }

    /**
     * Render all shapes to the Konva layer
     */
    renderShapes(shapes: Shape[]): void {
        if (!this.shapesLayer) {
            return;
        }

        // Remove existing shapes (but not transformer)
        const existingShapes = this.shapesLayer.find('.shape');
        existingShapes.forEach((shape) => {
            // Preserve shapes we're currently interacting with
            if (shape.id() !== this.locallyDraggingId && shape.id() !== this.locallyEditingId) {
                shape.destroy();
            }
        });

        // Sort by zIndex before rendering (lower zIndex = bottom)
        const sortedShapes = [...shapes].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));

        sortedShapes.forEach((shape) => {
            // Skip recreating shapes we're currently interacting with
            if (shape.id === this.locallyDraggingId || shape.id === this.locallyEditingId) {
                return;
            }

            // Check if someone else is dragging this shape
            const isDraggedByOther = !!(shape.draggedBy && shape.draggedBy !== this.localUserId);

            // Create Konva shape based on type
            const konvaShape = this.createKonvaShape(shape, isDraggedByOther);
            if (!konvaShape) {
                return;
            }

            // Attach event handlers
            this.attachEventHandlers(konvaShape, shape, isDraggedByOther);

            this.shapesLayer.add(konvaShape);
        });

        // Keep locally dragging shape on top
        if (this.locallyDraggingId) {
            const draggedNode = this.shapesLayer.findOne(`#${this.locallyDraggingId}`);
            if (draggedNode) {
                draggedNode.moveToTop();
            }
        }

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
            rotation: shape.rotation || 0,  // Apply stored rotation
            fill: shape.fill,
            stroke: shape.stroke,
            strokeWidth: shape.strokeWidth,
            strokeScaleEnabled: false,  // Keep stroke width constant when scaling
            draggable: (('draggable' in shape ? shape.draggable : true) ?? true) && !isDraggedByOther,
            opacity: isDraggedByOther ? 0.5 : (shape.opacity || 1),  // Use stored opacity
            shadowColor: isDraggedByOther ? '#667eea' : '',
            shadowBlur: isDraggedByOther ? 8 : 0,
            shadowOpacity: isDraggedByOther ? 0.6 : 0
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

            case 'ellipse':
                return new Konva.Ellipse({
                    ...baseConfig,
                    radiusX: shape.radiusX,
                    radiusY: shape.radiusY
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
                    points.push(
                        Math.cos(angle) * polygonShape.radius,
                        Math.sin(angle) * polygonShape.radius
                    );
                }
                return new Konva.Line({
                    ...baseConfig,
                    points: points,
                    closed: true
                });
            }

            case 'star':
                return new Konva.Star({
                    ...baseConfig,
                    numPoints: shape.numPoints,
                    innerRadius: shape.innerRadius,
                    outerRadius: shape.outerRadius
                });

            case 'text':
                return new Konva.Text({
                    ...baseConfig,
                    text: shape.text,
                    fontSize: shape.fontSize,
                    fontFamily: shape.fontFamily || SHAPES.DEFAULT_FONT_FAMILY,
                    fontStyle: shape.fontStyle,
                    align: shape.align || 'left',
                    fill: shape.fill || '#000000',
                    stroke: undefined // Text typically doesn't have stroke
                });

            case 'image':
                // Image shapes need special handling with Image objects
                // For now, return a placeholder rect (will be implemented in image support phase)
                console.warn('Image shape rendering not yet implemented');
                return new Konva.Rect({
                    ...baseConfig,
                    width: shape.width,
                    height: shape.height,
                    fill: '#e2e8f0',
                    stroke: '#94a3b8'
                });

            default:
                console.warn('Unknown shape type:', (shape as Shape).type);
                return null;
        }
    }

    /**
     * Attach event handlers to a Konva shape
     */
    private attachEventHandlers(
        konvaShape: Konva.Shape,
        shape: Shape,
        isDraggedByOther: boolean
    ): void {
        if (!this.callbacks || !this.stage) return;

        // Hover effects
        konvaShape.on('mouseenter', () => {
            if (!this.stage) return;
            this.stage.container().style.cursor = isDraggedByOther ? 'not-allowed' : 'move';

            if (!isDraggedByOther) {
                konvaShape.strokeWidth((shape.strokeWidth || 2) + 1);
                this.shapesLayer.batchDraw();
            }
        });

        konvaShape.on('mouseleave', () => {
            if (!this.stage) return;
            this.stage.container().style.cursor = 'default';

            if (!isDraggedByOther) {
                konvaShape.strokeWidth(shape.strokeWidth);
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

            // Move to top locally
            konvaShape.moveToTop();

            // Broadcast cursor
            this.callbacks!.onBroadcastCursor();

            // Track local drag
            this.locallyDraggingId = shape.id;

            // Update with highest zIndex
            this.callbacks!.onShapeUpdate(shape.id, {
                draggedBy: this.localUserId || undefined,
                zIndex: this.callbacks!.getMaxZIndex() + 1
            });
        });

        konvaShape.on('dragmove', (e) => {
            // Broadcast cursor and position
            this.callbacks!.onBroadcastCursor();
            this.callbacks!.onShapeUpdate(shape.id, {
                x: e.target.x(),
                y: e.target.y()
            });
        });

        konvaShape.on('dragend', (e) => {
            if (!this.stage) return;

            // Reset visual feedback
            konvaShape.opacity(1);
            konvaShape.shadowColor('');
            konvaShape.shadowBlur(0);
            konvaShape.shadowOpacity(0);
            konvaShape.shadowOffset({ x: 0, y: 0 });
            this.stage.container().style.cursor = 'move';

            // Update final position and clear drag state
            this.callbacks!.onShapeUpdate(shape.id, {
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

        // Click to select
        konvaShape.on('click tap', (e) => {
            if (this.isCreateMode) return;
            e.cancelBubble = true;
            this.callbacks!.onShapeSelect(shape.id);
        });

        // Double-click to edit text
        if (shape.type === 'text') {
            konvaShape.on('dblclick dbltap', () => {
                this.enableTextEditing(konvaShape as Konva.Text, shape);
            });
        }

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

