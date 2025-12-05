import axios, { type AxiosError } from 'axios';
import { getIdToken } from '../auth-store';

// API client for Azkaban (authentication service)
export const azkabanApi = axios.create({
  baseURL: import.meta.env.PUBLIC_AZKABAN_API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for Azkaban: Add Firebase ID Token
azkabanApi.interceptors.request.use(
  async (config) => {
    try {
      const token = await getIdToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      } else {
        // Don't make the request if there's no token
        throw new Error('No authentication token available');
      }
    } catch (error) {
      throw error;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor: Handle errors and refresh token
const handleAuthError = async (error: AxiosError, apiInstance: typeof azkabanApi) => {
  if (error.response?.status === 401) {
    // Token expired - Firebase handles refresh automatically
    const { login } = await import('../auth-store');
    // Try to get new token
    const newToken = await getIdToken();
    if (newToken && error.config) {
      // Retry request with new token
      error.config.headers.Authorization = `Bearer ${newToken}`;
      return apiInstance.request(error.config);
    } else {
      // If no token, redirect to login
      await login();
    }
  }
  return Promise.reject(error);
};

azkabanApi.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => handleAuthError(error, azkabanApi),
);

// Default export for backward compatibility (points to Azkaban)
export default azkabanApi;
