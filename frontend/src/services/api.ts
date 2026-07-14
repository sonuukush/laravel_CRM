import axios from 'axios';
import { store } from '../store';
import { logout } from '../features/authSlice';

const api = axios.create({
  baseURL: env('VITE_API_URL', 'http://localhost:8000/api'),
  withCredentials: true, // Crucial for cookie-based session auth
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request interceptor to attach bearer token as a robust fallback
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('crm_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle session expiration (401 errors)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear local state and log out
      store.dispatch(logout());
      // Redirect to login if not already there
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Helper function to fetch CSRF cookie before authentication calls
export const getCsrfCookie = async () => {
  try {
    await axios.get(env('VITE_CSRF_URL', 'http://localhost:8000/sanctum/csrf-cookie'), {
      withCredentials: true,
    });
  } catch (error) {
    console.error('Could not fetch CSRF cookie', error);
  }
};

// Helper function to resolve Vite env variables safely
function env(key: string, defaultValue: string): string {
  return (import.meta.env[key] as string) || defaultValue;
}

export default api;
