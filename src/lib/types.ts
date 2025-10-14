/**
 * Canvas Object Types
 * Based on PRD Rectangle schema
 */

export interface Rectangle {
    id: string; // UUID v4
    type: 'rectangle';
    x: number; // Position in canvas coordinates
    y: number;
    width: number;
    height: number;
    fill: string; // Hex color
    stroke: string; // Border color
    strokeWidth: number;
    draggable: boolean;
    createdBy: string; // User ID
    createdAt: number; // Unix timestamp (ms)
    draggedBy?: string; // User ID of who's currently dragging (temporary state)
    zIndex: number; // Z-order for stacking (higher = on top)
}

/**
 * Default rectangle properties
 */
export const DEFAULT_RECTANGLE: Partial<Rectangle> = {
    type: 'rectangle',
    width: 150,
    height: 100,
    strokeWidth: 2,
    draggable: true,
    zIndex: 0
};

