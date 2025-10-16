/**
 * Centralized Store Exports
 * Import all stores from here for consistency
 */

// Shapes store
export {
    shapes,
    shapeOperations,
    initializeShapesSync
} from './shapes';

// Selection store
export {
    selectedShapeIds,
    selectedShapes,
    hasSelection,
    selectedCount,
    selection
} from './selection';

// Canvas viewport store
export {
    viewport,
    viewportOperations,
    zoomPercentage,
    isViewportDefault
} from './canvas';

// Tool store
export {
    activeTool,
    toolOperations,
    isSelectToolActive,
    isCreateToolActive,
    isPanToolActive,
    TOOL_NAMES
} from './tool';

// History store
export {
    undoStackSize,
    redoStackSize,
    canUndo,
    canRedo,
    historyInfo,
    history,
    initializeUndoManager
} from './history';

// Clipboard store
export {
    clipboard,
    clipboardOperations
} from './clipboard';
