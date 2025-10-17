/**
 * Canvas Store
 * Manages viewport state (pan/zoom)
 */

import { writable, derived } from 'svelte/store';
import type { CanvasViewport } from '$lib/types/canvas';
import { CANVAS } from '$lib/constants';

/**
 * Canvas viewport state (position and zoom)
 */
export const viewport = writable<CanvasViewport>({
	x: 0,
	y: 0,
	scale: 1
});

/**
 * Viewport operations
 */
export const viewportOperations = {
	/**
	 * Set viewport position and scale
	 */
	set: (x: number, y: number, scale: number) => {
		viewport.set({ x, y, scale });
	},

	/**
	 * Pan viewport by delta
	 */
	panBy: (dx: number, dy: number) => {
		viewport.update((v) => ({
			...v,
			x: v.x + dx,
			y: v.y + dy
		}));
	},

	/**
	 * Set zoom level
	 */
	setZoom: (scale: number) => {
		const clampedScale = Math.max(CANVAS.MIN_ZOOM, Math.min(CANVAS.MAX_ZOOM, scale));
		viewport.update((v) => ({
			...v,
			scale: clampedScale
		}));
	},

	/**
	 * Zoom by factor
	 */
	zoomBy: (factor: number) => {
		viewport.update((v) => {
			const newScale = v.scale * factor;
			const clampedScale = Math.max(CANVAS.MIN_ZOOM, Math.min(CANVAS.MAX_ZOOM, newScale));
			return {
				...v,
				scale: clampedScale
			};
		});
	},

	/**
	 * Zoom to specific point
	 */
	zoomToPoint: (x: number, y: number, scale: number) => {
		const clampedScale = Math.max(CANVAS.MIN_ZOOM, Math.min(CANVAS.MAX_ZOOM, scale));
		viewport.update((v) => {
			// Calculate new position to zoom toward the point
			const mousePointTo = {
				x: (x - v.x) / v.scale,
				y: (y - v.y) / v.scale
			};

			return {
				x: x - mousePointTo.x * clampedScale,
				y: y - mousePointTo.y * clampedScale,
				scale: clampedScale
			};
		});
	},

	/**
	 * Reset viewport to default
	 */
	reset: () => {
		viewport.set({ x: 0, y: 0, scale: 1 });
	},

	/**
	 * Center viewport on specific coordinates
	 */
	centerOn: (x: number, y: number, width: number, height: number) => {
		viewport.update((v) => ({
			...v,
			x: width / 2 - x * v.scale,
			y: height / 2 - y * v.scale
		}));
	}
};

/**
 * Formatted zoom percentage (for display)
 */
export const zoomPercentage = derived(viewport, ($viewport) => Math.round($viewport.scale * 100));

/**
 * Is viewport at default position and zoom?
 */
export const isViewportDefault = derived(
	viewport,
	($viewport) => $viewport.x === 0 && $viewport.y === 0 && $viewport.scale === 1
);
