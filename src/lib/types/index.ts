/**
 * Centralized Type Exports
 * Import all types from here for consistency
 */

// Shape types
export type {
	ShapeType,
	BlendMode,
	ShadowConfig,
	BaseShape,
	RectangleShape,
	CircleShape,
	LineShape,
	TextShape,
	PolygonShape,
	StarShape,
	TriangleShape,
	Shape
} from './shapes';

export {
	isRectangle,
	isCircle,
	isLine,
	isText,
	isPolygon,
	isStar,
	isTriangle,
	DEFAULT_BASE_SHAPE,
	DEFAULT_SHAPE_DIMENSIONS
} from './shapes';

// Canvas types
export type { CanvasViewport, CanvasConfig, ToolType, CursorMode } from './canvas';

// Backward compatibility - export Rectangle as RectangleShape
export type { RectangleShape as Rectangle } from './shapes';
