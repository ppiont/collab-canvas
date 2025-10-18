/**
 * AI Tool Schema for OpenAI Function Calling
 * Defines 22 tools for canvas manipulation (6 creation, 8 manipulation, 5 layout, 3 query)
 */

import type { ChatCompletionTool } from 'openai/resources/chat/completions';

/**
 * Complete tool schema for OpenAI function calling
 */
export const AI_TOOLS: ChatCompletionTool[] = [
	// ═══════════════════════════════════════════════════════
	// CREATION TOOLS (6 tools)
	// ═══════════════════════════════════════════════════════

	{
		type: 'function',
		function: {
			name: 'createRectangle',
			description: 'Create a rectangle shape on the canvas',
			parameters: {
				type: 'object',
				properties: {
					x: { type: 'number', description: 'X position in canvas coordinates' },
					y: { type: 'number', description: 'Y position in canvas coordinates' },
					width: { type: 'number', description: 'Width in pixels (default: 150)' },
					height: { type: 'number', description: 'Height in pixels (default: 100)' },
					fill: { type: 'string', description: 'Fill color as hex code (default: #3b82f6)' },
					stroke: { type: 'string', description: 'Stroke color as hex code (default: #1e3a8a)' }
				},
				required: ['x', 'y']
			}
		}
	},

	{
		type: 'function',
		function: {
			name: 'createCircle',
			description: 'Create a circle shape on the canvas',
			parameters: {
				type: 'object',
				properties: {
					x: { type: 'number', description: 'X position (center)' },
					y: { type: 'number', description: 'Y position (center)' },
					radius: { type: 'number', description: 'Radius in pixels (default: 50)' },
					fill: { type: 'string', description: 'Fill color as hex code' },
					stroke: { type: 'string', description: 'Stroke color as hex code' }
				},
				required: ['x', 'y']
			}
		}
	},

	{
		type: 'function',
		function: {
			name: 'createLine',
			description: 'Create a line or polyline on the canvas',
			parameters: {
				type: 'object',
				properties: {
					points: {
						type: 'array',
						items: { type: 'number' },
						description: 'Array of coordinates [x1, y1, x2, y2, ...] defining the line path'
					},
					stroke: { type: 'string', description: 'Line color as hex code (default: #1e3a8a)' },
					strokeWidth: { type: 'number', description: 'Line thickness (default: 2)' }
				},
				required: ['points']
			}
		}
	},

	{
		type: 'function',
		function: {
			name: 'createText',
			description: 'Create a text layer on the canvas',
			parameters: {
				type: 'object',
				properties: {
					x: { type: 'number', description: 'X position' },
					y: { type: 'number', description: 'Y position' },
					text: { type: 'string', description: 'Text content' },
					fontSize: { type: 'number', description: 'Font size in pixels (default: 16)' },
					fill: { type: 'string', description: 'Text color as hex code (default: #000000)' },
					fontFamily: { type: 'string', description: 'Font family (default: system-ui)' }
				},
				required: ['x', 'y', 'text']
			}
		}
	},

	{
		type: 'function',
		function: {
			name: 'createPolygon',
			description: 'Create a regular polygon (pentagon, hexagon, etc.)',
			parameters: {
				type: 'object',
				properties: {
					x: { type: 'number', description: 'X position (center)' },
					y: { type: 'number', description: 'Y position (center)' },
					sides: { type: 'number', description: 'Number of sides (3-12, default: 5)' },
					radius: { type: 'number', description: 'Radius in pixels (default: 50)' },
					fill: { type: 'string', description: 'Fill color as hex code' },
					stroke: { type: 'string', description: 'Stroke color as hex code' }
				},
				required: ['x', 'y']
			}
		}
	},

	{
		type: 'function',
		function: {
			name: 'createStar',
			description: 'Create a star shape',
			parameters: {
				type: 'object',
				properties: {
					x: { type: 'number', description: 'X position (center)' },
					y: { type: 'number', description: 'Y position (center)' },
					numPoints: { type: 'number', description: 'Number of points (5-12, default: 5)' },
					innerRadius: { type: 'number', description: 'Inner radius (default: 25)' },
					outerRadius: { type: 'number', description: 'Outer radius (default: 50)' },
					fill: { type: 'string', description: 'Fill color as hex code' },
					stroke: { type: 'string', description: 'Stroke color as hex code' }
				},
				required: ['x', 'y']
			}
		}
	},

	{
		type: 'function',
		function: {
			name: 'createTriangle',
			description: 'Create a triangle shape',
			parameters: {
				type: 'object',
				properties: {
					x: { type: 'number', description: 'X position (center)' },
					y: { type: 'number', description: 'Y position (center)' },
					width: { type: 'number', description: 'Width in pixels (default: 100)' },
					height: { type: 'number', description: 'Height in pixels (default: 100)' },
					fill: { type: 'string', description: 'Fill color as hex code' },
					stroke: { type: 'string', description: 'Stroke color as hex code' }
				},
				required: ['x', 'y']
			}
		}
	},

	// ═══════════════════════════════════════════════════════
	// MANIPULATION TOOLS (6 tools)
	// ═══════════════════════════════════════════════════════

	{
		type: 'function',
		function: {
			name: 'moveShape',
			description: 'Move a shape to a new position',
			parameters: {
				type: 'object',
				properties: {
					shapeId: { type: 'string', description: 'ID of the shape to move' },
					x: { type: 'number', description: 'New X position' },
					y: { type: 'number', description: 'New Y position' }
				},
				required: ['shapeId', 'x', 'y']
			}
		}
	},

	{
		type: 'function',
		function: {
			name: 'resizeShape',
			description: 'Resize a shape (width/height for rectangles, radius for circles)',
			parameters: {
				type: 'object',
				properties: {
					shapeId: { type: 'string', description: 'ID of the shape to resize' },
					width: { type: 'number', description: 'New width (for rectangles, triangles)' },
					height: { type: 'number', description: 'New height (for rectangles, triangles)' },
					radius: { type: 'number', description: 'New radius (for circles, polygons, stars)' }
				},
				required: ['shapeId']
			}
		}
	},

	{
		type: 'function',
		function: {
			name: 'rotateShape',
			description: 'Rotate a shape by specified degrees',
			parameters: {
				type: 'object',
				properties: {
					shapeId: { type: 'string', description: 'ID of the shape to rotate' },
					degrees: { type: 'number', description: 'Rotation angle in degrees (0-360)' }
				},
				required: ['shapeId', 'degrees']
			}
		}
	},

	{
		type: 'function',
		function: {
			name: 'updateShapeColor',
			description: 'Change the color of a shape',
			parameters: {
				type: 'object',
				properties: {
					shapeId: { type: 'string', description: 'ID of the shape to update' },
					fill: { type: 'string', description: 'New fill color as hex code' },
					stroke: { type: 'string', description: 'New stroke color as hex code' }
				},
				required: ['shapeId']
			}
		}
	},

	{
		type: 'function',
		function: {
			name: 'deleteShape',
			description: 'Delete a shape from the canvas',
			parameters: {
				type: 'object',
				properties: {
					shapeId: { type: 'string', description: 'ID of the shape to delete' }
				},
				required: ['shapeId']
			}
		}
	},

	{
		type: 'function',
		function: {
			name: 'duplicateShape',
			description: 'Create a copy of a shape with optional offset',
			parameters: {
				type: 'object',
				properties: {
					shapeId: { type: 'string', description: 'ID of the shape to duplicate' },
					offsetX: { type: 'number', description: 'X offset for the duplicate (default: 20)' },
					offsetY: { type: 'number', description: 'Y offset for the duplicate (default: 20)' }
				},
				required: ['shapeId']
			}
		}
	},

	{
		type: 'function',
		function: {
			name: 'updateText',
			description: 'Update text content and/or formatting properties of a text shape',
			parameters: {
				type: 'object',
				properties: {
					shapeId: { type: 'string', description: 'ID of the text shape to update' },
					text: { type: 'string', description: 'New text content' },
					fontSize: { type: 'number', description: 'Font size in pixels (8-144)' },
					fontFamily: {
						type: 'string',
						enum: [
							'system-ui',
							'Arial',
							'Times New Roman',
							'Courier New',
							'Georgia',
							'Verdana',
							'Comic Sans MS',
							'Impact'
						],
						description: 'Font family'
					},
					fontWeight: {
						type: 'string',
						enum: ['normal', 'bold'],
						description: 'Font weight'
					},
					fontStyle: {
						type: 'string',
						enum: ['normal', 'italic'],
						description: 'Font style'
					},
					textDecoration: {
						type: 'string',
						enum: ['none', 'underline'],
						description: 'Text decoration'
					},
					align: {
						type: 'string',
						enum: ['left', 'center', 'right'],
						description: 'Text alignment'
					},
					fill: { type: 'string', description: 'Text color as hex code' }
				},
				required: ['shapeId']
			}
		}
	},

	{
		type: 'function',
		function: {
			name: 'bringToFront',
			description: 'Bring one or more shapes to the front (top z-order)',
			parameters: {
				type: 'object',
				properties: {
					shapeIds: {
						type: 'array',
						items: { type: 'string' },
						description: 'IDs of shapes to bring to front'
					}
				},
				required: ['shapeIds']
			}
		}
	},

	{
		type: 'function',
		function: {
			name: 'sendToBack',
			description: 'Send one or more shapes to the back (bottom z-order)',
			parameters: {
				type: 'object',
				properties: {
					shapeIds: {
						type: 'array',
						items: { type: 'string' },
						description: 'IDs of shapes to send to back'
					}
				},
				required: ['shapeIds']
			}
		}
	},

	// ═══════════════════════════════════════════════════════
	// LAYOUT TOOLS (5 tools)
	// ═══════════════════════════════════════════════════════

	{
		type: 'function',
		function: {
			name: 'arrangeHorizontal',
			description: 'Arrange multiple shapes in a horizontal row',
			parameters: {
				type: 'object',
				properties: {
					shapeIds: {
						type: 'array',
						items: { type: 'string' },
						description: 'IDs of shapes to arrange'
					},
					spacing: {
						type: 'number',
						description: 'Spacing between shapes in pixels (default: 20)'
					},
					startX: { type: 'number', description: 'Starting X position (optional)' },
					startY: { type: 'number', description: 'Y position for all shapes (optional)' }
				},
				required: ['shapeIds']
			}
		}
	},

	{
		type: 'function',
		function: {
			name: 'arrangeVertical',
			description: 'Arrange multiple shapes in a vertical column',
			parameters: {
				type: 'object',
				properties: {
					shapeIds: {
						type: 'array',
						items: { type: 'string' },
						description: 'IDs of shapes to arrange'
					},
					spacing: {
						type: 'number',
						description: 'Spacing between shapes in pixels (default: 20)'
					},
					startX: { type: 'number', description: 'X position for all shapes (optional)' },
					startY: { type: 'number', description: 'Starting Y position (optional)' }
				},
				required: ['shapeIds']
			}
		}
	},

	{
		type: 'function',
		function: {
			name: 'arrangeGrid',
			description: 'Arrange multiple shapes in a grid pattern',
			parameters: {
				type: 'object',
				properties: {
					shapeIds: {
						type: 'array',
						items: { type: 'string' },
						description: 'IDs of shapes to arrange'
					},
					columns: { type: 'number', description: 'Number of columns in the grid' },
					spacing: { type: 'number', description: 'Spacing between shapes (default: 20)' },
					startX: { type: 'number', description: 'Starting X position (optional)' },
					startY: { type: 'number', description: 'Starting Y position (optional)' }
				},
				required: ['shapeIds', 'columns']
			}
		}
	},

	{
		type: 'function',
		function: {
			name: 'distributeEvenly',
			description: 'Distribute shapes evenly across a specified distance',
			parameters: {
				type: 'object',
				properties: {
					shapeIds: {
						type: 'array',
						items: { type: 'string' },
						description: 'IDs of shapes to distribute'
					},
					direction: {
						type: 'string',
						enum: ['horizontal', 'vertical'],
						description: 'Direction to distribute shapes'
					}
				},
				required: ['shapeIds', 'direction']
			}
		}
	},

	{
		type: 'function',
		function: {
			name: 'alignShapes',
			description: 'Align multiple shapes along an edge or center',
			parameters: {
				type: 'object',
				properties: {
					shapeIds: {
						type: 'array',
						items: { type: 'string' },
						description: 'IDs of shapes to align'
					},
					alignment: {
						type: 'string',
						enum: ['left', 'center', 'right', 'top', 'middle', 'bottom'],
						description: 'Alignment type'
					}
				},
				required: ['shapeIds', 'alignment']
			}
		}
	},

	// ═══════════════════════════════════════════════════════
	// QUERY TOOLS (3 tools)
	// ═══════════════════════════════════════════════════════

	{
		type: 'function',
		function: {
			name: 'getCanvasState',
			description:
				'Get all shapes currently on the canvas with their full properties. Use this before manipulating existing shapes.',
			parameters: {
				type: 'object',
				properties: {},
				required: []
			}
		}
	},

	{
		type: 'function',
		function: {
			name: 'findShapesByType',
			description: 'Find all shapes of a specific type (rectangle, circle, etc.)',
			parameters: {
				type: 'object',
				properties: {
					type: {
						type: 'string',
						enum: ['rectangle', 'circle', 'line', 'text', 'polygon', 'star', 'triangle'],
						description: 'Shape type to find'
					}
				},
				required: ['type']
			}
		}
	},

	{
		type: 'function',
		function: {
			name: 'findShapesByColor',
			description: 'Find all shapes with a specific fill color',
			parameters: {
				type: 'object',
				properties: {
					color: { type: 'string', description: 'Color to search for as hex code (e.g., #ff0000)' }
				},
				required: ['color']
			}
		}
	}
];

/**
 * Tool names for validation
 */
export const TOOL_NAMES = [
	// Creation
	'createRectangle',
	'createCircle',
	'createLine',
	'createText',
	'createPolygon',
	'createStar',
	'createTriangle',
	// Manipulation
	'moveShape',
	'resizeShape',
	'rotateShape',
	'updateShapeColor',
	'updateText',
	'deleteShape',
	'duplicateShape',
	'bringToFront',
	'sendToBack',
	// Layout
	'arrangeHorizontal',
	'arrangeVertical',
	'arrangeGrid',
	'distributeEvenly',
	'alignShapes',
	// Query
	'getCanvasState',
	'findShapesByType',
	'findShapesByColor'
] as const;

export type ToolName = (typeof TOOL_NAMES)[number];
