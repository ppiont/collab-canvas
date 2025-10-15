# CollabCanvas MVP - Task Checklist

## Key Decisions
- **Single global room:** Everyone uses `/canvas` (no room IDs, no document management)
- **Shape type:** Rectangle only
- **Authentication:** Email Authentication via Auth0
- **Persistence:** Automatic via PartyKit Durable Objects (`persist: true`)
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
- [x] Create Railway project and link GitHub
- [x] Add railway.json configuration
- [x] Create basic landing page
- [x] Test deployment: push to main → Railway builds → URL accessible

**Validates:** Deployment infrastructure

---

### Task 0.2: Install Core Dependencies
**Priority:** CRITICAL - Foundation for all features
- [x] `bun add svelte-konva konva yjs y-partykit @supabase/supabase-js @supabase/ssr`
- [x] ~~`bun add -d @types/konva`~~ (Not needed - Konva has built-in types)
- [x] Verify Railway build succeeds with dependencies
- [x] Create lib/ directory structure

**Validates:** Dependencies install correctly

---

### Task 0.3: Auth0 Application Setup
**Priority:** CRITICAL - Required for authentication
- [x] Create Auth0 application
- [x] Enable Email Authentication (Password + Passwordless Email)
- [x] Add allowed callback URLs (localhost + Railway)
- [x] Add allowed logout URLs
- [x] Add env vars to Railway
- [x] Create lib/auth0.ts helper functions
- [x] Create auth hooks (server with JWT verification)
- [x] Create sign-in/signout pages
- [x] Note: No database needed - PartyKit Durable Objects handles state

**Validates:** Authentication infrastructure ready

---

### Task 0.4: PartyKit Room Deployment
**Priority:** CRITICAL - Required for real-time sync
- [x] Create partykit/ directory
- [x] Implement server.ts with Y-PartyKit (validated against official docs)
- [x] Add auth validation in onBeforeConnect (static method)
- [x] Local dev server working: `bunx partykit dev`
- [x] Add PUBLIC_PARTYKIT_HOST to env: `localhost:1999`
- [x] Test WebSocket connection (works locally)
- [ ] Cloud deploy: `bunx partykit deploy` (deferred: PartyKit service issue)

**Validates:** Real-time infrastructure ready locally ✅ (cloud deploy when PartyKit service recovers)

---

## Phase 1: Basic Canvas
**Goal:** Static canvas with shapes

### Task 1.1: Static Canvas with Konva
**Priority:** CRITICAL - MVP Req: "Basic canvas"
- [x] Create routes/canvas/+page.svelte
- [x] Import Stage and Layer from svelte-konva
- [x] Canvas fills viewport (100vw, 100vh)
- [x] Add grid background (50px grid)
- [x] Responsive to window resize
- [x] Note: Single global room - hardcode room ID as "main" or "global"

**Validates:** ✓ Basic canvas

---

### Task 1.2: Static Rectangles
**Priority:** CRITICAL - MVP Req: "At least one shape type"
- [x] Add Rect component from svelte-konva
- [x] Create array of 3 sample rectangles
- [x] Render on Layer with colors (blue, pink, green)
- [x] Verify clean rendering (no blur)

**Validates:** ✓ Shape type (rectangle)

---

### Task 1.3: Pan and Zoom
**Priority:** CRITICAL - MVP Req: "pan/zoom"
- [x] Make Stage draggable (pan)
- [x] Add wheel event handler (zoom)
- [x] Implement pointer-relative zoom (zooms toward cursor)
- [x] Store viewport state ($state runes: stageX, stageY, stageScale)
- [x] Add zoom level indicator UI (bottom-right corner)
- [x] Clamp zoom: 0.1x to 5x

**Validates:** ✓ Pan/zoom functionality

---

## Phase 2: Authentication & User Profile
**Goal:** Users can sign in and have collaborative identity (name + color)

**Note:** Auth infrastructure (hooks, sign-in page, protected routes) completed in Phase 0, Task 0.3

