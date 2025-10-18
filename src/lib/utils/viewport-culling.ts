/**
 * Viewport Culling Utilities
 * Calculates visible bounds and filters shapes for performance optimization
 *
 * Viewport culling ensures only visible shapes are rendered, dramatically
 * improving performance with large canvases (500+ shapes)
 */

import type { Shape } from '$lib/types/shapes';
import type { CanvasViewport } from '$lib/types/canvas';

/**
 * Visible bounds in canvas coordinates
 */
export interface VisibleBounds {
	left: number;
	right: number;
	top: number;
	bottom: number;
}

/**
 * Shape bounding box in canvas coordinates
 */
export interface ShapeBounds {
	left: number;
	right: number;
	top: number;
	bottom: number;
}

/**
 * Calculate visible bounds based on viewport and stage dimensions
 * Returns the canvas coordinates that are currently visible on screen
 */
export function calculateVisibleBounds(
	viewport: CanvasViewport,
	stageWidth: number,
	stageHeight: number,
	padding: number = 100 // Extra padding to render shapes slightly off-screen for smooth panning
): VisibleBounds {
	const { x, y, scale } = viewport;

	// Convert screen coordinates to canvas coordinates
	const left = -x / scale - padding;
	const right = (-x + stageWidth) / scale + padding;
	const top = -y / scale - padding;
	const bottom = (-y + stageHeight) / scale + padding;

	return { left, right, top, bottom };
}

/**
 * Calculate bounding box for a shape
 * Returns the shape's extents in canvas coordinates
 */
export function getShapeBounds(shape: Shape): ShapeBounds {
	const rotation = shape.rotation || 0;
	const hasRotation = rotation !== 0;

	// For rotated shapes, we need to calculate AABB (Axis-Aligned Bounding Box)
	// For simplicity, we'll use a conservative estimate
	switch (shape.type) {
		case 'rectangle': {
			if (!hasRotation) {
				return {
					left: shape.x,
					right: shape.x + shape.width,
					top: shape.y,
					bottom: shape.y + shape.height
				};
			}
			// Conservative bounds for rotated rectangle
			const diagonal = Math.sqrt(shape.width ** 2 + shape.height ** 2);
			return {
				left: shape.x - diagonal / 2,
				right: shape.x + diagonal / 2,
				top: shape.y - diagonal / 2,
				bottom: shape.y + diagonal / 2
			};
		}

		case 'circle': {
			const r = shape.radius;
			return {
				left: shape.x - r,
				right: shape.x + r,
				top: shape.y - r,
				bottom: shape.y + r
			};
		}

		case 'line': {
			// Find min/max of all points
			const points = shape.points;
			if (points.length === 0) {
				return { left: shape.x, right: shape.x, top: shape.y, bottom: shape.y };
			}

			let minX = Infinity,
				maxX = -Infinity;
			let minY = Infinity,
				maxY = -Infinity;

			for (let i = 0; i < points.length; i += 2) {
				const x = shape.x + points[i];
				const y = shape.y + points[i + 1];
				minX = Math.min(minX, x);
				maxX = Math.max(maxX, x);
				minY = Math.min(minY, y);
				maxY = Math.max(maxY, y);
			}

			return {
				left: minX,
				right: maxX,
				top: minY,
				bottom: maxY
			};
		}

		case 'text': {
			// Approximate text bounds (actual bounds depend on font metrics)
			const estimatedWidth = shape.width || shape.text.length * shape.fontSize * 0.6;
			const estimatedHeight = shape.fontSize * 1.2;

			if (!hasRotation) {
				return {
					left: shape.x,
					right: shape.x + estimatedWidth,
					top: shape.y,
					bottom: shape.y + estimatedHeight
				};
			}
			// Conservative bounds for rotated text
			const diagonal = Math.sqrt(estimatedWidth ** 2 + estimatedHeight ** 2);
			return {
				left: shape.x - diagonal / 2,
				right: shape.x + diagonal / 2,
				top: shape.y - diagonal / 2,
				bottom: shape.y + diagonal / 2
			};
		}

		case 'polygon': {
			// Polygon is a regular polygon centered at shape.x, shape.y
			const r = shape.radius;
			return {
				left: shape.x - r,
				right: shape.x + r,
				top: shape.y - r,
				bottom: shape.y + r
			};
		}

		case 'star': {
			// Star bounds based on outer radius
			const r = shape.outerRadius;
			return {
				left: shape.x - r,
				right: shape.x + r,
				top: shape.y - r,
				bottom: shape.y + r
			};
		}

		default: {
			// Fallback: point bounds
			// TypeScript exhaustiveness check - should never reach here
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			const _exhaustiveCheck: never = shape;
			return {
				left: 0,
				right: 0,
				top: 0,
				bottom: 0
			};
		}
	}
}

/**
 * Check if shape bounds intersect with visible bounds
 * Returns true if shape is at least partially visible
 */
export function isShapeVisible(shapeBounds: ShapeBounds, visibleBounds: VisibleBounds): boolean {
	// AABB intersection test
	return !(
		shapeBounds.right < visibleBounds.left ||
		shapeBounds.left > visibleBounds.right ||
		shapeBounds.bottom < visibleBounds.top ||
		shapeBounds.top > visibleBounds.bottom
	);
}

/**
 * Filter shapes to only those visible in viewport
 * This is the main entry point for viewport culling
 */
export function filterVisibleShapes(
	shapes: Shape[],
	viewport: CanvasViewport,
	stageWidth: number,
	stageHeight: number,
	padding: number = 100
): Shape[] {
	// If very few shapes, don't bother culling (overhead not worth it)
	if (shapes.length < 50) {
		return shapes;
	}

	const visibleBounds = calculateVisibleBounds(viewport, stageWidth, stageHeight, padding);

	return shapes.filter((shape) => {
		const shapeBounds = getShapeBounds(shape);
		return isShapeVisible(shapeBounds, visibleBounds);
	});
}

/**
 * Get culling statistics (for debugging/monitoring)
 */
export function getCullingStats(
	totalShapes: number,
	visibleShapes: number
): {
	totalShapes: number;
	visibleShapes: number;
	culledShapes: number;
	cullingRatio: number;
} {
	const culledShapes = totalShapes - visibleShapes;
	const cullingRatio = totalShapes > 0 ? culledShapes / totalShapes : 0;

	return {
		totalShapes,
		visibleShapes,
		culledShapes,
		cullingRatio
	};
}
