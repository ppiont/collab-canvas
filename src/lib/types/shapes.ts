/**
 * Comprehensive Shape Type System for CollabCanvas
 * Supports 7 shape types: rectangle, circle, line, text, polygon, star, triangle
 */

/** All supported shape types */
export type ShapeType =
	| 'rectangle'
	| 'circle'
	| 'line'
	| 'text'
	| 'polygon'
	| 'star'
	| 'triangle';

/** Blend modes for shape rendering */
export type BlendMode = 'normal' | 'multiply' | 'screen' | 'overlay' | 'darken' | 'lighten';

/** Shadow configuration */
export interface ShadowConfig {
	color: string;
	blur: number;
	offsetX: number;
	offsetY: number;
}

/** Base properties all shapes share */
export interface BaseShape {
	id: string;
	type: ShapeType;
	x: number;
	y: number;
	zIndex: number;
	opacity: number; // 0-1
	rotation: number; // 0-360
	fill?: string;
	fillEnabled?: boolean; // Whether fill is active (true by default if fill is set)
	stroke?: string;
	strokeEnabled?: boolean; // Whether stroke is active (true by default if stroke is set)
	strokeWidth?: number;
	blendMode?: BlendMode;
	shadow?: ShadowConfig;
	createdBy: string;
	createdAt: number;
	modifiedAt?: number;
	draggedBy?: string; // ephemeral - tracks who's dragging
}

/** Rectangle shape */
export interface RectangleShape extends BaseShape {
	type: 'rectangle';
	width: number;
	height: number;
	cornerRadius?: number; // rounded corners
	draggable?: boolean; // MVP compatibility
}

/** Circle shape */
export interface CircleShape extends BaseShape {
	type: 'circle';
	radius: number;
}

/** Line/polyline shape */
export interface LineShape extends BaseShape {
	type: 'line';
	points: number[]; // [x1, y1, x2, y2, ...]
	lineCap?: 'butt' | 'round' | 'square';
	lineJoin?: 'miter' | 'round' | 'bevel';
	dash?: number[]; // [dash, gap]
}

/** Text shape */
export interface TextShape extends BaseShape {
	type: 'text';
	text: string;
	fontSize: number;
	fontFamily: string;
	fontStyle?: 'normal' | 'italic';
	fontWeight?: 'normal' | 'bold' | number;
	textDecoration?: 'none' | 'underline' | 'line-through' | 'overline';
	lineHeight?: number;
	padding?: number;
	align?: 'left' | 'center' | 'right';
	width?: number; // text box width
}

/** Polygon shape */
export interface PolygonShape extends BaseShape {
	type: 'polygon';
	sides: number; // 3-12
	radius: number;
}

/** Star shape */
export interface StarShape extends BaseShape {
	type: 'star';
	numPoints: number; // 5-12
	innerRadius: number;
	outerRadius: number;
}

/** Triangle shape */
export interface TriangleShape extends BaseShape {
	type: 'triangle';
	width: number;
	height: number;
}

/** Union type for all shapes */
export type Shape =
	| RectangleShape
	| CircleShape
	| LineShape
	| TextShape
	| PolygonShape
	| StarShape
	| TriangleShape;

/** Type guards for discriminated unions */
export function isRectangle(shape: Shape): shape is RectangleShape {
	return shape.type === 'rectangle';
}

export function isCircle(shape: Shape): shape is CircleShape {
	return shape.type === 'circle';
}

export function isLine(shape: Shape): shape is LineShape {
	return shape.type === 'line';
}

export function isText(shape: Shape): shape is TextShape {
	return shape.type === 'text';
}

export function isPolygon(shape: Shape): shape is PolygonShape {
	return shape.type === 'polygon';
}

export function isStar(shape: Shape): shape is StarShape {
	return shape.type === 'star';
}

export function isTriangle(shape: Shape): shape is TriangleShape {
	return shape.type === 'triangle';
}

/** Default values for base shape properties */
export const DEFAULT_BASE_SHAPE: Omit<
	BaseShape,
	'id' | 'type' | 'x' | 'y' | 'createdBy' | 'createdAt'
> = {
	zIndex: 0,
	opacity: 1,
	rotation: 0,
	strokeWidth: 2,
	blendMode: 'normal'
};

/** Default dimensions for shapes */
export const DEFAULT_SHAPE_DIMENSIONS = {
	rectangle: { width: 150, height: 100 },
	circle: { radius: 50 },
	text: { fontSize: 16, fontFamily: 'system-ui' },
	polygon: { sides: 5, radius: 50 },
	star: { numPoints: 5, innerRadius: 25, outerRadius: 50 },
	triangle: { width: 100, height: 100 }
} as const;
