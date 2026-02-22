/**
 * Global Fetch Interceptor
 * 
 * This script monkey-patches the global window.fetch function to:
 * 1. Automatically inject the Authorization header if a token exists.
 * 2. Intercept 401 (Unauthorized) and 403 (Forbidden) responses to handle session expiration.
 * 3. Gracefully redirect the user to the login page on session expiry.
 */

(function () {
    const originalFetch = window.fetch;

    window.fetch = async (...args) => {
        let [resource, config] = args;

        // Ensure config is an object
        config = config || {};

        // Inject Authorization header if it doesn't already exist and we have a token
        const token = localStorage.getItem('token');
        if (token) {
            config.headers = {
                ...config.headers,
                'Authorization': config.headers?.['Authorization'] || `Bearer ${token}`
            };
        }

        try {
            const response = await originalFetch(resource, config);

            // Handle auth failures, but do not log out users on pure RBAC 403 responses.
            if (response.status === 401 || response.status === 403) {
                // Check if the URL is NOT the login endpoint (to avoid redirect loops during login)
                const url = typeof resource === 'string' ? resource : resource.url;
                if (!url.includes('/api/users/login')) {
                    let shouldLogout = response.status === 401;

                    if (response.status === 403) {
                        const errorBody = await response.clone().json().catch(() => ({}));
                        const message = (errorBody?.message || '').toLowerCase();
                        shouldLogout = message.includes('invalid or expired token') || message.includes('authentication required');
                    }

                    if (!shouldLogout) {
                        return response;
                    }

                    console.warn(`[AUTH] Session invalid (${response.status}) for: ${url}. Redirecting to login...`);

                    // Clear user session data
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    window.dispatchEvent(new Event('auth-updated'));

                    // Small delay to let any pending toasts or state updates finish
                    setTimeout(() => {
                        if (!window.location.pathname.includes('/login')) {
                            window.location.href = '/login';
                        }
                    }, 100);

                    throw new Error('Authentication failed');
                }
            }

            return response;
        } catch (error) {
            // Handle network errors or other fetch-related issues
            console.error('[FETCH ERROR]', error);
            throw error;
        }
    };

    console.log('✅ Global Fetch Interceptor active');
})();
