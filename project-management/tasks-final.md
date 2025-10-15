# CollabCanvas Final Product - Task List

**Approach:** Linear, chronological tasks. Each task = 1 commit minimum, atomic PR maximum.

---

## Phase 1: Core Design Tools Foundation (Days 1-3)

### Task 1.1: Add Circle Shape Support
**Goal:** Implement circle creation, manipulation, and sync
- [ ] Update Yjs schema to include `Circle` type
- [ ] Add circle data structure in types
- [ ] Create `Circle.svelte` component with Konva Circle
- [ ] Add circle creation mode to toolbar
- [ ] Implement circle click-to-create on canvas
- [ ] Add circle to transformer selection
- [ ] Test: Create circles, resize (radius), move, sync between users
- [ ] Commit: "feat: add circle shape support"

**Validates:** Second shape type working end-to-end

---

### Task 1.2: Add Ellipse Shape Support
**Goal:** Implement ellipse with independent X/Y radius
- [ ] Update Yjs schema for `Ellipse` type
- [ ] Add ellipse data structure with `radiusX`, `radiusY`
- [ ] Create `Ellipse.svelte` component
- [ ] Add ellipse mode to toolbar
- [ ] Implement ellipse creation (click-drag for size)
- [ ] Add ellipse to transformer with corner resize
- [ ] Test: Create, resize independently on X/Y, rotate, sync
- [ ] Commit: "feat: add ellipse shape support"

**Validates:** Non-uniform scaling works

---

### Task 1.3: Add Line/Polyline Shape Support
**Goal:** Implement line drawing with multiple points
- [ ] Update Yjs schema for `Line` type with points array
- [ ] Add line data structure: `points: number[]`, `stroke`, `dash`
- [ ] Create `Line.svelte` component with Konva Line
- [ ] Add line mode to toolbar
- [ ] Implement line creation: click-to-add-points, double-click to finish
- [ ] Add line to transformer (move only, no resize)
- [ ] Add line style controls: solid, dashed, dotted
- [ ] Test: Draw straight lines, polylines, sync
- [ ] Commit: "feat: add line and polyline support"

**Validates:** Point-based shapes and stroke styles

---

### Task 1.4: Add Text Layer Support
**Goal:** Implement text with inline editing
- [ ] Update Yjs schema for `Text` type
- [ ] Add text data structure: `text`, `fontSize`, `fontFamily`, `align`
- [ ] Create `Text.svelte` component with Konva Text
- [ ] Add text mode to toolbar
- [ ] Implement text creation: click to place, auto-focus edit mode
- [ ] Implement inline editing: double-click text to edit
- [ ] Add text to transformer (move, resize adjusts fontSize)
- [ ] Add basic formatting: bold, italic, underline toggles
- [ ] Test: Create text, edit content, format, sync
- [ ] Commit: "feat: add text layer support with inline editing"

**Validates:** Text rendering and editing

---

### Task 1.5: Add Polygon Shape Support
**Goal:** Implement regular polygons (3-12 sides)
- [ ] Update Yjs schema for `Polygon` type
- [ ] Add polygon data structure: `sides`, `radius`
- [ ] Create `Polygon.svelte` component with Konva RegularPolygon
- [ ] Add polygon mode to toolbar with side selector (3-12)
- [ ] Implement polygon creation: click to place
- [ ] Add polygon to transformer
- [ ] Test: Create triangles, pentagons, hexagons, octagons, sync
- [ ] Commit: "feat: add polygon shape support"

**Validates:** Parametric shapes

---

### Task 1.6: Add Star Shape Support
**Goal:** Implement star shapes (5-12 points)
- [ ] Update Yjs schema for `Star` type
- [ ] Add star data structure: `numPoints`, `innerRadius`, `outerRadius`
- [ ] Create `Star.svelte` component with Konva Star
- [ ] Add star mode to toolbar with point selector (5-12)
- [ ] Implement star creation: click to place
- [ ] Add star to transformer
- [ ] Test: Create 5-point, 6-point, 8-point stars, sync
- [ ] Commit: "feat: add star shape support"

**Validates:** All basic shape types complete

---

