import type { LayoutServerLoad } from './$types';
import { getUserProfile } from '$lib/user-utils';

export const load: LayoutServerLoad = async ({ locals: { safeGetSession } }) => {
    const { session, user } = await safeGetSession();

    // Generate user profile if authenticated
    const userProfile = user ? getUserProfile(user) : null;

    return {
        session,
        user,
        userProfile
    };
};

