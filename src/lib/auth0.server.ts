/**
 * Server-only Auth0 utilities
 * These functions use secrets and must NEVER be imported by client code
 */

import { PUBLIC_AUTH0_DOMAIN, PUBLIC_AUTH0_CLIENT_ID } from '$env/static/public';
import { AUTH0_CLIENT_SECRET } from '$env/static/private';
import type { Auth0User } from './auth0';

/**
 * Exchange authorization code for tokens
 * Called in the /auth/callback endpoint (server-side only)
 */
export async function exchangeCodeForTokens(
	code: string,
	redirectUri: string
): Promise<{ id_token: string; access_token: string } | null> {
	try {
		const response = await fetch(`https://${PUBLIC_AUTH0_DOMAIN}/oauth/token`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				grant_type: 'authorization_code',
				client_id: PUBLIC_AUTH0_CLIENT_ID,
				client_secret: AUTH0_CLIENT_SECRET,
				code,
				redirect_uri: redirectUri
			})
		});

		if (!response.ok) {
			console.error('Token exchange failed:', await response.text());
			return null;
		}

		const data = await response.json();
		return { id_token: data.id_token, access_token: data.access_token };
	} catch (error) {
		console.error('Token exchange error:', error);
		return null;
	}
}

/**
 * Decode JWT token to extract user info
 * Simple base64 decode - verification happens in hooks.server.ts
 */
export function decodeToken(token: string): Auth0User | null {
	try {
		const parts = token.split('.');
		if (parts.length !== 3) return null;

		const payload = JSON.parse(atob(parts[1]));

		return {
			id: payload.sub,
			email: payload.email,
			name: payload.name || payload.email?.split('@')[0] || 'User',
			picture: payload.picture,
			email_verified: payload.email_verified
		};
	} catch (error) {
		console.error('Token decode error:', error);
		return null;
	}
}
