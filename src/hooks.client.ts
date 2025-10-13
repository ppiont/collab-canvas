import { createBrowserClient, isBrowser, parse } from '@supabase/ssr';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import type { HandleClientError } from '@sveltejs/kit';

// Create a single Supabase client instance for the browser
export const supabase = createBrowserClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY);

export const handleError: HandleClientError = async ({ error, event }) => {
    console.error('Client error:', error, event);
};

