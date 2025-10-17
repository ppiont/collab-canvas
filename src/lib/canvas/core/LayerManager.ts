/**
 * Layer Manager - Z-index Operations
 * TODO: Extract layer management logic
 * Week 2 Implementation
 */

import type { Shape } from '$lib/types/shapes';
import { shapeOperations } from '$lib/stores/shapes';

export class LayerManager {
	/**
	 * Bring shape to front
	 */
	bringToFront(shapeId: string, allShapes: Shape[]) {
		const maxZIndex = Math.max(...allShapes.map((s) => s.zIndex), 0);
		shapeOperations.update(shapeId, { zIndex: maxZIndex + 1 });
	}

	/**
	 * Send shape to back
	 */
	sendToBack(shapeId: string, allShapes: Shape[]) {
		const minZIndex = Math.min(...allShapes.map((s) => s.zIndex), 0);
		shapeOperations.update(shapeId, { zIndex: minZIndex - 1 });
	}

	/**
	 * Bring shape forward
	 */
	bringForward(shapeId: string) {
		const shape = shapeOperations.get(shapeId);
		if (shape) {
			shapeOperations.update(shapeId, { zIndex: shape.zIndex + 1 });
		}
	}

	/**
	 * Send shape backward
	 */
	sendBackward(shapeId: string) {
		const shape = shapeOperations.get(shapeId);
		if (shape) {
			shapeOperations.update(shapeId, { zIndex: shape.zIndex - 1 });
		}
	}

	/**
	 * Sort shapes by z-index
	 */
	sortByZIndex(shapes: Shape[]): Shape[] {
		return [...shapes].sort((a, b) => a.zIndex - b.zIndex);
	}
}

export const layerManager = new LayerManager();