### Task 1.7: Implement Rotation for All Shapes
**Goal:** Add rotation handle to transformer
- [ ] Update transformer component to show rotation handle
- [ ] Add rotation logic to transformer dragmove
- [ ] Implement shift-key constraint (15° increments)
- [ ] Update all shape components to apply rotation
- [ ] Update Yjs sync to include rotation property
- [ ] Test: Rotate each shape type, sync rotation
- [ ] Commit: "feat: add rotation transformation for all shapes"

**Validates:** Rotation works universally

---

### Task 1.8: Implement Multi-Select
**Goal:** Select multiple shapes simultaneously
- [ ] Implement shift+click to toggle selection
- [ ] Maintain `selectedShapeIds: Set<string>` state
- [ ] Update transformer to show group bounding box
- [ ] Implement drag-to-select (rectangle selection box)
- [ ] Update move/delete/duplicate to work on multi-select
- [ ] Add visual indicators (count badge)
- [ ] Test: Multi-select, move group, delete group, sync
- [ ] Commit: "feat: implement multi-select with group operations"

**Validates:** Group selection and operations

---

### Task 1.9: Implement Layer Management (Z-Index)
**Goal:** Control shape stacking order
- [ ] Add z-index controls to context menu: front, forward, backward, back
- [ ] Implement keyboard shortcuts (Cmd+], Cmd+[, Cmd+Shift+], Cmd+Shift+[)
- [ ] Add z-index badge on selected shapes
- [ ] Update Yjs to sync z-index changes
- [ ] Ensure shapes render in z-index order (sort in render loop)
- [ ] Test: Change layer order, verify visual stacking, sync
- [ ] Commit: "feat: add layer management with z-index controls"

**Validates:** Z-index ordering

---

### Task 1.10: Implement Delete Operation
**Goal:** Delete shapes with keyboard and context menu
- [ ] Add Delete/Backspace keyboard handler
- [ ] Add "Delete" to right-click context menu
- [ ] Implement multi-delete (works with multi-select)
- [ ] Update Yjs to remove shapes from document
- [ ] Test: Delete single shape, delete multiple, sync
- [ ] Commit: "feat: implement delete operation"

**Validates:** Destructive operations sync

---

### Task 1.11: Implement Duplicate Operation
**Goal:** Duplicate shapes with offset
- [ ] Add Cmd/Ctrl+D keyboard handler
- [ ] Add "Duplicate" to right-click context menu
- [ ] Implement duplication logic: copy all properties, new ID, offset 20px
- [ ] Implement multi-duplicate (works with multi-select)
- [ ] Update Yjs to add duplicated shapes
- [ ] Test: Duplicate single, duplicate multiple, sync
- [ ] Commit: "feat: implement duplicate operation"

**Validates:** Creation from existing shapes

---

## Phase 2: AI Canvas Agent (Days 4-6)

### Task 2.1: OpenAI Integration Setup
**Goal:** Configure OpenAI API in PartyKit backend
- [ ] Install `openai@^4.0.0` in PartyKit server
- [ ] Add `OPENAI_API_KEY` to Cloudflare Workers secrets
- [ ] Create `ai-service.ts` with OpenAI client initialization
- [ ] Create health check endpoint: `/api/ai/health`
- [ ] Test: Verify API key works, can call OpenAI
- [ ] Commit: "feat: setup OpenAI integration in PartyKit"

**Validates:** AI service connectivity

---

### Task 2.2: Define AI Tool Schema
**Goal:** Create function definitions for GPT-4
- [ ] Create `ai-tools.ts` with tool schema definitions
- [ ] Implement creation tools: `createRectangle`, `createCircle`, `createEllipse`, `createLine`, `createText`, `createPolygon`, `createStar`
- [ ] Implement manipulation tools: `moveShape`, `resizeShape`, `rotateShape`, `updateShapeColor`, `deleteShape`, `duplicateShape`
- [ ] Implement layout tools: `arrangeHorizontal`, `arrangeVertical`, `arrangeGrid`, `distributeEvenly`, `alignShapes`
- [ ] Implement query tools: `getCanvasState`, `findShapesByType`, `findShapesByColor`, `getViewportBounds`
- [ ] Add TypeScript types for all tool parameters
- [ ] Test: Schema validates with OpenAI function calling format
- [ ] Commit: "feat: define AI tool schema for canvas manipulation"

**Validates:** Tool definitions complete

