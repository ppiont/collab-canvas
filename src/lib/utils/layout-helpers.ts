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
	return (
		(shape.width as number) ||
		((shape.radius as number) ? (shape.radius as number) * 2 : 0) ||
		((shape.outerRadius as number) ? (shape.outerRadius as number) * 2 : 0) ||
		100
	);
}

/**
 * Get height of a shape, handling different shape types
 */
export function getShapeHeight(shape: Shape): number {
	return (
		(shape.height as number) ||
		((shape.radius as number) ? (shape.radius as number) * 2 : 0) ||
		((shape.outerRadius as number) ? (shape.outerRadius as number) * 2 : 0) ||
		100
	);
}
