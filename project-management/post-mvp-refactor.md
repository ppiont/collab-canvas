# CollabCanvas: Pre-Final Product Refactoring Plan

## Executive Summary

The MVP is functional but monolithic. Before implementing Final Product features (AI agent, 7 shape types, images, multi-canvas), we need to:

1. **Modularize** the 1200+ line canvas component
2. **Establish** a proper design system (shadcn/ui + Tailwind)
3. **Refactor** the type system for extensibility
4. **Prepare** infrastructure (D1, R2, OpenAI)
5. **Optimize** PartyKit for multi-room + AI endpoints
6. **Improve** state management patterns

---

## 1. Architecture & File Structure

### Current Issues

**Problem**: Single monolithic file `canvas/+page.svelte` (1200+ lines)

- All Konva logic, cursor rendering, shape operations, event handlers in one place
- Impossible to maintain when adding 6 more shape types
- No separation of concerns

**File Structure Needed**:

```
src/
├── lib/
│   ├── canvas/
│   │   ├── core/
│   │   │   ├── CanvasEngine.ts          # Core Konva stage management
│   │   │   ├── ViewportManager.ts       # Pan/zoom logic
│   │   │   ├── SelectionManager.ts      # Multi-select, transformer
│   │   │   └── LayerManager.ts          # Z-index operations
│   │   ├── shapes/
│   │   │   ├── BaseShape.ts             # Abstract shape class
│   │   │   ├── RectangleShape.ts        # Rectangle renderer
│   │   │   ├── CircleShape.ts           # Circle renderer (new)
│   │   │   ├── EllipseShape.ts          # Ellipse renderer (new)
│   │   │   ├── LineShape.ts             # Line/polyline renderer (new)
│   │   │   ├── TextShape.ts             # Text renderer (new)
│   │   │   ├── PolygonShape.ts          # Polygon renderer (new)
│   │   │   ├── StarShape.ts             # Star renderer (new)
│   │   │   ├── ImageShape.ts            # Image renderer (new)
│   │   │   └── ShapeFactory.ts          # Factory pattern for shapes
│   │   ├── collaboration/
│   │   │   ├── CursorManager.ts         # Remote cursor rendering
│   │   │   ├── PresenceManager.ts       # User awareness
│   │   │   └── FollowModeManager.ts     # Follow user feature
│   │   └── tools/
│   │       ├── SelectTool.ts            # Selection tool
│   │       ├── CreateTool.ts            # Shape creation
│   │       ├── PanTool.ts               # Pan/zoom
│   │       └── ToolManager.ts           # Tool switching
│   ├── components/
│   │   ├── ui/                          # shadcn/ui components
│   │   │   ├── button.svelte
│   │   │   ├── dialog.svelte
│   │   │   ├── dropdown-menu.svelte
│   │   │   ├── input.svelte
│   │   │   ├── label.svelte
│   │   │   ├── slider.svelte
│   │   │   ├── popover.svelte
│   │   │   ├── command.svelte           # For AI command palette
│   │   │   └── ...
│   │   ├── canvas/
│   │   │   ├── Canvas.svelte            # Main canvas wrapper (slim)
│   │   │   ├── Toolbar.svelte           # Enhanced toolbar
│   │   │   ├── PropertiesPanel.svelte   # Right sidebar (new)
│   │   │   ├── LayersPanel.svelte       # Layers list (optional)
│   │   │   └── CommandPalette.svelte    # AI command palette (new)
│   │   ├── shapes/
│   │   │   └── ShapeControls.svelte     # Shape-specific property editors
│   │   └── project/
│   │       ├── ProjectCard.svelte       # Project card (new)
│   │       ├── CanvasCard.svelte        # Canvas card (new)
│   │       └── ShareDialog.svelte       # Sharing UI (new)
│   ├── stores/
│   │   ├── shapes.ts                    # Generic shapes store (refactored)
│   │   ├── canvas.ts                    # Canvas state (viewport, zoom)
│   │   ├── selection.ts                 # Selection state
│   │   ├── tool.ts                      # Active tool state
│   │   └── history.ts                   # Undo/redo (Yjs UndoManager)
│   ├── types/
│   │   ├── shapes.ts                    # All shape types
│   │   ├── canvas.ts                    # Canvas types
│   │   ├── project.ts                   # Project/permissions types
│   │   └── ai.ts                        # AI tool schema types
│   └── api/
│       ├── projects.ts                  # D1 project CRUD
│       ├── canvases.ts                  # D1 canvas CRUD
│       ├── permissions.ts               # D1 permissions
│       ├── images.ts                    # R2 upload helpers
│       └── ai.ts                        # OpenAI client wrapper
```