---

### Task 2.3: Implement Tool Executors
**Goal:** Execute tool functions that modify Yjs document
- [ ] Create `ai-executors.ts` with executor functions
- [ ] Implement each creation executor (adds shapes to Yjs)
- [ ] Implement each manipulation executor (modifies shapes in Yjs)
- [ ] Implement each layout executor (calculates positions, updates Yjs)
- [ ] Implement each query executor (reads Yjs, returns data)
- [ ] Add parameter validation and error handling
- [ ] Test: Call each executor directly, verify Yjs updates
- [ ] Commit: "feat: implement AI tool executors"

**Validates:** Tools can modify canvas

---

### Task 2.4: Create AI Command Handler
**Goal:** Process natural language commands
- [ ] Create `/api/ai/command` endpoint in PartyKit
- [ ] Implement command handler: receives user input, calls GPT-4
- [ ] Pass tool schema to GPT-4 function calling
- [ ] Parse GPT-4 response (function calls)
- [ ] Execute tools sequentially
- [ ] Return execution results to client
- [ ] Add error handling for ambiguous commands
- [ ] Test: Send commands via API, verify tool execution
- [ ] Commit: "feat: create AI command processing pipeline"

**Validates:** End-to-end AI flow (backend)

---

### Task 2.5: Build Command Palette UI
**Goal:** Create keyboard-activated AI interface
- [ ] Create `CommandPalette.svelte` component
- [ ] Implement modal overlay with backdrop
- [ ] Add input field with auto-focus
- [ ] Add keyboard handler: Cmd/Ctrl+K to open
- [ ] Add Escape to close
- [ ] Add loading indicator during AI processing
- [ ] Style: Centered, modern, accessible
- [ ] Test: Open/close palette, submit command
- [ ] Commit: "feat: build AI command palette UI"

**Validates:** AI interaction surface

---

### Task 2.6: Connect Command Palette to AI Backend
**Goal:** Send commands from UI to backend
- [ ] Implement fetch to `/api/ai/command` in CommandPalette
- [ ] Show loading state during request
- [ ] Handle success: close palette, show success toast
- [ ] Handle errors: show error message, keep palette open
- [ ] Add timeout (10s)
- [ ] Add command history (last 5 commands, up/down arrows)
- [ ] Test: Submit commands, verify shapes appear on canvas
- [ ] Commit: "feat: connect command palette to AI backend"

**Validates:** AI commands work end-to-end

---

### Task 2.7: Implement Context-Aware Commands
**Goal:** AI uses current canvas state for decisions
- [ ] Update command handler to call `getCanvasState()` before GPT-4
- [ ] Pass canvas state in system prompt
- [ ] Update prompt to reference viewport for "center" commands
- [ ] Test: "Create a circle in the center", "Move the red rectangle left"
- [ ] Commit: "feat: add canvas context to AI commands"

**Validates:** AI understands canvas state

---

### Task 2.8: Test AI Command Types
**Goal:** Validate all 6+ command categories work
- [ ] Test creation commands: circle, text, star, etc.
- [ ] Test manipulation commands: move, resize, rotate, color
- [ ] Test layout commands: horizontal, vertical, grid, align
- [ ] Test complex commands: login form, nav bar, card layout
- [ ] Document test results in PRD
- [ ] Fix any failing command types
- [ ] Commit: "test: validate all AI command categories"

**Validates:** AI meets acceptance criteria

---

### Task 2.9: Implement AI Rate Limiting
**Goal:** Prevent abuse and manage costs
- [ ] Add rate limiter in PartyKit: 10 commands/minute per user
- [ ] Store rate limit state in Durable Object
- [ ] Return 429 error when limit exceeded
- [ ] Show user-friendly error in command palette
- [ ] Add cooldown indicator
- [ ] Test: Trigger rate limit, verify error handling
- [ ] Commit: "feat: add rate limiting for AI commands"

**Validates:** Cost control

---

### Task 2.10: Add AI Command Logging
**Goal:** Debug and monitor AI usage
- [ ] Log all commands to console with user ID, timestamp
- [ ] Log tool executions with parameters
- [ ] Log errors with stack traces
- [ ] Add optional analytics (count commands by type)
- [ ] Test: View logs in PartyKit dashboard
- [ ] Commit: "feat: add logging for AI commands"

