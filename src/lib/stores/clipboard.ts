/**
 * Clipboard Store
 * Manages copy/paste functionality for shapes
 */

import { writable, get } from 'svelte/store';
import type { Shape } from '$lib/types/shapes';

/**
 * Clipboard state - stores copied shapes
 */
export const clipboard = writable<Shape[]>([]);

/**
 * Clipboard operations
 */
export const clipboardOperations = {
    /**
     * Copy shapes to clipboard
     */
    copy: (shapes: Shape[]) => {
        if (shapes.length === 0) return;

        // Deep copy to prevent reference issues
        const copiedShapes = shapes.map(shape => ({ ...shape }));
        clipboard.set(copiedShapes);
    },

    /**
     * Check if clipboard has content
     */
    isEmpty: (): boolean => {
        return get(clipboard).length === 0;
    },

    /**
     * Clear clipboard
     */
    clear: () => {
        clipboard.set([]);
    },

    /**
     * Get clipboard contents
     */
    getContents: (): Shape[] => {
        return get(clipboard);
    }
};

