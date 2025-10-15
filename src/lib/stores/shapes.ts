/**
 * Shapes Store - Refactored from rectangles.ts
 * Manages all shape types with Yjs synchronization
 */

import { writable } from 'svelte/store';
import type { Shape } from '$lib/types/shapes';
import { ydoc } from '$lib/collaboration';
import type * as Y from 'yjs';

/**
 * Get shapesMap from collaboration module
 * We'll need to update collaboration.ts to export this
 */
let shapesMap: Y.Map<Shape>;

/**
 * Global shapes store (read-only, synced from Yjs)
 */
export const shapes = writable<Shape[]>([]);

/**
 * Initialize Yjs observer to sync Y.Map changes to Svelte store
 * Call this once on app initialization
 */
export function initializeShapesSync(shapeMapInstance: Y.Map<Shape>) {
    shapesMap = shapeMapInstance;

    // Listen to Yjs changes and update Svelte store
    shapesMap.observe(() => {
        const allShapes = getAllShapes();
        shapes.set(allShapes);
        console.log('Shapes synced from Yjs:', allShapes.length);
    });

    // Initial load
    shapes.set(getAllShapes());
    console.log('Initial shapes loaded:', getAllShapes().length);
}

/**
 * Get all shapes from Yjs map as array
 */
export function getAllShapes(): Shape[] {
    if (!shapesMap) return [];

    const shapesList: Shape[] = [];
    shapesMap.forEach((shape, id) => {
        shapesList.push({ ...shape, id });
    });
    return shapesList;
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
        });
        console.log('Shape added to Yjs:', shape.id, shape.type);
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
                // Type assertion needed because TypeScript can't guarantee union type compatibility
                const updated = { ...existing, ...changes, modifiedAt: Date.now() } as Shape;
                shapesMap.set(id, updated);
            });
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
        });
        console.log('Shape deleted from Yjs:', id);
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
            ids.forEach(id => shapesMap.delete(id));
        });
        console.log('Multiple shapes deleted:', ids.length);
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
        });
        console.log('All shapes cleared');
    },

    /**
     * Get a single shape by ID
     */
    get: (id: string): Shape | undefined => {
        if (!shapesMap) return undefined;
        return shapesMap.get(id);
    }
};

// Backward compatibility exports for MVP code
export const addRectangle = shapeOperations.add;
export const updateRectangle = shapeOperations.update;
export const deleteRectangle = shapeOperations.delete;
export const rectangles = shapes; // Alias for gradual migration

