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

### Task 0.3: Supabase Project Setup
**Priority:** CRITICAL - Required for authentication
- [x] Create Supabase project
- [x] Enable Email Auth (Email + Password & Magic Link)
- [x] Add redirect URLs (localhost + Railway)
- [x] Create document-snapshots storage bucket with policies
- [x] Add env vars to Railway
- [x] Create lib/supabase.ts client
- [x] Create auth hooks (server + client)
- [x] Create sign-in/sign-up/signout pages
- [x] Note: No documents table needed - single global room

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

### Task 2.1: Auth Hooks & Session Management ✅ COMPLETED in Task 0.3
**Priority:** CRITICAL - MVP Req: "User authentication"
- [x] Create src/hooks.server.ts with Supabase
- [x] Set up cookie-based sessions
- [x] Create src/hooks.client.ts
- [x] Add locals type definitions (app.d.ts)

**Validates:** Auth plumbing ✅

---

### Task 2.2: Sign-In Page ✅ COMPLETED in Task 0.3
**Priority:** CRITICAL - MVP Req: "User authentication"
- [x] Create routes/auth/signin/+page.svelte
- [x] ~~Add "Sign in with Google" button~~ (Using Email/Password + Magic Link instead)
- [x] ~~Implement signInWithOAuth() handler~~ (Using Email auth)
- [x] Create routes/auth/callback/+server.ts
- [x] Redirect to /canvas after auth

**Validates:** Email auth flow works ✅

---

### Task 2.3: User Profile & Canvas Route Setup
**Priority:** CRITICAL - MVP Req: "users have names for multiplayer"
- [ ] Create routes/canvas/+page.server.ts to load session
- [ ] Create lib/user-utils.ts with helper functions:
  - [ ] `getUserDisplayName(user)` - extract name from email or metadata
  - [ ] `assignUserColor(userId)` - deterministic color from user ID
  - [ ] `getUserProfile(user)` - return { id, name, email, color }
- [ ] Update canvas page to receive user profile via page data
- [ ] Update navbar to show display name instead of just email
- [ ] Test: user has name and color available for collaboration

**Validates:** ✓ User has collaborative identity (name + color)

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
- [x] Phase 0: Deployed ✓
- [x] Phase 1: Canvas with pan/zoom ✓
- [x] Phase 1: Shape type (rectangle) ✓
- [ ] Phase 2: Authentication + User Profile (partial: auth ✓, profile pending)
- [ ] Phase 3: Create objects
- [ ] Phase 3: Move objects
- [ ] Phase 4: Real-time sync 2+ users
- [ ] Phase 5: Multiplayer cursors with labels
- [ ] Phase 6: Presence awareness
- [ ] Phase 7: Persistence layer

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