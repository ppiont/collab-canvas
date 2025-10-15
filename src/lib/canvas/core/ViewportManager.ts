/**
 * Viewport Manager - Pan and Zoom Control
 * Extracted from canvas/+page.svelte
 * 
 * Handles:
 * - Zoom in/out with mouse wheel
 * - Pan with stage dragging
 * - Viewport state management
 * - Zoom constraints (min/max)
 */

import Konva from 'konva';
import type { CanvasViewport } from '$lib/types/canvas';
import { CANVAS } from '$lib/constants';

/** Callback for viewport changes */
export type ViewportChangeCallback = (viewport: CanvasViewport) => void;

/**
 * ViewportManager handles canvas pan and zoom
 */
export class ViewportManager {
    private stage: Konva.Stage;
    private onViewportChange: ViewportChangeCallback | null = null;

    constructor(stage: Konva.Stage) {
        this.stage = stage;
    }

    /**
     * Set callback for viewport changes
     */
    setOnViewportChange(callback: ViewportChangeCallback): void {
        this.onViewportChange = callback;
    }

    /**
     * Handle mouse wheel for zoom
     */
    handleWheel(e: WheelEvent): void {
        if (!this.stage) return;
        e.preventDefault();

        const oldScale = this.stage.scaleX();

        // Get pointer position relative to stage
        const pointer = this.stage.getPointerPosition();
        if (!pointer) return;

        const mousePointTo = {
            x: (pointer.x - this.stage.x()) / oldScale,
            y: (pointer.y - this.stage.y()) / oldScale
        };

        // Calculate new scale
        const newScale = e.deltaY < 0
            ? oldScale * CANVAS.ZOOM_STEP
            : oldScale / CANVAS.ZOOM_STEP;

        // Clamp scale between min and max
        const clampedScale = Math.max(
            CANVAS.MIN_ZOOM,
            Math.min(CANVAS.MAX_ZOOM, newScale)
        );

        this.stage.scale({ x: clampedScale, y: clampedScale });

        // Adjust position to zoom toward pointer
        const newPos = {
            x: pointer.x - mousePointTo.x * clampedScale,
            y: pointer.y - mousePointTo.y * clampedScale
        };

        this.stage.position(newPos);
        this.stage.batchDraw();

        // Notify listeners
        this.notifyViewportChange();
    }

    /**
     * Pan viewport by delta amount
     */
    pan(dx: number, dy: number): void {
        const currentPos = this.stage.position();
        this.stage.position({
            x: currentPos.x + dx,
            y: currentPos.y + dy
        });
        this.stage.batchDraw();

        this.notifyViewportChange();
    }

    /**
     * Zoom to a specific point
     */
    zoomToPoint(x: number, y: number, scale: number): void {
        const clampedScale = Math.max(
            CANVAS.MIN_ZOOM,
            Math.min(CANVAS.MAX_ZOOM, scale)
        );

        this.stage.scale({ x: clampedScale, y: clampedScale });
        this.stage.position({ x, y });
        this.stage.batchDraw();

        this.notifyViewportChange();
    }

    /**
     * Get current viewport state
     */
    getViewport(): CanvasViewport {
        const pos = this.stage.position();
        const scale = this.stage.scaleX();

        return {
            x: pos.x,
            y: pos.y,
            scale
        };
    }

    /**
     * Set viewport state
     */
    setViewport(viewport: CanvasViewport): void {
        const clampedScale = Math.max(
            CANVAS.MIN_ZOOM,
            Math.min(CANVAS.MAX_ZOOM, viewport.scale)
        );

        this.stage.position({ x: viewport.x, y: viewport.y });
        this.stage.scale({ x: clampedScale, y: clampedScale });
        this.stage.batchDraw();

        this.notifyViewportChange();
    }

    /**
     * Center viewport on a specific canvas coordinate
     */
    centerOn(x: number, y: number): void {
        const stageWidth = this.stage.width();
        const stageHeight = this.stage.height();
        const scale = this.stage.scaleX();

        const newPos = {
            x: stageWidth / 2 - x * scale,
            y: stageHeight / 2 - y * scale
        };

        this.stage.position(newPos);
        this.stage.batchDraw();

        this.notifyViewportChange();
    }

    /**
     * Reset viewport to default (0, 0, 1x zoom)
     */
    reset(): void {
        this.setViewport({ x: 0, y: 0, scale: 1 });
    }

    /**
     * Notify listeners of viewport change
     */
    private notifyViewportChange(): void {
        if (this.onViewportChange) {
            this.onViewportChange(this.getViewport());
        }
    }

    /**
     * Clean up resources
     */
    destroy(): void {
        this.onViewportChange = null;
    }
}
