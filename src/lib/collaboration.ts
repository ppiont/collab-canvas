import * as Y from 'yjs';
import YPartyKitProvider from 'y-partykit/provider';
import { writable, type Writable } from 'svelte/store';
import type { Shape } from './types/shapes';
import { PUBLIC_PARTYKIT_HOST } from '$env/static/public';

/**
 * Yjs Document - Global CRDT state
 */
export const ydoc = new Y.Doc();

/**
 * Shared Y.Map for shapes (all types)
 * Key: shape.id, Value: Shape
 */
export const shapesMap = ydoc.getMap<Shape>('shapes');

/**
 * Metadata map (for future use)
 */
export const metadataMap = ydoc.getMap('metadata');

/**
 * PartyKit Provider - WebSocket connection
 */
let _provider: YPartyKitProvider | null = null;

/**
 * Provider store (reactive)
 */
export const provider: Writable<YPartyKitProvider | null> = writable(null);

/**
 * Connection status store
 */
export const connectionStatus: Writable<'connected' | 'connecting' | 'disconnected'> =
	writable('disconnected');

/**
 * Initialize PartyKit provider and connect to room
 */
export function initializeProvider(
	userId: string,
	userName: string,
	userColor: string
): YPartyKitProvider {
	// Get PartyKit host from environment
	const host = PUBLIC_PARTYKIT_HOST || 'localhost:1999';

	// Create provider
	// When using cloud-prem deployment, need to specify party name
	_provider = new YPartyKitProvider(
		host,
		'main', // Room ID
		ydoc,
		{
			connect: true,
			party: 'yjs' // Party name from partykit.json
		}
	);

	// Update the store
	provider.set(_provider);

	// Set user awareness metadata (for cursors in Phase 5)
	_provider.awareness.setLocalStateField('user', {
		id: userId,
		name: userName,
		color: userColor
	});

	// PHASE 1: Initialize draggedShapes field for live shape sync
	_provider.awareness.setLocalStateField('draggedShapes', {});

	// Connection status events
	_provider.on('status', (event: { status: 'connected' | 'connecting' | 'disconnected' }) => {
		connectionStatus.set(event.status);
	});

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	_provider.on('sync', (isSynced: boolean) => {
		// Sync complete - shapes loaded
	});

	// Connection error handling
	_provider.on('connection-error', (error: Error) => {
		console.error('PartyKit connection error:', error);
		connectionStatus.set('disconnected');
	});

	return _provider;
}

/**
 * Disconnect and cleanup
 */
export function disconnectProvider() {
	if (_provider) {
		_provider.disconnect();
		_provider.destroy();
		_provider = null;
		provider.set(null);
		connectionStatus.set('disconnected');
	}
}

/**
 * Get all shapes from Yjs map as array
 */
export function getAllShapes(): Shape[] {
	const shapesList: Shape[] = [];
	shapesMap.forEach((shape, id) => {
		shapesList.push({ ...shape, id });
	});
	return shapesList;
}

/**
 * PHASE 1, 6: Update live dragged shape position in Awareness
 * Called during dragmove to show other users the shape being dragged
 */
export function updateDraggedShape(shapeId: string, x: number, y: number, userId: string): void {
	if (!_provider) return;

	const currentState = _provider.awareness.getLocalState() || {};
	const draggedShapes = currentState.draggedShapes || {};

	_provider.awareness.setLocalStateField('draggedShapes', {
		...draggedShapes,
		[shapeId]: {
			id: shapeId,
			x,
			y,
			userId,
			timestamp: Date.now()
		}
	});
}

/**
 * Update live transformed shape (resize/rotation) in Awareness
 * Called during transform to show other users the shape being resized/rotated
 */
export function updateTransformedShape(
	shapeId: string,
	x: number,
	y: number,
	userId: string,
	transformProps: {
		scaleX?: number;
		scaleY?: number;
		rotation?: number;
		width?: number;
		height?: number;
	}
): void {
	if (!_provider) return;

	const currentState = _provider.awareness.getLocalState() || {};
	const draggedShapes = currentState.draggedShapes || {};

	_provider.awareness.setLocalStateField('draggedShapes', {
		...draggedShapes,
		[shapeId]: {
			id: shapeId,
			x,
			y,
			userId,
			timestamp: Date.now(),
			...transformProps
		}
	});
}

/**
 * PHASE 6: Clear dragged shape from Awareness
 * Called on dragend to remove the ghost shape
 */
export function clearDraggedShape(shapeId: string): void {
	if (!_provider) return;

	const currentState = _provider.awareness.getLocalState() || {};
	const draggedShapes = { ...currentState.draggedShapes };

	delete draggedShapes[shapeId];

	_provider.awareness.setLocalStateField('draggedShapes', draggedShapes);
}