**Action Items**:

- Extract all shape rendering into `lib/canvas/shapes/`
- Extract cursor logic into `lib/canvas/collaboration/CursorManager.ts`
- Create abstract `BaseShape` class with common operations
- Slim down `canvas/+page.svelte` to <200 lines (orchestration only)

---

## 2. Type System Refactoring

### Current Issues

**Problem**: Only `Rectangle` type defined, not extensible

- No union type for all shapes
- No shared properties interface
- Hard to add 6 more shape types

**Needed Type Architecture**:

```typescript
// src/lib/types/shapes.ts

/** Base properties all shapes share */
export interface BaseShape {
	id: string;
	type: ShapeType;
	x: number;
	y: number;
	zIndex: number;
	opacity: number; // 0-1 (new)
	rotation: number; // 0-360 (new)
	fill?: string;
	stroke?: string;
	strokeWidth?: number;
	blendMode?: BlendMode; // new
	shadow?: ShadowConfig; // new
	createdBy: string;
	createdAt: number;
	modifiedAt?: number;
	draggedBy?: string; // ephemeral
}

export type ShapeType =
	| 'rectangle'
	| 'circle'
	| 'ellipse'
	| 'line'
	| 'text'
	| 'polygon'
	| 'star'
	| 'image';

export type BlendMode = 'normal' | 'multiply' | 'screen' | 'overlay' | 'darken' | 'lighten';

export interface ShadowConfig {
	color: string;
	blur: number;
	offsetX: number;
	offsetY: number;
}

/** Rectangle shape */
export interface RectangleShape extends BaseShape {
	type: 'rectangle';
	width: number;
	height: number;
}

/** Circle shape (new) */
export interface CircleShape extends BaseShape {
	type: 'circle';
	radius: number;
}

/** Ellipse shape (new) */
export interface EllipseShape extends BaseShape {
	type: 'ellipse';
	radiusX: number;
	radiusY: number;
}

/** Line/polyline shape (new) */
export interface LineShape extends BaseShape {
	type: 'line';
	points: number[]; // [x1, y1, x2, y2, ...]
	lineCap?: 'butt' | 'round' | 'square';
	lineJoin?: 'miter' | 'round' | 'bevel';
	dash?: number[]; // [dash, gap]
}

/** Text shape (new) */
export interface TextShape extends BaseShape {
	type: 'text';
	text: string;
	fontSize: number;
	fontFamily: string;
	fontStyle?: 'normal' | 'bold' | 'italic';
	fontWeight?: number;
	align?: 'left' | 'center' | 'right';
	width?: number; // text box width
}

/** Polygon shape (new) */
export interface PolygonShape extends BaseShape {
	type: 'polygon';
	sides: number; // 3-12
	radius: number;
}

/** Star shape (new) */
export interface StarShape extends BaseShape {
	type: 'star';
	numPoints: number; // 5-12
	innerRadius: number;
	outerRadius: number;
}

/** Image shape (new) */
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

/** Type guards */
export function isRectangle(shape: Shape): shape is RectangleShape {
	return shape.type === 'rectangle';
}
// ... similar for all types

/** Default values */
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
```

**Action Items**:

- Create comprehensive type system in `src/lib/types/shapes.ts`
- Refactor all existing code to use union `Shape` type
- Add type guards for discriminated unions
- Update Yjs store to use `Y.Map<Shape>` instead of `Y.Map<Rectangle>`

---

## 3. Design System Integration

### Current Issues

**Problem**: Inline CSS, inconsistent styling, no component library

- Every component has custom styles
- No design tokens (colors, spacing, typography)
- Hard to maintain visual consistency

**Solution**: shadcn/ui + Tailwind CSS

**Setup shadcn/ui** (already have Tailwind 4):

```bash
# Install shadcn-svelte
bunx shadcn-svelte@latest init

# When prompted:
# - TypeScript: Yes
# - Style: Default
# - Base color: Slate
# - CSS variables: Yes
```

**Install needed components**:

```bash
bunx shadcn-svelte@latest add button
bunx shadcn-svelte@latest add dialog
bunx shadcn-svelte@latest add dropdown-menu
bunx shadcn-svelte@latest add input
bunx shadcn-svelte@latest add label
bunx shadcn-svelte@latest add slider
bunx shadcn-svelte@latest add popover
bunx shadcn-svelte@latest add command
bunx shadcn-svelte@latest add tabs
bunx shadcn-svelte@latest add card
bunx shadcn-svelte@latest add badge
bunx shadcn-svelte@latest add separator
bunx shadcn-svelte@latest add scroll-area
```