**Validates:** Observability

---

## Phase 3: Image Support (Days 7-8)

### Task 3.1: Setup Cloudflare R2 Bucket
**Goal:** Configure image storage
- [ ] Create R2 bucket: `collabcanvas-images`
- [ ] Configure public read access
- [ ] Add bucket credentials to Cloudflare Workers secrets
- [ ] Create `/api/images/upload` endpoint for presigned URLs
- [ ] Test: Generate presigned URL, upload test image
- [ ] Commit: "feat: setup Cloudflare R2 for image storage"

**Validates:** Storage infrastructure

---

### Task 3.2: Implement Image Upload Flow
**Goal:** Users can upload images to canvas
- [ ] Create `ImageUpload.svelte` component (button + drag-drop)
- [ ] Add file validation: max 4MB, formats PNG/JPG/GIF/WebP
- [ ] Implement upload: request presigned URL → upload to R2
- [ ] Store R2 URL in Yjs as new shape type `Image`
- [ ] Show progress indicator during upload
- [ ] Test: Upload image, verify appears on canvas, sync
- [ ] Commit: "feat: implement image upload to R2"

**Validates:** Image upload end-to-end

---

### Task 3.3: Add Image Shape Rendering
**Goal:** Display images on canvas
- [ ] Update Yjs schema for `Image` type
- [ ] Create `ImageShape.svelte` component with Konva Image
- [ ] Load image from URL asynchronously
- [ ] Show placeholder while loading
- [ ] Add image to transformer (move, resize with aspect ratio)
- [ ] Test: Upload image, move, resize, rotate, sync
- [ ] Commit: "feat: add image shape rendering with Konva"

**Validates:** Image display and manipulation

---

### Task 3.4: Add Image to AI Tool Schema
**Goal:** AI can create image placeholders
- [ ] Add `createImage` tool to schema
- [ ] Implement executor: adds Image shape with URL
- [ ] Update prompt to suggest placeholder URLs (e.g., unsplash)
- [ ] Test: "Add an image at 100, 100", "Create a 300x200 image placeholder"
- [ ] Commit: "feat: enable AI to create image shapes"

**Validates:** AI + images integration

---

### Task 3.5: Implement Image Opacity Control
**Goal:** Adjust image transparency
- [ ] Add opacity slider to properties panel (when image selected)
- [ ] Update Image shape component to apply opacity
- [ ] Sync opacity via Yjs
- [ ] Test: Change image opacity, sync
- [ ] Commit: "feat: add opacity control for images"

**Validates:** Image styling

---

## Phase 4: Enhanced UX (Days 9-11)

### Task 4.1: Implement Undo/Redo with Yjs
**Goal:** Support undo/redo for all operations
- [ ] Import Yjs UndoManager: `import { UndoManager } from 'yjs'`
- [ ] Initialize UndoManager for shapes map
- [ ] Add Cmd/Ctrl+Z for undo
- [ ] Add Cmd/Ctrl+Shift+Z for redo
- [ ] Add undo/redo buttons to toolbar (with disabled state)
- [ ] Test: Create shape, undo, redo, verify stack works
- [ ] Commit: "feat: implement undo/redo with Yjs UndoManager"

**Validates:** History management

---

