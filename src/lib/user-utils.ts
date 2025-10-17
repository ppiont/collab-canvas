import type { Auth0User } from '$lib/auth0';

/**
 * User Profile for Collaboration
 * Contains display name and assigned color for multiplayer features
 */
export interface UserProfile {
	id: string;
	email: string;
	displayName: string;
	color: string;
}

/**
 * Color palette for user assignments
 * 8 distinct, accessible colors for cursor and presence indicators
 */
const USER_COLORS = [
	'#3b82f6', // blue
	'#ec4899', // pink
	'#10b981', // green
	'#f59e0b', // amber
	'#8b5cf6', // purple
	'#ef4444', // red
	'#14b8a6', // teal
	'#f97316' // orange
];

/**
 * Extract display name from Auth0 user
 * Prioritizes name from profile, falls back to email prefix
 */
export function getUserDisplayName(user: Auth0User): string {
	if (user.name && user.name !== user.email) {
		return user.name;
	}

	if (user.email) {
		return user.email.split('@')[0];
	}

	return 'Anonymous';
}

/**
 * Assign a deterministic color based on user ID
 * Same user ID always gets the same color
 */
export function assignUserColor(userId: string): string {
	// Simple hash function for consistent color assignment
	let hash = 0;
	for (let i = 0; i < userId.length; i++) {
		hash = userId.charCodeAt(i) + ((hash << 5) - hash);
	}

	const index = Math.abs(hash) % USER_COLORS.length;
	return USER_COLORS[index];
}

/**
 * Generate complete user profile for collaboration
 */
export function getUserProfile(user: Auth0User): UserProfile {
	return {
		id: user.id,
		email: user.email || '',
		displayName: getUserDisplayName(user),
		color: assignUserColor(user.id)
	};
}
