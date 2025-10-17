import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { getUserProfile } from '$lib/user-utils';

export const load: PageServerLoad = async ({ locals }) => {
	// Redirect if not authenticated (extra safety - hooks.server.ts also protects)
	if (!locals.user) {
		redirect(303, '/auth/signin');
	}

	// Generate user profile for collaboration
	const userProfile = getUserProfile(locals.user);

	return {
		user: locals.user,
		userProfile
	};
};
