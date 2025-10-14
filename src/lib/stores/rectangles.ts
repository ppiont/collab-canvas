import { writable } from 'svelte/store';
import type { Rectangle } from '$lib/types';
import { rectanglesMap, getAllRectangles, ydoc } from '$lib/collaboration';

/**
 * Global store for canvas rectangles
 * Phase 4: Synced with Yjs Y.Map
 * Store is read-only - all writes go through Yjs
 */
export const rectangles = writable<Rectangle[]>([]);

/**
 * Initialize Yjs observer to sync Y.Map changes to Svelte store
 * Call this once on app initialization
 */
export function initializeYjsSync() {
    // Listen to Yjs changes and update Svelte store
    rectanglesMap.observe(() => {
        const allRects = getAllRectangles();
        rectangles.set(allRects);
        console.log('Rectangles synced from Yjs:', allRects.length);
    });

    // Initial load
    rectangles.set(getAllRectangles());
    console.log('Initial rectangles loaded:', getAllRectangles().length);
}

/**
 * Add a new rectangle to the canvas
 * Writes to Yjs (will sync to all clients)
 */
export function addRectangle(rect: Rectangle) {
    ydoc.transact(() => {
        rectanglesMap.set(rect.id, rect);
    });
    console.log('Rectangle added to Yjs:', rect.id);
}

/**
 * Update an existing rectangle by ID
 * Writes to Yjs (will sync to all clients)
 */
export function updateRectangle(id: string, changes: Partial<Rectangle>) {
    const existing = rectanglesMap.get(id);
    if (existing) {
        ydoc.transact(() => {
            rectanglesMap.set(id, { ...existing, ...changes });
        });
    }
}

/**
 * Delete a rectangle by ID
 * Writes to Yjs (will sync to all clients)
 */
export function deleteRectangle(id: string) {
    ydoc.transact(() => {
        rectanglesMap.delete(id);
    });
    console.log('Rectangle deleted from Yjs:', id);
}

/**
 * Clear all rectangles (for testing)
 * Writes to Yjs (will sync to all clients)
 */
export function clearRectangles() {
    ydoc.transact(() => {
        rectanglesMap.clear();
    });
}