**Design Tokens** (Tailwind config):

```typescript
// tailwind.config.ts
export default {
	theme: {
		extend: {
			colors: {
				primary: {
					DEFAULT: '#667eea', // Current brand color
					50: '#f5f7ff'
					// ... full scale
				},
				canvas: {
					bg: '#ffffff',
					grid: '#e2e8f0',
					selection: '#667eea'
				}
			},
			fontFamily: {
				sans: ['Inter', 'system-ui', 'sans-serif']
			}
		}
	}
};
```

**Refactor Components**:

Replace:

```svelte
<!-- OLD: Inline styles -->
<button class="toolbar-btn" class:active={isCreateMode}>
```

With:

```svelte
<!-- NEW: shadcn Button -->
<Button variant={isCreateMode ? 'default' : 'outline'} size="sm">
	<RectangleIcon class="w-4 h-4 mr-2" />
	Create Rectangle
</Button>
```

**Action Items**:

- Install shadcn-svelte with all needed components
- Create design token system in Tailwind config
- Refactor Toolbar.svelte to use shadcn Button
- Refactor ConnectionStatus.svelte to use shadcn DropdownMenu
- Remove all inline `<style>` blocks from components
- Create reusable icon component set

---

## 4. State Management Improvements

### Current Issues

**Problem**: Mixed patterns (Svelte stores + Yjs + local state)

- `rectangles` store wraps Yjs but still reactive
- No undo/redo implementation
- No selection state management
- Viewport state scattered in component

**Improved Architecture**:

```typescript
// src/lib/stores/shapes.ts
import { writable, derived } from 'svelte/store';
import type { Shape } from '$lib/types/shapes';
import { shapesMap, ydoc } from '$lib/collaboration';

/**
 * Global shapes store (read-only, synced from Yjs)
 */
export const shapes = writable<Shape[]>([]);

/**
 * Initialize Yjs observer
 */
export function initializeShapesSync() {
	shapesMap.observe(() => {
		const allShapes = getAllShapes();
		shapes.set(allShapes);
	});
	shapes.set(getAllShapes());
}

/**
 * Shape operations (write to Yjs)
 */
export const shapeOperations = {
	add: (shape: Shape) => {
		ydoc.transact(() => shapesMap.set(shape.id, shape));
	},
	update: (id: string, changes: Partial<Shape>) => {
		const existing = shapesMap.get(id);
		if (existing) {
			ydoc.transact(() => shapesMap.set(id, { ...existing, ...changes }));
		}
	},
	delete: (id: string) => {
		ydoc.transact(() => shapesMap.delete(id));
	},
	clear: () => {
		ydoc.transact(() => shapesMap.clear());
	}
};

// src/lib/stores/selection.ts
import { writable, derived } from 'svelte/store';

/**
 * Selected shape IDs (multi-select support)
 */
export const selectedShapeIds = writable<Set<string>>(new Set());

export const selection = {
	select: (id: string) => selectedShapeIds.update((s) => new Set([id])),
	addToSelection: (id: string) => selectedShapeIds.update((s) => new Set([...s, id])),
	removeFromSelection: (id: string) =>
		selectedShapeIds.update((s) => {
			const newSet = new Set(s);
			newSet.delete(id);
			return newSet;
		}),
	selectMultiple: (ids: string[]) => selectedShapeIds.set(new Set(ids)),
	clear: () => selectedShapeIds.set(new Set()),
	toggle: (id: string) =>
		selectedShapeIds.update((s) => {
			const newSet = new Set(s);
			if (newSet.has(id)) newSet.delete(id);
			else newSet.add(id);
			return newSet;
		})
};

/**
 * Get selected shapes (derived store)
 */
export const selectedShapes = derived([shapes, selectedShapeIds], ([$shapes, $selectedIds]) =>
	$shapes.filter((s) => $selectedIds.has(s.id))
);

// src/lib/stores/canvas.ts
import { writable } from 'svelte/store';

export interface CanvasViewport {
	x: number;
	y: number;
	scale: number;
}

export const viewport = writable<CanvasViewport>({
	x: 0,
	y: 0,
	scale: 1
});

// src/lib/stores/tool.ts
export type ToolType =
	| 'select'
	| 'rectangle'
	| 'circle'
	| 'ellipse'
	| 'line'
	| 'text'
	| 'polygon'
	| 'star'
	| 'pan';

export const activeTool = writable<ToolType>('select');

// src/lib/stores/history.ts
import { UndoManager } from 'yjs';
import { ydoc, shapesMap } from '$lib/collaboration';

export const undoManager = new UndoManager(shapesMap, {
	trackedOrigins: new Set([ydoc.clientID])
});

export const history = {
	undo: () => undoManager.undo(),
	redo: () => undoManager.redo(),
	canUndo: () => undoManager.undoStack.length > 0,
	canRedo: () => undoManager.redoStack.length > 0
};
```

