/**
 * Shape Factory
 * Creates shapes based on type with proper defaults
 * Week 2 Implementation
 */

import type {
    Shape,
    ShapeType,
    RectangleShape,
    CircleShape,
    EllipseShape,
    LineShape,
    TextShape,
    PolygonShape,
    StarShape,
    ImageShape
} from '$lib/types/shapes';
import { DEFAULT_BASE_SHAPE, DEFAULT_SHAPE_DIMENSIONS } from '$lib/types/shapes';

export class ShapeFactory {
    /**
     * Create a new shape with proper defaults
     */
    static create(
        type: ShapeType,
        baseProps: Partial<Shape>,
        userId: string
    ): Shape {
        const base = {
            id: crypto.randomUUID(),
            ...DEFAULT_BASE_SHAPE,
            type,
            x: baseProps.x ?? 0,
            y: baseProps.y ?? 0,
            createdBy: userId,
            createdAt: Date.now(),
            ...baseProps
        };

        switch (type) {
            case 'rectangle':
                return {
                    ...base,
                    type: 'rectangle',
                    width: (baseProps as any).width ?? DEFAULT_SHAPE_DIMENSIONS.rectangle.width,
                    height: (baseProps as any).height ?? DEFAULT_SHAPE_DIMENSIONS.rectangle.height,
                    draggable: true // MVP compatibility
                } as RectangleShape;

            case 'circle':
                return {
                    ...base,
                    type: 'circle',
                    radius: (baseProps as any).radius ?? DEFAULT_SHAPE_DIMENSIONS.circle.radius
                } as CircleShape;

            case 'ellipse':
                return {
                    ...base,
                    type: 'ellipse',
                    radiusX: (baseProps as any).radiusX ?? DEFAULT_SHAPE_DIMENSIONS.ellipse.radiusX,
                    radiusY: (baseProps as any).radiusY ?? DEFAULT_SHAPE_DIMENSIONS.ellipse.radiusY
                } as EllipseShape;

            case 'line':
                return {
                    ...base,
                    type: 'line',
                    points: (baseProps as any).points ?? [0, 0, 100, 100],
                    lineCap: 'round',
                    lineJoin: 'round'
                } as LineShape;

            case 'text':
                return {
                    ...base,
                    type: 'text',
                    text: (baseProps as any).text ?? 'Text',
                    fontSize: (baseProps as any).fontSize ?? DEFAULT_SHAPE_DIMENSIONS.text.fontSize,
                    fontFamily: (baseProps as any).fontFamily ?? DEFAULT_SHAPE_DIMENSIONS.text.fontFamily,
                    align: 'left'
                } as TextShape;

            case 'polygon':
                return {
                    ...base,
                    type: 'polygon',
                    sides: (baseProps as any).sides ?? DEFAULT_SHAPE_DIMENSIONS.polygon.sides,
                    radius: (baseProps as any).radius ?? DEFAULT_SHAPE_DIMENSIONS.polygon.radius
                } as PolygonShape;

            case 'star':
                return {
                    ...base,
                    type: 'star',
                    numPoints: (baseProps as any).numPoints ?? DEFAULT_SHAPE_DIMENSIONS.star.numPoints,
                    innerRadius: (baseProps as any).innerRadius ?? DEFAULT_SHAPE_DIMENSIONS.star.innerRadius,
                    outerRadius: (baseProps as any).outerRadius ?? DEFAULT_SHAPE_DIMENSIONS.star.outerRadius
                } as StarShape;

            case 'image':
                return {
                    ...base,
                    type: 'image',
                    width: (baseProps as any).width ?? DEFAULT_SHAPE_DIMENSIONS.image.width,
                    height: (baseProps as any).height ?? DEFAULT_SHAPE_DIMENSIONS.image.height,
                    imageUrl: (baseProps as any).imageUrl ?? ''
                } as ImageShape;

            default:
                throw new Error(`Unknown shape type: ${type}`);
        }
    }
}

