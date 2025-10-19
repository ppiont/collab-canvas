/**
 * History Store
 * Manages undo/redo functionality with Yjs UndoManager
 */

import { writable, derived } from 'svelte/store';
import { UndoManager } from 'yjs';
import { ydoc } from '$lib/collaboration';
import type * as Y from 'yjs';

/**
 * Undo manager instance
 */
let undoManager: UndoManager | null = null;

/**
 * Event handler reference for cleanup
 */
let stackUpdateHandler: (() => void) | null = null;

/**
 * Stack sizes for reactive updates
 */
export const undoStackSize = writable(0);
export const redoStackSize = writable(0);

/**
 * Cleanup existing undo manager listeners
 */
function cleanupUndoManagerListeners() {
	if (undoManager && stackUpdateHandler) {
		undoManager.off('stack-item-added', stackUpdateHandler);
		undoManager.off('stack-item-popped', stackUpdateHandler);
		undoManager.off('stack-cleared', stackUpdateHandler);
		stackUpdateHandler = null;
	}
}

/**
 * Initialize undo manager
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function initializeUndoManager(shapesMap: Y.Map<any>) {
	// Cleanup old listeners if re-initializing (HMR)
	cleanupUndoManagerListeners();

	undoManager = new UndoManager(shapesMap, {
		// Only track transactions with 'user-action' origin
		// This prevents system changes (like selection updates) from affecting undo/redo
		trackedOrigins: new Set(['user-action']),
		captureTimeout: 500 // Group rapid changes within 500ms
	});

	// Create and store handler reference for cleanup
	stackUpdateHandler = () => {
		if (undoManager) {
			const undoSize = undoManager.undoStack.length;
			const redoSize = undoManager.redoStack.length;
			undoStackSize.set(undoSize);
			redoStackSize.set(redoSize);
		}
	};

	// Attach event listeners
	undoManager.on('stack-item-added', stackUpdateHandler);
	undoManager.on('stack-item-popped', stackUpdateHandler);
	undoManager.on('stack-cleared', stackUpdateHandler);
}

/**
 * Destroy undo manager and cleanup listeners
 */
export function destroyUndoManager() {
	cleanupUndoManagerListeners();
	if (undoManager) {
		undoManager.clear();
		undoManager = null;
	}
	undoStackSize.set(0);
	redoStackSize.set(0);
}

/**
 * History operations
 */
export const history = {
	/**
	 * Undo last action
	 */
	undo: () => {
		if (undoManager && undoManager.undoStack.length > 0) {
			undoManager.undo();
		}
	},

	/**
	 * Redo last undone action
	 */
	redo: () => {
		if (undoManager && undoManager.redoStack.length > 0) {
			undoManager.redo();
		}
	},

	/**
	 * Check if undo is available
	 */
	canUndo: (): boolean => {
		return undoManager ? undoManager.undoStack.length > 0 : false;
	},

	/**
	 * Check if redo is available
	 */
	canRedo: (): boolean => {
		return undoManager ? undoManager.redoStack.length > 0 : false;
	},

	/**
	 * Clear all history
	 */
	clear: () => {
		if (undoManager) {
			undoManager.clear();
		}
	},

	/**
	 * Stop capturing changes temporarily
	 */
	stopCapturing: () => {
		if (undoManager) {
			undoManager.stopCapturing();
		}
	}
};

/**
 * Can undo (derived store)
 */
export const canUndo = derived(undoStackSize, ($size) => $size > 0);

/**
 * Can redo (derived store)
 */
export const canRedo = derived(redoStackSize, ($size) => $size > 0);

/**
 * Undo/redo info for display
 */
export const historyInfo = derived([undoStackSize, redoStackSize], ([$undo, $redo]) => ({
	undoCount: $undo,
	redoCount: $redo,
	canUndo: $undo > 0,
	canRedo: $redo > 0
}));