**Action Items**:

- Rename `rectangles.ts` to `shapes.ts` and generalize
- Create `selection.ts` store for multi-select
- Create `canvas.ts` store for viewport state
- Create `tool.ts` store for active tool
- Implement `history.ts` with Yjs UndoManager
- Update all components to use new stores

---

## 5. PartyKit Server Enhancements

### Current Issues

**Problem**: Only supports single "main" room, no AI endpoints

- Hardcoded room ID
- No per-canvas rooms
- No AI command processing
- No OpenAI integration

**Needed Architecture**:

```typescript
// partykit/server.ts
import type * as Party from 'partykit/server';
import { onConnect } from 'y-partykit';
import OpenAI from 'openai';

export default class CollabCanvasServer implements Party.Server {
	constructor(public party: Party.Room) {}

	/**
	 * WebSocket connection for Yjs sync
	 */
	onConnect(conn: Party.Connection) {
		// Multi-room support: room ID = canvas ID
		console.log(`Client connected to room: ${this.party.id}`);

		return onConnect(conn, this.party, {
			persist: true
		});
	}

	/**
	 * HTTP endpoints for AI commands
	 */
	async onRequest(req: Party.Request) {
		const url = new URL(req.url);

		// Health check
		if (url.pathname === '/') {
			return new Response(
				JSON.stringify({
					room: this.party.id,
					connections: [...this.party.getConnections()].length
				}),
				{
					headers: { 'Content-Type': 'application/json' }
				}
			);
		}

		// AI command endpoint (new)
		if (url.pathname === '/api/ai/command' && req.method === 'POST') {
			return this.handleAICommand(req);
		}

		return new Response('Not found', { status: 404 });
	}

	/**
	 * Process AI command with OpenAI GPT-4
	 */
	private async handleAICommand(req: Party.Request): Promise<Response> {
		try {
			const { command, userId } = await req.json();

			// Rate limiting check (stored in Durable Object state)
			const isAllowed = await this.checkRateLimit(userId);
			if (!isAllowed) {
				return new Response(
					JSON.stringify({
						error: 'Rate limit exceeded. Please wait.'
					}),
					{ status: 429 }
				);
			}

			// Get current canvas state
			const canvasState = await this.getCanvasState();

			// Call OpenAI GPT-4 with function calling
			const openai = new OpenAI({
				apiKey: this.party.env.OPENAI_API_KEY
			});

			const response = await openai.chat.completions.create({
				model: 'gpt-4-turbo',
				messages: [
					{
						role: 'system',
						content:
							'You are a canvas manipulation assistant. Use the provided tools to create and modify shapes.'
					},
					{
						role: 'user',
						content: `Current canvas state: ${JSON.stringify(canvasState)}\n\nUser command: ${command}`
					}
				],
				tools: this.getAIToolSchema(),
				tool_choice: 'auto'
			});

			// Execute tool calls
			const toolCalls = response.choices[0].message.tool_calls;
			if (toolCalls) {
				for (const toolCall of toolCalls) {
					await this.executeAITool(toolCall);
				}
			}

			return new Response(
				JSON.stringify({
					success: true,
					message: response.choices[0].message.content
				})
			);
		} catch (error) {
			console.error('AI command error:', error);
			return new Response(
				JSON.stringify({
					error: 'Failed to process command'
				}),
				{ status: 500 }
			);
		}
	}

	/**
	 * Get AI tool schema for function calling
	 */
	private getAIToolSchema() {
		// Return OpenAI function definitions for all shape operations
		// See PRD-final.md section 2.3
		return [
			{
				type: 'function',
				function: {
					name: 'createRectangle',
					description: 'Create a rectangle on the canvas',
					parameters: {
						type: 'object',
						properties: {
							x: { type: 'number' },
							y: { type: 'number' },
							width: { type: 'number' },
							height: { type: 'number' },
							fill: { type: 'string' },
							stroke: { type: 'string' }
						},
						required: ['x', 'y', 'width', 'height']
					}
				}
			}
			// ... 14 more tools (see PRD 2.3)
		];
	}

	/**
	 * Execute AI tool by modifying Yjs document
	 */
	private async executeAITool(toolCall: any) {
		// Modify Yjs document directly in Durable Object
		// Changes will auto-sync to all connected clients
	}

	/**
	 * Rate limiting per user (10 commands/minute)
	 */
	private async checkRateLimit(userId: string): Promise<boolean> {
		// Store in Durable Object state
		const key = `ratelimit:${userId}`;
		const now = Date.now();
		const window = 60000; // 1 minute

		const calls = (await this.party.storage.get<number[]>(key)) || [];
		const recentCalls = calls.filter((t) => now - t < window);

		if (recentCalls.length >= 10) {
			return false;
		}

		recentCalls.push(now);
		await this.party.storage.put(key, recentCalls);
		return true;
	}

	/**
	 * Get current canvas state from Yjs document
	 */
	private async getCanvasState() {
		// Access Yjs document from Durable Object storage
		// Return all shapes
	}
}
```

