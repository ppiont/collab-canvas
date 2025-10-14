import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { PUBLIC_AUTH0_DOMAIN, PUBLIC_AUTH0_CLIENT_ID } from '$env/static/public';
import { AUTH0_CLIENT_SECRET } from '$env/static/private';

export const POST: RequestHandler = async ({ request }) => {
    const { email, password } = await request.json();

    if (!email || !password) {
        return json({ error: 'Email and password required' }, { status: 400 });
    }

    if (password.length < 8) {
        return json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }

    try {
        // Use Auth0's public signup endpoint (no Management API token needed)
        const signupResponse = await fetch(`https://${PUBLIC_AUTH0_DOMAIN}/dbconnections/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                client_id: PUBLIC_AUTH0_CLIENT_ID,
                email,
                password,
                connection: 'Username-Password-Authentication'
            })
        });

        if (!signupResponse.ok) {
            const error = await signupResponse.json();
            console.error('Auth0 signup error:', error);

            // Check for specific error cases
            if (error.code === 'invalid_signup' || error.description?.includes('already exists')) {
                return json({ error: 'An account with this email already exists' }, { status: 409 });
            }

            if (error.code === 'invalid_password') {
                return json({ error: 'Password does not meet requirements' }, { status: 400 });
            }

            return json({ error: error.description || 'Signup failed' }, { status: 400 });
        }

        const result = await signupResponse.json();

        return json({
            success: true,
            message: 'Account created! Please check your email to verify your account.',
            user_id: result._id
        });
    } catch (error) {
        console.error('Signup error:', error);
        return json({ error: 'Signup failed' }, { status: 500 });
    }
};

