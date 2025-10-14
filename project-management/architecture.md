```mermaid
graph TB
    subgraph Browser["Client Layer (Browser)"]
        UI[Svelte UI: Toolbar, Navbar, Sidebar]
        Canvas[Konva Canvas: Stage + Layers]
        YDoc[Yjs Document: objects, cursors]
        Provider[YPartyKitProvider WebSocket]
        
        UI --> Canvas
        Canvas --> YDoc
        YDoc <--> Provider
    end

    subgraph Edge["PartyKit (Cloudflare Workers + Durable Objects)"]
        Room[Room: main Durable Object]
        YCRDT[Yjs CRDT State Canonical]
        Awareness[Awareness API Cursors]
        Persist[Durable Storage persist: true]
        
        Room --> YCRDT
        Room --> Awareness
        Room --> Persist
    end

    subgraph Backend["Backend Services"]
        subgraph Railway["Railway (SvelteKit)"]
            App[SvelteKit App routes/canvas]
            Hooks[Auth Hooks hooks.server.ts]
        end
        
        subgraph Supabase["Supabase"]
            Auth[Supabase Auth Email]
        end
    end

    %% Authentication Flow
    Browser -->|Sign in with Email| Auth
    Auth -->|Session token| Hooks
    Hooks -->|Authenticated session| App
    App -->|Render canvas| Browser

    %% Real-time Sync Flow
    Provider <-->|WebSocket Yjs updates 40-50ms| Room
    Room -->|Broadcast to all clients| Provider
    
    %% Cursor Flow
    Provider -.->|Awareness API 50ms throttle| Awareness
    Awareness -.->|Broadcast cursors| Provider

    %% Persistence Flow (Automatic via Durable Objects)
    Room -->|Automatic persist| Persist
    Persist -.->|Load on cold start| Room

    %% Styling
    classDef clientStyle fill:#e3f2fd,stroke:#1976d2,stroke-width:2px
    classDef edgeStyle fill:#fff3e0,stroke:#f57c00,stroke-width:2px
    classDef backendStyle fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px
    classDef supabaseStyle fill:#e8f5e9,stroke:#388e3c,stroke-width:2px
    
    class UI,Canvas,YDoc,Provider clientStyle
    class Room,YCRDT,Awareness,Persist edgeStyle
    class App,Hooks backendStyle
    class Auth supabaseStyle
```