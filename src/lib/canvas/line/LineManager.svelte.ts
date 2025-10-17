import { writable, derived, type Writable } from 'svelte/store';
import type { LineShape } from '$lib/types/shapes';

/**
 * LineManager - Reactive line state management for Svelte 5
 * Uses Svelte stores for proper reactivity in .svelte.ts files
 */

interface LineState {
	selectedLineId: string | null;
	selectedLinePoints: number[];
	draggedEndpointIndex: number | null;
	isDragging: boolean;
}

// Create writable store for line state
function createLineStore() {
	const initialState: LineState = {
		selectedLineId: null,
		selectedLinePoints: [],
		draggedEndpointIndex: null,
		isDragging: false
	};

	const { subscribe, set, update } = writable<LineState>(initialState);

	// Callbacks for syncing with Yjs
	let onPointsChange: ((points: number[]) => void) | null = null;
	let getLineShape: ((id: string) => LineShape | undefined) | null = null;

	return {
		subscribe,

		setCallbacks(
			pointsChange: (points: number[]) => void,
			getShape: (id: string) => LineShape | undefined
		) {
			onPointsChange = pointsChange;
			getLineShape = getShape;
		},

		selectLine(lineId: string) {
			if (getLineShape) {
				const line = getLineShape(lineId);
				if (line && line.type === 'line') {
					update((state) => ({
						...state,
						selectedLineId: lineId,
						selectedLinePoints: [...line.points]
					}));
				}
			}
		},

		deselectLine() {
			update((state) => ({
				...state,
				selectedLineId: null,
				selectedLinePoints: [],
				draggedEndpointIndex: null,
				isDragging: false
			}));
		},

		startDraggingEndpoint(endpointIndex: number) {
			update((state) => ({
				...state,
				draggedEndpointIndex: endpointIndex,
				isDragging: true
			}));
		},

		updateEndpointPosition(x: number, y: number) {
			update((state) => {
				if (state.draggedEndpointIndex === null) return state;

				const pointIndex = state.draggedEndpointIndex * 2;
				const newPoints = [...state.selectedLinePoints];
				newPoints[pointIndex] = x;
				newPoints[pointIndex + 1] = y;

				return {
					...state,
					selectedLinePoints: newPoints
				};
			});
		},

		finishDragging() {
			update((state) => {
				// Sync to Yjs on finish
				if (onPointsChange) {
					onPointsChange(state.selectedLinePoints);
				}

				return {
					...state,
					isDragging: false,
					draggedEndpointIndex: null
				};
			});
		},

		getEndpoints(): Array<{ x: number; y: number; index: number }> {
			let endpoints: Array<{ x: number; y: number; index: number }> = [];
			let state: LineState | undefined;
			subscribe((s) => {
				state = s;
			})();

			if (state) {
				for (let i = 0; i < state.selectedLinePoints.length; i += 2) {
					endpoints.push({
						x: state.selectedLinePoints[i],
						y: state.selectedLinePoints[i + 1],
						index: i / 2
					});
				}
			}
			return endpoints;
		},

		isDraggingState(): boolean {
			let isDragging = false;
			subscribe((state) => {
				isDragging = state.isDragging;
			})();
			return isDragging;
		},

		hasSelectedLine(): boolean {
			let hasLine = false;
			subscribe((state) => {
				hasLine = state.selectedLineId !== null;
			})();
			return hasLine;
		},

		getSelectedLineId(): string | null {
			let lineId: string | null = null;
			subscribe((state) => {
				lineId = state.selectedLineId;
			})();
			return lineId;
		},

		getPoints(): number[] {
			let points: number[] = [];
			subscribe((state) => {
				points = state.selectedLinePoints;
			})();
			return points;
		}
	};
}

// Export singleton instance
export const lineManager = createLineStore();
