---

## MVP Acceptance Criteria

### Functional Requirements
- [ ] Users can authenticate with Email/Password or Magic Link
- [ ] Users can create rectangles on canvas
- [ ] Users can drag rectangles to move them
- [ ] Users can pan and zoom canvas
- [ ] 2+ users see real-time updates (<100ms latency)
- [ ] Users see collaborators' cursors (<50ms latency)
- [ ] Users see who's online (presence list)
- [ ] Canvas state persists (survives server restarts)
- [ ] Application is publicly accessible

### Performance Requirements
- [ ] 60 FPS rendering
- [ ] <100ms object synchronization latency
- [ ] <50ms cursor synchronization latency
- [ ] <2 second initial canvas load time
- [ ] 5+ concurrent users without degradation

### Quality Requirements
- [ ] No data loss on disconnect/reconnect
- [ ] Conflict-free concurrent editing (CRDT)
- [ ] Secure authentication (OAuth + session management)
- [ ] Clear connection status indicators# CollabCanvas MVP - Product Requirements Document

**Version:** 1.0  
**Stack:** Svelte + Bun + Yjs + PartyKit + Supabase

## Key Decisions
- **Single global room:** All users collaborate in one shared canvas (room ID: "main")
- **No document management:** No multiple canvases, no CRUD operations
- **Shape types:** Rectangle only (no circles, text, or other shapes)
- **No selection/manipulation:** Create and move only (no resize, rotate, delete UI)
- **No viewport culling:** Simple rendering (optimization if needed later)
- **Authentication:** Email Authentication (Password + Magic Link) via Supabase
- **Persistence:** 60-second snapshot interval to Supabase Storage
- **Deployment:** Railway + PartyKit on Cloudflare

---

## Executive Summary

This PRD defines requirements for a collaborative canvas application MVP that enables real-time multi-user design collaboration in a single global room. The system supports rectangle creation and manipulation with sub-100ms synchronization, multiplayer cursor tracking, and persistent state storage.

**Core capabilities:** Users authenticate via email (password or magic link), join a shared global canvas, create/move rectangles, see collaborators' cursors in real-time, and return to find their work preserved. The architecture uses Yjs CRDTs for conflict-free synchronization, PartyKit for edge-deployed WebSocket infrastructure, Konva.js for 60 FPS canvas rendering, and Supabase for authentication and persistence.

**Success criteria:** 2+ concurrent users editing simultaneously with <100ms object sync latency, <50ms cursor latency, 60 FPS rendering, and full state persistence surviving server restarts.

---

## Technology Stack

### Frontend & Runtime
- **Framework:** SvelteKit 2.0+ with Svelte 5
- **Runtime:** Bun 1.1+ (package manager and build tool)
- **Canvas Rendering:** Konva.js 10.0+ with svelte-konva wrapper
- **State Management:** Svelte stores + Yjs reactive bindings

### Real-Time Collaboration
- **CRDT Engine:** Yjs (conflict-free replicated data types)
- **Transport Layer:** PartyKit with Y-PartyKit Provider
- **WebSocket Infrastructure:** PartyKit Durable Objects on Cloudflare Workers
- **Cursor Broadcasting:** PartyKit Awareness API (separate from document sync)

### Backend Services
- **Authentication:** Supabase Auth (Email providers: Password + Magic Link)
- **Database:** Supabase PostgreSQL with Row-Level Security
- **Persistence:** Supabase Storage for Yjs state snapshots
- **Deployment:** Railway (native Bun support, WebSocket-friendly)

### Key Dependencies
```json
{
  "svelte-konva": "^1.0.0",
  "konva": "^10.0.0",
  "yjs": "^13.6.0",
  "y-partykit": "^0.0.20",
  "@supabase/supabase-js": "^2.39.0",
  "@supabase/ssr": "^0.0.10"
}
```

---

## System Architecture

### High-Level Data Flow

