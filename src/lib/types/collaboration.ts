/**
 * Collaboration Type Definitions
 * Types for Awareness state, live shape sync, and multi-user coordination
 */

/**
 * User info stored in Awareness
 */
export interface AwarenessUser {
	id: string;
	name: string;
	color: string;
}

/**
 * Cursor position stored in Awareness
 */
export interface AwarenessCursor {
	x: number;
	y: number;
}

/**
 * Live shape position during drag (broadcasted via Awareness, not persisted)
 */
export interface DraggedShape {
	id: string;
	x: number;
	y: number;
	userId: string;
	timestamp: number;
}

/**
 * Complete Awareness state for a user
 */
export interface AwarenessState {
	user?: AwarenessUser;
	cursor?: AwarenessCursor;
	draggedShapes?: {
		[shapeId: string]: DraggedShape;
	};
}
