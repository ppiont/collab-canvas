/**
 * Tool Store
 * Manages active canvas tool state
 */

import { writable, derived } from 'svelte/store';
import type { ToolType } from '$lib/types/canvas';

// Re-export ToolType for convenience
export type { ToolType } from '$lib/types/canvas';

/**
 * Currently active tool
 */
export const activeTool = writable<ToolType>('select');

/**
 * Tool operations
 */
export const toolOperations = {
	/**
	 * Set active tool
	 */
	set: (tool: ToolType) => {
		activeTool.set(tool);
	},

	/**
	 * Reset to select tool
	 */
	reset: () => {
		activeTool.set('select');
	},

	/**
	 * Check if a specific tool is active
	 */
	isActive: (tool: ToolType, currentTool: ToolType) => {
		return currentTool === tool;
	}
};

/**
 * Is selection tool active?
 */
export const isSelectToolActive = derived(activeTool, ($tool) => $tool === 'select');

/**
 * Is a shape creation tool active?
 */
export const isCreateToolActive = derived(activeTool, ($tool) =>
	['rectangle', 'circle', 'ellipse', 'line', 'text', 'polygon', 'star', 'image'].includes($tool)
);

/**
 * Is pan tool active?
 */
export const isPanToolActive = derived(activeTool, ($tool) => $tool === 'pan');

/**
 * Tool display names
 */
export const TOOL_NAMES: Record<ToolType, string> = {
	select: 'Select',
	rectangle: 'Rectangle',
	circle: 'Circle',
	ellipse: 'Ellipse',
	line: 'Line',
	text: 'Text',
	polygon: 'Polygon',
	star: 'Star',
	image: 'Image',
	pan: 'Pan'
};
