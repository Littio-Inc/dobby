import axios, { type AxiosError } from 'axios';
import { getIdToken } from '../auth-store';

// API client for Azkaban (authentication service)
export const azkabanApi = axios.create({
  baseURL: import.meta.env.PUBLIC_AZKABAN_API_URL || 'http://localhost:8001',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

azkabanApi.interceptors.request.use(
  async (config) => {
    try {
      const token = await getIdToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      } else {
        console.error('[API-Client] No token available for request:', config.url);
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

// Response interceptor: Handle errors
// Disabled automatic retry to prevent infinite loops
// 401 errors should be handled by the calling code (e.g., redirect to login)
const handleAuthError = async (error: AxiosError) => {
  // Log 401 errors but don't retry automatically to avoid infinite loops
  if (error.response?.status === 401) {
    console.warn('[API-Client] 401 Unauthorized - authentication required');
    // Don't retry - let the calling code handle the error
  }
  return Promise.reject(error);
};

azkabanApi.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => handleAuthError(error),
);

// Default export for backward compatibility (points to Azkaban)
export default azkabanApi;
