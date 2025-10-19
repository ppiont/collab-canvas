/**
 * Selection Store
 * Manages selected shape IDs with multi-select support
 */

import { writable, derived } from 'svelte/store';
import { shapes } from './shapes';
import type { Shape } from '$lib/types/shapes';

/**
 * Selected shape IDs (multi-select support)
 * 
 * NOTE: Using Svelte stores instead of runes because:
 * 1. Global selection state shared across SelectionManager, EventHandlers, PropertiesPanel
 * 2. Multiple derived stores (selectedShapes, hasSelection, selectedCount) depend on this
 * 3. Set-based operations are easier with store.update() pattern
 * 4. Konva Transformer requires stable subscription for reactive selection updates
 * 
 * This is an acceptable pattern for global singleton state.
 */
export const selectedShapeIds = writable<Set<string>>(new Set());

/**
 * Selection operations
 */
export const selection = {
	/**
	 * Select a single shape (replaces current selection)
	 */
	select: (id: string) => {
		selectedShapeIds.set(new Set([id]));
	},

	/**
	 * Add a shape to current selection
	 */
	addToSelection: (id: string) => {
		selectedShapeIds.update((s) => {
			const newSet = new Set(s);
			newSet.add(id);
			return newSet;
		});
	},

	/**
	 * Remove a shape from current selection
	 */
	removeFromSelection: (id: string) => {
		selectedShapeIds.update((s) => {
			const newSet = new Set(s);
			newSet.delete(id);
			return newSet;
		});
	},

	/**
	 * Select multiple shapes (replaces current selection)
	 */
	selectMultiple: (ids: string[]) => {
		selectedShapeIds.set(new Set(ids));
	},

	/**
	 * Clear all selections
	 */
	clear: () => {
		selectedShapeIds.set(new Set());
	},

	/**
	 * Toggle a shape in/out of selection
	 */
	toggle: (id: string) => {
		selectedShapeIds.update((s) => {
			const newSet = new Set(s);
			if (newSet.has(id)) {
				newSet.delete(id);
			} else {
				newSet.add(id);
			}
			return newSet;
		});
	},

	/**
	 * Select all shapes
	 */
	selectAll: (shapesList: Shape[]) => {
		selectedShapeIds.set(new Set(shapesList.map((s) => s.id)));
	}
};

/**
 * Get selected shapes (derived store)
 */
export const selectedShapes = derived([shapes, selectedShapeIds], ([$shapes, $selectedIds]) => {
	return $shapes.filter((s) => $selectedIds.has(s.id));
});

/**
 * Check if any shape is selected
 */
export const hasSelection = derived(selectedShapeIds, ($ids) => $ids.size > 0);

/**
 * Get count of selected shapes
 */
export const selectedCount = derived(selectedShapeIds, ($ids) => $ids.size);
