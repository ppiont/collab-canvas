import { PUBLIC_AUTH0_DOMAIN, PUBLIC_AUTH0_CLIENT_ID } from '$env/static/public';

/**
 * Auth0 User Interface
 * Standardized user object from Auth0 tokens
 */
export interface Auth0User {
    id: string; // sub claim
    email: string;
    name: string;
    picture?: string;
    email_verified?: boolean;
}

/**
 * Generate Auth0 login URL
 * For client-side redirects to Auth0
 */
export function getLoginUrl(redirectUri: string, connection?: string): string {
    const params = new URLSearchParams({
        client_id: PUBLIC_AUTH0_CLIENT_ID,
        response_type: 'code',
        redirect_uri: redirectUri,
        scope: 'openid profile email'
    });

    if (connection) {
        params.set('connection', connection);
    }

    return `https://${PUBLIC_AUTH0_DOMAIN}/authorize?${params}`;
}

/**
 * Generate Auth0 logout URL
 * Clears Auth0 session and returns to your app
 */
export function getLogoutUrl(returnTo: string): string {
    const params = new URLSearchParams({
        client_id: PUBLIC_AUTH0_CLIENT_ID,
        returnTo
    });

    return `https://${PUBLIC_AUTH0_DOMAIN}/v2/logout?${params}`;
}
