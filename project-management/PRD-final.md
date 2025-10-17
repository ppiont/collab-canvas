# CollabCanvas Final Product - Product Requirements Document

**Version:** 2.0  
**Previous Version:** 1.0 (MVP - Rectangle-only canvas)  
**Stack:** SvelteKit + Bun + Yjs + PartyKit + Auth0 + OpenAI + Cloudflare R2  
**Last Updated:** [DATE]

---

## Document History

- **v1.0 (MVP):** Basic collaborative canvas with rectangles only, single global room
- **v2.0 (Final):** Full design tool with 7 shape types, AI agent, images, multi-canvas support

---

## Executive Summary

CollabCanvas is a real-time collaborative design tool that combines Figma-style multiplayer editing with natural language AI capabilities. Users can design together in real-time while using AI commands to rapidly create complex layouts.

**Core Innovation:** Natural language canvas manipulation through GPT-4 function calling, enabling users to say "create a login form" and watch the AI build it in real-time, visible to all collaborators.

### What's New in v2.0

**From MVP (v1.0):**

- ✅ Rectangles only → **7 shape types** (rectangle, circle, ellipse, line, text, polygon, star)
- ✅ Basic move/resize → **Full transformations** (rotate, multi-select, layer management)
- ✅ Single canvas → **Multi-project/canvas architecture** with permissions
- ✅ No AI → **GPT-4 powered canvas agent** with 15+ tools
- ✅ No images → **Image upload with Cloudflare R2** (4MB limit)
- ✅ Basic UX → **Advanced features** (undo/redo, keyboard shortcuts, export, styling controls)

---

## Key Architecture Decisions

### MVP Decisions (Carried Forward)

- **Real-time sync:** Yjs CRDTs for conflict-free editing
- **Backend:** PartyKit on Cloudflare Workers (edge-deployed WebSockets)
- **Canvas rendering:** Konva.js for 60 FPS performance
- **Auth:** Auth0 (email + password)
- **Persistence:** PartyKit Durable Objects (automatic, no external DB needed)
- **Deployment:** Railway (frontend) + Cloudflare Workers (PartyKit backend)

### New Decisions (v2.0)

- **AI Provider:** OpenAI GPT-4-turbo with function calling
- **AI UX Pattern:** Command palette (Cmd/Ctrl+K) for ephemeral AI interactions
- **Image Storage:** Cloudflare R2 with 4MB file size limit
- **Project Storage:** Cloudflare D1 (SQLite) for project/canvas metadata
- **Room Strategy:** Per-canvas rooms (`canvas-${canvasId}`) instead of global "main" room
- **Custom Paths:** Deferred to future (complexity vs. value)

---

## 1. Core Design Tools

### 1.1 Shape Types

#### Rectangles (Already Implemented - MVP)

- **Properties:** x, y, width, height, fill, stroke, strokeWidth, rotation
- **Transformations:** Move, resize, rotate
- **Status:** ✅ Complete

#### Circles

- **Properties:** x, y, radius, fill, stroke, strokeWidth, rotation
- **Transformations:** Move, resize (radius), rotate
- **Creation:** Click to place with default radius

#### Ellipses

- **Properties:** x, y, radiusX, radiusY, fill, stroke, strokeWidth, rotation
- **Transformations:** Move, resize (independent X/Y axes), rotate
- **Creation:** Click-drag to define size

#### Lines & Polylines

- **Properties:** points (array of [x, y] coordinates), stroke, strokeWidth, lineCap, lineJoin, dash
- **Transformations:** Move (all points), edit individual points (future), rotate
- **Creation:** Click to add points, double-click or press Enter to finish
- **Styles:** Solid, dashed, dotted with customizable dash patterns

#### Text Layers

- **Properties:** x, y, text (string), fontSize, fontFamily, fontStyle, fontWeight, fill, align, rotation
- **Transformations:** Move, resize (adjusts fontSize proportionally), rotate
- **Creation:** Click to place, immediately enter edit mode
- **Editing:** Double-click to edit inline, toolbar for bold/italic/underline
- **Formatting:**
  - Bold, italic, underline (toggle)
  - Alignment: left, center, right
  - Font size: 8-144px
  - Font family: System fonts (sans-serif, serif, monospace)

#### Polygons

- **Properties:** x, y, sides (3-12), radius, fill, stroke, strokeWidth, rotation
- **Transformations:** Move, resize (radius), rotate
- **Creation:** Click to place, toolbar selector for number of sides
- **Presets:** Triangle (3), pentagon (5), hexagon (6), octagon (8)

#### Stars

- **Properties:** x, y, numPoints (5-12), innerRadius, outerRadius, fill, stroke, strokeWidth, rotation
- **Transformations:** Move, resize (both radii proportionally), rotate
- **Creation:** Click to place, toolbar selector for number of points
- **Default:** 5-point star

### 1.2 Transformations

#### Basic Transformations (MVP - Already Working)

