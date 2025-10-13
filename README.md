# CollabCanvas

Real-time collaborative canvas application built with SvelteKit, Yjs, PartyKit, and Supabase.

## 🚀 Tech Stack

- **Frontend:** SvelteKit 2.0 + Svelte 5
- **Runtime:** Bun 1.3+
- **Canvas:** Konva.js with svelte-konva
- **Real-time:** Yjs + PartyKit (Y-PartyKit Provider)
- **Backend:** Supabase (Auth + Storage)
- **Deployment:** Railway + Cloudflare Workers (PartyKit)

## 📋 Features

- ⚡ Real-time collaboration (<100ms sync latency)
- 👥 Multiplayer cursors with name labels
- 🎨 Rectangle creation and manipulation
- 🔒 Google OAuth authentication
- 💾 Automatic state persistence
- 🌐 Single global collaborative room

## 🛠️ Development

### Prerequisites

- Bun 1.3+ installed
- Supabase account (for Tasks 0.3+)
- PartyKit account (for Tasks 0.4+)

### Installation

```bash
# Install dependencies
bun install

# Start development server
bun run dev

# Build for production
bun run build

# Preview production build
bun run preview
```

### Environment Variables

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

See `DEPLOYMENT.md` for detailed setup instructions.

## 📦 Deployment

See `DEPLOYMENT.md` for complete deployment instructions for Railway and PartyKit.

## 📖 Project Documentation

- `project-management/PRD.md` - Product Requirements Document
- `project-management/architecture.md` - System Architecture Diagram
- `project-management/tasks.md` - Task Checklist
- `project-management/userflows.md` - User Flow Diagrams
- `DEPLOYMENT.md` - Deployment Guide

## 🏗️ Development Status

- [x] Task 0.1: Project initialization & deployment pipeline
- [ ] Task 0.2: Install core dependencies
- [ ] Task 0.3: Supabase setup
- [ ] Task 0.4: PartyKit deployment

## 📄 License

Private project - All rights reserved.
