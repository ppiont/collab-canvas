/**
 * AI Agent and Tool Schema Types
 */

import type { Shape, ShapeType } from './shapes';

/** AI command request */
export interface AICommandRequest {
    command: string;
    userId: string;
    canvasId: string;
}

/** AI command response */
export interface AICommandResponse {
    success: boolean;
    message?: string;
    error?: string;
    shapesCreated?: number;
    shapesModified?: number;
}

/** AI tool execution result */
export interface AIToolResult {
    success: boolean;
    shapeId?: string;
    error?: string;
}

/** Tool parameter types */
export interface CreateShapeParams {
    type: ShapeType;
    x: number;
    y: number;
    [key: string]: any;
}

export interface MoveShapeParams {
    shapeId: string;
    x: number;
    y: number;
}

export interface ResizeShapeParams {
    shapeId: string;
    width?: number;
    height?: number;
    radius?: number;
    radiusX?: number;
    radiusY?: number;
}

export interface RotateShapeParams {
    shapeId: string;
    degrees: number;
}

export interface UpdateColorParams {
    shapeId: string;
    fill?: string;
    stroke?: string;
}

export interface UpdateTextParams {
    shapeId: string;
    text: string;
}

export interface DeleteShapeParams {
    shapeId: string;
}

export interface DuplicateShapeParams {
    shapeId: string;
    offsetX?: number;
    offsetY?: number;
}

export interface ArrangeShapesParams {
    shapeIds: string[];
    direction: 'horizontal' | 'vertical';
    spacing?: number;
}

export interface ArrangeGridParams {
    shapeIds: string[];
    cols: number;
    spacing?: number;
}

export interface AlignShapesParams {
    shapeIds: string[];
    alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom';
}

/** Canvas state for AI context */
export interface CanvasState {
    shapes: Shape[];
    viewportBounds: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
    selectedShapeIds: string[];
}

/** Rate limit state */
export interface RateLimitState {
    userId: string;
    commandTimestamps: number[];
    lastCheck: number;
}