```
┌─────────────────────────────────────────────────────────┐
│  Client Layer (Browser)                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Svelte UI  │  │ Konva Canvas │  │   Yjs Doc    │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  │
│         │                  │                  │          │
│         └──────────────────┴──────────────────┘          │
└─────────────────────────────┬───────────────────────────┘
                              │ WebSocket (40-50ms RTT)
                              ↓
┌─────────────────────────────────────────────────────────┐
│  PartyKit Layer (Cloudflare Edge)                       │
│  ┌─────────────────────────────────────────────────┐    │
│  │  Room Coordinator (Durable Object)              │    │
│  │  - Y-PartyKit Provider                          │    │
│  │  - CRDT state synchronization                   │    │
│  │  - Awareness (cursor) broadcasting              │    │
│  └─────────────────┬───────────────────────────────┘    │
└────────────────────┼────────────────────────────────────┘
                     │ Periodic snapshots (60s interval)
                     ↓
┌─────────────────────────────────────────────────────────┐
│  Persistence Layer (Supabase)                           │
│  ┌──────────────────┐      ┌──────────────────┐        │
│  │   PostgreSQL     │      │   Storage API    │        │
│  │   (metadata)     │      │   (snapshots)    │        │
│  └──────────────────┘      └──────────────────┘        │
└─────────────────────────────────────────────────────────┘
```

### Component Responsibilities

**Client (SvelteKit + Konva + Yjs):**
- Render canvas objects at 60 FPS with viewport culling
- Handle user input (mouse/keyboard) and update local Yjs document
- Listen to Yjs changes and update Konva layer reactively
- Broadcast cursor position via PartyKit Awareness (50ms throttle)
- Manage authentication state and session tokens

**PartyKit Room (Cloudflare Worker):**
- Maintain canonical CRDT state in Durable Object storage for single global room ("main")
- Broadcast Yjs updates to all connected clients (sub-50ms)
- Handle client connections, disconnections, and reconnections
- Validate authentication tokens on WebSocket upgrade
- Trigger periodic snapshots to Supabase every 60 seconds

**Supabase (Auth + Storage):**
- Authenticate users via OAuth and maintain sessions
- Store Yjs state snapshots in Storage bucket (main/latest.yjs)
- Provide snapshot on cold-start (load from latest snapshot)

### State Management Strategy

**Local State (Svelte Stores):**
- Viewport position, zoom level
- Selected object IDs
- Tool selection (create, move, select)
- UI panel visibility

**Shared State (Yjs Document):**
- `objects` Y.Map: `{ [rectId]: { x, y, width, height, fill, ... } }`
- `cursors` Y.Map: `{ [userId]: { x, y, name, color } }` (ephemeral)
- `metadata` Y.Map: `{ documentName, createdBy, createdAt }`

**Persisted State (Supabase):**
- User accounts and sessions (Auth tables)
- Yjs state snapshots (Storage: main/latest.yjs)

---

## Technical Specifications

### Canvas Object Model

**Rectangle Schema:**
```typescript
interface Rectangle {
  id: string;                 // UUID v4
  type: 'rectangle';
  x: number;                  // Position in canvas coordinates
  y: number;
  width: number;
  height: number;
  fill: string;               // Hex color (e.g., '#3b82f6')
  stroke: string;             // Border color
  strokeWidth: number;        // Border width in pixels
  rotation: number;           // Degrees (0-360)
  opacity: number;            // 0-1
  draggable: boolean;         // Can be moved by users
  version: number;            // Monotonically increasing
  versionNonce: number;       // Random 0-1 for tie-breaking
  isDeleted: boolean;         // Tombstone for CRDT deletion
  createdBy: string;          // User ID
  createdAt: number;          // Unix timestamp (ms)
  modifiedAt: number;         // Unix timestamp (ms)
}
```

**Default Values:**
```typescript
const DEFAULT_RECTANGLE: Partial<Rectangle> = {
  width: 100,
  height: 100,
  fill: '#3b82f6',
  stroke: '#1e40af',
  strokeWidth: 2,
  rotation: 0,
  opacity: 1,
  draggable: true,
  version: 0,
  versionNonce: Math.random(),
  isDeleted: false
};
```