### Task 2.1: User Profile & Canvas Route Setup
**Priority:** CRITICAL - MVP Req: "users have names for multiplayer"
- [x] Create routes/canvas/+page.server.ts to load session
- [x] Create lib/user-utils.ts with helper functions:
  - [x] `getUserDisplayName(user)` - extract name from email or metadata
  - [x] `assignUserColor(userId)` - deterministic color from user ID
  - [x] `getUserProfile(user)` - return { id, name, email, color }
- [x] Update canvas page to receive user profile via page data
- [x] Update navbar to show display name instead of just email
- [x] Test: user has name and color available for collaboration

**Validates:** ✓ User has collaborative identity (name + color)

---

## Phase 3: Local Interaction
**Goal:** Create and move rectangles (local only)

### Task 3.1: Create Rectangle Tool
**Priority:** CRITICAL - MVP Req: "Ability to create objects"
- [x] Create Toolbar component
- [x] Add "Create Rectangle" button
- [x] Click canvas → create rectangle at pointer
- [x] Store rectangles in Svelte store (local)
- [x] Generate UUID for each rectangle

**Validates:** ✓ Create objects

---

### Task 3.2: Drag Rectangles
**Priority:** CRITICAL - MVP Req: "Ability to move objects"
- [x] Add draggable={true} to Rect
- [x] Handle dragend event
- [x] Update rectangle position in store
- [x] Test: can drag multiple rectangles

**Validates:** ✓ Move objects

---

## Phase 4: Real-Time Sync
**Goal:** Multiple users see changes in real-time

### Task 4.1: Yjs Document Initialization
**Priority:** CRITICAL - MVP Req: "Real-time sync"
- [x] Create lib/collaboration.ts
- [x] Initialize Y.Doc and objectsMap
- [x] Bind Svelte store to Yjs Y.Map
- [x] Rectangles now stored in Yjs (no PartyKit yet)
- [x] Test: CRUD operations work via Yjs locally

**Validates:** Yjs integration

---

### Task 4.2: Connect to PartyKit
**Priority:** CRITICAL - MVP Req: "Real-time sync"
- [x] Create YPartyKitProvider with hardcoded room ID ("main")
- [x] Pass Auth0 JWT token as query param
- [x] Add connection status indicator (green/red)
- [x] Handle connection/disconnection events
- [x] Test: WebSocket connects (check Network tab)

**Validates:** WebSocket connection

---

### Task 4.3: Real-Time Rectangle Sync
**Priority:** CRITICAL - MVP Req: "Real-time sync between 2+ users"
- [x] Yjs updates broadcast automatically via PartyKit
- [x] Test with 2 browser windows
- [x] Add subtle visual feedback for remote updates
- [x] Test: create, move, delete syncs <100ms
- [x] Verify: no duplicates or corruption

**Validates:** ✓ Real-time sync between 2+ users (CORE FEATURE COMPLETE)

---

## Phase 5: Multiplayer Cursors
**Goal:** See collaborators' cursors

### Task 5.1: Cursor Broadcasting
**Priority:** CRITICAL - MVP Req: "Multiplayer cursors"
- [x] Add mousemove listener to Stage
- [x] Throttle to 50ms intervals
- [x] Use provider.awareness.setLocalStateField('cursor', {x, y})
- [x] Include user name and color from session
- [x] Verify: cursor messages in Network tab

**Validates:** Cursor position broadcasting

---

### Task 5.2: Render Remote Cursors
**Priority:** CRITICAL - MVP Req: "Multiplayer cursors with name labels"
- [x] Create Cursor rendering logic (Konva shapes)
- [x] Listen to awareness.on('change')
- [x] Render cursor at remote position
- [x] Add name label above cursor
- [x] Use separate Konva Layer for cursors
- [x] Test: 2 windows show each other's cursors <50ms

**Validates:** ✓ Multiplayer cursors with name labels (CORE FEATURE COMPLETE)

---

## Phase 6: Presence Awareness
**Goal:** Show who's online

### Task 6.1: Online Users List
**Priority:** CRITICAL - MVP Req: "Presence awareness (who's online)"
- [x] Create Sidebar component
- [x] Extract users from provider.awareness.getStates()
- [x] Display list: name, colored indicator
- [x] Update on awareness change
- [x] Highlight current user as "You"
- [x] Test: join/leave updates list

