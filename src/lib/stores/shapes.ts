/**
 * Shapes Store - Refactored from rectangles.ts
 * Manages all shape types with Yjs synchronization
 */

import { writable } from 'svelte/store';
import type { Shape } from '$lib/types/shapes';
import { ydoc, shapesMap, getAllShapes } from '$lib/collaboration';
import type * as Y from 'yjs';

/**
 * Global shapes store (read-only, synced from Yjs)
 */
export const shapes = writable<Shape[]>([]);

/**
 * Initialize Yjs observer to sync Y.Map changes to Svelte store
 * Call this once on app initialization
 */
export function initializeShapesSync(_shapeMapInstance: Y.Map<Shape>) {
	// Listen to Yjs changes and update Svelte store
	shapesMap.observe(() => {
		const allShapes = getAllShapes();
		shapes.set(allShapes);
	});

	// Initial load
	shapes.set(getAllShapes());
}

/**
 * Shape operations (write to Yjs)
 * All modifications go through these functions for consistency
 */
export const shapeOperations = {
	/**
	 * Add a new shape to the canvas
	 */
	add: (shape: Shape) => {
		if (!shapesMap) {
			console.error('shapesMap not initialized');
			return;
		}
		ydoc.transact(() => {
			shapesMap.set(shape.id, shape);
		}, 'user-action');
	},

	/**
	 * Update an existing shape by ID
	 */
	update: (id: string, changes: Partial<Shape>) => {
		if (!shapesMap) {
			console.error('shapesMap not initialized');
			return;
		}
		const existing = shapesMap.get(id);
		if (existing) {
			ydoc.transact(() => {
				// Safe type assertion: existing is Shape, changes is Partial<Shape>, spread is valid
				const updated = { ...existing, ...changes, modifiedAt: Date.now() } as Shape;
				shapesMap.set(id, updated);
			}, 'user-action');
		} else {
			console.warn('Shape not found for update:', id);
		}
	},

	/**
	 * Delete a shape by ID
	 */
	delete: (id: string) => {
		if (!shapesMap) {
			console.error('shapesMap not initialized');
			return;
		}
		ydoc.transact(() => {
			shapesMap.delete(id);
		}, 'user-action');
	},

	/**
	 * Delete multiple shapes
	 */
	deleteMultiple: (ids: string[]) => {
		if (!shapesMap) {
			console.error('shapesMap not initialized');
			return;
		}
		ydoc.transact(() => {
			ids.forEach((id) => shapesMap.delete(id));
		}, 'user-action');
	},

	/**
	 * Clear all shapes (for testing)
	 */
	clear: () => {
		if (!shapesMap) {
			console.error('shapesMap not initialized');
			return;
		}
		ydoc.transact(() => {
			shapesMap.clear();
		}, 'user-action');
	},

	/**
	 * Get a single shape by ID
	 */
	get: (id: string): Shape | undefined => {
		if (!shapesMap) return undefined;
		return shapesMap.get(id);
	}
};