### Performance Requirements

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| **Frame Rate** | 60 FPS sustained | Chrome DevTools Performance profiler |
| **Object Sync Latency** | <100ms | Timestamp diff between local update and remote render |
| **Cursor Sync Latency** | <50ms | Timestamp diff between mousemove and remote cursor update |
| **Concurrent Users** | 5+ simultaneous | Test with 5 browser windows, verify no degradation |
| **Initial Load Time** | <2 seconds | Time to first canvas render |
| **Reconnection Recovery** | <3 seconds | Time from disconnect to full state sync |

### Real-Time Synchronization Requirements

**Yjs Document Structure:**
```typescript
// Initialize shared document
const ydoc = new Y.Doc();
const objectsMap = ydoc.getMap('objects');
const cursorsMap = ydoc.getMap('cursors');
const metadataMap = ydoc.getMap('metadata');

// Connect to PartyKit (single global room)
const provider = new YPartyKitProvider(
  'canvas.username.partykit.dev',
  'main',  // Hardcoded global room ID
  ydoc,
  { connect: true, awareness: true }
);
```

**Update Flow:**
1. User drags rectangle → Konva fires `dragend` event
2. Update local Yjs map: `objectsMap.set(rectId, updatedRect)`
3. Yjs generates binary update (typically 20-50 bytes)
4. Y-PartyKit Provider sends update to PartyKit room
5. PartyKit broadcasts to all connected clients (~40ms network latency)
6. Remote clients receive update, Yjs merges automatically
7. Svelte reactivity triggers Konva layer re-render

**Conflict Resolution:**
- Automatic via Yjs CRDT (Last Write Wins for scalar values)
- Version + versionNonce for application-level conflict detection
- Tombstones (isDeleted flag) for deletion consistency

**Cursor Broadcasting:**
- Separate from document sync (uses PartyKit Awareness API)
- Throttled to 50ms intervals (20 updates/second max)
- Ephemeral (not persisted, cleared on disconnect)

### Persistence Requirements

**Snapshot Strategy:**
- **Trigger:** Every 60 seconds, serialize Yjs document to binary
- **Storage:** Save to Supabase Storage bucket `document-snapshots`
- **Filename:** `{documentId}/{timestamp}.yjs`
- **Retention:** Keep last 10 snapshots, delete older
- **Load Strategy:** On room cold-start, load latest snapshot then apply incremental updates

**Database Storage:**
```sql
-- Document metadata (PostgreSQL)
CREATE TABLE documents (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  modified_at TIMESTAMPTZ DEFAULT NOW(),
  latest_snapshot_url TEXT -- Storage bucket URL
);

-- No object-level storage (objects live in Yjs snapshots)
```

**Recovery Scenarios:**
- **All users disconnect:** State persists in PartyKit Durable Object (24-48 hours)
- **Server restart:** Load from latest Supabase snapshot
- **User refresh:** Fetch full Yjs state from active PartyKit room

---

## API Design

### Canvas API (Client-Side)

```typescript
interface CanvasAPI {
  // Object operations
  createRectangle(props: Partial<Rectangle>): string; // Returns ID
  updateRectangle(id: string, changes: Partial<Rectangle>): void;
  deleteRectangle(id: string): void;
  
  // Viewport
  setViewport(x: number, y: number, zoom: number): void;
  panBy(dx: number, dy: number): void;
  zoomTo(zoom: number, centerX?: number, centerY?: number): void;
  fitToScreen(): void;
  
  // Query
  getAllRectangles(): Rectangle[];
  getRectangleById(id: string): Rectangle | null;
  
  // State
  getConnectionStatus(): 'connected' | 'connecting' | 'disconnected';
  getCollaborators(): Array<{ id: string; name: string; color: string }>;
}
```

### REST API Endpoints

**Authentication** (handled by Supabase):
```
POST /auth/v1/token?grant_type=password
POST /auth/v1/signup
POST /auth/v1/token?grant_type=refresh_token
```

