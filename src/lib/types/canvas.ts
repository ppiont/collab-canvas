/**
 * Canvas and Viewport Types
 */

/** Canvas viewport state */
export interface CanvasViewport {
    x: number;
    y: number;
    scale: number;
}

/** Canvas configuration */
export interface CanvasConfig {
    width: number;
    height: number;
    gridSize: number;
    gridColor: string;
    backgroundColor: string;
}

/** Tool types for canvas interaction */
export type ToolType =
    | 'select'
    | 'rectangle'
    | 'circle'
    | 'ellipse'
    | 'line'
    | 'text'
    | 'polygon'
    | 'star'
    | 'image'
    | 'pan';

/** Cursor mode for canvas */
export type CursorMode =
    | 'default'
    | 'move'
    | 'pointer'
    | 'crosshair'
    | 'grab'
    | 'grabbing'
    | 'not-allowed';

