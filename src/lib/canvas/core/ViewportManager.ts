/**
 * Viewport Manager - Pan and Zoom Control
 * Refactored to use Svelte 5 store pattern
 *
 * Handles:
 * - Zoom in/out with mouse wheel
 * - Pan with stage dragging
 * - Viewport state management (writes to store)
 * - Zoom constraints (min/max)
 */

import Konva from 'konva';
import type { CanvasViewport } from '$lib/types/canvas';
import { CANVAS } from '$lib/constants';
import { viewportOperations } from '$lib/stores/canvas';

/**
 * ViewportManager handles canvas pan and zoom
 * Writes all changes to the viewport store (single source of truth)
 */
export class ViewportManager {
	private stage: Konva.Stage;

	constructor(stage: Konva.Stage) {
		this.stage = stage;

		// Initialize store with current stage state
		const pos = stage.position();
		const scale = stage.scaleX();
		viewportOperations.set(pos.x, pos.y, scale);
	}

	/**
	 * Handle mouse wheel for zoom with smooth easing
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
		const newScale = e.deltaY < 0 ? oldScale * CANVAS.ZOOM_STEP : oldScale / CANVAS.ZOOM_STEP;

		// Clamp scale between min and max
		const clampedScale = Math.max(CANVAS.MIN_ZOOM, Math.min(CANVAS.MAX_ZOOM, newScale));

		// Calculate target position
		const newPos = {
			x: pointer.x - mousePointTo.x * clampedScale,
			y: pointer.y - mousePointTo.y * clampedScale
		};

		// Smooth zoom with Konva.Tween
		new Konva.Tween({
			node: this.stage,
			duration: 0.12, // 120ms for responsive feel
			scaleX: clampedScale,
			scaleY: clampedScale,
			x: newPos.x,
			y: newPos.y,
			easing: Konva.Easings.EaseOut,
			onFinish: () => {
				// Update store after animation completes
				viewportOperations.set(newPos.x, newPos.y, clampedScale);
			}
		}).play();
	}

	/**
	 * Pan viewport by delta amount
	 */
	pan(dx: number, dy: number): void {
		const currentPos = this.stage.position();
		const newPos = {
			x: currentPos.x + dx,
			y: currentPos.y + dy
		};
		this.stage.position(newPos);
		this.stage.batchDraw();

		// Update store
		const scale = this.stage.scaleX();
		viewportOperations.set(newPos.x, newPos.y, scale);
	}

	/**
	 * Zoom to a specific point
	 */
	zoomToPoint(x: number, y: number, scale: number): void {
		const clampedScale = Math.max(CANVAS.MIN_ZOOM, Math.min(CANVAS.MAX_ZOOM, scale));

		this.stage.scale({ x: clampedScale, y: clampedScale });
		this.stage.position({ x, y });
		this.stage.batchDraw();

		// Update store
		viewportOperations.set(x, y, clampedScale);
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
		const clampedScale = Math.max(CANVAS.MIN_ZOOM, Math.min(CANVAS.MAX_ZOOM, viewport.scale));

		this.stage.position({ x: viewport.x, y: viewport.y });
		this.stage.scale({ x: clampedScale, y: clampedScale });
		this.stage.batchDraw();
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
	}

	/**
	 * Reset viewport to default (0, 0, 1x zoom)
	 */
	reset(): void {
		this.setViewport({ x: 0, y: 0, scale: 1 });
	}

	/**
	 * Sync store with current stage state
	 * Call this after any direct stage manipulation (like Konva's built-in drag)
	 */
	syncStore(): void {
		const pos = this.stage.position();
		const scale = this.stage.scaleX();
		viewportOperations.set(pos.x, pos.y, scale);
	}

	/**
	 * Clean up resources
	 */
	destroy(): void {
		// No cleanup needed - store persists
	}
}
