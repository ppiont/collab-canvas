import { createBrowserClient, createServerClient, isBrowser } from '@supabase/ssr';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import type { Database } from './database.types';

/**
 * Client-side Supabase client for use in components
 */
export const supabase = createBrowserClient<Database>(
    PUBLIC_SUPABASE_URL,
    PUBLIC_SUPABASE_ANON_KEY
);

/**
 * Create a Supabase client for server-side use in load functions
 * @param fetch - SvelteKit fetch function
 */
export function createSupabaseServerClient(fetch: typeof globalThis.fetch) {
    return createServerClient<Database>(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
        cookies: {
            getAll() {
                return [];
            },
            setAll() { }
        },
        global: {
            fetch
        }
    });
}

