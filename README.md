# CollabCanvas

**Real-time collaborative design tool with AI-powered shape manipulation**

A Figma-inspired canvas application where multiple users can design together in real-time using natural language commands. Built with SvelteKit, Yjs, PartyKit, and OpenAI GPT-4.

![Project Status](https://img.shields.io/badge/status-submission_prep-blue)
![Estimated Score](https://img.shields.io/badge/score-75--85%2F100-yellow)
![Phase](https://img.shields.io/badge/phase-4_complete-green)

---

## ✨ Features

### 🎨 **Comprehensive Shape System**
- **8 shape types:** Rectangle, Circle, Ellipse, Line, Text, Polygon, Star, Image
- **Full transformations:** Move, resize, rotate (with Konva Transformer)
- **Advanced operations:** Undo/redo, copy/paste, duplicate, multi-select
- **Layer management:** Z-index control, bring forward/backward

### 🤖 **AI Canvas Agent**
- **22 AI tools** across 4 categories:
  - **Creation:** All 8 shape types
  - **Manipulation:** Move, resize, rotate, color, delete, duplicate
  - **Layout:** Horizontal, vertical, grid, distribute, align
  - **Query:** Get state, find by type, find by color
- **Natural language interface:** Cmd/Ctrl+K command palette
- **GPT-4-turbo powered:** OpenAI function calling
- **Rate limited:** 10 commands/minute per user

### 👥 **Real-Time Collaboration**
- **Sub-100ms sync:** Object updates with Yjs CRDT
- **Sub-50ms sync:** Multiplayer cursors with name labels
- **Presence awareness:** See who's online, what they're doing
- **Automatic conflict resolution:** No manual merging needed
- **State persistence:** Survives server restarts (Durable Objects)
- **Auto-reconnection:** Handles network drops gracefully

### ⚡ **Performance**
- **60 FPS rendering** with 100+ shapes (tested)
- **Viewport culling** for large canvases
- **Efficient sync** with Yjs binary protocol
- **Debug overlay** (press `~` to toggle)

### 🔒 **Security**
- **Auth0 authentication:** Email + password
- **JWT session management:** Secure HTTP-only cookies
- **Protected routes:** Server-side middleware
- **Rate limiting:** AI endpoint protection

---

## 🚀 Quick Start

### Prerequisites
- **Bun 1.3+** ([install](https://bun.sh))
- **Auth0 account** (for authentication)
- **OpenAI API key** (for AI agent)

### Installation

```bash
# Clone repository
git clone <repository-url>
cd collab-canvas

# Install dependencies
bun install

# Configure environment variables
cp .env.example .env.local
# Edit .env.local with your Auth0 and OpenAI credentials

# Start development servers (2 terminals)
bun run dev              # SvelteKit dev server (http://localhost:5173)
bunx partykit dev        # PartyKit dev server (http://localhost:1999)
```

### Environment Variables

```bash
# Auth0 Configuration
PUBLIC_AUTH0_DOMAIN=dev-xxxxx.us.auth0.com
PUBLIC_AUTH0_CLIENT_ID=xxxxxxxxxxxxxxxxxxxx
AUTH0_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx

# PartyKit Configuration
PUBLIC_PARTYKIT_HOST=localhost:1999
PUBLIC_APP_URL=http://localhost:5173

# OpenAI Configuration (for AI agent)
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxx
```

---

## 💡 Usage

### Basic Collaboration
1. Open the app in 2+ browser windows
2. Sign in with different email accounts
3. Create shapes and see real-time updates
4. Watch multiplayer cursors move

### AI Commands
Press `Cmd/Ctrl+K` to open the AI command palette, then try:

**Simple:**
- "Create a red circle at 200, 200"
- "Make a blue rectangle 300 wide and 150 tall"
- "Add text that says Hello World"

**Layout:**
- "Arrange these shapes in a horizontal row"
- "Create a 3x3 grid of circles"
- "Distribute these elements evenly"

**Complex:**
- "Create a login form" (username, password, button)
- "Build a navigation bar with Home, About, Services, Contact"
- "Make a card layout with title and description"

### Keyboard Shortcuts

**Tools:**
- `V` - Select tool
- `R` - Rectangle
- `C` - Circle
- `E` - Ellipse
- `L` - Line
- `T` - Text
- `P` - Polygon
- `S` - Star

**Operations:**
- `Delete/Backspace` - Delete selected
- `Cmd/Ctrl+D` - Duplicate
- `Cmd/Ctrl+C` - Copy
- `Cmd/Ctrl+V` - Paste
- `Cmd/Ctrl+Z` - Undo
- `Cmd/Ctrl+Shift+Z` - Redo

**Layers:**
- `Cmd/Ctrl+]` - Bring forward
- `Cmd/Ctrl+[` - Send backward
- `Cmd/Ctrl+Shift+]` - Bring to front
- `Cmd/Ctrl+Shift+[` - Send to back

**AI:**
- `Cmd/Ctrl+K` - Open AI command palette
- `Escape` - Close palette

**Other:**
- `~` - Toggle debug overlay
- `Shift+Click` - Add to selection
- `Shift+Drag` - Marquee/drag-net selection

---

## 🏗️ Architecture

### Tech Stack

**Frontend:**
- **SvelteKit 2** with Svelte 5 (runes)
- **Konva.js 10** - Canvas rendering
- **shadcn-svelte** - UI components
- **Tailwind CSS 4** - Styling
- **Bun** - Runtime & package manager

**Backend:**
- **PartyKit** - WebSocket server (Cloudflare Workers)
- **Yjs** - CRDT for conflict-free replication
- **Y-PartyKit** - Yjs transport provider
- **Durable Objects** - State persistence

**AI:**
- **OpenAI GPT-4-turbo** - Function calling
- **22 custom tools** - Canvas manipulation

**Auth:**
- **Auth0** - Authentication & session management
- **jose** - JWT verification

### Project Structure

```
src/
├── lib/
│   ├── canvas/
│   │   ├── core/              # CanvasEngine, ViewportManager, SelectionManager, EventHandlers
│   │   ├── shapes/            # ShapeRenderer, ShapeFactory, BaseShape
│   │   └── collaboration/     # CursorManager
│   ├── stores/                # State management (shapes, selection, tool, clipboard, history)
│   ├── types/                 # TypeScript types (shapes, canvas)
│   └── components/            # UI (Toolbar, PropertiesPanel, CommandPalette, etc.)
├── routes/
│   ├── +layout.server.ts      # Auth middleware
│   ├── auth/                  # Auth0 routes
│   └── canvas/                # Main canvas page
└── hooks.server.ts            # JWT verification

partykit/
├── server.ts                  # Yjs server + AI endpoint
└── ai/
    ├── tools.ts               # 22 AI tool definitions
    ├── executors.ts           # Tool implementations
    └── prompts.ts             # System prompt for GPT-4
```

---

## 📊 Project Status

### Implemented ✅
- **All 8 shape types** (rectangle, circle, ellipse, line, text, polygon, star, image)
- **AI Agent with 22 tools** (GPT-4-turbo function calling)
- **Real-time collaboration** (Yjs + PartyKit, <100ms sync)
- **Multiplayer cursors** (<50ms sync)
- **Undo/redo** (Yjs UndoManager)
- **Multi-select** (Shift+click, drag-net)
- **Copy/paste** (with cumulative offset)
- **Rotation** (Transformer handle)
- **Z-index management** (bring forward/backward)
- **Viewport culling** (performance optimization)
- **Auth0 authentication** (email + password)
- **Clean modular architecture** (~400 line orchestrator)

### Missing ⚠️
- Export functionality (PNG/SVG) - not implemented
- Image upload to R2 - placeholders only
- Color picker with presets - not implemented
- Layers panel UI - keyboard only
- Scale testing (500+ shapes, 5+ users) - incomplete

### Critical Gaps ❌
- **Demo video** (required for submission - or -10 points)
- **AI Development Log** (required - needs completion)
- **Scale testing verification** (performance claims)

**Estimated Rubric Score:** 75-85 / 100 points (before demo video)

See [`PROJECT-STATUS.md`](./PROJECT-STATUS.md) for detailed breakdown.

---

## 🧪 Testing

### Manual Testing

**Collaboration:**
```bash
# Open 2+ browser windows
# Sign in as different users
# Test: create, move, edit shapes
# Verify: real-time sync, cursor sync, presence
```

**AI Agent:**
```bash
# Press Cmd/Ctrl+K
# Test simple commands
# Test complex commands (login form, nav bar)
# Verify: shapes created, layout correct
```

**Performance:**
```bash
# Create 100+ shapes
# Pan and zoom
# Check FPS (press ~ for debug overlay)
# Verify: smooth 60 FPS
```

### Scale Testing (TODO)
```bash
# Create 500+ shapes
# Test with 5+ concurrent users
# Network throttling (3G, slow 4G)
# Document performance metrics
```

---

## 📦 Deployment

### Production URLs
- **Frontend:** Railway (automatic via GitHub push)
- **Backend:** `collab-canvas.piontek0.workers.dev`
- **Room:** Global "main" room at `/parties/yjs/main`

### Deploy Commands

```bash
# Deploy PartyKit to Cloudflare Workers
bunx partykit deploy --domain collab-canvas.piontek0.workers.dev

# Deploy frontend to Railway (automatic on git push)
git push origin main
```

### Environment Variables (Production)

```bash
# Railway (Frontend)
PUBLIC_AUTH0_DOMAIN=<same as dev>
PUBLIC_AUTH0_CLIENT_ID=<same as dev>
AUTH0_CLIENT_SECRET=<same as dev>
PUBLIC_PARTYKIT_HOST=collab-canvas.piontek0.workers.dev
PUBLIC_APP_URL=https://your-app.railway.app

# Cloudflare Workers (PartyKit Backend)
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxx
```

---

## 📚 Documentation

### Project Management
- [`PROJECT-STATUS.md`](./PROJECT-STATUS.md) - Quick overview
- [`project-management/RUBRIC-ASSESSMENT.md`](./project-management/RUBRIC-ASSESSMENT.md) - Detailed scoring
- [`project-management/CollabCanvas Rubric.md`](./project-management/CollabCanvas%20Rubric.md) - Official rubric
- [`project-management/PRD-final.md`](./project-management/PRD-final.md) - Full product requirements

### Memory Bank
- [`memory-bank/projectbrief.md`](./memory-bank/projectbrief.md) - Project overview
- [`memory-bank/progress.md`](./memory-bank/progress.md) - Feature status
- [`memory-bank/activeContext.md`](./memory-bank/activeContext.md) - Current focus
- [`memory-bank/systemPatterns.md`](./memory-bank/systemPatterns.md) - Architecture patterns
- [`memory-bank/techContext.md`](./memory-bank/techContext.md) - Tech stack details

### External Resources
- [Yjs Documentation](https://docs.yjs.dev)
- [PartyKit Documentation](https://docs.partykit.io)
- [Konva.js Documentation](https://konvajs.org/docs/)
- [OpenAI Function Calling](https://platform.openai.com/docs/guides/function-calling)
- [shadcn-svelte](https://www.shadcn-svelte.com/)

---

## 🎯 Roadmap

### Critical Path (Submission Prep)
- [ ] Complete AI Development Log
- [ ] Create demo video (3-5 minutes)
- [ ] Scale testing verification
- [ ] Update all documentation

### High-Value Enhancements
- [ ] Implement export (PNG/SVG)
- [ ] Add color picker component
- [ ] Test complex AI commands thoroughly
- [ ] Performance optimization

### Future (Post-Submission)
- [ ] Image upload to R2
- [ ] Multi-canvas/project management
- [ ] Permissions system (owner/editor/viewer)
- [ ] Layers panel UI
- [ ] Advanced styling (gradients, blend modes)
- [ ] Mobile/tablet optimization

---

## 🤝 Contributing

This is an academic project for course submission. Contributions are not accepted at this time.

---

## 📄 License

Private academic project - All rights reserved.

---

## 🙏 Acknowledgments

Built with:
- [SvelteKit](https://kit.svelte.dev/) - Framework
- [Yjs](https://yjs.dev/) - CRDT engine
- [PartyKit](https://partykit.io/) - Real-time infrastructure
- [Konva](https://konvajs.org/) - Canvas rendering
- [OpenAI](https://openai.com/) - AI agent
- [Auth0](https://auth0.com/) - Authentication
- [shadcn-svelte](https://www.shadcn-svelte.com/) - UI components
- [Bun](https://bun.sh/) - Runtime

---

**Last Updated:** October 16, 2025  
**Status:** ✅ Ready for submission prep  
**Estimated Score:** 75-85 / 100 points