**Snapshot Management:**
```typescript
// POST /api/snapshots
// Save Yjs state snapshot (called by PartyKit every 60s)
Request: {
  snapshot: Uint8Array; // Binary Yjs state
  timestamp: number;
}
Response: { success: boolean; url: string }

// GET /api/snapshots/latest
// Fetch most recent snapshot for global room
Response: {
  snapshot: Uint8Array;
  timestamp: number;
}
```

### PartyKit Room API

**Server Implementation:**
```typescript
// partykit/server.ts
import type * as Party from "partykit/server";
import { onConnect } from "y-partykit";

export default class CanvasRoom implements Party.Server {
  constructor(readonly room: Party.Room) {}
  
  onConnect(conn: Party.Connection, ctx: Party.ConnectionContext) {
    return onConnect(conn, this.room, {
      persist: true, // Use Durable Object storage
      callback: {
        handler: async (update: Uint8Array) => {
          await this.saveSnapshot(update);
        },
        debounceWait: 60000 // 60 seconds
      }
    });
  }
  
  async onBeforeConnect(req: Party.Request) {
    // Validate auth token from query param
    const url = new URL(req.url);
    const token = url.searchParams.get('token');
    
    const user = await validateSupabaseToken(token);
    if (!user) return new Response('Unauthorized', { status: 401 });
    
    return { userId: user.id, userName: user.name };
  }
  
  async saveSnapshot(update: Uint8Array) {
    // Save to main/latest.yjs (single global room)
    await fetch(`${API_URL}/api/snapshots`, {
      method: 'POST',
      body: JSON.stringify({
        snapshot: Buffer.from(update).toString('base64'),
        timestamp: Date.now()
      })
    });
  }
}
```

---

## Supabase Configuration

### Authentication Setup

Supabase Auth manages user authentication. No custom database tables needed for MVP.

**Email Authentication Configuration:**
- Enabled Providers: Email/Password and Magic Link (OTP)
- Redirect URLs: 
  - Development: `http://localhost:5173/auth/callback`
  - Production: `https://your-app.railway.app/auth/callback`
- Email templates: Use Supabase default templates for confirmation and magic link emails

### Supabase Storage

**Bucket Configuration:**
```typescript
// Bucket: document-snapshots
{
  public: false, // Requires authentication
  fileSizeLimit: 10485760, // 10MB
  allowedMimeTypes: ['application/octet-stream']
}

// File structure (single global room):
// document-snapshots/
//   main/
//     latest.yjs  // Overwritten every 60 seconds
```

**Save Snapshot:**
```typescript
async function saveSnapshot(snapshotData: Uint8Array) {
  const filename = 'main/latest.yjs';
  
  await supabase.storage
    .from('document-snapshots')
    .upload(filename, snapshotData, {
      contentType: 'application/octet-stream',
      upsert: true  // Overwrite existing
    });
}
```

**Load Snapshot:**
```typescript
async function loadSnapshot() {
  const { data } = await supabase.storage
    .from('document-snapshots')
    .download('main/latest.yjs');
  
  if (!data) return null;
  
  return new Uint8Array(await data.arrayBuffer());
}
```

---

## Development Phases

### Phase 0: Project Setup (4 hours)
**Goal:** Running dev environment with all dependencies

**Tasks:**
- Initialize SvelteKit with Bun: `bunx sv create collab-canvas`
- Install dependencies: `bun add svelte-konva konva yjs y-partykit @supabase/supabase-js @supabase/ssr`
- Configure Railway project and link GitHub repo
- Create Supabase project (enable Auth, create Storage bucket)
- Deploy PartyKit room: `bunx partykit deploy`
- Set up environment variables

**Deliverables:**
- `bun run dev` starts local server
- Railway deployment pipeline active
- Supabase project provisioned

---

### Phase 1: Basic Canvas (6 hours)
**Goal:** Static canvas with rectangles (no multiplayer)

