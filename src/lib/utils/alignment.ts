/**
 * Alignment utilities for Konva shapes
 * Wraps core alignment logic to work with Konva.Shape objects
 */

import Konva from 'konva';
import * as AlignmentCore from './alignment-core';

export type { PositionUpdate } from './alignment-core';

/**
 * Convert Konva shapes to plain data for core alignment functions
 */
function konvaShapesToData(shapes: Konva.Shape[]): AlignmentCore.ShapeData[] {
    return shapes.map((shape) => {
        const absPos = shape.absolutePosition();
        const attrs = shape.attrs;

        return {
            id: shape.id(),
            x: absPos.x,
            y: absPos.y,
            width: attrs.width,
            height: attrs.height,
            radius: attrs.radius,
            outerRadius: attrs.outerRadius,
            fontSize: attrs.fontSize,
            type: attrs.type || 'rectangle'
        };
    });
}

/**
 * Align all shapes to the leftmost edge
 */
export function alignLeft(shapes: Konva.Shape[]): AlignmentCore.PositionUpdate[] {
    return AlignmentCore.alignLeft(konvaShapesToData(shapes));
}

/**
 * Align all shapes to horizontal center
 */
export function alignCenter(shapes: Konva.Shape[]): AlignmentCore.PositionUpdate[] {
    return AlignmentCore.alignCenter(konvaShapesToData(shapes));
}

/**
 * Align all shapes to the rightmost edge
 */
export function alignRight(shapes: Konva.Shape[]): AlignmentCore.PositionUpdate[] {
    return AlignmentCore.alignRight(konvaShapesToData(shapes));
}

/**
 * Align all shapes to the topmost edge
 */
export function alignTop(shapes: Konva.Shape[]): AlignmentCore.PositionUpdate[] {
    return AlignmentCore.alignTop(konvaShapesToData(shapes));
}

/**
 * Align all shapes to vertical middle (center vertically)
 */
export function alignMiddle(shapes: Konva.Shape[]): AlignmentCore.PositionUpdate[] {
    return AlignmentCore.alignMiddle(konvaShapesToData(shapes));
}

/**
 * Align all shapes to the bottommost edge
 */
export function alignBottom(shapes: Konva.Shape[]): AlignmentCore.PositionUpdate[] {
    return AlignmentCore.alignBottom(konvaShapesToData(shapes));
}

/**
 * Distribute shapes evenly along the horizontal axis
 */
export function distributeHorizontally(shapes: Konva.Shape[]): AlignmentCore.PositionUpdate[] {
    return AlignmentCore.distributeHorizontally(konvaShapesToData(shapes));
}

/**
 * Distribute shapes evenly along the vertical axis
 */
export function distributeVertically(shapes: Konva.Shape[]): AlignmentCore.PositionUpdate[] {
    return AlignmentCore.distributeVertically(konvaShapesToData(shapes));
}
