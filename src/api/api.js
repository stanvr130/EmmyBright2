import axios from 'axios';

// 1. Create centralized Axios instance
// 🔄 FIX: baseURL now reads from an environment variable instead of being
// hardcoded to localhost. Vite exposes env vars prefixed VITE_ via
// import.meta.env. Falls back to localhost for local dev if unset.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true // CRUCIAL: Enables sending & receiving httpOnly cookies
});

// 2. REQUEST INTERCEPTOR: Attach Access Token to outgoing requests
api.interceptors.request.use(
  (config) => {
    // Read short-lived token stored in client storage
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 3. RESPONSE INTERCEPTOR: Handle 401 Expiration & Auto-Refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Check if the request was made to an auth endpoint
    const isAuthEndpoint = originalRequest.url?.includes('/auth/login') ||
                           originalRequest.url?.includes('/auth/register') ||
                           originalRequest.url?.includes('/auth/verify-otp') ||
                           originalRequest.url?.includes('/auth/forgot-password') ||
                           originalRequest.url?.includes('/auth/reset-password') ||
                           originalRequest.url?.includes('/auth/refresh');

    // Check if failure is due to 401 (Unauthorized), has not been retried yet, AND is NOT an auth request
    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true;

      try {
        // 🔄 FIX: use the same configurable base URL instead of a
        // hardcoded localhost address, so refresh works in production too.
        const refreshResponse = await axios.post(
          `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/refresh`,
          {},
          { withCredentials: true }
        );

        const newAccessToken = refreshResponse.data.accessToken || refreshResponse.data.token;

        // Store the fresh access token
        localStorage.setItem('authToken', newAccessToken);

        // Update authorization header on the original failed request
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        // Retry original request seamlessly
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh token expired or missing -> clear local state & redirect to login
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');

        // Only redirect if the user isn't already on the login page
        if (window.location.pathname !== '/login') {
          window.location.href = '/login?session=expired';
        }

        return Promise.reject(refreshError);
      }
    }

    // Pass the actual backend response error directly back to the calling component
    return Promise.reject(error);
  }
);

export default api;