import { type Handle, redirect } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { jwtVerify, createRemoteJWKSet } from 'jose';
import { PUBLIC_AUTH0_DOMAIN, PUBLIC_AUTH0_CLIENT_ID } from '$env/static/public';

// Create JWKS endpoint for JWT verification
const JWKS = createRemoteJWKSet(new URL(`https://${PUBLIC_AUTH0_DOMAIN}/.well-known/jwks.json`));

/**
 * Auth0 Session Management
 * Verifies JWT token from cookie and attaches user to locals
 */
const auth: Handle = async ({ event, resolve }) => {
	const sessionToken = event.cookies.get('auth_session');

	if (sessionToken) {
		try {
			// Verify JWT signature and claims
			const { payload } = await jwtVerify(sessionToken, JWKS, {
				issuer: `https://${PUBLIC_AUTH0_DOMAIN}/`,
				audience: PUBLIC_AUTH0_CLIENT_ID
			});

			// Extract user info from verified token
			event.locals.user = {
				id: payload.sub!,
				email: payload.email as string,
				name: (payload.name as string) || (payload.email as string)?.split('@')[0] || 'User',
				picture: payload.picture as string | undefined,
				email_verified: payload.email_verified as boolean | undefined
			};
		} catch (error) {
			// Token invalid or expired - clear it
			console.error('JWT verification failed:', error);
			event.cookies.delete('auth_session', { path: '/' });
			event.locals.user = null;
		}
	} else {
		event.locals.user = null;
	}

	return resolve(event);
};

/**
 * Auth Guard
 * Protects routes requiring authentication
 */
const authGuard: Handle = async ({ event, resolve }) => {
	// Protect /canvas route - require authentication
	if (event.url.pathname.startsWith('/canvas')) {
		if (!event.locals.user) {
			redirect(303, '/auth/signin');
		}
	}

	// Redirect authenticated users away from signin page
	if (event.url.pathname.startsWith('/auth/signin') && event.locals.user) {
		redirect(303, '/canvas');
	}

	return resolve(event);
};

export const handle: Handle = sequence(auth, authGuard);