- **Move:** Drag shape to new position
- **Resize:** Drag corner/edge handles on bounding box
- **Status:** ✅ Implemented for rectangles

#### Rotation (New)

- **UI:** Rotation handle appears above bounding box when shape selected
- **Interaction:** Drag rotation handle to rotate around center point
- **Constraint:** Hold Shift for 15° increments (0°, 15°, 30°, 45°, etc.)
- **Visual:** Show rotation angle tooltip while dragging
- **Applies to:** All shape types

#### Multi-Select (New)

- **Methods:**
  - Shift+Click: Toggle individual shapes into/out of selection
  - Click-drag on empty canvas: Rectangle selection box (all shapes within box)
- **Visual:** Group bounding box showing collective bounds of all selected shapes
- **Operations:** Move group, delete all, duplicate all, transform all together
- **Limitation:** Cannot resize group (would distort proportions)
- **Implementation:** Maintain `Set<string>` of selected shape IDs

#### Layer Management (New)

- **Z-Index Control:** Each shape has zIndex property
- **Operations:**
  - Bring to Front: Set zIndex to max + 1
  - Bring Forward: Increment zIndex by 1
  - Send Backward: Decrement zIndex by 1
  - Send to Back: Set zIndex to min - 1
- **Keyboard Shortcuts:**
  - Cmd/Ctrl+] : Bring forward
  - Cmd/Ctrl+[ : Send backward
  - Cmd/Ctrl+Shift+] : Bring to front
  - Cmd/Ctrl+Shift+[ : Send to back
- **UI:** Context menu (right-click) with layer options
- **Visual:** Selected shapes show z-index badge

### 1.3 Shape Operations

#### Delete

- **Methods:**
  - Keyboard: Delete or Backspace key
  - Context menu: Right-click → Delete
- **Multi-delete:** Works with multi-select (deletes all selected)
- **Sync:** Removes shapes from Yjs document immediately

#### Duplicate

- **Methods:**
  - Keyboard: Cmd/Ctrl+D
  - Context menu: Right-click → Duplicate
- **Behavior:** Creates copy with new ID, offset by 20px down and right
- **Properties:** Copies all properties including styling, preserves z-index + 1
- **Multi-duplicate:** Works with multi-select (duplicates all selected with same offset)
- **Sync:** Adds new shapes to Yjs document immediately

### 1.4 Universal Shape Properties

All shapes support (where applicable):

- **Position:** x, y coordinates
- **Color:** fill (solid color or gradient)
- **Stroke:** stroke color, strokeWidth (0-20px)
- **Opacity:** 0-100%
- **Blend Mode:** normal, multiply, screen, overlay, darken, lighten
- **Shadow:** color, blur, offsetX, offsetY (enable/disable toggle)
- **Rotation:** 0-360° with 15° snap option
- **Z-Index:** Layer stacking order
- **Metadata:** createdBy (user ID), createdAt (timestamp)

---

## 2. AI Canvas Agent

### 2.1 Vision

Users can manipulate the canvas using natural language, dramatically accelerating design work. The AI agent understands spatial relationships, can create complex multi-shape layouts, and all changes sync in real-time to all collaborators.

**Example Use Cases:**

- "Create a login form" → AI builds username field, password field, submit button, arranged vertically
- "Make a navigation bar with Home, About, Services, Contact" → AI creates horizontal nav with text elements
- "Arrange these shapes in a grid" → AI calculates grid positions and moves shapes
- "Change all blue rectangles to green" → AI finds and updates shapes

### 2.2 Architecture

**Provider:** OpenAI GPT-4-turbo

- **Model:** `gpt-4-turbo` (or latest GPT-4 variant)
- **API:** OpenAI Node SDK v4.0+
- **Feature:** Function calling for tool execution

**Data Flow:**

1. User opens command palette (Cmd/Ctrl+K)
2. User types natural language command
3. Frontend sends command to PartyKit `/api/ai/command` endpoint
4. PartyKit calls `getCanvasState()` to get current shapes
5. PartyKit calls GPT-4 with: system prompt + canvas state + user command + tool schema
6. GPT-4 returns function calls (e.g., `createRectangle`, `arrangeHorizontal`)
7. PartyKit executes each tool function sequentially
8. Tools modify Yjs document (shapes map)
9. Yjs syncs changes to all connected clients in real-time
10. Frontend shows success/error message in command palette

### 2.3 Tool Schema

The AI has access to the following tools (implemented as Yjs operations):

#### Creation Tools

```typescript
createRectangle(x: number, y: number, width: number, height: number, fill: string, stroke?: string)
createCircle(x: number, y: number, radius: number, fill: string, stroke?: string)
createEllipse(x: number, y: number, radiusX: number, radiusY: number, fill: string, stroke?: string)
createLine(points: number[], stroke: string, strokeWidth?: number, dash?: number[])
createText(x: number, y: number, text: string, fontSize: number, fontFamily?: string, fill?: string)
createPolygon(x: number, y: number, sides: number, radius: number, fill: string, stroke?: string)
createStar(x: number, y: number, numPoints: number, innerRadius: number, outerRadius: number, fill: string, stroke?: string)
createImage(x: number, y: number, width: number, height: number, imageUrl: string)
```

#### Manipulation Tools

```typescript
moveShape(shapeId: string, x: number, y: number)
resizeShape(shapeId: string, width: number, height: number) // or radius for circles
rotateShape(shapeId: string, degrees: number)
updateShapeColor(shapeId: string, fill: string, stroke?: string)
updateTextContent(shapeId: string, text: string)
deleteShape(shapeId: string)
duplicateShape(shapeId: string, offsetX?: number, offsetY?: number)
```

#### Layout Tools

```typescript
arrangeHorizontal(shapeIds: string[], spacing?: number)
arrangeVertical(shapeIds: string[], spacing?: number)
arrangeGrid(shapeIds: string[], cols: number, spacing?: number)
distributeEvenly(shapeIds: string[], direction: 'horizontal' | 'vertical')
alignShapes(shapeIds: string[], alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom')
groupShapes(shapeIds: string[]) // Creates visual grouping (z-index proximity)
```

#### Query Tools

```typescript
getCanvasState() // Returns all shapes with full properties
findShapesByType(type: string) // Returns array of shape IDs
findShapesByColor(color: string) // Returns array of shape IDs
getViewportBounds() // Returns { x, y, width, height } of visible area
getSelectedShapes() // Returns array of currently selected shape IDs
```

### 2.4 Command Examples

**Simple Creation:**

- "Create a red circle at 100, 200"
- "Add a text layer that says 'Welcome to CollabCanvas'"
- "Make a blue 6-point star in the center"

**Manipulation:**

- "Move the red circle to x: 300, y: 150"
- "Rotate the rectangle 45 degrees"
- "Change all blue shapes to green"
- "Resize the text to 48 pixels"

**Layout:**

- "Arrange these 3 rectangles in a horizontal row with 20px spacing"
- "Create a 3x3 grid of circles, 50px apart"
- "Align all text layers to the left edge"
- "Distribute these shapes evenly across the canvas"

**Complex (Multi-Step):**

- "Create a login form with username and password fields"
  - Expected: 2 text labels + 2 input rectangles + 1 submit button, vertically arranged
- "Build a navigation bar with Home, About, Services, Contact"
  - Expected: 1 background rectangle + 4 text elements, horizontally arranged
- "Make a card with title, image placeholder, and description"
  - Expected: 1 card background + 1 title text + 1 image rectangle + 1 description text

### 2.5 AI UX - Command Palette

**Activation:**

- Keyboard: Cmd/Ctrl+K (global shortcut)
- Button: "AI" icon in toolbar (sparkle icon ✨)

**UI Design:**

- Modal overlay with semi-transparent dark backdrop
- Centered input field (width: 600px, single line)
- Placeholder: "Ask AI to create or modify shapes..."
- Auto-focus on open
- Loading indicator (spinner) while processing
- Success message (green checkmark) or error message (red X)
- Command history: Up/Down arrows to navigate previous commands (last 5)

**Interaction States:**

1. **Idle:** Input ready, placeholder visible
2. **Loading:** Spinner visible, input disabled, "Processing..." text
3. **Success:** Checkmark + "Done!" → auto-close after 1s
4. **Error:** Error message + keep palette open for retry
5. **Timeout:** After 10s, show "Request timed out. Try again?"

**Keyboard Shortcuts:**

- Cmd/Ctrl+K: Open palette
- Escape: Close palette
- Enter: Submit command
- Up/Down: Navigate command history

### 2.6 Performance & Limits

**Latency Targets:**

- Simple commands (1 shape): <2 seconds
- Complex commands (5+ shapes): <5 seconds
- Timeout: 10 seconds (show error)

**Rate Limiting:**

- Max 10 commands per minute per user
- Enforced in PartyKit backend (store in Durable Object state)
- Error message: "Too many requests. Please wait X seconds."
- UI: Show cooldown timer

**Cost Management:**

- Log all GPT-4 API calls (user ID, command, tokens used)
- Monitor usage via PartyKit logs
- Consider command credits system (future)

**Error Handling:**

- Invalid commands: GPT-4 asks clarifying question in response
- Tool execution errors: Show user-friendly message, keep palette open
- Network errors: Show retry button
- Ambiguous commands: AI asks for clarification before executing

### 2.7 Multi-User AI

**Shared State:**

- All AI-generated shapes sync to all users in real-time (via Yjs)
- Users see AI actions as they happen (shapes appearing, moving, etc.)
- Command palette is per-user (each user can issue commands independently)

**Concurrent Commands:**

- Multiple users can issue AI commands simultaneously
- Commands are queued in backend (process sequentially)
- Show "Another user is using AI" message if queue is busy

**Presence:**

- Show indicator when user is issuing AI command (e.g., "🤖 User is using AI")

---

## 3. Image Support

### 3.1 Image Upload

**Storage:** Cloudflare R2

- **Bucket:** `collabcanvas-images`
- **Region:** Auto (closest to user)
- **Access:** Public read, private write

**Upload Flow:**

1. User clicks "Add Image" button or drags file onto canvas
2. Client validates file (type, size)
3. Client requests presigned upload URL from `/api/images/upload`
4. Client uploads file directly to R2 using presigned URL
5. Backend returns public R2 URL
6. Client creates Image shape in Yjs with R2 URL
7. Image loads and displays on canvas, syncs to all users

**Validation:**

- **Max size:** 4MB per image
- **Formats:** PNG, JPG, JPEG, GIF, WebP
- **Reject:** SVG (security risk), TIFF, BMP (large files)

**UI/UX:**

- Drag-drop zone: Entire canvas accepts image files
- Button: "📷 Add Image" in toolbar
- Progress indicator: Show upload progress (0-100%)
- Placeholder: Gray box while loading
- Error states: Show user-friendly messages (file too large, invalid format, upload failed)

### 3.2 Image Shape

**Data Structure:**

```typescript
interface ImageShape {
	id: string;
	type: 'image';
	x: number;
	y: number;
	width: number;
	height: number;
	imageUrl: string; // R2 public URL
	opacity: number; // 0-100
	rotation: number; // 0-360
	zIndex: number;
	createdBy: string;
	createdAt: number;
}
```

**Rendering:**

- Use Konva Image node
- Load image asynchronously (`new Image()`)
- Show placeholder while loading (gray rectangle with camera icon)
- Cache loaded images in browser

**Transformations:**

- Move: Drag to reposition
- Resize: Maintain aspect ratio by default (hold Shift to ignore)
- Rotate: Use rotation handle
- Opacity: Slider in properties panel (0-100%)

**Limitations (v2.0):**

- No cropping (future feature)
- No filters (grayscale, blur, etc.) - future
- No direct image editing (brightness, contrast) - future

### 3.3 AI + Images

**AI Capabilities:**

- AI can create image placeholders: `createImage(x, y, width, height, imageUrl)`
- AI uses placeholder services: "Create an image placeholder 300x200" → uses `https://via.placeholder.com/300x200`
- AI can move/resize existing images: `moveShape(imageId, x, y)`
- AI **cannot** upload images (user action only)

**Example Commands:**

- "Add an image placeholder at 100, 100"
- "Create a 400x300 image in the center"
- "Move the image to the top right"

### 3.4 R2 Configuration

**Backend API:**

- Endpoint: POST `/api/images/upload`
- Auth: Requires valid Auth0 session
- Returns: `{ uploadUrl: string, publicUrl: string }`
- Rate limit: 10 uploads per minute per user

**R2 Setup:**

```bash
# Create bucket
wrangler r2 bucket create collabcanvas-images

# Set CORS for uploads
wrangler r2 bucket cors put collabcanvas-images --rules '[{
  "AllowedOrigins": ["*"],
  "AllowedMethods": ["GET", "PUT"],
  "AllowedHeaders": ["*"],
  "MaxAgeSeconds": 3600
}]'

# Secrets (add to Cloudflare Workers)
R2_ACCESS_KEY_ID=<from Cloudflare dashboard>
R2_SECRET_ACCESS_KEY=<from Cloudflare dashboard>
```

**CDN:** Automatic via Cloudflare R2 (serves via CF edge network)

**Lifecycle (Future):**

- Delete unused images after 90 days
- Implement image usage tracking in D1

---

## 4. Enhanced UX Features

### 4.1 Undo/Redo

**Implementation:** Yjs UndoManager

- **Library:** Built into Yjs (`import { UndoManager } from 'yjs'`)
- **Scope:** Per-user (only undo your own actions)
- **Stack Size:** 50 actions
- **Captures:** All Yjs operations (create, update, delete shapes)

**Keyboard Shortcuts:**

- Cmd/Ctrl+Z: Undo
- Cmd/Ctrl+Shift+Z or Cmd/Ctrl+Y: Redo

**UI:**

- Undo/Redo buttons in toolbar
- Disabled state when stack is empty
- Tooltips show keyboard shortcuts

**Limitations:**

- Cannot undo other users' actions
- AI commands are undoable (treated as your actions when you invoke AI)

### 4.2 Keyboard Shortcuts

**Canvas Navigation:**

- Space + Drag: Pan canvas
- Cmd/Ctrl + Mouse Wheel: Zoom in/out
- Cmd/Ctrl + 0: Reset zoom to 100%

**Tool Selection:**

- V: Selection tool (default, escape from other tools)
- R: Rectangle tool
- C: Circle tool
- E: Ellipse tool
- L: Line tool
- T: Text tool
- P: Polygon tool (opens side selector)
- S: Star tool (opens point selector)

**Shape Operations:**

- Delete or Backspace: Delete selected shape(s)
- Cmd/Ctrl+D: Duplicate selected shape(s)
- Cmd/Ctrl+A: Select all shapes
- Escape: Deselect all

**Layer Management:**

- Cmd/Ctrl+]: Bring forward
- Cmd/Ctrl+[: Send backward
- Cmd/Ctrl+Shift+]: Bring to front
- Cmd/Ctrl+Shift+[: Send to back

**Undo/Redo:**

- Cmd/Ctrl+Z: Undo
- Cmd/Ctrl+Shift+Z: Redo

**AI:**

- Cmd/Ctrl+K: Open AI command palette

**Opacity Shortcuts:**

- 1: 10% opacity
- 2: 20% opacity
- ...
- 9: 90% opacity
- 0: 100% opacity

**UI:**

- Tooltips show shortcuts on hover
- Shortcuts work regardless of text input focus (except when typing in command palette)

### 4.3 Styling Controls

All accessible via **Properties Panel** (right sidebar when shape selected)

#### Color Picker

- **Modes:**
  - Solid: Hex, RGB, HSL inputs
  - Linear Gradient: Start/end colors, angle
  - Radial Gradient: Inner/outer colors, position
- **Presets:** Material Design color palette (20 colors)
- **Recent Colors:** Last 10 used (stored in localStorage)
- **Eyedropper (Future):** Pick color from canvas

#### Stroke Controls

- **Width:** Slider 0-20px
- **Style:** Dropdown (solid, dashed, dotted)
- **Dash Pattern (Advanced):** Custom array input (e.g., `[10, 5]` = 10px dash, 5px gap)
- **Color:** Uses color picker

#### Shadow Controls

- **Enable/Disable:** Toggle switch
- **Color:** Uses color picker (with alpha)
- **Blur:** Slider 0-50px
- **Offset X:** Slider -50 to +50px
- **Offset Y:** Slider -50 to +50px
- **Presets:**
  - Subtle: blur 5px, offset 2px
  - Medium: blur 10px, offset 4px
  - Heavy: blur 20px, offset 8px

#### Opacity & Blend Modes

- **Opacity:** Slider 0-100% (or keyboard shortcuts 0-9)
- **Blend Modes:** Dropdown
  - Normal (default)
  - Multiply (darken)
  - Screen (lighten)
  - Overlay (contrast)
  - Darken
  - Lighten
- Applies to entire shape (fill + stroke)

### 4.4 Export

#### PNG Export

- **Trigger:** Toolbar button "Export" → "PNG"
- **Options Dialog:**
  - Resolution: 1x, 2x, 4x (default 2x)
  - Background: Transparent or White (default transparent)
  - Scope: Full canvas or Selected shapes only
- **Implementation:** Konva `toDataURL({ pixelRatio: 2 })`
- **Output:** Downloads `collabcanvas-export-[timestamp].png`

#### SVG Export

- **Trigger:** Toolbar button "Export" → "SVG"
- **Options Dialog:**
  - Fonts: Embed or Convert to paths (default embed)
  - Background: Transparent or White
  - Scope: Full canvas or Selected shapes only
- **Implementation:** Custom SVG generator (iterate shapes, create SVG elements)
- **Output:** Downloads `collabcanvas-export-[timestamp].svg`
- **Preserves:** Vector quality, gradients, text as text (unless converted)

**Export Considerations:**

- Images are embedded as base64 (PNG export) or linked (SVG export)
- Text in SVG may not render identically in other apps (font availability)
- Transformations (rotation, scale) are baked into exported coordinates

### 4.5 Properties Panel

**Location:** Right sidebar (300px wide, collapsible)

**Shows When:** One or more shapes selected

**Sections:**

1. **Transform:**
   - X, Y position (number inputs)
   - Width, Height (number inputs, or radius for circles)
   - Rotation (slider 0-360°, snap to 15°)

2. **Appearance:**
   - Fill: Color picker
   - Stroke: Color picker + width slider
   - Opacity: Slider 0-100%
   - Blend Mode: Dropdown

3. **Effects:**
   - Shadow: Toggle + controls
   - (Future: Blur, other filters)

4. **Shape-Specific:**
   - Text: Content, fontSize, fontFamily, bold/italic/underline
   - Polygon: Number of sides
   - Star: Number of points, inner/outer radius
   - Line: Stroke style, dash pattern

5. **Layer:**
   - Z-Index: Show current, buttons for bring forward/backward
   - (Future: Lock, hide)

**Multi-Select Behavior:**

- If properties differ, show "Mixed" placeholder
- Changing property applies to all selected shapes

---

## 5. Multi-Canvas & Project Management

### 5.1 Data Model

**Projects:**

```typescript
interface Project {
	id: string; // UUID
	name: string; // User-defined name
	ownerId: string; // Auth0 user ID
	createdAt: number; // Unix timestamp
	updatedAt: number; // Unix timestamp
}
```

**Canvases:**

```typescript
interface Canvas {
	id: string; // UUID
	projectId: string; // Foreign key to project
	name: string; // User-defined name
	thumbnailUrl: string; // R2 URL to canvas screenshot (optional)
	createdBy: string; // Auth0 user ID
	createdAt: number; // Unix timestamp
	updatedAt: number; // Unix timestamp
}
```

**Permissions:**

```typescript
interface Permission {
	id: string; // UUID
	projectId: string; // Foreign key
	userId: string; // Auth0 user ID (or email for invited users)
	role: 'owner' | 'editor' | 'viewer';
	grantedAt: number; // Unix timestamp
	grantedBy: string; // Auth0 user ID
}
```

**Storage:** Cloudflare D1 (SQLite database)

### 5.2 URL Structure

**Current (MVP):**

- `/` - Landing page
- `/canvas` - Single global canvas (room: "main")

**New (Multi-Canvas):**

- `/` - Home page (project list)
- `/project/:projectId` - Project page (canvas list)
- `/project/:projectId/canvas/:canvasId` - Canvas editor

**Migration:**

- Existing "main" room becomes "Untitled Canvas" in "My First Project"
- All users become owners of default project

### 5.3 PartyKit Room Strategy

**Current (MVP):**

- Single room: `"main"`
- All users join same room

**New (Multi-Canvas):**

- Per-canvas rooms: `canvas-${canvasId}`
- Users join room for specific canvas
- Presence is per-canvas (only see users in same canvas)

**Implications:**

- Must pass canvasId to PartyKit provider
- Room persistence via Durable Objects (already implemented)
- Each canvas has independent Yjs document

### 5.4 User Flows

#### Create New Project

1. User on home page clicks "New Project"
2. Modal prompts for project name
3. POST `/api/projects` with name
4. Redirect to `/project/:projectId` (empty canvas list)

#### Create New Canvas

1. User in project page clicks "New Canvas"
2. Modal prompts for canvas name (optional, default "Untitled")
3. POST `/api/projects/:projectId/canvases` with name
4. Backend creates canvas, generates canvasId
5. Redirect to `/project/:projectId/canvas/:canvasId`

#### Share Project

1. User in project page clicks "Share"
2. Modal shows: Add email input + role selector (editor/viewer)
3. POST `/api/projects/:projectId/permissions` with email + role
4. Backend creates permission record
5. (Optional) Send invitation email
6. Recipient can access project if logged in with that email

#### Navigate Between Canvases

1. User clicks breadcrumb "← Project Name"
2. Returns to `/project/:projectId` (canvas list)
3. User clicks different canvas thumbnail
4. Loads `/project/:projectId/canvas/:canvasId`
5. PartyKit disconnects from old room, connects to new room

### 5.5 Permissions & Access Control

**Role Capabilities:**

| Action         | Owner | Editor | Viewer |
| -------------- | ----- | ------ | ------ |
| View canvas    | ✅    | ✅     | ✅     |
| Edit shapes    | ✅    | ✅     | ❌     |
| Use AI         | ✅    | ✅     | ❌     |
| Upload images  | ✅    | ✅     | ❌     |
| Create canvas  | ✅    | ✅     | ❌     |
| Rename canvas  | ✅    | ✅     | ❌     |
| Delete canvas  | ✅    | ❌     | ❌     |
| Share project  | ✅    | ❌     | ❌     |
| Delete project | ✅    | ❌     | ❌     |

**Enforcement:**

- **Frontend:** Hide buttons/tools for disallowed actions
- **Backend:** Validate permissions on all API endpoints
- **PartyKit:** Check permissions before processing Yjs updates (viewers cannot modify)

**UI Indicators:**

- Show role badge in presence list ("👑 Owner", "✏️ Editor", "👁️ Viewer")
- Gray out tools if viewer role
- Tooltip: "You have view-only access" when hovering disabled tools

### 5.6 Home & Project Pages

#### Home Page (/)

- **Layout:** Grid of project cards (4 columns on desktop)
- **Card Content:**
  - Project name (editable on click)
  - Canvas count (e.g., "5 canvases")
  - Last updated (relative time, e.g., "2 hours ago")
  - Thumbnail (mosaic of canvas thumbnails, or first canvas)
- **Actions:**
  - Click card → Navigate to project page
  - "New Project" button (top right)
  - Search/filter (future)
- **Empty State:** "Create your first project" with illustration

#### Project Page (/project/:projectId)

- **Header:**
  - Breadcrumb: Home → Project Name (editable)
  - "Share" button
  - "Settings" dropdown (rename, delete)
- **Layout:** Grid of canvas cards (4 columns)
- **Card Content:**
  - Canvas name (editable on click)
  - Thumbnail (auto-generated screenshot)
  - Last updated
- **Actions:**
  - Click card → Navigate to canvas editor
  - "New Canvas" button (top right)
- **Empty State:** "Create your first canvas" with illustration

---

## 6. Performance Requirements

### 6.1 Rendering Performance

**Target:** 60 FPS (16.67ms per frame) under all conditions

**Test Scenarios:**

1. 500 rectangles on canvas, user panning/zooming
2. 100 shapes of mixed types, user creating new shapes
3. 50 text layers with various sizes, user editing
4. 20 images (1MB each), user dragging one
5. Real-time collaboration: 5 users editing simultaneously

**Optimizations:**

- Use Konva layer caching for static shapes
- Implement viewport culling (only render visible shapes) - Phase 4+
- Batch Yjs updates (don't trigger re-render for every keystroke)
- Debounce cursor position updates (50ms)
- Lazy-load images outside viewport

**Monitoring:**

- Chrome DevTools Performance tab (record during interactions)
- FPS counter overlay (development mode)

### 6.2 Synchronization Performance

**Targets:**

- Shape updates: <100ms end-to-end latency
- Cursor updates: <50ms end-to-end latency
- AI commands: <2s for simple, <5s for complex

**Test Scenarios:**

1. User A creates shape, User B sees it appear (measure latency)
2. User A drags shape, User B sees smooth movement (no jitter)
3. User A types in text field, User B sees characters appear in real-time
4. 10 users create shapes simultaneously, no conflicts or lost updates

**Architecture Benefits:**

- PartyKit edge deployment (low latency globally)
- Yjs CRDT (no server-side conflict resolution needed)
- Binary protocol (efficient over WebSocket)

### 6.3 Load Time Performance

**Targets:**

- Initial page load: <2 seconds (First Contentful Paint)
- Canvas with 100 shapes: <2 seconds to fully interactive
- Large canvas (500 shapes): <5 seconds, progressive rendering

**Optimizations:**

- Code splitting (load AI module only when command palette opened)
- Lazy load images
- Progressive shape rendering (render in batches of 50)
- Cache Yjs document in browser (faster reconnection)

### 6.4 Scalability

**Concurrent Users:**

- Target: 10+ users per canvas without degradation
- Test: 20 users in same canvas, all editing simultaneously

**Canvas Size:**

- Target: 1000+ shapes without FPS drop
- Limit: Consider pagination or virtual scrolling for 5000+ shapes

**PartyKit Limits:**

- Durable Objects: Unlimited storage (within CloudFlare limits)
- WebSocket connections: 10,000+ per Worker (CloudFlare limit)
- Room state size: No practical limit (Yjs compresses efficiently)

---

## 7. Success Criteria

### 7.1 Functional Requirements

**Must Have (All must pass):**

- ✅ All 7 shape types create, move, resize, rotate, delete
- ✅ Multi-select with group operations
- ✅ Layer management (z-index reordering)
- ✅ AI agent handles 6+ command categories reliably
- ✅ AI complex commands (form, navbar, card) work correctly
- ✅ Images upload (4MB), display, transform
- ✅ Multi-canvas navigation works
- ✅ Permissions (owner/editor/viewer) enforced
- ✅ Undo/redo works for all operations
- ✅ Keyboard shortcuts functional
- ✅ Export PNG and SVG works
- ✅ Styling controls (colors, gradients, shadows, opacity, blend modes)
- ✅ Real-time sync: 2+ users see changes <100ms

### 7.2 Performance Requirements

**Must Achieve:**

- ✅ 60 FPS with 500+ shapes (tested with Performance profiler)
- ✅ AI simple commands <2s, complex <5s
- ✅ Image upload completes <3s for 4MB file
- ✅ Sync latency <100ms for shapes, <50ms for cursors
- ✅ No lag with 5+ concurrent users
- ✅ Initial canvas load <2s

### 7.3 Quality Requirements

**Must Demonstrate:**

- ✅ No data loss during concurrent editing
- ✅ AI commands execute reliably (success rate >95%)
- ✅ Graceful error handling (network issues, invalid commands, upload failures)
- ✅ Intuitive UX (testers can use without instructions)
- ✅ Clear visual feedback for all actions
- ✅ Works on modern browsers (Chrome, Firefox, Safari, Edge - latest 2 versions)

### 7.4 Acceptance Testing

**Test Plan:**

1. **Shape Tools (30 minutes)**
   - Create all 7 shape types
   - Transform each (move, resize, rotate)
   - Multi-select, group operations
   - Layer reordering
   - Delete, duplicate
   - Verify sync across 2 users

2. **AI Agent (30 minutes)**
   - Test all command categories (creation, manipulation, layout, complex)
   - Test error handling (invalid commands)
   - Test rate limiting (trigger limit)
   - Verify results sync to all users

3. **Images (15 minutes)**
   - Upload 5 images (various sizes)
   - Transform images
   - Verify sync
   - Test upload errors (oversized file)

4. **UX Features (20 minutes)**
   - Undo/redo operations
   - Test all keyboard shortcuts
   - Use styling controls
   - Export PNG and SVG
   - Verify exports look correct

5. **Multi-Canvas (15 minutes)**
   - Create project, create 3 canvases
   - Navigate between canvases
   - Share project with viewer role
   - Verify permissions (viewer cannot edit)

6. **Performance (15 minutes)**
   - Load canvas with 500 shapes, pan/zoom, verify 60 FPS
   - Test with 5 users editing simultaneously
   - Measure AI command latency
   - Measure image upload time

**Total Testing Time:** ~2 hours

---

## 8. Non-Functional Requirements

### 8.1 Security

**Authentication:**

- Auth0 JWT verification on all API endpoints
- Session management (HTTP-only cookies)
- No sensitive data in localStorage

**Authorization:**

- Permission checks on all project/canvas operations
- Viewer role cannot modify Yjs document (enforced in PartyKit)

**Data Validation:**

- Sanitize all user inputs (text fields, AI commands)
- Validate file types and sizes before upload
- Rate limiting on AI and image uploads

**External Content:**

- Images stored in Cloudflare R2 (not user's browser)
- AI-generated image URLs validated (no arbitrary URLs)

### 8.2 Privacy

**User Data:**

- Only store email, user ID, display name (from Auth0)
- Canvas data is private to project collaborators
- No analytics without user consent (future)

**AI Prompts:**

- Log AI commands for debugging (user ID + timestamp)
- Do not share prompts with third parties (beyond OpenAI API)

### 8.3 Reliability

**Uptime:**

- Target: 99.9% uptime (Cloudflare Workers SLA)
- Graceful degradation: Canvas works without AI if OpenAI is down

**Data Durability:**

- PartyKit Durable Objects persist indefinitely
- R2 images have 99.999999999% durability (11 nines)

**Error Recovery:**

- Auto-reconnect WebSocket on disconnect
- Retry failed Yjs sync operations
- Show user-friendly error messages, never crash

### 8.4 Accessibility

**Keyboard Navigation:**

- All features accessible via keyboard
- Tab order follows visual layout
- Focus indicators visible

**Screen Readers:**

- ARIA labels on all interactive elements
- Semantic HTML (buttons, inputs, headings)
- Alt text on icons (where applicable)

**Color Contrast:**

- WCAG AA compliance (4.5:1 for text)
- Do not rely on color alone (use icons + text)

**Future:** High-contrast mode, font size adjustment

### 8.5 Browser Support

**Required:**

- Chrome 120+ (latest)
- Firefox 120+ (latest)
- Safari 17+ (latest)
- Edge 120+ (Chromium-based)

**Not Supported:**

- Internet Explorer (deprecated)
- Mobile browsers (future consideration)

**Progressive Enhancement:**

- Basic canvas works without JavaScript (static image)
- AI features degrade gracefully if API unavailable

---

## 9. Technical Debt & Future Enhancements

### 9.1 Known Limitations (v2.0)

**Deferred to Future:**

- Custom paths / freehand drawing (complex geometry)
- Image cropping and filters
- Advanced text formatting (line spacing, letter spacing)
- Collaborative text editing (operational transform for text)
- Version history / time travel
- Canvas templates
- Plugin system

**Technical Debt:**

- No viewport culling (performance optimization)
- No image compression before upload (R2 cost)
- No database backups (relying on Cloudflare durability)
- No monitoring/observability (no error tracking service)

### 9.2 Future Roadmap

**Phase 7 (Post-Launch):**

- Mobile app (React Native + same backend)
- Advanced AI: "Design a landing page" → multi-canvas layout
- Comments and annotations
- Design system / component library
- Public sharing (shareable links, embeds)

**Phase 8:**

- Real-time video chat (WebRTC)
- Advanced export (PDF, Figma import/export)
- Plugin API for third-party integrations

---

## 10. Appendix

### 10.1 Glossary

- **CRDT:** Conflict-free Replicated Data Type (Yjs)
- **PartyKit:** Edge-deployed WebSocket server platform
- **Durable Objects:** Cloudflare's stateful serverless primitive
- **R2:** Cloudflare's S3-compatible object storage
- **D1:** Cloudflare's SQLite database
- **Transformer:** Konva component for shape selection/resize handles
- **Yjs:** Real-time collaboration library (CRDT)

### 10.2 References

- [Yjs Documentation](https://docs.yjs.dev)
- [PartyKit Documentation](https://docs.partykit.io)
- [Konva.js Documentation](https://konvajs.org/docs/)
- [OpenAI Function Calling](https://platform.openai.com/docs/guides/function-calling)
- [Cloudflare R2 Documentation](https://developers.cloudflare.com/r2/)
- [Cloudflare D1 Documentation](https://developers.cloudflare.com/d1/)

---

**End of PRD v2.0**
