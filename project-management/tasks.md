# CollabCanvas MVP - Task Checklist

## Key Decisions
- **Single global room:** Everyone uses `/canvas` (no room IDs, no document management)
- **Shape type:** Rectangle only
- **Authentication:** Google OAuth via Supabase
- **Persistence:** Saves to Supabase Storage on 60s interval
- **Deployment:** Railway + PartyKit on Cloudflare

## MVP Core Requirements (8 Items)
- [ ] Basic canvas with pan/zoom
- [ ] At least one shape type (rectangle)
- [ ] Ability to create objects
- [ ] Ability to move objects
- [ ] Real-time sync between 2+ users
- [ ] Multiplayer cursors with name labels
- [ ] Presence awareness (who's online)
- [ ] User authentication + deployed

---

## Phase 0: Foundation
**Goal:** Infrastructure ready for development

### Task 0.1: Project Initialization & Deployment Pipeline
**Priority:** CRITICAL - Required for "deployed and publicly accessible"
- [x] Initialize SvelteKit with Bun: `bunx sv create collab-canvas`
- [x] Configure svelte-adapter-bun
- [ ] Create Railway project and link GitHub
- [ ] Add railway.json configuration
- [ ] Create basic landing page
- [ ] Test deployment: push to main → Railway builds → URL accessible

**Validates:** Deployment infrastructure

---

### Task 0.2: Install Core Dependencies
**Priority:** CRITICAL - Foundation for all features
- [ ] `bun add svelte-konva konva yjs y-partykit @supabase/supabase-js @supabase/ssr`
- [ ] `bun add -d @types/konva`
- [ ] Verify Railway build succeeds with dependencies
- [ ] Create lib/ directory structure

**Validates:** Dependencies install correctly

---

### Task 0.3: Supabase Project Setup
**Priority:** CRITICAL - Required for authentication
- [ ] Create Supabase project
- [ ] Enable Google OAuth provider
- [ ] Add redirect URLs (localhost + Railway)
- [ ] Create document-snapshots storage bucket
- [ ] Add env vars to Railway
- [ ] Create lib/supabase.ts client
- [ ] Note: No documents table needed - single global room

**Validates:** Authentication infrastructure ready

---

### Task 0.4: PartyKit Room Deployment
**Priority:** CRITICAL - Required for real-time sync
- [ ] Create partykit/ directory
- [ ] Implement server.ts with Y-PartyKit
- [ ] Add auth validation in onBeforeConnect
- [ ] Deploy: `bunx partykit deploy`
- [ ] Add PUBLIC_PARTYKIT_HOST to env
- [ ] Test WebSocket connection

**Validates:** Real-time infrastructure ready

---

## Phase 1: Basic Canvas
**Goal:** Static canvas with shapes

### Task 1.1: Static Canvas with Konva
**Priority:** CRITICAL - MVP Req: "Basic canvas"
- [ ] Create routes/canvas/+page.svelte
- [ ] Import Stage and Layer from svelte-konva
- [ ] Canvas fills viewport (100vw, 100vh)
- [ ] Add grid background
- [ ] Responsive to window resize
- [ ] Note: Single global room - hardcode room ID as "main" or "global"

**Validates:** ✓ Basic canvas

---

### Task 1.2: Static Rectangles
**Priority:** CRITICAL - MVP Req: "At least one shape type"
- [ ] Add Rect component from svelte-konva
- [ ] Create array of 3 sample rectangles
- [ ] Render on Layer with colors
- [ ] Verify clean rendering (no blur)

**Validates:** ✓ Shape type (rectangle)

---

### Task 1.3: Pan and Zoom
**Priority:** CRITICAL - MVP Req: "pan/zoom"
- [ ] Make Stage draggable (pan)
- [ ] Add wheel event handler (zoom)
- [ ] Implement pointer-relative zoom
- [ ] Store viewport state in Svelte store
- [ ] Add zoom level indicator UI

**Validates:** ✓ Pan/zoom functionality

---

## Phase 2: Authentication
**Goal:** Users can sign in with Google

### Task 2.1: Auth Hooks & Session Management
**Priority:** CRITICAL - MVP Req: "User authentication"
- [ ] Create src/hooks.server.ts with Supabase
- [ ] Set up cookie-based sessions
- [ ] Create src/hooks.client.ts
- [ ] Add locals type definitions (app.d.ts)

**Validates:** Auth plumbing

---

### Task 2.2: Sign-In Page
**Priority:** CRITICAL - MVP Req: "User authentication"
- [ ] Create routes/auth/signin/+page.svelte
- [ ] Add "Sign in with Google" button
- [ ] Implement signInWithOAuth() handler
- [ ] Create routes/auth/callback/+server.ts
- [ ] Redirect to /canvas after auth

**Validates:** OAuth flow works

---

### Task 2.3: Protected Routes & User UI
**Priority:** CRITICAL - MVP Req: "users have accounts/names"
- [ ] Create routes/canvas/+page.server.ts with auth check
- [ ] Redirect to signin if not authenticated
- [ ] Add user profile in navbar (name, avatar)
- [ ] Add sign-out button
- [ ] Test: unauthenticated → redirects, authenticated → shows canvas

**Validates:** ✓ User authentication complete

---

## Phase 3: Local Interaction
**Goal:** Create and move rectangles (local only)

### Task 3.1: Create Rectangle Tool
**Priority:** CRITICAL - MVP Req: "Ability to create objects"
- [ ] Create Toolbar component
- [ ] Add "Create Rectangle" button
- [ ] Click canvas → create rectangle at pointer
- [ ] Store rectangles in Svelte store (local)
- [ ] Generate UUID for each rectangle

**Validates:** ✓ Create objects

---

### Task 3.2: Drag Rectangles
**Priority:** CRITICAL - MVP Req: "Ability to move objects"
- [ ] Add draggable={true} to Rect
- [ ] Handle dragend event
- [ ] Update rectangle position in store
- [ ] Test: can drag multiple rectangles

**Validates:** ✓ Move objects

---

## Phase 4: Real-Time Sync
**Goal:** Multiple users see changes in real-time

### Task 4.1: Yjs Document Initialization
**Priority:** CRITICAL - MVP Req: "Real-time sync"
- [ ] Create lib/collaboration.ts
- [ ] Initialize Y.Doc and objectsMap
- [ ] Bind Svelte store to Yjs Y.Map
- [ ] Rectangles now stored in Yjs (no PartyKit yet)
- [ ] Test: CRUD operations work via Yjs locally

**Validates:** Yjs integration

---

### Task 4.2: Connect to PartyKit
**Priority:** CRITICAL - MVP Req: "Real-time sync"
- [ ] Create YPartyKitProvider with hardcoded room ID ("main")
- [ ] Pass Supabase token as query param
- [ ] Add connection status indicator (green/red)
- [ ] Handle connection/disconnection events
- [ ] Test: WebSocket connects (check Network tab)

**Validates:** WebSocket connection

---

### Task 4.3: Real-Time Rectangle Sync
**Priority:** CRITICAL - MVP Req: "Real-time sync between 2+ users"
- [ ] Yjs updates broadcast automatically via PartyKit
- [ ] Test with 2 browser windows
- [ ] Add subtle visual feedback for remote updates
- [ ] Test: create, move, delete syncs <100ms
- [ ] Verify: no duplicates or corruption

**Validates:** ✓ Real-time sync between 2+ users (CORE FEATURE COMPLETE)

---

## Phase 5: Multiplayer Cursors
**Goal:** See collaborators' cursors

### Task 5.1: Cursor Broadcasting
**Priority:** CRITICAL - MVP Req: "Multiplayer cursors"
- [ ] Add mousemove listener to Stage
- [ ] Throttle to 50ms intervals
- [ ] Use provider.awareness.setLocalStateField('cursor', {x, y})
- [ ] Include user name and color from session
- [ ] Verify: cursor messages in Network tab

**Validates:** Cursor position broadcasting

---

### Task 5.2: Render Remote Cursors
**Priority:** CRITICAL - MVP Req: "Multiplayer cursors with name labels"
- [ ] Create Cursor component
- [ ] Listen to awareness.on('change')
- [ ] Render cursor at remote position
- [ ] Add name label above cursor
- [ ] Use separate Konva Layer for cursors
- [ ] Test: 2 windows show each other's cursors <50ms

**Validates:** ✓ Multiplayer cursors with name labels (CORE FEATURE COMPLETE)

---

## Phase 6: Presence Awareness
**Goal:** Show who's online

### Task 6.1: Online Users List
**Priority:** CRITICAL - MVP Req: "Presence awareness (who's online)"
- [ ] Create Sidebar component
- [ ] Extract users from provider.awareness.getStates()
- [ ] Display list: name, colored indicator
- [ ] Update on awareness change
- [ ] Highlight current user as "You"
- [ ] Test: join/leave updates list

**Validates:** ✓ Presence awareness (CORE FEATURE COMPLETE)

---

## Phase 7: Persistence
**Goal:** State survives server restarts

### Task 7.1: Save Snapshots to Supabase
**Priority:** CRITICAL - MVP Req: "Persistence layer that saves state on disconnects"
- [ ] Create routes/api/snapshots/+server.ts POST
- [ ] PartyKit calls endpoint every 60s
- [ ] Save binary snapshot to Supabase Storage (single global room)
- [ ] Store as "main/latest.yjs" (overwrite each time)
- [ ] Verify: snapshot appears in Storage dashboard

**Validates:** Snapshot saving works

---

### Task 7.2: Load Snapshots on Room Start
**Priority:** CRITICAL - MVP Req: "Persistence layer that saves state on disconnects"
- [ ] PartyKit onConnect: check if state empty
- [ ] Fetch "main/latest.yjs" from Supabase Storage
- [ ] Load into Yjs document
- [ ] Handle: no snapshot exists (new global room)
- [ ] Test: restart server → state recovered

**Validates:** ✓ Persistence layer (CORE FEATURE COMPLETE)



## MVP Completion Checklist

### All Core Requirements Met After Phase 7:
- [x] Phase 1: Canvas with pan/zoom ✓
- [x] Phase 1: Shape type (rectangle) ✓
- [x] Phase 3: Create objects ✓
- [x] Phase 3: Move objects ✓
- [x] Phase 4: Real-time sync 2+ users ✓
- [x] Phase 5: Multiplayer cursors with labels ✓
- [x] Phase 6: Presence awareness ✓
- [x] Phase 2: Authentication ✓
- [x] Phase 0: Deployed ✓
- [x] Phase 7: Persistence layer ✓

### Final MVP Test (After Task 7.2)
- [ ] Open 2 browser windows
- [ ] Sign in as different users in each
- [ ] Create rectangles → verify sync <100ms
- [ ] Move rectangles → verify sync
- [ ] See each other's cursors with names
- [ ] Online users list shows both users
- [ ] Pan/zoom works smoothly
- [ ] Refresh page → can sign back in
- [ ] Close all windows, reopen → canvas state preserved
- [ ] Deploy to Railway → public URL works

**If all above pass: MVP COMPLETE ✅**

---

## Bare Minimum Path

**Complete all 19 tasks in Phase 0-7:**

1. Phase 0: Infrastructure (4 tasks)
2. Phase 1: Canvas + shapes + pan/zoom (3 tasks)
3. Phase 2: Authentication (3 tasks)
4. Phase 3: Create + move (2 tasks)
5. Phase 4: Real-time sync (3 tasks)
6. Phase 5: Cursors (2 tasks)
7. Phase 6: Presence (1 task)
8. Phase 7: Persistence (2 tasks)

**Complete all 19 → MVP Done**

---

## What Can Be Cut?

Nothing. All 19 tasks are required for MVP.

**19 Required Tasks:**
- Phase 0: 0.1, 0.2, 0.3, 0.4 (4 tasks)
- Phase 1: 1.1, 1.2, 1.3 (3 tasks)
- Phase 2: 2.1, 2.2, 2.3 (3 tasks)
- Phase 3: 3.1, 3.2 (2 tasks)
- Phase 4: 4.1, 4.2, 4.3 (3 tasks)
- Phase 5: 5.1, 5.2 (2 tasks)
- Phase 6: 6.1 (1 task)
- Phase 7: 7.1, 7.2 (2 tasks)