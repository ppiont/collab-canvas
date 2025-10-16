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
import type { ViewportManager } from './ViewportManager';
import type { SelectionManager } from './SelectionManager';
import type { CursorManager } from '../collaboration/CursorManager';
import { SelectionNet } from './SelectionNet';
import type { Shape } from '$lib/types/shapes';
import { activeTool } from '$lib/stores/tool';
import { shapeOperations } from '$lib/stores/shapes';

/** Callback for shape creation */
export type ShapeCreateCallback = (x: number, y: number) => void;

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
    private getShapes: GetShapesCallback;
    private isDraggingStage = false;
    private isDrawingNet = false;
    private netStartPos: { x: number; y: number } | null = null;
    private isSpacePressed = false; // Track spacebar for pan mode

    constructor(
        stage: Konva.Stage,
        shapesLayer: Konva.Layer,
        viewportManager: ViewportManager,
        selectionManager: SelectionManager,
        cursorManager: CursorManager,
        isCreateMode: () => boolean,
        onShapeCreate: ShapeCreateCallback,
        getShapes: GetShapesCallback
    ) {
        this.stage = stage;
        this.shapesLayer = shapesLayer;
        this.viewportManager = viewportManager;
        this.selectionManager = selectionManager;
        this.cursorManager = cursorManager;
        this.isCreateMode = isCreateMode;
        this.onShapeCreate = onShapeCreate;
        this.getShapes = getShapes;
        this.selectionNet = new SelectionNet(stage, shapesLayer);
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
            this.cursorManager?.broadcastCursor(e);

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
            // Stop following mode on any click
            this.cursorManager?.stopFollowing();

            // Get keyboard modifiers
            const isShift = e.evt.shiftKey;
            const isCmd = e.evt.metaKey || e.evt.ctrlKey;

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
                console.log('[Click] Shape clicked:', shapeId, 'Shift:', isShift, 'Cmd:', isCmd);

                if (isCmd) {
                    // Cmd/Ctrl+Click: Toggle selection
                    console.log('[Click] Cmd mode - toggling');
                    this.selectionManager.toggleSelection(shapeId);
                } else if (isShift) {
                    // Shift+Click: Add to or remove from selection
                    if (this.selectionManager.isSelected(shapeId)) {
                        console.log('[Click] Shift mode - removing from selection');
                        this.selectionManager.removeFromSelection(shapeId);
                    } else {
                        console.log('[Click] Shift mode - adding to selection');
                        this.selectionManager.addToSelection(shapeId);
                    }
                } else {
                    // Normal click: Single select
                    console.log('[Click] Normal mode - single select');
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
                        console.log('[MouseDown] Recorded netStartPos:', this.netStartPos);
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
                console.log('[DragStart] Stage drag started');
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

            console.log('[DragEnd] Stage drag ended');

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
            if (this.netStartPos && !this.isDrawingNet && !this.isCreateMode() && !this.isSpacePressed && !this.isDraggingStage) {
                const pos = this.stage.getPointerPosition();
                if (pos) {
                    // Calculate drag distance
                    const dx = pos.x - this.netStartPos.x;
                    const dy = pos.y - this.netStartPos.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    // Start net if dragged more than 5px
                    if (distance > 5) {
                        console.log('[DragNet] Starting drag-net, distance:', distance);
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
                console.log('[DragNet] Bounds:', bounds);

                if (bounds && (bounds.width > 0 || bounds.height > 0)) {
                    const allShapes = this.getShapes();
                    console.log('[DragNet] All shapes:', allShapes.length);

                    const intersectingIds = this.selectionNet.getIntersectingShapes(
                        bounds,
                        allShapes
                    );
                    console.log('[DragNet] Intersecting shapes:', intersectingIds);

                    // Get keyboard modifiers
                    const isShift = e.evt.shiftKey;
                    const isCmd = e.evt.metaKey || e.evt.ctrlKey;

                    if (isShift) {
                        // Shift: Add to selection
                        const current = this.selectionManager.getSelectedIds();
                        const combined = [...new Set([...current, ...intersectingIds])];
                        this.selectionManager.selectMultiple(combined);
                        console.log('[DragNet] Shift mode - Combined selection:', combined);
                    } else if (isCmd) {
                        // Cmd: Toggle selection
                        const current = new Set(this.selectionManager.getSelectedIds());
                        intersectingIds.forEach(id => {
                            if (current.has(id)) {
                                current.delete(id);
                            } else {
                                current.add(id);
                            }
                        });
                        const toggled = Array.from(current);
                        this.selectionManager.selectMultiple(toggled);
                        console.log('[DragNet] Cmd mode - Toggled selection:', toggled);
                    } else {
                        // Default: Replace selection
                        this.selectionManager.selectMultiple(intersectingIds);
                        console.log('[DragNet] Default mode - Selected:', intersectingIds);
                    }
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
                if (e.key === 'v') {
                    e.preventDefault();
                    activeTool.set('select');
                    return;
                }
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
                if (e.key === 'e') {
                    e.preventDefault();
                    activeTool.set('ellipse');
                    return;
                }
                if (e.key === 'l') {
                    e.preventDefault();
                    activeTool.set('line');
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

            // Delete/Backspace - delete selected shapes
            if (e.key === 'Delete' || e.key === 'Backspace') {
                if (!isTyping) {
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
                    const maxZ = Math.max(...allShapes.map(s => s.zIndex || 0), 0);

                    selectedIds.forEach(id => {
                        const shape = allShapes.find(s => s.id === id);
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

            // Cmd+] - Bring forward / Bring to front
            if (isModifierKey && e.key === ']' && !isTyping) {
                e.preventDefault();
                const selectedIds = this.selectionManager.getSelectedIds();
                if (selectedIds.length > 0) {
                    const allShapes = this.getShapes();

                    if (e.shiftKey) {
                        // Cmd+Shift+] - Bring to front
                        const maxZ = Math.max(...allShapes.map(s => s.zIndex || 0), 0);
                        selectedIds.forEach(id => {
                            shapeOperations.update(id, { zIndex: maxZ + 1 });
                        });
                    } else {
                        // Cmd+] - Bring forward
                        selectedIds.forEach(id => {
                            const shape = allShapes.find(s => s.id === id);
                            if (shape) {
                                shapeOperations.update(id, { zIndex: (shape.zIndex || 0) + 1 });
                            }
                        });
                    }
                }
            }

            // Cmd+[ - Send backward / Send to back
            if (isModifierKey && e.key === '[' && !isTyping) {
                e.preventDefault();
                const selectedIds = this.selectionManager.getSelectedIds();
                if (selectedIds.length > 0) {
                    const allShapes = this.getShapes();

                    if (e.shiftKey) {
                        // Cmd+Shift+[ - Send to back
                        const minZ = Math.min(...allShapes.map(s => s.zIndex || 0), 0);
                        selectedIds.forEach(id => {
                            shapeOperations.update(id, { zIndex: minZ - 1 });
                        });
                    } else {
                        // Cmd+[ - Send backward
                        selectedIds.forEach(id => {
                            const shape = allShapes.find(s => s.id === id);
                            if (shape) {
                                shapeOperations.update(id, { zIndex: (shape.zIndex || 0) - 1 });
                            }
                        });
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
                        selectedIds.forEach(id => {
                            const shape = shapeOperations.get(id);
                            if (shape) {
                                shapeOperations.update(id, { y: shape.y - nudgeAmount });
                            }
                        });
                    }
                    if (e.key === 'ArrowDown') {
                        e.preventDefault();
                        selectedIds.forEach(id => {
                            const shape = shapeOperations.get(id);
                            if (shape) {
                                shapeOperations.update(id, { y: shape.y + nudgeAmount });
                            }
                        });
                    }
                    if (e.key === 'ArrowLeft') {
                        e.preventDefault();
                        selectedIds.forEach(id => {
                            const shape = shapeOperations.get(id);
                            if (shape) {
                                shapeOperations.update(id, { x: shape.x - nudgeAmount });
                            }
                        });
                    }
                    if (e.key === 'ArrowRight') {
                        e.preventDefault();
                        selectedIds.forEach(id => {
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