**Tasks:**
- Implement Konva Stage and Layer components
- Create Rectangle component with drag handlers
- Add viewport pan (drag background) and zoom (wheel)
- Implement toolbar with "Create Rectangle" button
- Add click-to-create rectangle functionality
- Implement viewport culling with QuadTree

**Acceptance Criteria:**
- ✅ Canvas fills viewport, supports pan and zoom
- ✅ Can create rectangles by clicking "Create" then clicking canvas
- ✅ Can drag rectangles around canvas
- ✅ 60 FPS with 500+ rectangles (verified with DevTools)
- ✅ Viewport culling: only visible rectangles render

---

### Phase 2: Authentication (4 hours)
**Goal:** Users can sign in with Email

**Tasks:**
- Configure Supabase Email Authentication (Password + Magic Link providers)
- Implement `hooks.server.ts` with Supabase SSR
- Create sign-in page with email/password and magic link options
- Add protected route middleware
- Implement user profile indicator in navbar
- Add sign-out functionality

**Acceptance Criteria:**
- ✅ Users can sign up with email/password
- ✅ Users can sign in with email/password
- ✅ Users can sign in with magic link (OTP)
- ✅ After auth, session persists across refreshes
- ✅ Canvas route requires authentication
- ✅ Can sign out successfully

---

### Phase 3: Real-Time Sync (12 hours)
**Goal:** Multiple users see each other's changes

**Tasks:**
- Initialize Yjs document with `objects` Y.Map
- Connect YPartyKitProvider to room (document ID from URL)
- Bind Konva rectangles to Yjs map (observer pattern)
- Implement rectangle CRUD operations via Yjs
- Add WebSocket connection status indicator
- Handle reconnection and state recovery
- Test with 2+ browser windows

**Acceptance Criteria:**
- ✅ Creating rectangle in Window A appears in Window B within 100ms
- ✅ Dragging rectangle syncs smoothly across all windows
- ✅ Deleting rectangle removes from all clients
- ✅ Refreshing window recovers full canvas state
- ✅ Connection status shows "Connected" when active

---

### Phase 4: Multiplayer Cursors (4 hours)
**Goal:** See collaborators' cursor positions in real-time

**Tasks:**
- Implement cursor position broadcasting via PartyKit Awareness
- Throttle cursor updates to 50ms intervals
- Render remote cursors on separate Konva layer
- Add name labels with user colors
- Implement cursor interpolation for smooth movement

**Acceptance Criteria:**
- ✅ Remote cursors visible within 50ms of movement
- ✅ Each user has distinct cursor color
- ✅ Name labels display above cursors
- ✅ Cursor movements are smooth (no jittering)

---

### Phase 5: Persistence (6 hours)
**Goal:** Canvas state survives server restarts

**Tasks:**
- Implement Yjs snapshot serialization in PartyKit
- Set up 60-second snapshot interval
- Create `/api/snapshots` endpoint in SvelteKit
- Save snapshots to Supabase Storage
- Implement snapshot loading on room cold-start
- Create `documents` table in Supabase
- Add document metadata CRUD operations

**Acceptance Criteria:**
- ✅ Snapshots save every 60 seconds to Supabase
- ✅ Restarting PartyKit room recovers state from latest snapshot
- ✅ All users disconnect and reconnect: canvas state preserved
- ✅ Document metadata (name, created_by) stored in PostgreSQL

---

### Phase 6: Object Manipulation (6 hours)
**Goal:** Select, resize, and delete rectangles

**Tasks:**
- Implement click selection (highlight selected rectangle)
- Add Konva Transformer for resize handles
- Implement Delete key handler
- Add rectangle properties panel (color, size inputs)
- Update Yjs map on all property changes

**Acceptance Criteria:**
- ✅ Clicking rectangle selects it (shows resize handles)
- ✅ Can resize with corner handles
- ✅ Delete key removes selected rectangle
- ✅ Color picker updates rectangle fill color
- ✅ All changes sync to collaborators

---

### Phase 7: Polish and Deployment (4 hours)
**Goal:** MVP deployed and production-ready