### Task 4.2: Implement Comprehensive Keyboard Shortcuts
**Goal:** Add all keyboard shortcuts from PRD
- [ ] Create `useKeyboardShortcuts.ts` composable
- [ ] Implement shape tool shortcuts: R, C, T, L, V
- [ ] Implement layer shortcuts: Cmd+], Cmd+[, etc.
- [ ] Implement selection shortcuts: Cmd+A, Escape
- [ ] Implement operation shortcuts: already done (Delete, Duplicate)
- [ ] Add shortcut hints to toolbar tooltips
- [ ] Test: All shortcuts work as expected
- [ ] Commit: "feat: add comprehensive keyboard shortcuts"

**Validates:** Keyboard efficiency

---

### Task 4.3: Build Color Picker with Gradients
**Goal:** Advanced color selection
- [ ] Create `ColorPicker.svelte` component
- [ ] Add solid color picker (hex, RGB, HSL inputs)
- [ ] Add gradient picker (linear, radial)
- [ ] Add preset palette (Material Design colors)
- [ ] Add recent colors (last 10)
- [ ] Integrate with properties panel
- [ ] Test: Pick colors, apply to shapes, sync
- [ ] Commit: "feat: build color picker with gradient support"

**Validates:** Color controls

---

### Task 4.4: Add Stroke Controls
**Goal:** Customize borders
- [ ] Create `StrokeControls.svelte` component
- [ ] Add width slider (0-20px)
- [ ] Add style selector: solid, dashed, dotted
- [ ] Add custom dash pattern input
- [ ] Integrate with properties panel
- [ ] Test: Apply strokes to shapes, sync
- [ ] Commit: "feat: add stroke customization controls"

**Validates:** Stroke styling

---

### Task 4.5: Add Shadow Controls
**Goal:** Add drop shadows to shapes
- [ ] Create `ShadowControls.svelte` component
- [ ] Add enable/disable toggle
- [ ] Add color, blur, offsetX, offsetY controls
- [ ] Add presets: subtle, medium, heavy
- [ ] Update shape components to apply shadow
- [ ] Sync shadow properties via Yjs
- [ ] Test: Add shadows, change parameters, sync
- [ ] Commit: "feat: add shadow controls for shapes"

**Validates:** Advanced styling

---

### Task 4.6: Add Opacity & Blend Modes
**Goal:** Layer transparency and compositing
- [ ] Add opacity slider to properties panel (0-100%)
- [ ] Add blend mode selector: normal, multiply, screen, overlay, darken, lighten
- [ ] Implement keyboard shortcuts (1-9 for 10%-90%)
- [ ] Update shape components to apply opacity and blend mode
- [ ] Sync via Yjs
- [ ] Test: Change opacity, blend modes, sync
- [ ] Commit: "feat: add opacity and blend mode controls"

**Validates:** Compositing options

---

### Task 4.7: Implement PNG Export
**Goal:** Export canvas to PNG
- [ ] Create `ExportDialog.svelte` component
- [ ] Add resolution selector: 1x, 2x, 4x
- [ ] Add background toggle: transparent or white
- [ ] Add selection toggle: full canvas or selected objects
- [ ] Use Konva `toDataURL()` to generate PNG
- [ ] Trigger browser download
- [ ] Test: Export canvas at different resolutions
- [ ] Commit: "feat: implement PNG export"

**Validates:** Raster export

---

### Task 4.8: Implement SVG Export
**Goal:** Export canvas to SVG
- [ ] Use Konva `toSVG()` or custom SVG generator
- [ ] Preserve vector quality for all shapes
- [ ] Embed fonts or convert text to paths
- [ ] Group elements by z-index
- [ ] Trigger browser download
- [ ] Test: Export canvas, open in Illustrator/Inkscape
- [ ] Commit: "feat: implement SVG export"

**Validates:** Vector export

---

### Task 4.9: Add Properties Panel
**Goal:** Centralize shape editing controls
- [ ] Create `PropertiesPanel.svelte` component (right sidebar)
- [ ] Show when shape selected
- [ ] Display controls for: color, stroke, shadow, opacity, blend mode
- [ ] Show shape-specific properties (e.g., text content, font size)
- [ ] Auto-update when selection changes
- [ ] Test: Select shapes, edit in panel, sync
- [ ] Commit: "feat: add properties panel for shape editing"

**Validates:** Consolidated editing UI

---

### Task 4.10: Improve Toolbar UX
**Goal:** Better visual feedback for tools
- [ ] Add active state indicators for selected tool
- [ ] Group related tools (shapes, text, AI)
- [ ] Add tooltips with keyboard shortcuts
- [ ] Add visual dividers between groups
- [ ] Make toolbar sticky (always visible)
- [ ] Test: Switch tools, verify visual feedback
- [ ] Commit: "feat: improve toolbar UX with active states"

**Validates:** Tool discoverability

---

## Phase 5: Multi-Canvas & Project Management (Days 12-14)

### Task 5.1: Design Database Schema for Projects
**Goal:** Plan data model for multi-canvas
- [ ] Create schema in project docs: Projects, Canvases, Permissions
- [ ] Decide on storage: Cloudflare D1 (SQLite) or KV for metadata
- [ ] Design PartyKit room strategy: `canvas-${canvasId}`
- [ ] Plan migration for existing "main" room → default project
- [ ] Document schema in PRD
- [ ] Commit: "docs: design multi-canvas database schema"

**Validates:** Architecture plan

---

### Task 5.2: Setup Database (Cloudflare D1)
**Goal:** Initialize SQL database for metadata
- [ ] Create D1 database in Cloudflare dashboard
- [ ] Create tables: `projects`, `canvases`, `permissions`
- [ ] Add database binding to PartyKit Worker
- [ ] Create migration scripts
- [ ] Test: Query database from Worker
- [ ] Commit: "feat: setup Cloudflare D1 for project metadata"

**Validates:** Database infrastructure

---

### Task 5.3: Create Project Management API
**Goal:** CRUD endpoints for projects
- [ ] Create `/api/projects` endpoint
- [ ] Implement: GET (list), POST (create), PATCH (update), DELETE (delete)
- [ ] Add auth checks (owner only for delete/update)
- [ ] Return project with canvas count
- [ ] Test: Create project, list projects, delete project
- [ ] Commit: "feat: implement project management API"

**Validates:** Project CRUD

---

### Task 5.4: Create Canvas Management API
**Goal:** CRUD endpoints for canvases
- [ ] Create `/api/projects/:projectId/canvases` endpoint
- [ ] Implement: GET (list), POST (create), PATCH (update), DELETE (delete)
- [ ] Generate thumbnail on canvas save (Konva screenshot)
- [ ] Upload thumbnail to R2
- [ ] Test: Create canvas, list canvases, delete canvas
- [ ] Commit: "feat: implement canvas management API"

**Validates:** Canvas CRUD

---

### Task 5.5: Build Home Page
**Goal:** Project list view
- [ ] Create `/routes/+page.svelte` (new home page)
- [ ] Fetch projects from API
- [ ] Display as grid with cards (name, canvas count, updated date)
- [ ] Add "Create Project" button
- [ ] Add search/filter
- [ ] Link to project page on click
- [ ] Test: View projects, create new, navigate
- [ ] Commit: "feat: build home page with project list"

**Validates:** Project navigation

---

### Task 5.6: Build Project Page
**Goal:** Canvas list within project
- [ ] Create `/routes/project/[projectId]/+page.svelte`
- [ ] Fetch canvases from API
- [ ] Display as grid with thumbnails
- [ ] Add "Create Canvas" button
- [ ] Add breadcrumb: Home → Project
- [ ] Add project settings button (rename, delete)
- [ ] Link to canvas page on click
- [ ] Test: View canvases, create new, navigate
- [ ] Commit: "feat: build project page with canvas list"

**Validates:** Canvas navigation

---

### Task 5.7: Update Canvas Page Routing
**Goal:** Support per-canvas rooms
- [ ] Rename route: `/canvas` → `/project/[projectId]/canvas/[canvasId]`
- [ ] Update PartyKit connection to use `canvas-${canvasId}` room
- [ ] Load canvas metadata from API
- [ ] Add breadcrumb: Home → Project → Canvas
- [ ] Test: Navigate to canvas, verify correct room connection
- [ ] Commit: "feat: update canvas routing for multi-canvas support"

**Validates:** Per-canvas isolation

---

### Task 5.8: Migrate Existing Data
**Goal:** Move "main" room to default project
- [ ] Create migration script
- [ ] Create default project: "My First Project"
- [ ] Create default canvas: "Untitled Canvas"
- [ ] Copy data from "main" room to `canvas-${defaultCanvasId}` room
- [ ] Run migration on production PartyKit
- [ ] Test: Verify existing data appears in new structure
- [ ] Commit: "feat: migrate existing canvas data to multi-canvas structure"

**Validates:** Backward compatibility

---

### Task 5.9: Implement Sharing & Permissions
**Goal:** Invite collaborators to projects
- [ ] Create `PermissionsManager.svelte` component
- [ ] Add "Share" button in project page
- [ ] Implement invite flow: add email, select role (editor/viewer)
- [ ] Send invitation email (optional: use email service or skip for MVP)
- [ ] Add permissions check to canvas page (prevent edits if viewer)
- [ ] Test: Share project, login as invited user, verify permissions
- [ ] Commit: "feat: implement project sharing and permissions"

**Validates:** Collaboration permissions

---

### Task 5.10: Update Presence for Multi-Canvas
**Goal:** Show who's in which canvas
- [ ] Update presence to include `canvasId`
- [ ] Show collaborators only in current canvas
- [ ] Add global presence view (all users across project)
- [ ] Add "Go to their canvas" button
- [ ] Test: Multiple users in different canvases
- [ ] Commit: "feat: update presence for multi-canvas awareness"

**Validates:** Cross-canvas presence

---

## Phase 6: Polish & Testing (Days 15-16)

### Task 6.1: Comprehensive Integration Testing
**Goal:** Test all features together
- [ ] Test AI commands with all shape types
- [ ] Test multi-user collaboration with 5+ users
- [ ] Test image uploads during active collaboration
- [ ] Test undo/redo with AI commands
- [ ] Test multi-canvas navigation and presence
- [ ] Test permissions (editor vs viewer)
- [ ] Document any bugs found
- [ ] Commit: "test: comprehensive integration testing"

**Validates:** System stability

---

### Task 6.2: Performance Testing
**Goal:** Validate performance requirements
- [ ] Load canvas with 500+ shapes, measure FPS
- [ ] Test AI command response times (simple & complex)
- [ ] Test image upload speed (4MB files)
- [ ] Test sync latency with network throttling
- [ ] Test 10+ concurrent users
- [ ] Optimize any bottlenecks found
- [ ] Commit: "perf: optimize canvas rendering and sync"

**Validates:** Performance targets met

---

### Task 6.3: Error Handling & Edge Cases
**Goal:** Graceful failure modes
- [ ] Test network disconnection/reconnection
- [ ] Test invalid AI commands
- [ ] Test image upload failures
- [ ] Test concurrent edits on same shape
- [ ] Add user-friendly error messages everywhere
- [ ] Test rate limit errors
- [ ] Commit: "fix: improve error handling for edge cases"

**Validates:** Robustness

---

### Task 6.4: Accessibility Audit
**Goal:** Ensure keyboard and screen reader support
- [ ] Test all keyboard shortcuts
- [ ] Add ARIA labels to all interactive elements
- [ ] Test with screen reader (VoiceOver/NVDA)
- [ ] Ensure color contrast meets WCAG AA
- [ ] Test keyboard-only navigation
- [ ] Fix any accessibility issues
- [ ] Commit: "a11y: improve accessibility for keyboard and screen readers"

**Validates:** Inclusive design

---

### Task 6.5: Mobile Responsiveness (Basic)
**Goal:** Canvas works on tablets (not primary focus)
- [ ] Test on iPad/tablet devices
- [ ] Adjust toolbar for smaller screens
- [ ] Ensure touch gestures work (pan, zoom)
- [ ] Disable features not suitable for mobile
- [ ] Add viewport meta tag
- [ ] Commit: "feat: add basic mobile/tablet support"

**Validates:** Device compatibility

---

### Task 6.6: Documentation Updates
**Goal:** Update all project documentation
- [ ] Update README with final feature list
- [ ] Update PRD with any changes during implementation
- [ ] Create user guide (markdown in docs/)
- [ ] Document AI command examples
- [ ] Update architecture diagram for multi-canvas
- [ ] Create deployment guide updates
- [ ] Commit: "docs: update documentation for final product"

**Validates:** Documentation complete

---

### Task 6.7: Final Bug Fixes
**Goal:** Address any remaining issues
- [ ] Review all GitHub issues
- [ ] Fix critical bugs
- [ ] Triage low-priority bugs (defer or fix)
- [ ] Perform final QA pass
- [ ] Test deployment on Railway + Cloudflare
- [ ] Commit: "fix: final bug fixes and QA"

**Validates:** Production readiness

---

### Task 6.8: Demo Video & Submission Prep
**Goal:** Prepare for submission
- [ ] Record 3-5 minute demo video
- [ ] Show real-time collaboration (2+ users)
- [ ] Demonstrate AI commands (simple & complex)
- [ ] Explain architecture (brief)
- [ ] Update AI Development Log (mylog.md)
- [ ] Create submission checklist
- [ ] Final deployment to production
- [ ] Commit: "docs: add demo video and submission materials"

**Validates:** Submission requirements met