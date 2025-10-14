import type { Session, SupabaseClient, User } from '@supabase/supabase-js';
import type { Database } from '$lib/database.types';
import type { UserProfile } from '$lib/user-utils';

declare global {
    namespace App {
        interface Locals {
            supabase: SupabaseClient<Database>;
            safeGetSession: () => Promise<{ session: Session | null; user: User | null }>;
            session: Session | null;
            user: User | null;
        }
        interface PageData {
            session: Session | null;
            user: User | null;
            userProfile: UserProfile | null;
        }
        // interface Error {}
        // interface Platform {}
    }
}

export { };

