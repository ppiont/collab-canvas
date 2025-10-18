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
	LineShape,
	TextShape,
	PolygonShape,
	StarShape,
	TriangleShape
} from '$lib/types/shapes';
import { DEFAULT_BASE_SHAPE, DEFAULT_SHAPE_DIMENSIONS } from '$lib/types/shapes';

export class ShapeFactory {
	/**
	 * Create a new shape with proper defaults
	 */
	static create(type: ShapeType, baseProps: Partial<Shape>, userId: string): Shape {
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
			case 'rectangle': {
				const props = baseProps as Partial<RectangleShape>;
				return {
					...base,
					type: 'rectangle',
					width: props.width ?? DEFAULT_SHAPE_DIMENSIONS.rectangle.width,
					height: props.height ?? DEFAULT_SHAPE_DIMENSIONS.rectangle.height,
					draggable: true // MVP compatibility
				} as RectangleShape;
			}

			case 'circle': {
				const props = baseProps as Partial<CircleShape>;
				return {
					...base,
					type: 'circle',
					radius: props.radius ?? DEFAULT_SHAPE_DIMENSIONS.circle.radius
				} as CircleShape;
			}

			case 'line': {
				const props = baseProps as Partial<LineShape>;
				return {
					...base,
					type: 'line',
					points: props.points ?? [0, 0, 100, 100],
					lineCap: 'round',
					lineJoin: 'round'
				} as LineShape;
			}

			case 'text': {
				const props = baseProps as Partial<TextShape>;
				return {
					...base,
					type: 'text',
					text: props.text ?? 'Text',
					fontSize: props.fontSize ?? DEFAULT_SHAPE_DIMENSIONS.text.fontSize,
					fontFamily: props.fontFamily ?? DEFAULT_SHAPE_DIMENSIONS.text.fontFamily,
					fontWeight: props.fontWeight ?? 'normal',
					fontStyle: props.fontStyle ?? 'normal',
					textDecoration: props.textDecoration ?? 'none',
					// Use the provided fill color (user's color), default to black if not provided
					fill: props.fill ?? '#000000',
					align: props.align ?? 'left',
					width: props.width
				} as TextShape;
			}

			case 'polygon': {
				const props = baseProps as Partial<PolygonShape>;
				return {
					...base,
					type: 'polygon',
					sides: props.sides ?? DEFAULT_SHAPE_DIMENSIONS.polygon.sides,
					radius: props.radius ?? DEFAULT_SHAPE_DIMENSIONS.polygon.radius
				} as PolygonShape;
			}

			case 'star': {
				const props = baseProps as Partial<StarShape>;
				return {
					...base,
					type: 'star',
					numPoints: props.numPoints ?? DEFAULT_SHAPE_DIMENSIONS.star.numPoints,
					innerRadius: props.innerRadius ?? DEFAULT_SHAPE_DIMENSIONS.star.innerRadius,
					outerRadius: props.outerRadius ?? DEFAULT_SHAPE_DIMENSIONS.star.outerRadius
				} as StarShape;
			}

			case 'triangle': {
				const props = baseProps as Partial<TriangleShape>;
				return {
					...base,
					type: 'triangle',
					width: props.width ?? DEFAULT_SHAPE_DIMENSIONS.triangle.width,
					height: props.height ?? DEFAULT_SHAPE_DIMENSIONS.triangle.height
				} as TriangleShape;
			}

			default:
				throw new Error(`Unknown shape type: ${type}`);
		}
	}
}
