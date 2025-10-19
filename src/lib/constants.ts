/**
 * Global Constants for CollabCanvas
 * Centralizes all magic numbers and configuration values
 */

/** Canvas configuration constants */
export const CANVAS = {
	GRID_SIZE: 50,
	GRID_COLOR: '#e2e8f0',
	BACKGROUND_COLOR: '#ffffff',
	MIN_ZOOM: 0.1,
	MAX_ZOOM: 5,
	ZOOM_STEP: 1.15,
	DEFAULT_WIDTH: 1920,
	DEFAULT_HEIGHT: 1080,
	// Viewport culling settings
	ENABLE_CULLING: true, // Enable viewport culling for performance
	CULLING_PADDING: 100, // Extra pixels to render off-screen
	CULLING_THRESHOLD: 50, // Min shapes before culling activates
	// Performance and interaction
	FRAME_TIME_MS: 16, // 60fps update interval
	DRAG_NET_THRESHOLD: 5 // Min pixels to start drag-net selection
} as const;

/** Cursor and presence constants */
export const CURSOR = {
	THROTTLE_MS: 30,
	EDGE_PADDING: 30,
	ANIMATION_DURATION: 120,
	LABEL_OFFSET_X: 14,
	LABEL_OFFSET_Y: 14
} as const;

/** Shape default values */
export const SHAPES = {
	DEFAULT_WIDTH: 150,
	DEFAULT_HEIGHT: 100,
	DEFAULT_RADIUS: 50,
	MIN_SIZE: 5,
	DEFAULT_STROKE_WIDTH: 2,
	DEFAULT_FONT_SIZE: 16,
	DEFAULT_FONT_FAMILY: 'system-ui, -apple-system, sans-serif',
	MAX_FONT_SIZE: 144,
	MIN_FONT_SIZE: 8
} as const;

/** AI Agent constants */
export const AI = {
	MAX_COMMANDS_PER_MINUTE: 10,
	RATE_LIMIT_WINDOW_MS: 60000,
	COMMAND_TIMEOUT_MS: 30000, // User-facing command timeout (30s)
	MAX_SHAPES_PER_COMMAND: 50,
	MODEL: 'gpt-4-turbo'
} as const;

/** Image upload constants */
export const IMAGE = {
	MAX_FILE_SIZE: 4 * 1024 * 1024, // 4MB
	ALLOWED_TYPES: ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'],
	MAX_DIMENSION: 4096
} as const;

/** UI constants */
export const UI = {
	TOOLBAR_WIDTH: 60,
	PROPERTIES_PANEL_WIDTH: 320,
	ANIMATION_DURATION: 200,
	TOAST_DURATION: 3000
} as const;

/** Color palette for user avatars */
export const USER_COLORS = [
	'#ef4444', // red
	'#f59e0b', // amber
	'#10b981', // green
	'#3b82f6', // blue
	'#8b5cf6', // violet
	'#ec4899', // pink
	'#06b6d4', // cyan
	'#f97316', // orange
	'#84cc16', // lime
	'#6366f1' // indigo
] as const;

/** Collaboration constants */
export const COLLABORATION = {
	DEFAULT_ROOM: 'main',
	SYNC_DEBOUNCE_MS: 50,
	RECONNECT_TIMEOUT_MS: 3000,
	MAX_RECONNECT_ATTEMPTS: 5
} as const;

/** History/Undo constants */
export const HISTORY = {
	CAPTURE_TIMEOUT_MS: 500 // Group rapid changes within 500ms
} as const;
