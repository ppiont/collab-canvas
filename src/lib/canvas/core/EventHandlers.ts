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
import { activeTool } from '$lib/stores/tool';
import { get } from 'svelte/store';

/** Callback for shape creation */
export type ShapeCreateCallback = (x: number, y: number) => void;

/**
 * CanvasEventHandlers manages all stage and canvas interactions
 */
export class CanvasEventHandlers {
    private stage: Konva.Stage;
    private viewportManager: ViewportManager;
    private selectionManager: SelectionManager;
    private cursorManager: CursorManager;
    private isCreateMode: () => boolean;
    private onShapeCreate: ShapeCreateCallback;
    private isDraggingStage = false;

    constructor(
        stage: Konva.Stage,
        viewportManager: ViewportManager,
        selectionManager: SelectionManager,
        cursorManager: CursorManager,
        isCreateMode: () => boolean,
        onShapeCreate: ShapeCreateCallback
    ) {
        this.stage = stage;
        this.viewportManager = viewportManager;
        this.selectionManager = selectionManager;
        this.cursorManager = cursorManager;
        this.isCreateMode = isCreateMode;
        this.onShapeCreate = onShapeCreate;
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
                    // Deselect
                    this.selectionManager.deselect();
                }
            }
        });
    }

    /**
     * Set up stage drag handlers for pan
     */
    setupDragHandlers(): void {
        // Set initial cursor
        this.stage.container().style.cursor = 'grab';

        this.stage.on('mousedown', (e) => {
            if (e.target === this.stage) {
                this.stage.draggable(true);
                this.stage.container().style.cursor = 'grabbing';
            } else {
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

        this.stage.on('dragend', (e) => {
            this.isDraggingStage = false;
            if (e.target !== this.stage) {
                this.stage.draggable(true);
            }
            // Reset cursor
            this.stage.container().style.cursor = this.isCreateMode() ? 'crosshair' : 'grab';
        });

        // Handle mouseup to reset drag state (in case drag didn't complete)
        this.stage.on('mouseup', () => {
            if (this.isDraggingStage) {
                this.isDraggingStage = false;
                this.stage.container().style.cursor = this.isCreateMode() ? 'crosshair' : 'grab';
            }
        });
    }

    /**
     * Set up keyboard shortcuts
     */
    setupKeyboardHandlers(): void {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                this.selectionManager.deselect();
                if (this.isCreateMode()) {
                    activeTool.set('select');
                }
            }
            if (e.key === 'Delete' || e.key === 'Backspace') {
                this.selectionManager.delete();
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        // Store for cleanup
        this.keydownHandler = handleKeyDown;
    }

    private keydownHandler: ((e: KeyboardEvent) => void) | null = null;

    /**
     * Clean up all event handlers
     */
    destroy(): void {
        if (this.keydownHandler) {
            window.removeEventListener('keydown', this.keydownHandler);
            this.keydownHandler = null;
        }

        // Stage event handlers are automatically cleaned up when stage is destroyed
    }
}

