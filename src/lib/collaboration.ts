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
 * Get online user count from awareness
 */
export function getOnlineUserCount(): number {
	return _provider?.awareness.getStates().size || 1;
}
