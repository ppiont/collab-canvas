/**
 * Layout Helper Functions
 * Common utilities for AI layout tools
 */

import type { Shape } from '$lib/types/shapes';
import { shapeOperations } from '$lib/stores/shapes';

/**
 * Get valid shapes from shape IDs, filtering out undefined references
 * Used across all layout tools to avoid duplication
 */
export function getShapesForLayout(shapeIds: string[]): Shape[] {
	return shapeIds
		.map((id: string) => shapeOperations.get(id))
		.filter((s: unknown): s is Shape => s !== undefined);
}

/**
 * Get width of a shape, handling different shape types
 */
export function getShapeWidth(shape: Shape): number {
	if ('width' in shape && shape.width !== undefined) {
		return shape.width as number;
	}
	if ('radius' in shape && shape.radius !== undefined) {
		return (shape.radius as number) * 2;
	}
	if ('outerRadius' in shape && shape.outerRadius !== undefined) {
		return (shape.outerRadius as number) * 2;
	}
	return 100;
}

/**
 * Get height of a shape, handling different shape types
 */
export function getShapeHeight(shape: Shape): number {
	if ('height' in shape && shape.height !== undefined) {
		return shape.height as number;
	}
	if ('radius' in shape && shape.radius !== undefined) {
		return (shape.radius as number) * 2;
	}
	if ('outerRadius' in shape && shape.outerRadius !== undefined) {
		return (shape.outerRadius as number) * 2;
	}
	return 100;
}
