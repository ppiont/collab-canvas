import type * as Party from "partykit/server";
import { onConnect } from "y-partykit";
import * as Y from 'yjs';
import OpenAI from 'openai';
import { AI_TOOLS } from './ai/tools';
import { executeTool, getCanvasState } from './ai/executors';
import { AI_SYSTEM_PROMPT } from './ai/prompts';

/**
 * CollabCanvas Yjs Server
 * 
 * Handles real-time CRDT synchronization using Y-PartyKit
 * Supports collaborative editing in the global "main" room
 * Includes AI canvas agent for natural language manipulation
 */
export default class YjsServer implements Party.Server {
    private yjsDoc: Y.Doc | null = null;

    constructor(public party: Party.Room) { }

    /**
     * Called when a client connects via WebSocket
     * Y-PartyKit handles all Yjs protocol communication
     */
    onConnect(conn: Party.Connection) {
        return onConnect(conn, this.party, {
            persist: {
                mode: 'snapshot'
            },
            callback: {
                handler: (ydoc: Y.Doc) => {
                    this.yjsDoc = ydoc;
                }
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
        // Future: Add token validation here
        return req;
    }

    /**
     * Handle HTTP requests (health checks, AI commands)
     */
    async onRequest(req: Party.Request) {
        const url = new URL(req.url);

        // Handle CORS preflight
        if (req.method === 'OPTIONS') {
            return new Response(null, {
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type'
                }
            });
        }

        // Health check
        if (req.method === 'GET' && (url.pathname === '/' || url.pathname.endsWith('/main') || url.pathname.endsWith('/main/'))) {
            return new Response(JSON.stringify({
                room: this.party.id,
                connections: [...this.party.getConnections()].length,
                status: 'healthy'
            }), {
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // AI command endpoint
        if (req.method === 'POST' && url.pathname.includes('/api/ai/command')) {
            return this.handleAICommand(req);
        }

        return new Response('Not found', { status: 404 });
    }

    /**
     * Handle AI command execution with GPT-4 function calling
     */
    private async handleAICommand(req: Party.Request): Promise<Response> {
        try {
            const body = await req.json() as { command?: string; userId?: string };
            const { command, userId } = body;

            if (!command || !userId) {
                return new Response(JSON.stringify({
                    error: 'Missing command or userId'
                }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            // Rate limiting
            const rateLimit = await this.checkRateLimit(userId);
            if (!rateLimit.allowed) {
                return new Response(JSON.stringify({
                    error: 'Rate limit exceeded. Please wait before trying again.',
                    retryAfter: rateLimit.retryAfter
                }), {
                    status: 429,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            // Get OpenAI API key from environment
            const apiKey = this.party.env.OPENAI_API_KEY as string;
            if (!apiKey) {
                return new Response(JSON.stringify({
                    error: 'OpenAI API key not configured'
                }), {
                    status: 500,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            // Access Yjs document from Durable Object
            const ydoc = await this.getYDoc();
            const canvasState = getCanvasState(ydoc);

            // Call OpenAI GPT-4 with function calling
            const openai = new OpenAI({ apiKey });

            const completion = await openai.chat.completions.create({
                model: 'gpt-4-turbo',
                messages: [
                    { role: 'system', content: AI_SYSTEM_PROMPT },
                    {
                        role: 'user',
                        content: `Current canvas has ${canvasState.length} shapes:\n${JSON.stringify(canvasState)}\n\nUser command: ${command}`
                    }
                ],
                tools: AI_TOOLS,
                tool_choice: 'auto',
                max_tokens: 1000
            });

            const message = completion.choices[0].message;
            const toolCalls = message.tool_calls || [];

            if (toolCalls.length === 0) {
                return new Response(JSON.stringify({
                    success: false,
                    error: message.content || 'No actions taken'
                }), {
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            // Return tool calls for CLIENT to execute via its Yjs connection
            // This way changes use the existing WebSocket sync
            const toolsToExecute = toolCalls
                .filter(tc => tc.type === 'function')
                .map(tc => ({
                    name: tc.function.name,
                    params: JSON.parse(tc.function.arguments)
                }));

            return new Response(JSON.stringify({
                success: true,
                toolsToExecute: toolsToExecute
            }), {
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'POST, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type'
                }
            });

        } catch (error) {
            console.error('AI command error:', error);
            return new Response(JSON.stringify({
                error: error instanceof Error ? error.message : 'Failed to process command'
            }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }
    }

    /**
     * Rate limiting: 10 commands per minute per user
     */
    private async checkRateLimit(userId: string): Promise<{ allowed: boolean; retryAfter?: number }> {
        const key = `ratelimit:${userId}`;
        const now = Date.now();
        const window = 60000; // 1 minute

        const calls = await this.party.storage.get<number[]>(key) || [];
        const recentCalls = calls.filter(t => now - t < window);

        if (recentCalls.length >= 10) {
            const oldestCall = Math.min(...recentCalls);
            const retryAfter = Math.ceil((oldestCall + window - now) / 1000);
            return { allowed: false, retryAfter };
        }

        recentCalls.push(now);
        await this.party.storage.put(key, recentCalls);
        return { allowed: true };
    }

    /**
     * Get Yjs document by loading from Y-PartyKit storage
     */
    private async getYDoc(): Promise<Y.Doc> {
        const ydoc = new Y.Doc();

        try {
            // Y-PartyKit stores Yjs state in storage
            // Try common Y-PartyKit storage keys
            const possibleKeys = ['ydoc', 'yjs', 'doc', 'state'];

            for (const key of possibleKeys) {
                const data = await this.party.storage.get<Uint8Array>(key);
                if (data instanceof Uint8Array) {
                    Y.applyUpdate(ydoc, data);
                    console.log('[AI] Loaded Yjs state from storage key:', key);
                    break;
                }
            }
        } catch (error) {
            console.error('[AI] Failed to load Yjs state:', error);
        }

        return ydoc;
    }

    /**
     * Persist Y.Doc to storage (Y-PartyKit format)
     */
    private async persistYDoc(ydoc: Y.Doc): Promise<void> {
        try {
            // Encode document state
            const state = Y.encodeStateAsUpdate(ydoc);

            // Store in Y-PartyKit's expected format
            await this.party.storage.put('ydoc', state);
        } catch (error) {
            console.error('Failed to persist Y.Doc:', error);
        }
    }

}

// Satisfy TypeScript
YjsServer satisfies Party.Worker;