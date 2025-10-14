import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { getUserProfile } from '$lib/user-utils';

export const load: PageServerLoad = async ({ locals: { safeGetSession } }) => {
    const { session, user } = await safeGetSession();

    // Redirect if not authenticated (extra safety - hooks.server.ts also protects)
    if (!session || !user) {
        throw redirect(303, '/auth/signin');
    }

    // Generate user profile for collaboration
    const userProfile = getUserProfile(user);

    return {
        session,
        user,
        userProfile
    };
};

