import { writable } from 'svelte/store';
import type { Rectangle } from '$lib/types';

/**
 * Global store for canvas rectangles
 * Phase 3: Local state only
 * Phase 4: Will sync with Yjs
 */
export const rectangles = writable<Rectangle[]>([]);

/**
 * Add a new rectangle to the canvas
 */
export function addRectangle(rect: Rectangle) {
    rectangles.update((rects) => [...rects, rect]);
}

/**
 * Update an existing rectangle by ID
 */
export function updateRectangle(id: string, changes: Partial<Rectangle>) {
    rectangles.update((rects) => rects.map((r) => (r.id === id ? { ...r, ...changes } : r)));
}

/**
 * Delete a rectangle by ID
 */
export function deleteRectangle(id: string) {
    rectangles.update((rects) => rects.filter((r) => r.id !== id));
}

/**
 * Clear all rectangles (for testing)
 */
export function clearRectangles() {
    rectangles.set([]);
}