**Action Items**:

- Add OpenAI SDK: `bun add openai`
- Implement AI command endpoint in PartyKit
- Add rate limiting with Durable Object storage
- Create tool schema matching PRD section 2.3
- Test with simple commands ("create a red circle")

---

## 6. Database Setup (Cloudflare D1)

### Current Issues

**Problem**: No project/canvas management, no permissions

- MVP uses single global room
- No way to create multiple canvases
- No sharing/permissions

**D1 Schema**:

```sql
-- partykit/schema.sql

CREATE TABLE projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  owner_id TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE canvases (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  name TEXT NOT NULL,
  thumbnail_url TEXT,
  created_by TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE TABLE permissions (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('owner', 'editor', 'viewer')),
  granted_at INTEGER NOT NULL,
  granted_by TEXT NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE INDEX idx_canvases_project ON canvases(project_id);
CREATE INDEX idx_permissions_project ON permissions(project_id);
CREATE INDEX idx_permissions_user ON permissions(user_id);
```

**Setup Commands**:

```bash
# Create D1 database
bunx wrangler d1 create collabcanvas-db

# Run migrations
bunx wrangler d1 execute collabcanvas-db --file=./partykit/schema.sql

# Add to wrangler.toml (or partykit.json)
[[d1_databases]]
binding = "DB"
database_name = "collabcanvas-db"
database_id = "<from create command>"
```

**API Routes** (SvelteKit):

```typescript
// src/routes/api/projects/+server.ts
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals, platform }) => {
	const db = platform?.env?.DB;
	const userId = locals.user?.id;

	// Get all projects user has access to
	const projects = await db
		.prepare(
			`
    SELECT p.* FROM projects p
    LEFT JOIN permissions perm ON p.id = perm.project_id
    WHERE p.owner_id = ? OR perm.user_id = ?
    ORDER BY p.updated_at DESC
  `
		)
		.bind(userId, userId)
		.all();

	return new Response(JSON.stringify(projects.results));
};

export const POST: RequestHandler = async ({ request, locals, platform }) => {
	const db = platform?.env?.DB;
	const { name } = await request.json();
	const userId = locals.user?.id;

	const id = crypto.randomUUID();
	const now = Date.now();

	await db
		.prepare(
			`
    INSERT INTO projects (id, name, owner_id, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?)
  `
		)
		.bind(id, name, userId, now, now)
		.run();

	return new Response(JSON.stringify({ id, name }));
};
```

**Action Items**:

- Create D1 database in Cloudflare
- Write schema.sql with tables above
- Run migrations
- Create API routes for CRUD operations
- Create client-side API wrappers in `src/lib/api/`
- Update PartyKit to check permissions before allowing edits

---

## 7. Image Upload Infrastructure (R2)

### Current Issues

**Problem**: No image support in MVP

- Need R2 bucket for storage
- Need presigned URL generation
- Need client-side upload flow

**R2 Setup**:

```bash
# Create R2 bucket
bunx wrangler r2 bucket create collabcanvas-images

# Configure CORS
bunx wrangler r2 bucket cors put collabcanvas-images --rules '[{
  "AllowedOrigins": ["*"],
  "AllowedMethods": ["GET", "PUT"],
  "AllowedHeaders": ["*"],
  "MaxAgeSeconds": 3600
}]'

# Add to wrangler.toml
[[r2_buckets]]
binding = "IMAGES"
bucket_name = "collabcanvas-images"
```

