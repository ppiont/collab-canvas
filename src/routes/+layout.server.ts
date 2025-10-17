import type { LayoutServerLoad } from './$types';
import { getUserProfile } from '$lib/user-utils';

export const load: LayoutServerLoad = async ({ locals }) => {
	// Generate user profile if authenticated
	const userProfile = locals.user ? getUserProfile(locals.user) : null;

	return {
		user: locals.user,
		userProfile
	};
};
