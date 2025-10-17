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
 * 32 distinct, accessible colors for cursor and presence indicators
 */
const USER_COLORS = [
	'#696969', // dimgray
	'#556b2f', // darkolivegreen
	'#8b4513', // saddlebrown
	'#228b22', // forestgreen
	'#483d8b', // darkslateblue
	'#b8860b', // darkgoldenrod
	'#008b8b', // darkcyan
	'#4682b4', // steelblue
	'#000080', // navy
	'#9acd32', // yellowgreen
	'#7f007f', // purple2
	'#8fbc8f', // darkseagreen
	'#ff4500', // orangered
	'#ff8c00', // darkorange
	'#ffff00', // yellow
	'#40e0d0', // turquoise
	'#7fff00', // chartreuse
	'#9400d3', // darkviolet
	'#00ff7f', // springgreen
	'#dc143c', // crimson
	'#0000ff', // blue
	'#da70d6', // orchid
	'#ff00ff', // fuchsia
	'#1e90ff', // dodgerblue
	'#db7093', // palevioletred
	'#90ee90', // lightgreen
	'#add8e6', // lightblue
	'#ff1493', // deeppink
	'#7b68ee', // mediumslateblue
	'#ffa07a', // lightsalmon
	'#ffdead', // navajowhite
	'#ffc0cb'  // pink
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

/**
 * Darken a hex color by a given percentage
 * Useful for creating darker outlines/strokes from fill colors
 */
export function darkenColor(hexColor: string, percent: number = 20): string {
	try {
		// Remove # if present
		const hex = hexColor.replace('#', '');

		// Convert hex to RGB
		let r = parseInt(hex.slice(0, 2), 16);
		let g = parseInt(hex.slice(2, 4), 16);
		let b = parseInt(hex.slice(4, 6), 16);

		// Darken by reducing values
		r = Math.max(0, Math.floor(r * (1 - percent / 100)));
		g = Math.max(0, Math.floor(g * (1 - percent / 100)));
		b = Math.max(0, Math.floor(b * (1 - percent / 100)));

		// Convert back to hex
		return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
	} catch {
		// Fallback to a safe default if color parsing fails
		return '#333333';
	}
}