**Tasks:**
- Add loading states (canvas loading, connecting)
- Implement error handling (connection failed, auth error)
- Add keyboard shortcuts (Esc to deselect, Delete)
- Create welcome/onboarding flow
- Deploy to Railway production
- Configure custom domain (optional)
- Load testing with 5+ concurrent users

**Acceptance Criteria:**
- ✅ Application accessible at public URL
- ✅ No console errors in production
- ✅ 5 users can collaborate without performance issues
- ✅ Error states display helpful messages
- ✅ Loading states prevent user confusion

---

## MVP Acceptance Criteria Summary

### Functional Requirements
- ✅ Users can authenticate with Email/Password or Magic Link
- ✅ Users can create rectangles on canvas
- ✅ Users can drag rectangles to move them
- ✅ Users can select and resize rectangles
- ✅ Users can delete rectangles
- ✅ Users can pan and zoom canvas
- ✅ 2+ users see real-time updates (<100ms latency)
- ✅ Users see collaborators' cursors (<50ms latency)
- ✅ Canvas state persists (survives server restarts)
- ✅ Application is publicly accessible

### Performance Requirements
- ✅ 60 FPS rendering with 500+ rectangles
- ✅ <100ms object synchronization latency
- ✅ <50ms cursor synchronization latency
- ✅ <2 second initial canvas load time
- ✅ 5+ concurrent users without degradation

### Quality Requirements
- ✅ No data loss on disconnect/reconnect
- ✅ Conflict-free concurrent editing (CRDT)
- ✅ Secure authentication (OAuth + session management)
- ✅ Mobile-responsive canvas (viewport adapts)
- ✅ Clear connection status indicators

## Environment Configuration

### Required Environment Variables

```bash
# .env.local (development)
PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

PUBLIC_PARTYKIT_HOST=canvas.username.partykit.dev
PUBLIC_APP_URL=http://localhost:5173

# Railway (production)
PUBLIC_SUPABASE_URL=<same>
PUBLIC_SUPABASE_ANON_KEY=<same>
SUPABASE_SERVICE_ROLE_KEY=<same>
PUBLIC_PARTYKIT_HOST=canvas.username.partykit.dev
PUBLIC_APP_URL=https://your-app.railway.app
```

### Deployment Commands

```bash
# Local development
bun install
bun run dev

# Deploy PartyKit (single global room: "main")
cd partykit
bunx partykit deploy

# Deploy Railway (automatic via GitHub push)
git push origin main

# Build for production
bun run build
bun run preview
```

---

## Testing Strategy

### Multi-User Testing Checklist
- [ ] Open 2+ browser windows (or devices)
- [ ] Sign in as different users in each window
- [ ] Create rectangle in Window 1 → appears in Window 2
- [ ] Drag rectangle in Window 2 → updates in Window 1
- [ ] Move mouse in Window 1 → cursor appears in Window 2
- [ ] Check online users list shows all connected users
- [ ] Refresh Window 1 → state persists
- [ ] Close all windows → reopen → canvas restored

### Performance Testing
- [ ] Monitor FPS in Chrome DevTools (target: 60 FPS)
- [ ] Measure sync latency with console.time() (target: <100ms)
- [ ] Test with 5+ concurrent users
- [ ] Verify smooth pan/zoom at various zoom levels

### Edge Cases
- [ ] Network disconnection → reconnects automatically
- [ ] PartyKit room restart → loads from snapshot
- [ ] Multiple users editing same rectangle → CRDT resolves conflict
- [ ] User signs out → cursor disappears for others

---

## Success Metrics

### MVP Launch Criteria
- Application deployed and publicly accessible
- 5+ concurrent users tested without issues
- All functional requirements met
- All performance requirements met
- Zero critical bugs

### Post-Launch Monitoring
- **Performance:** Track FPS, sync latency, load times
- **Reliability:** Monitor connection drops, error rates
- **Usage:** Active users, session duration, rectangles created

---

**Document Status:** Final - Ready for Implementation  
**Scope:** 19 required tasks across 7 phases  
**Last Updated:** October 2025