**Upload API**:

```typescript
// src/routes/api/images/upload/+server.ts
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ locals, platform }) => {
	const r2 = platform?.env?.IMAGES;
	const userId = locals.user?.id;

	if (!userId) {
		return new Response('Unauthorized', { status: 401 });
	}

	// Generate unique filename
	const fileId = crypto.randomUUID();
	const filename = `${userId}/${fileId}`;

	// Generate presigned URL (valid for 5 minutes)
	const uploadUrl = await r2.createPresignedUrl(filename, {
		expiresIn: 300,
		method: 'PUT'
	});

	const publicUrl = `https://collabcanvas-images.${platform.env.ACCOUNT_ID}.r2.cloudflarestorage.com/${filename}`;

	return new Response(JSON.stringify({ uploadUrl, publicUrl }));
};
```

**Client-side Upload**:

```typescript
// src/lib/api/images.ts
export async function uploadImage(file: File): Promise<string> {
	// 1. Request presigned URL
	const res = await fetch('/api/images/upload', { method: 'POST' });
	const { uploadUrl, publicUrl } = await res.json();

	// 2. Upload directly to R2
	await fetch(uploadUrl, {
		method: 'PUT',
		body: file,
		headers: {
			'Content-Type': file.type
		}
	});

	// 3. Return public URL
	return publicUrl;
}
```

**Action Items**:

- Create R2 bucket in Cloudflare
- Configure CORS for client uploads
- Create presigned URL endpoint
- Implement client-side upload helper
- Add file validation (4MB limit, allowed types)
- Create ImageShape renderer in Konva

---

## 8. Component Refactoring Priorities

### Phase 1: Extract Canvas Logic (Priority: CRITICAL)

**Before**: 1200 line `canvas/+page.svelte`

**After**: Modular architecture

```svelte
<!-- src/routes/canvas/+page.svelte (slim orchestrator) -->
<script lang="ts">
	import Canvas from '$lib/components/canvas/Canvas.svelte';
	import Toolbar from '$lib/components/canvas/Toolbar.svelte';
	import PropertiesPanel from '$lib/components/canvas/PropertiesPanel.svelte';
	import CommandPalette from '$lib/components/canvas/CommandPalette.svelte';
	import { initializeProvider } from '$lib/collaboration';
	import { initializeShapesSync } from '$lib/stores/shapes';

	let { data } = $props();

	onMount(() => {
		initializeShapesSync();
		initializeProvider(data.user.id, data.userProfile.displayName, data.userProfile.color);
	});
</script>

<div class="flex h-screen">
	<Toolbar />
	<Canvas />
	<PropertiesPanel />
	<CommandPalette />
</div>
```

**Extract to**:

- `Canvas.svelte`: Just Konva stage + layers
- `CanvasEngine.ts`: Stage setup, event handlers
- `ShapeRenderer.ts`: Renders shapes from store
- `CursorManager.ts`: Remote cursor logic (currently 400+ lines inline)

### Phase 2: Toolbar Enhancement

**Current**: Single button for rectangles

**Needed**: All shape types + tools

```svelte
<!-- src/lib/components/canvas/Toolbar.svelte -->
<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Separator } from '$lib/components/ui/separator';
	import { activeTool } from '$lib/stores/tool';

	// Icons from lucide-svelte
	import {
		MousePointer2,
		Square,
		Circle,
		Pentagon,
		Star,
		Type,
		Minus,
		Image,
		Undo,
		Redo,
		Sparkles
	} from 'lucide-svelte';

	const tools = [
		{ id: 'select', icon: MousePointer2, label: 'Select' },
		{ id: 'rectangle', icon: Square, label: 'Rectangle' },
		{ id: 'circle', icon: Circle, label: 'Circle' }
		// ... more tools
	];
</script>

