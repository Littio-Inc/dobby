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

// Response interceptor: Handle errors and refresh token
const handleAuthError = async (error: AxiosError, apiInstance: typeof azkabanApi) => {
  if (error.response?.status === 401) {
    const { login } = await import('../auth-store');
    const newToken = await getIdToken();
    if (newToken && error.config) {
      error.config.headers.Authorization = `Bearer ${newToken}`;
      return apiInstance.request(error.config);
    } else {
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
