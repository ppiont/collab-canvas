import type { LineShape } from '$lib/types/shapes';

/**
 * LineManager - Simple reactive state management using class-based store pattern
 * Compatible with all Svelte versions, no runes needed
 * Subscribers are notified of changes to trigger reactivity in Svelte components
 */
export class LineManager {
	// State
	selectedLineId: string | null = null;
	selectedLinePoints: number[] = [];
	draggedEndpointIndex: number | null = null;
	isDragging = false;

	// Callbacks for syncing with Yjs
	private onPointsChange: ((points: number[]) => void) | null = null;
	private getLineShape: ((id: string) => LineShape | undefined) | null = null;

	// Subscriber system for reactivity
	private subscribers: Set<() => void> = new Set();

	constructor() {}

	/**
	 * Subscribe to state changes
	 */
	subscribe(callback: () => void) {
		this.subscribers.add(callback);
		return () => this.subscribers.delete(callback);
	}

	/**
	 * Notify subscribers of state changes
	 */
	private notify() {
		this.subscribers.forEach((sub) => sub());
	}

	/**
	 * Set callbacks for external integration
	 */
	setCallbacks(
		onPointsChange: (points: number[]) => void,
		getLineShape: (id: string) => LineShape | undefined
	) {
		this.onPointsChange = onPointsChange;
		this.getLineShape = getLineShape;
	}

	/**
	 * Select a line for editing
	 */
	selectLine(lineId: string) {
		this.selectedLineId = lineId;
		if (this.getLineShape) {
			const line = this.getLineShape(lineId);
			if (line && line.type === 'line') {
				this.selectedLinePoints = [...line.points];
			}
		}
		this.notify();
	}

	/**
	 * Deselect current line
	 */
	deselectLine() {
		this.selectedLineId = null;
		this.selectedLinePoints = [];
		this.draggedEndpointIndex = null;
		this.isDragging = false;
		this.notify();
	}

	/**
	 * Start dragging an endpoint
	 */
	startDraggingEndpoint(endpointIndex: number) {
		this.draggedEndpointIndex = endpointIndex;
		this.isDragging = true;
		this.notify();
	}

	/**
	 * Update endpoint position during drag
	 */
	updateEndpointPosition(x: number, y: number) {
		if (this.draggedEndpointIndex === null) return;

		const pointIndex = this.draggedEndpointIndex * 2;
		const newPoints = [...this.selectedLinePoints];
		newPoints[pointIndex] = x;
		newPoints[pointIndex + 1] = y;

		this.selectedLinePoints = newPoints;
		this.notify();
	}

	/**
	 * Finish dragging and sync to Yjs
	 */
	finishDragging() {
		this.isDragging = false;
		this.draggedEndpointIndex = null;

		// Sync to Yjs
		if (this.onPointsChange) {
			this.onPointsChange(this.selectedLinePoints);
		}
		this.notify();
	}

	/**
	 * Get endpoint positions for rendering
	 */
	getEndpoints() {
		const endpoints: Array<{ x: number; y: number; index: number }> = [];
		for (let i = 0; i < this.selectedLinePoints.length; i += 2) {
			endpoints.push({
				x: this.selectedLinePoints[i],
				y: this.selectedLinePoints[i + 1],
				index: i / 2
			});
		}
		return endpoints;
	}

	/**
	 * Check if is dragging
	 */
	isDraggingState() {
		return this.isDragging;
	}

	/**
	 * Check if has selected line
	 */
	hasSelectedLine() {
		return this.selectedLineId !== null;
	}

	/**
	 * Get selected line ID
	 */
	getSelectedLineId() {
		return this.selectedLineId;
	}

	/**
	 * Get current points
	 */
	getPoints() {
		return this.selectedLinePoints;
	}
}

// Export singleton instance
export const lineManager = new LineManager();