<div class="fixed left-4 top-4 flex flex-col gap-2 bg-white rounded-lg shadow-lg border p-2">
	{#each tools as tool}
		<Button
			variant={$activeTool === tool.id ? 'default' : 'ghost'}
			size="icon"
			on:click={() => activeTool.set(tool.id)}
		>
			<svelte:component this={tool.icon} class="w-4 h-4" />
		</Button>
	{/each}

	<Separator />

	<Button variant="ghost" size="icon" on:click={() => history.undo()}>
		<Undo class="w-4 h-4" />
	</Button>

	<Button variant="ghost" size="icon" on:click={() => history.redo()}>
		<Redo class="w-4 h-4" />
	</Button>

	<Separator />

	<Button variant="ghost" size="icon" on:click={openCommandPalette}>
		<Sparkles class="w-4 h-4" />
	</Button>
</div>
```

### Phase 3: Properties Panel (NEW)

**Create**: Right sidebar for shape properties

```svelte
<!-- src/lib/components/canvas/PropertiesPanel.svelte -->
<script lang="ts">
	import { selectedShapes } from '$lib/stores/selection';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Slider } from '$lib/components/ui/slider';
	import ShapeControls from '$lib/components/shapes/ShapeControls.svelte';

	let selected = $derived($selectedShapes);
	let shape = $derived(selected.length === 1 ? selected[0] : null);
</script>

