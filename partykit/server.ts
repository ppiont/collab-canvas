import type * as Party from "partykit/server";
import { onConnect } from "y-partykit";

/**
 * CollabCanvas Yjs Server
 * 
 * Handles real-time CRDT synchronization using Y-PartyKit
 * Supports collaborative editing in the global "main" room
 */
export default class YjsServer implements Party.Server {
    constructor(public party: Party.Room) { }

    /**
     * Called when a client connects via WebSocket
     * Y-PartyKit handles all Yjs protocol communication
     */
    onConnect(conn: Party.Connection) {
        return onConnect(conn, this.party, {
            persist: {
                mode: 'snapshot'
            }
        });
    }

    /**
     * Called before WebSocket connection is established
     * Use for authentication validation
     * NOTE: Must be static in PartyKit
     */
    static async onBeforeConnect(req: Party.Request) {
        // For MVP: Allow all connections

        const url = new URL(req.url);
        const token = url.searchParams.get('token');

        console.log('Client connecting', {
            token: token ? 'present' : 'missing'
        });

        // Allow connection
        return req;
    }

    /**
     * Handle HTTP requests for health checks
     */
    async onRequest(req: Party.Request) {
        if (req.method === 'GET') {
            return new Response(JSON.stringify({
                room: this.party.id,
                connections: [...this.party.getConnections()].length,
                status: 'healthy'
            }), {
                headers: { 'Content-Type': 'application/json' }
            });
        }

        return new Response('Method not allowed', { status: 405 });
    }
}

// Satisfy TypeScript
YjsServer satisfies Party.Worker;