**Validates:** ✓ Presence awareness (CORE FEATURE COMPLETE)

---

## Phase 7: Persistence
**Goal:** State survives server restarts

### ✅ PHASE 7 COMPLETE - No Additional Work Needed

**PartyKit Durable Objects provides automatic persistence:**
- `persist: true` in Y-PartyKit configuration
- State automatically saved to Cloudflare Durable Objects storage
- Survives server restarts, disconnects, and room hibernation
- No external backup layer needed for MVP

### Task 7.1: ~~Save Snapshots to Storage~~ (UNNECESSARY)
**Status:** NOT NEEDED - Durable Objects handles persistence automatically
- ~~Create snapshot save endpoints~~
- ~~PartyKit calls endpoint every 60s~~
- ~~Save binary snapshot to storage~~

**Validated:** Persistence works via Cloudflare Durable Objects ✅

---

### Task 7.2: ~~Load Snapshots on Room Start~~ (UNNECESSARY)
**Status:** NOT NEEDED - Durable Objects loads state automatically
- ~~PartyKit onConnect: check if state empty~~
- ~~Fetch snapshot from storage~~
- ~~Load into Yjs document~~

**Validated:** ✓ Persistence layer (CORE FEATURE COMPLETE) ✅

**Deployment:** `bunx partykit deploy --domain collab-canvas.piontek0.workers.dev`



## MVP Completion Checklist

### All Core Requirements Met:
- [x] Phase 0: Deployed ✓
- [x] Phase 1: Canvas with pan/zoom ✓
- [x] Phase 1: Shape type (rectangle) ✓
- [x] Phase 2: Authentication + User Profile ✓
- [x] Phase 3: Create objects ✓
- [x] Phase 3: Move objects ✓
- [x] Phase 4: Real-time sync 2+ users ✓
- [x] Phase 5: Multiplayer cursors with labels ✓
- [x] Phase 6: Presence awareness ✓
- [x] Phase 7: Persistence layer ✓ (PartyKit Durable Objects)

### Final MVP Test
- [x] Open 2 browser windows
- [x] Sign in as different users in each
- [x] Create rectangles → verify sync <100ms
- [x] Move rectangles → verify sync
- [x] See each other's cursors with names
- [x] Online users list shows both users
- [x] Pan/zoom works smoothly
- [x] Refresh page → can sign back in
- [x] Close all windows, reopen → canvas state preserved (Durable Objects)
- [x] Deploy to Railway → public URL works
- [x] PartyKit deployed → `collab-canvas.piontek0.workers.dev`

**MVP COMPLETE ✅**

---

## Bare Minimum Path

**Completed 15 tasks across Phase 0-6:**

1. Phase 0: Infrastructure (4 tasks) ✅
2. Phase 1: Canvas + shapes + pan/zoom (3 tasks) ✅
3. Phase 2: User Profile (1 task - auth completed in Phase 0) ✅
4. Phase 3: Create + move (2 tasks) ✅
5. Phase 4: Real-time sync (3 tasks) ✅
6. Phase 5: Cursors (2 tasks) ✅
7. Phase 6: Presence (1 task) ✅
8. Phase 7: Persistence (0 tasks - handled by PartyKit Durable Objects) ✅

**All 15 tasks completed → MVP DONE ✅**

---

## What Was Cut?

**Phase 7 External backup layer (2 tasks):** Not needed - PartyKit Durable Objects provides automatic persistence with `persist: true`.

**15 Completed Tasks:**
- Phase 0: 0.1, 0.2, 0.3, 0.4 (4 tasks) ✅
- Phase 1: 1.1, 1.2, 1.3 (3 tasks) ✅
- Phase 2: 2.1 (1 task) ✅
- Phase 3: 3.1, 3.2 (2 tasks) ✅
- Phase 4: 4.1, 4.2, 4.3 (3 tasks) ✅
- Phase 5: 5.1, 5.2 (2 tasks) ✅
- Phase 6: 6.1 (1 task) ✅
- Phase 7: Built-in persistence (0 tasks) ✅