{#if shape}
	<div class="fixed right-0 top-0 h-screen w-80 bg-white border-l shadow-lg overflow-y-auto">
		<div class="p-4 space-y-6">
			<!-- Transform -->
			<section>
				<h3 class="text-sm font-semibold mb-3">Transform</h3>
				<div class="grid grid-cols-2 gap-3">
					<div>
						<Label>X</Label>
						<Input type="number" bind:value={shape.x} />
					</div>
					<div>
						<Label>Y</Label>
						<Input type="number" bind:value={shape.y} />
					</div>
				</div>
			</section>

			<!-- Shape-specific controls -->
			<ShapeControls {shape} />
		</div>
	</div>
{/if}
```

---

## 9. Code Quality Improvements

### Current Issues

**Problems**:

- No TypeScript strictness (`any` types used)
- 400+ line functions (cursor rendering)
- Inline event handlers
- Magic numbers everywhere
- No error handling

**Actions**:

1. **Enable Strict TypeScript**:

```json
// tsconfig.json
{
	"compilerOptions": {
		"strict": true,
		"noImplicitAny": true,
		"strictNullChecks": true,
		"strictFunctionTypes": true
	}
}
```

2. **Extract Constants**:

```typescript
// src/lib/constants.ts
export const CANVAS = {
	GRID_SIZE: 50,
	GRID_COLOR: '#e2e8f0',
	MIN_ZOOM: 0.1,
	MAX_ZOOM: 5,
	ZOOM_STEP: 1.05
} as const;

export const CURSOR = {
	THROTTLE_MS: 30,
	EDGE_PADDING: 30,
	ANIMATION_DURATION: 120
} as const;

export const SHAPES = {
	DEFAULT_WIDTH: 150,
	DEFAULT_HEIGHT: 100,
	MIN_SIZE: 5,
	DEFAULT_STROKE_WIDTH: 2
} as const;
```

3. **Error Boundaries**:

```typescript
// src/lib/utils/error-handler.ts
export function handleCanvasError(error: Error, context: string) {
	console.error(`Canvas error in ${context}:`, error);

	// Show user-friendly toast
	showToast({
		variant: 'destructive',
		title: 'Something went wrong',
		description: 'Please try again or refresh the page.'
	});
}
```

---

## 10. Implementation Roadmap

### Before Starting Final Product Features

**Week 1: Foundation Refactoring**

- [ ] Set up shadcn/ui and design system
- [ ] Extract type system (`src/lib/types/shapes.ts`)
- [ ] Create store architecture (`shapes.ts`, `selection.ts`, etc.)
- [ ] Install OpenAI SDK, D1, R2 infrastructure

**Week 2: Canvas Modularization**

- [ ] Extract `CanvasEngine.ts`, `ViewportManager.ts`
- [ ] Extract `CursorManager.ts` (400+ lines)
- [ ] Create `BaseShape` class and factory pattern
- [ ] Refactor `canvas/+page.svelte` to <200 lines

**Week 3: Component Overhaul**

- [ ] Rebuild Toolbar with shadcn components
- [ ] Create PropertiesPanel component
- [ ] Create CommandPalette component (AI)
- [ ] Refactor ConnectionStatus with shadcn

**Week 4: Infrastructure**

- [ ] Set up D1 database and migrations
- [ ] Create project/canvas API routes
- [ ] Set up R2 bucket and upload flow
- [ ] Add AI endpoint to PartyKit server

**Week 5: Multi-Canvas**

- [ ] Implement home page with project grid
- [ ] Implement project page with canvas grid
- [ ] Add per-canvas PartyKit rooms
- [ ] Implement permissions system

### Then Start Final Product Features

Once refactoring is complete, implement in this order:

1.  **Shapes** (Phases 1-2 of Final PRD)

                                                - Add 6 new shape types
                                                - Update Toolbar with all tools
                                                - Implement rotation, multi-select

2.  **AI Agent** (Phase 3 of Final PRD)

                                                - Command palette UI
                                                - OpenAI integration
                                                - 15+ tool implementations

3.  **Images** (Phase 4 of Final PRD)

                                                - Upload flow
                                                - ImageShape renderer
                                                - R2 integration

4.  **UX Polish** (Phase 5 of Final PRD)

                                                - Undo/redo
                                                - Keyboard shortcuts
                                                - Export PNG/SVG

---

## 11. Migration Strategy

### For Existing MVP Users

**Problem**: Current MVP uses global "main" room, Final Product needs per-canvas rooms

**Migration Plan**:

```typescript
// src/routes/migration/+server.ts
export const POST: RequestHandler = async ({ locals, platform }) => {
	const db = platform?.env?.DB;
	const userId = locals.user?.id;

	// 1. Create default project for user
	const projectId = crypto.randomUUID();
	await db
		.prepare(
			`
    INSERT INTO projects (id, name, owner_id, created_at, updated_at)
    VALUES (?, 'My First Project', ?, ?, ?)
  `
		)
		.bind(projectId, userId, Date.now(), Date.now())
		.run();

	// 2. Create canvas for "main" room
	const canvasId = 'main'; // Preserve existing room ID
	await db
		.prepare(
			`
    INSERT INTO canvases (id, project_id, name, created_by, created_at, updated_at)
    VALUES (?, ?, 'Untitled Canvas', ?, ?, ?)
  `
		)
		.bind(canvasId, projectId, userId, Date.now(), Date.now())
		.run();

	// 3. Redirect to new canvas URL
	return redirect(303, `/project/${projectId}/canvas/${canvasId}`);
};
```

**URL Migration**:

- Old: `/canvas` (global room)
- New: `/project/{projectId}/canvas/{canvasId}`
- Keep "main" as a valid canvas ID for backward compatibility

---

## 12. Testing Strategy

### Before & After Refactoring

**Unit Tests** (add vitest):

```typescript
// src/lib/canvas/shapes/ShapeFactory.test.ts
import { describe, it, expect } from 'vitest';
import { ShapeFactory } from './ShapeFactory';

describe('ShapeFactory', () => {
	it('creates rectangle with correct defaults', () => {
		const rect = ShapeFactory.create('rectangle', { x: 0, y: 0 });
		expect(rect.type).toBe('rectangle');
		expect(rect.width).toBe(150);
		expect(rect.height).toBe(100);
	});

	// ... more tests
});
```

**Integration Tests**:

```typescript
// src/routes/canvas/canvas.spec.ts
import { test, expect } from '@playwright/test';

test('multi-select rectangles with shift+click', async ({ page }) => {
	await page.goto('/project/test/canvas/test');

	// Create 2 rectangles
	await page.click('[data-tool="rectangle"]');
	await page.click('.konva-container', { position: { x: 100, y: 100 } });
	await page.click('.konva-container', { position: { x: 200, y: 200 } });

	// Select both with shift
	await page.click('.konva-container', { position: { x: 100, y: 100 } });
	await page.click('.konva-container', { position: { x: 200, y: 200 }, modifiers: ['Shift'] });

	// Verify both selected
	const transformer = await page.locator('.konva-transformer');
	expect(await transformer.count()).toBe(1);
});
```

---

## 13. Performance Optimization Opportunities

### Identified During Refactoring

1.  **Viewport Culling** (not in MVP):

                                                - Only render shapes within viewport bounds
                                                - Use quadtree for spatial indexing
                                                - Can handle 5000+ shapes easily

2.  **Konva Layer Caching**:

                                                - Cache static grid layer
                                                - Only redraw shapes layer when changes occur

3.  **Cursor Throttling** (already implemented):

                                                - 30ms throttle working well
                                                - Consider WebWorker for cursor interpolation

4.  **Yjs Batching**:

                                                - Already using `ydoc.transact()` for atomic updates
                                                - Good for multi-shape operations

---

## Summary

This refactoring plan transforms the MVP from a monolithic prototype into a production-ready architecture that can support:

- 7 shape types (vs 1)
- AI agent with 15+ tools
- Multi-canvas/project management
- Image uploads
- Advanced UX features

**Estimated Effort**: 4-5 weeks of refactoring before Final Product implementation

**Outcome**: Clean, modular, maintainable codebase with world-class design system integration
