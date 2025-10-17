/**
 * Comprehensive Shape Type System for CollabCanvas
 * Supports 8 shape types: rectangle, circle, ellipse, line, text, polygon, star, image
 */

/** All supported shape types */
export type ShapeType =
	| 'rectangle'
	| 'circle'
	| 'ellipse'
	| 'line'
	| 'text'
	| 'polygon'
	| 'star'
	| 'image';

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
	stroke?: string;
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

/** Ellipse shape */
export interface EllipseShape extends BaseShape {
	type: 'ellipse';
	radiusX: number;
	radiusY: number;
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

/** Image shape */
export interface ImageShape extends BaseShape {
	type: 'image';
	width: number;
	height: number;
	imageUrl: string; // R2 URL
}

/** Union type for all shapes */
export type Shape =
	| RectangleShape
	| CircleShape
	| EllipseShape
	| LineShape
	| TextShape
	| PolygonShape
	| StarShape
	| ImageShape;

/** Type guards for discriminated unions */
export function isRectangle(shape: Shape): shape is RectangleShape {
	return shape.type === 'rectangle';
}

export function isCircle(shape: Shape): shape is CircleShape {
	return shape.type === 'circle';
}

export function isEllipse(shape: Shape): shape is EllipseShape {
	return shape.type === 'ellipse';
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

export function isImage(shape: Shape): shape is ImageShape {
	return shape.type === 'image';
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
	ellipse: { radiusX: 75, radiusY: 50 },
	text: { fontSize: 16, fontFamily: 'system-ui' },
	polygon: { sides: 5, radius: 50 },
	star: { numPoints: 5, innerRadius: 25, outerRadius: 50 },
	image: { width: 200, height: 150 }
} as const;
